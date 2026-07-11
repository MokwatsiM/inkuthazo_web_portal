import { describe, it, expect } from "vitest";
import { mapStatusTransition } from "./transitions";

describe("mapStatusTransition", () => {
  it("maps contribution review outcomes", () => {
    expect(mapStatusTransition("contributions", "pending", "approved")).toBe(
      "contribution_approved"
    );
    expect(mapStatusTransition("contributions", "pending", "rejected")).toBe(
      "contribution_rejected"
    );
  });

  it("ignores contribution edits that do not change review state", () => {
    expect(mapStatusTransition("contributions", "approved", "approved")).toBeNull();
    expect(mapStatusTransition("contributions", "approved", "rejected")).toBeNull();
    expect(mapStatusTransition("contributions", "pending", "pending")).toBeNull();
  });

  it("maps claim review outcomes", () => {
    expect(mapStatusTransition("claims", "pending", "approved")).toBe("claim_approved");
    expect(mapStatusTransition("claims", "pending", "rejected")).toBe("claim_rejected");
    expect(mapStatusTransition("claims", "approved", "rejected")).toBeNull();
  });

  it("maps the credit lifecycle including the 'active' approval status", () => {
    // reviewCredit sets status 'active' on approval
    expect(mapStatusTransition("credits", "pending_review", "active")).toBe(
      "credit_approved"
    );
    expect(mapStatusTransition("credits", "pending_review", "approved")).toBe(
      "credit_approved"
    );
    expect(mapStatusTransition("credits", "needs_info", "active")).toBe(
      "credit_approved"
    );
    expect(mapStatusTransition("credits", "pending_review", "rejected")).toBe(
      "credit_rejected"
    );
    expect(mapStatusTransition("credits", "pending_review", "needs_info")).toBe(
      "credit_needs_info"
    );
    expect(mapStatusTransition("credits", "active", "settled")).toBe("credit_settled");
  });

  it("ignores non-lifecycle credit updates", () => {
    // payment that does not settle: status unchanged
    expect(mapStatusTransition("credits", "active", "active")).toBeNull();
    expect(mapStatusTransition("credits", "settled", "active")).toBeNull();
    // needs_info -> needs_info repeat request is not a new notification
    expect(mapStatusTransition("credits", "needs_info", "needs_info")).toBeNull();
  });

  it("maps donation review outcomes", () => {
    expect(mapStatusTransition("donations", "pending", "approved")).toBe(
      "donation_approved"
    );
    expect(mapStatusTransition("donations", "pending", "rejected")).toBe(
      "donation_rejected"
    );
  });

  it("maps member approval to a welcome event", () => {
    expect(mapStatusTransition("members", "pending", "approved")).toBe("member_approved");
    expect(mapStatusTransition("members", "pending", "active")).toBe("member_approved");
    expect(mapStatusTransition("members", "approved", "active")).toBeNull();
    expect(mapStatusTransition("members", "active", "inactive")).toBeNull();
  });

  it("returns null for missing statuses", () => {
    expect(mapStatusTransition("contributions", undefined, "approved")).toBeNull();
    expect(mapStatusTransition("contributions", "pending", undefined)).toBeNull();
  });
});
