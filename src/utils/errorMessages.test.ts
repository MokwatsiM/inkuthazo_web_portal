import { describe, it, expect } from "vitest";
import { FirebaseError } from "firebase/app";
import {
  getFriendlyErrorMessage,
  getActionableErrorMessage,
} from "./errorMessages";

describe("getFriendlyErrorMessage", () => {
  it("maps known auth codes to friendly text (never the raw message)", () => {
    const err = new FirebaseError(
      "auth/wrong-password",
      "Firebase: Error (auth/wrong-password)."
    );
    const msg = getFriendlyErrorMessage(err);
    expect(msg).toBe("The email or password is incorrect.");
    expect(msg).not.toContain("Firebase");
    expect(msg).not.toContain("auth/");
  });

  it("maps firestore permission-denied", () => {
    const err = new FirebaseError("permission-denied", "Missing or insufficient permissions.");
    expect(getFriendlyErrorMessage(err)).toBe("You don't have permission to do that.");
  });

  it("maps storage codes", () => {
    const err = new FirebaseError("storage/unauthorized", "raw");
    expect(getFriendlyErrorMessage(err)).toBe(
      "You don't have permission to access this file."
    );
  });

  it("handles plain objects that carry a Firebase code", () => {
    expect(getFriendlyErrorMessage({ code: "auth/too-many-requests" })).toBe(
      "Too many attempts. Please wait a few minutes and try again."
    );
  });

  it("uses the provided fallback for unknown Firebase codes", () => {
    const err = new FirebaseError("auth/some-new-code", "raw firebase text");
    expect(getFriendlyErrorMessage(err, "Failed to sign in")).toBe("Failed to sign in");
  });

  it("uses the fallback for non-Firebase errors", () => {
    expect(getFriendlyErrorMessage(new Error("boom"), "Custom fallback")).toBe(
      "Custom fallback"
    );
    expect(getFriendlyErrorMessage("a string")).toBe(
      "Something went wrong. Please try again."
    );
  });
});

describe("getActionableErrorMessage", () => {
  it("still maps Firebase codes to friendly text", () => {
    const err = new FirebaseError("permission-denied", "Missing or insufficient permissions.");
    expect(getActionableErrorMessage(err)).toBe("You don't have permission to do that.");
  });

  it("preserves the message of an app-thrown Error (e.g. import validation)", () => {
    expect(getActionableErrorMessage(new Error("Member not found: Thabo"))).toBe(
      "Member not found: Thabo"
    );
  });

  it("uses the fallback for non-Error, non-Firebase values", () => {
    expect(getActionableErrorMessage(42, "fallback")).toBe("fallback");
  });
});
