import { FirebaseError } from "firebase/app";

/**
 * Maps Firebase error codes to friendly, user-facing messages. Raw Firebase
 * messages (e.g. "Firebase: Error (auth/wrong-password).") are never shown to
 * users — they're confusing and leak implementation detail. Use
 * `getFriendlyErrorMessage` wherever an error reaches the UI.
 */
const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  // ---- Authentication ----
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/user-disabled": "This account has been disabled. Please contact an administrator.",
  "auth/user-not-found": "No account was found with those details.",
  "auth/wrong-password": "The email or password is incorrect.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-login-credentials": "The email or password is incorrect.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in instead.",
  "auth/weak-password": "Please choose a stronger password (at least 6 characters).",
  "auth/missing-password": "Please enter your password.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/requires-recent-login": "Please sign in again to complete this action.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email. Sign in with your password to link it.",
  "auth/unauthorized-domain": "Sign-in isn't allowed from this address. Please contact an administrator.",
  "auth/operation-not-allowed": "This sign-in method isn't enabled. Please contact an administrator.",
  "auth/expired-action-code": "This link has expired. Please request a new one.",
  "auth/invalid-action-code": "This link is invalid or has already been used.",

  // ---- Firestore ----
  "permission-denied": "You don't have permission to do that.",
  "unavailable": "The service is temporarily unavailable. Please try again shortly.",
  "not-found": "The requested item could not be found.",
  "already-exists": "That item already exists.",
  "failed-precondition": "This action can't be completed right now. Please refresh and try again.",
  "deadline-exceeded": "The request timed out. Please try again.",
  "resource-exhausted": "The service is busy. Please try again shortly.",
  "unauthenticated": "Please sign in to continue.",

  // ---- Storage ----
  "storage/unauthorized": "You don't have permission to access this file.",
  "storage/canceled": "The upload was cancelled.",
  "storage/quota-exceeded": "Storage limit reached. Please contact an administrator.",
  "storage/retry-limit-exceeded": "The upload failed after several attempts. Please try again.",
  "storage/object-not-found": "The file could not be found.",

  // ---- Cloud Functions (callable) ----
  "functions/unauthenticated": "Please sign in to continue.",
  "functions/permission-denied": "You don't have permission to do that.",
  "functions/invalid-argument": "Some of the information provided was invalid.",
  "functions/internal": "Something went wrong. Please try again.",
  "functions/unavailable": "The service is temporarily unavailable. Please try again shortly.",
};

const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

/**
 * Translate any error into a friendly, user-facing message.
 *
 * @param error   the caught error (FirebaseError, Error, or unknown)
 * @param fallback message to use when the error isn't a known Firebase code
 *                 (defaults to a generic "something went wrong")
 */
export const getFriendlyErrorMessage = (
  error: unknown,
  fallback: string = DEFAULT_MESSAGE
): string => {
  if (error instanceof FirebaseError) {
    return FIREBASE_ERROR_MESSAGES[error.code] ?? fallback;
  }
  // Some Firebase SDK errors arrive as plain objects with a `code` field.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    return FIREBASE_ERROR_MESSAGES[code] ?? fallback;
  }
  return fallback;
};

/**
 * Like `getFriendlyErrorMessage`, but preserves the message of a plain
 * `Error` thrown deliberately by app code (e.g. import validation like
 * "Member not found: X"). Only Firebase codes are translated; anything else
 * keeps its own message. Use where the thrown text is meant for the user.
 */
export const getActionableErrorMessage = (
  error: unknown,
  fallback: string = DEFAULT_MESSAGE
): string => {
  if (error instanceof FirebaseError) {
    return FIREBASE_ERROR_MESSAGES[error.code] ?? fallback;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    return FIREBASE_ERROR_MESSAGES[code] ?? fallback;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};
