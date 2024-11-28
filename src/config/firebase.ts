import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyASFxUFPYG-pu8BKYcEIkqKrtlQN5Xja8A",
  authDomain: "inkuthazo-a0ac7.firebaseapp.com",
  projectId: "inkuthazo-a0ac7",
  storageBucket: "inkuthazo-a0ac7.firebasestorage.app",
  messagingSenderId: "519479960600",
  appId: "1:519479960600:web:1a7584f91218e0881bcf6d",
  measurementId: "G-10XSV7NX3S"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);