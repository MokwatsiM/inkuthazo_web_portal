import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { Timestamp } from 'firebase/firestore';
import type { Dependant } from '../types';

export const uploadDependantDocument = async (
  memberId: string,
  dependantId: string,
  file: File
): Promise<string> => {
  const storageRef = ref(
    storage,
    `dependants/${memberId}/${dependantId}_${Date.now()}_${file.name}`
  );
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

export const deleteDependantDocument = async (documentUrl: string): Promise<void> => {
  try {
    const fileRef = ref(storage, documentUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting dependant document:', error);
    throw error;
  }
};

export const addDependant = async (
  memberId: string,
  dependantData: Omit<Dependant, 'id'>,
  file: File
): Promise<void> => {
  try {
    const dependantId = `dep_${Date.now()}`;
    const documentUrl = await uploadDependantDocument(memberId, dependantId, file);

    const dependant: Dependant = {
      id: dependantId,
      ...dependantData,
      date_of_birth:  dependantData.date_of_birth,
      id_document_url: documentUrl
    };

    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      dependants: arrayUnion(dependant)
    });
  } catch (error) {
    console.error('Error adding dependant:', error);
    throw error;
  }
};

export const removeDependant = async (
  memberId: string,
  dependant: Dependant
): Promise<void> => {
  try {
    if (dependant.id_document_url) {
      await deleteDependantDocument(dependant.id_document_url);
    }

    const memberRef = doc(db, 'members', memberId);
    await updateDoc(memberRef, {
      dependants: arrayRemove(dependant)
    });
  } catch (error) {
    console.error('Error removing dependant:', error);
    throw error;
  }
};