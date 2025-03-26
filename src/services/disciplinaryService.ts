import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { DisciplinaryRecord } from "../types";

export const addDisciplinaryRecord = async (
  data: Omit<DisciplinaryRecord, "id" | "status" | "created_at">
): Promise<DisciplinaryRecord> => {
  try {
    const docRef = await addDoc(collection(db, "disciplinary_records"), {
      ...data,
      status: "pending",
      created_at: Timestamp.now(),
    });

    return {
      id: docRef.id,
      ...data,
      status: "pending",
      created_at: Timestamp.now(),
    } as DisciplinaryRecord;
  } catch (error) {
    console.error("Error adding disciplinary record:", error);
    throw error;
  }
};

export const updateDisciplinaryRecord = async (
  id: string,
  data: Partial<DisciplinaryRecord>
): Promise<void> => {
  try {
    const recordRef = doc(db, "disciplinary_records", id);
    await updateDoc(recordRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating disciplinary record:", error);
    throw error;
  }
};

export const deleteDisciplinaryRecord = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "disciplinary_records", id));
  } catch (error) {
    console.error("Error deleting disciplinary record:", error);
    throw error;
  }
};

export const resolveDisciplinaryRecord = async (
  id: string,
  resolutionNotes: string,
  resolvedBy: string
): Promise<void> => {
  try {
    const recordRef = doc(db, "disciplinary_records", id);
    await updateDoc(recordRef, {
      status: "resolved",
      resolved_at: Timestamp.now(),
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
    });
  } catch (error) {
    console.error("Error resolving disciplinary record:", error);
    throw error;
  }
};

export const getMemberDisciplinaryRecords = async (
  memberId: string
): Promise<DisciplinaryRecord[]> => {
  try {
    const recordsRef = collection(db, "disciplinary_records");
    const q = query(
      recordsRef,
      where("member_id", "==", memberId),
      orderBy("created_at", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DisciplinaryRecord[];
  } catch (error) {
    console.error("Error fetching disciplinary records:", error);
    throw error;
  }
};

export const getAllDisciplinaryRecords = async (): Promise<
  DisciplinaryRecord[]
> => {
  try {
    const recordsRef = collection(db, "disciplinary_records");
    const q = query(recordsRef, orderBy("created_at", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DisciplinaryRecord[];
  } catch (error) {
    console.error("Error fetching all disciplinary records:", error);
    throw error;
  }
};
