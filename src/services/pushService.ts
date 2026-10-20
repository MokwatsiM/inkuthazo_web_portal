import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";
import { app, db } from "../config/firebase";
import { isIos, isStandalone } from "../components/pwa/platform";
import logger from "../utils/logger";

/**
 * Phone push notifications via Firebase Cloud Messaging
 * (docs/specs/pwa R5 / D6). Each device stores its FCM token at
 * `members/{uid}/push_tokens/{token}`; the `notify()` Cloud Function fans
 * out to those tokens.
 */

const TOKEN_KEY = "push-token";
const SW_READY_TIMEOUT_MS = 5000;

export type PushState =
  /** Browser can't do web push at all */
  | "unsupported"
  /** iPhone/iPad: push only works once added to the Home Screen */
  | "needs-install"
  /** Member denied the browser permission prompt */
  | "blocked"
  | "off"
  | "on";

export const hasPushApis = (): boolean =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

/** Pure decision used by the profile toggle; kept separate so it is testable. */
export const resolvePushState = (input: {
  hasApis: boolean;
  ios: boolean;
  standalone: boolean;
  permission: NotificationPermission | "none";
  preference: boolean | undefined;
}): PushState => {
  if (input.ios && !input.standalone) return "needs-install";
  if (!input.hasApis) return "unsupported";
  if (input.permission === "denied") return "blocked";
  if (input.permission === "granted" && input.preference === true) return "on";
  return "off";
};

export const getPushState = async (
  preference: boolean | undefined
): Promise<PushState> => {
  const state = resolvePushState({
    hasApis: hasPushApis(),
    ios: isIos(),
    standalone: isStandalone(),
    permission: hasPushApis() ? Notification.permission : "none",
    preference,
  });
  if (state === "unsupported" || state === "needs-install") return state;
  // Some browsers expose the APIs but can't actually use FCM
  return (await isSupported().catch(() => false)) ? state : "unsupported";
};

const readStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const storeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable — server prunes stale tokens anyway.
  }
};

const platformOf = (): string => {
  if (isIos()) return "ios";
  if (/android/i.test(navigator.userAgent)) return "android";
  return "web";
};

/** The service worker registration FCM should attach to (our sw.ts). */
const getRegistration = async (): Promise<ServiceWorkerRegistration> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("The app is still getting ready. Try again in a moment.")),
      SW_READY_TIMEOUT_MS
    )
  );
  return Promise.race([navigator.serviceWorker.ready, timeout]);
};

/** Fetch (or refresh) this device's token and save it for the member. */
const registerToken = async (uid: string): Promise<string> => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    throw new Error("Push notifications are not configured for this build.");
  }
  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration: await getRegistration(),
  });
  if (!token) throw new Error("Could not register this device for notifications.");

  await setDoc(
    doc(db, "members", uid, "push_tokens", token),
    {
      token,
      platform: platformOf(),
      user_agent: navigator.userAgent.slice(0, 200),
      updated_at: serverTimestamp(),
    },
    { merge: true }
  );
  storeToken(token);
  return token;
};

/** Must be called from a click handler (browsers require a user gesture). */
export const enablePush = async (uid: string): Promise<void> => {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Allow them in your browser or phone settings, then try again."
        : "Notification permission was not granted."
    );
  }
  await registerToken(uid);
  await updateDoc(doc(db, "members", uid), { push_notifications: true });
};

export const disablePush = async (uid: string): Promise<void> => {
  const token = readStoredToken();
  if (token) {
    await deleteDoc(doc(db, "members", uid, "push_tokens", token)).catch((err) =>
      logger.warn("Could not delete push token doc", err)
    );
    await deleteToken(getMessaging(app)).catch((err) =>
      logger.warn("Could not revoke push token", err)
    );
    storeToken(null);
  }
  await updateDoc(doc(db, "members", uid), { push_notifications: false });
};

/**
 * Keeps an opted-in member's token current (FCM rotates tokens, and signing
 * back in on the same device needs the token re-attached). Never prompts.
 */
export const syncPushToken = async (uid: string): Promise<void> => {
  if (!hasPushApis() || Notification.permission !== "granted") return;
  if (isIos() && !isStandalone()) return;
  try {
    if (await isSupported()) await registerToken(uid);
  } catch (error) {
    logger.warn("Push token sync failed", error);
  }
};

/**
 * Sign-out: stop this device receiving the previous member's notifications
 * (shared phones, R7 AC7.2). Best effort and must run while still signed in.
 */
export const removeThisDeviceToken = async (uid: string): Promise<void> => {
  const token = readStoredToken();
  if (!token) return;
  try {
    await deleteDoc(doc(db, "members", uid, "push_tokens", token));
  } catch (error) {
    logger.warn("Could not remove push token on sign-out", error);
  }
  storeToken(null);
};

/** Foreground messages (app open) arrive here instead of the service worker. */
export const listenForegroundMessages = async (
  handler: (message: { title: string; body: string; link?: string }) => void
): Promise<() => void> => {
  if (!hasPushApis() || !(await isSupported().catch(() => false))) {
    return () => undefined;
  }
  return onMessage(getMessaging(app), (payload) => {
    const data = payload.data ?? {};
    handler({ title: data.title ?? "Inkuthazo", body: data.body ?? "", link: data.link });
  });
};
