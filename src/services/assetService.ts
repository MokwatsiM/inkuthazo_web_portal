// src/services/assetService.ts
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { logAuditTrail } from "./auditService";
import type {
  Asset,
  AssetRental,
  AssetSummary,
  AssetStatus,
  RentalStatus,
} from "../types/asset";
import logger from "../utils/logger";

const ASSETS = "assets";
const RENTALS = "asset_rentals";

/* -------------------------------------------------------------------------- */
/* Assets                                                                     */
/* -------------------------------------------------------------------------- */

export const createAsset = async (
  data: Omit<Asset, "id" | "created_at" | "updated_at" | "status"> & {
    status?: AssetStatus;
  },
  userId: string,
  userName?: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, ASSETS), {
      ...data,
      status: data.status ?? "available",
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    await logAuditTrail(
      userId,
      "ASSET_CREATE",
      {
        asset_id: docRef.id,
        name: data.name,
        category: data.category,
        purchase_price: data.purchase_price,
        current_value: data.current_value,
      },
      userName
    );

    return docRef.id;
  } catch (error) {
    logger.error("Error creating asset:", error);
    throw error;
  }
};

export const getAsset = async (assetId: string): Promise<Asset | null> => {
  try {
    const snap = await getDoc(doc(db, ASSETS, assetId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Asset;
  } catch (error) {
    logger.error("Error fetching asset:", error);
    throw error;
  }
};

export const getAssets = async (): Promise<Asset[]> => {
  try {
    const q = query(collection(db, ASSETS), orderBy("created_at", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Asset));
  } catch (error) {
    logger.error("Error fetching assets:", error);
    throw error;
  }
};

export const updateAsset = async (
  assetId: string,
  updates: Partial<Asset>,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await updateDoc(doc(db, ASSETS, assetId), {
      ...cleaned,
      updated_at: Timestamp.now(),
    });

    await logAuditTrail(
      userId,
      "ASSET_UPDATE",
      { asset_id: assetId, updated_fields: Object.keys(cleaned) },
      userName
    );
  } catch (error) {
    logger.error("Error updating asset:", error);
    throw error;
  }
};

export const deleteAsset = async (
  assetId: string,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const asset = await getAsset(assetId);
    if (!asset) throw new Error("Asset not found");
    if (asset.status === "rented_out") {
      throw new Error(
        "This asset is currently rented out. Record its return before deleting."
      );
    }

    await deleteDoc(doc(db, ASSETS, assetId));

    await logAuditTrail(
      userId,
      "ASSET_DELETE",
      { asset_id: assetId, name: asset.name },
      userName
    );
  } catch (error) {
    logger.error("Error deleting asset:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/* Rentals                                                                    */
/* -------------------------------------------------------------------------- */

export const getAssetRentals = async (
  assetId: string
): Promise<AssetRental[]> => {
  try {
    const q = query(
      collection(db, RENTALS),
      where("asset_id", "==", assetId)
    );
    const snapshot = await getDocs(q);
    const rentals = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as AssetRental)
    );
    // Sort client-side (newest first) to avoid a composite index.
    return rentals.sort(
      (a, b) => b.start_date.toMillis() - a.start_date.toMillis()
    );
  } catch (error) {
    logger.error("Error fetching asset rentals:", error);
    throw error;
  }
};

export const getAllRentals = async (): Promise<AssetRental[]> => {
  try {
    const snapshot = await getDocs(collection(db, RENTALS));
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AssetRental));
  } catch (error) {
    logger.error("Error fetching rentals:", error);
    throw error;
  }
};

/**
 * Rent an asset out. Creates a rental record AND flips the asset to
 * `rented_out` in a single batch so the two collections stay consistent.
 */
export const rentOutAsset = async (
  rental: Omit<
    AssetRental,
    "id" | "created_at" | "updated_at" | "status" | "returned_date"
  >,
  userId: string,
  userName?: string
): Promise<string> => {
  try {
    const asset = await getAsset(rental.asset_id);
    if (!asset) throw new Error("Asset not found");
    if (asset.status !== "available") {
      throw new Error("This asset is not available to rent out.");
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    const rentalRef = doc(collection(db, RENTALS));
    const cleaned = Object.fromEntries(
      Object.entries(rental).filter(([, v]) => v !== undefined)
    );
    batch.set(rentalRef, {
      ...cleaned,
      status: "active" as RentalStatus,
      created_at: now,
      updated_at: now,
    });

    batch.update(doc(db, ASSETS, rental.asset_id), {
      status: "rented_out" as AssetStatus,
      updated_at: now,
    });

    await batch.commit();

    await logAuditTrail(
      userId,
      "ASSET_RENT_OUT",
      {
        asset_id: rental.asset_id,
        asset_name: rental.asset_name,
        rental_id: rentalRef.id,
        renter_name: rental.renter_name,
        rental_fee: rental.rental_fee,
      },
      userName
    );

    return rentalRef.id;
  } catch (error) {
    logger.error("Error renting out asset:", error);
    throw error;
  }
};

/**
 * Record the return of a rented asset: marks the rental returned and frees the
 * asset back to `available`, in one batch.
 */
export const returnAsset = async (
  rentalId: string,
  returnedDate: Date,
  userId: string,
  userName?: string
): Promise<void> => {
  try {
    const rentalSnap = await getDoc(doc(db, RENTALS, rentalId));
    if (!rentalSnap.exists()) throw new Error("Rental not found");
    const rental = { id: rentalSnap.id, ...rentalSnap.data() } as AssetRental;
    if (rental.status === "returned") {
      throw new Error("This rental has already been returned.");
    }

    const batch = writeBatch(db);
    const now = Timestamp.now();

    batch.update(doc(db, RENTALS, rentalId), {
      status: "returned" as RentalStatus,
      returned_date: Timestamp.fromDate(returnedDate),
      updated_at: now,
    });

    batch.update(doc(db, ASSETS, rental.asset_id), {
      status: "available" as AssetStatus,
      updated_at: now,
    });

    await batch.commit();

    await logAuditTrail(
      userId,
      "ASSET_RETURN",
      {
        asset_id: rental.asset_id,
        asset_name: rental.asset_name,
        rental_id: rentalId,
        renter_name: rental.renter_name,
      },
      userName
    );
  } catch (error) {
    logger.error("Error recording asset return:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/* Summary                                                                    */
/* -------------------------------------------------------------------------- */

/** Build the KPI summary from already-loaded assets and rentals. */
export const buildAssetSummary = (
  assets: Asset[],
  rentals: AssetRental[]
): AssetSummary => {
  const totalValue = assets
    .filter((a) => a.status !== "retired")
    .reduce((sum, a) => sum + (a.current_value || 0), 0);

  return {
    totalAssets: assets.length,
    totalValue,
    rentedOutCount: assets.filter((a) => a.status === "rented_out").length,
    // Every recorded rental fee is realised income to the club.
    totalRentalIncome: rentals.reduce((sum, r) => sum + (r.rental_fee || 0), 0),
  };
};

export const getAssetSummary = async (): Promise<AssetSummary> => {
  const [assets, rentals] = await Promise.all([getAssets(), getAllRentals()]);
  return buildAssetSummary(assets, rentals);
};
