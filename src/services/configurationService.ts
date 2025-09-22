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
    const configData: any = {
      type: data.type,
      name: data.name,
      description: data.description,
      value: data.value,
      effective_date: Timestamp.fromDate(data.effective_date),
      created_by: createdBy,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
      is_active: true,
    };

    // Only add end_date if it exists (Firestore doesn't allow undefined values)
    if (data.end_date) {
      configData.end_date = Timestamp.fromDate(data.end_date);
    }

    await addDoc(collection(db, "configurations"), configData);
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

    // Build update data without undefined values
    const updateData: any = {
      updated_at: Timestamp.now(),
    };

    // Handle each field explicitly to ensure proper type conversion
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.value !== undefined) {
      updateData.value = data.value;
    }
    if (data.type !== undefined) {
      updateData.type = data.type;
    }
    if (data.is_active !== undefined) {
      updateData.is_active = data.is_active;
    }

    // Handle dates - convert to Firestore Timestamp if they're Date objects or already Timestamps
    if (data.effective_date !== undefined) {
      if (data.effective_date instanceof Date) {
        updateData.effective_date = Timestamp.fromDate(data.effective_date);
      } else {
        // If it's already a Timestamp, convert to Date then back to ensure compatibility
        updateData.effective_date = Timestamp.fromDate(data.effective_date.toDate());
      }
    }

    if (data.end_date !== undefined) {
      if (data.end_date instanceof Date) {
        updateData.end_date = Timestamp.fromDate(data.end_date);
      } else if (data.end_date) {
        // If it's already a Timestamp, convert to Date then back to ensure compatibility
        updateData.end_date = Timestamp.fromDate(data.end_date.toDate());
      }
    }

    await updateDoc(configRef, updateData);
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

    // Find the configuration that was valid for the specific date
    for (const doc of snapshot.docs) {
      const config = doc.data() as Configuration;

      // Check if this configuration was valid for the given date
      const configEffectiveDate = config.effective_date.toDate();
      const configEndDate = config.end_date?.toDate();

      // Configuration is valid if:
      // 1. Effective date is <= query date
      // 2. No end date specified OR end date is > query date
      if (configEffectiveDate <= effectiveDate &&
          (!configEndDate || configEndDate > effectiveDate)) {
        return config.value;
      }
    }

    // If no valid configuration found, return defaults
    const defaults: Record<ConfigurationType, number> = {
      monthly_fee: 150,
      late_penalty: 50,
      registration_fee: 500,
      other: 0,
    };
    return defaults[type];
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
