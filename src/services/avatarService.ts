import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    // Create a reference to the avatar file in Firebase Storage
    const avatarRef = ref(storage, `avatars/${userId}/${Date.now()}_${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(avatarRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update the user's document with the new avatar URL
    const userRef = doc(db, 'members', userId);
    await updateDoc(userRef, {
      avatar_url: downloadURL
    });

    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export const deleteAvatar = async (userId: string, avatarUrl: string): Promise<void> => {
  try {
    // Delete the old avatar file from storage
    const fileRef = ref(storage, avatarUrl);
    await deleteObject(fileRef);

    // Update the user's document to remove the avatar URL
    const userRef = doc(db, 'members', userId);
    await updateDoc(userRef, {
      avatar_url: null
    });
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
};