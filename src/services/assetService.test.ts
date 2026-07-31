import { describe, it, expect } from "vitest";
import { Timestamp } from "firebase/firestore";
import { buildAssetSummary } from "./assetService";
import {
  isAssetAvailable,
  isRentalOverdue,
  assetStatusLabel,
} from "../types/asset";
import type { Asset, AssetRental } from "../types/asset";

const asset = (over: Partial<Asset>): Asset =>
  ({
    id: "a",
    name: "Tent",
    category: "equipment",
    purchase_price: 1000,
    purchase_date: Timestamp.now(),
    current_value: 800,
    status: "available",
    condition: "good",
    created_by: "u",
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    ...over,
  } as Asset);

const rental = (over: Partial<AssetRental>): AssetRental =>
  ({
    id: "r",
    asset_id: "a",
    asset_name: "Tent",
    renter_type: "member",
    renter_name: "Sipho",
    rental_fee: 100,
    start_date: Timestamp.now(),
    due_date: Timestamp.now(),
    status: "returned",
    created_by: "u",
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
    ...over,
  } as AssetRental);

describe("buildAssetSummary", () => {
  it("counts assets and rented-out assets", () => {
    const summary = buildAssetSummary(
      [asset({}), asset({ status: "rented_out" }), asset({ status: "retired" })],
      []
    );
    expect(summary.totalAssets).toBe(3);
    expect(summary.rentedOutCount).toBe(1);
  });

  it("excludes retired assets from total value", () => {
    const summary = buildAssetSummary(
      [
        asset({ current_value: 500 }),
        asset({ current_value: 300, status: "retired" }),
      ],
      []
    );
    expect(summary.totalValue).toBe(500);
  });

  it("sums rental income across all rentals", () => {
    const summary = buildAssetSummary(
      [asset({})],
      [rental({ rental_fee: 100 }), rental({ rental_fee: 250, status: "active" })]
    );
    expect(summary.totalRentalIncome).toBe(350);
  });

  it("handles zero data without NaN", () => {
    const summary = buildAssetSummary([], []);
    expect(summary).toEqual({
      totalAssets: 0,
      totalValue: 0,
      rentedOutCount: 0,
      totalRentalIncome: 0,
    });
  });
});

describe("asset helpers", () => {
  it("isAssetAvailable only for available status", () => {
    expect(isAssetAvailable({ status: "available" })).toBe(true);
    expect(isAssetAvailable({ status: "rented_out" })).toBe(false);
  });

  it("isRentalOverdue when active and past due", () => {
    const past = Timestamp.fromDate(new Date("2020-01-01"));
    const future = Timestamp.fromDate(new Date("2999-01-01"));
    expect(isRentalOverdue({ status: "active", due_date: past })).toBe(true);
    expect(isRentalOverdue({ status: "active", due_date: future })).toBe(false);
    expect(isRentalOverdue({ status: "returned", due_date: past })).toBe(false);
  });

  it("assetStatusLabel renders friendly labels", () => {
    expect(assetStatusLabel("rented_out")).toBe("Rented out");
    expect(assetStatusLabel("available")).toBe("Available");
  });
});
