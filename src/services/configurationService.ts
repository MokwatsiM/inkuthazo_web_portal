import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  Configuration,
  ConfigurationInput,
  ConfigurationType,
} from "../types/configuration";

export const addConfiguration = async (
  data: ConfigurationInput,
  createdBy: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "configurations"), {
      ...data,
      effective_date: Timestamp.fromDate(data.effective_date),
      created_by: createdBy,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      is_active: true,
    });
  } catch (error) {
    console.error("Error adding configuration:", error);
    throw error;
  }
};

export const updateConfiguration = async (
  id: string,
  data: Partial<Configuration>
): Promise<void> => {
  try {
    const configRef = doc(db, "configurations", id);
    await updateDoc(configRef, {
      ...data,
      updated_at: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    throw error;
  }
};

export const deleteConfiguration = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "configurations", id));
  } catch (error) {
    console.error("Error deleting configuration:", error);
    throw error;
  }
};

export const getAllConfigurations = async (): Promise<Configuration[]> => {
  try {
    const configurationsRef = collection(db, "configurations");
    const q = query(
      configurationsRef,
      where("is_active", "==", true),
      orderBy("type"),
      orderBy("effective_date", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Configuration[];
  } catch (error) {
    console.error("Error fetching configurations:", error);
    throw error;
  }
};

export const getConfigurationValue = async (
  type: ConfigurationType,
  effectiveDate: Date = new Date()
): Promise<number> => {
  try {
    const configurationsRef = collection(db, "configurations");
    const q = query(
      configurationsRef,
      where("type", "==", type),
      where("is_active", "==", true),
      where("effective_date", "<=", Timestamp.fromDate(effectiveDate)),
      orderBy("effective_date", "desc")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return default values if no configuration found
      const defaults: Record<ConfigurationType, number> = {
        monthly_fee: 150,
        late_penalty: 50,
        registration_fee: 500,
        other: 0,
      };
      return defaults[type];
    }

    const latestConfig = snapshot.docs[0].data() as Configuration;
    return latestConfig.value;
  } catch (error) {
    console.error("Error getting configuration value:", error);
    // Return default values on error
    const defaults: Record<ConfigurationType, number> = {
      monthly_fee: 150,
      late_penalty: 50,
      registration_fee: 500,
      other: 0,
    };
    return defaults[type];
  }
};

export const getConfigurationHistory = async (
  type: ConfigurationType
): Promise<Configuration[]> => {
  try {
    const configurationsRef = collection(db, "configurations");
    const q = query(
      configurationsRef,
      where("type", "==", type),
      where("is_active", "==", true),
      orderBy("effective_date", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Configuration[];
  } catch (error) {
    console.error("Error fetching configuration history:", error);
    throw error;
  }
};
