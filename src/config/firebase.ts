import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import logger from "../utils/logger";

// Production environment config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Connect to the local Firebase Emulator Suite when explicitly opted in
// during development (VITE_USE_EMULATORS=true + `npm run dev`). Production
// builds (import.meta.env.DEV === false) can never reach this branch, so
// there is no way to accidentally ship an emulator-pointing build.
const useEmulators =
  import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === "true";

// App Check: attests that requests to Firestore/Storage/Auth come from this
// app (reCAPTCHA v3). Skipped when no site key is configured, and when using
// emulators (App Check would reject emulator traffic).
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (recaptchaSiteKey && !useEmulators) {
  if (import.meta.env.DEV) {
    // In dev the SDK prints a debug token to the browser console on first
    // run; register it under App Check > Apps > Manage debug tokens
    Object.assign(self, { FIREBASE_APPCHECK_DEBUG_TOKEN: true });
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
export const auth = getAuth(app);
// Auto-detect long-polling instead of the default WebChannel/QUIC stream.
// Some networks (corporate proxies, certain ISPs, VPNs) break the HTTP/3
// streaming transport with errors like ERR_QUIC_PROTOCOL_ERROR, which makes
// onSnapshot listeners fail. This lets the SDK fall back to long-polling when
// streaming can't be established, with no effect on networks where it works.
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

if (useEmulators) {
  const host = "127.0.0.1";
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
  logger.info(
    "🔧 Firebase Emulators connected (Auth:9099, Firestore:8080, Storage:9199, Functions:5001)"
  );
}

// Shared Google OAuth provider for sign-in/up. `select_account` forces the
// account chooser so users aren't silently signed in with a stale session.
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
