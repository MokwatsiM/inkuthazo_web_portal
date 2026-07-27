import { describe, it, expect, vi } from "vitest";
import { Timestamp } from "firebase/firestore";

// useAuth.tsx imports ../config/firebase at module load, which calls
// getAuth()/initializeApp(). Mock it so the pure helpers can be imported
// without a live Firebase app / env vars (mirrors permissionService.test).
vi.mock("../config/firebase", () => ({
  auth: {},
  db: {},
  googleProvider: {},
}));

import { buildNewMember } from "./useAuth";

describe("buildNewMember", () => {
  it("builds a pending member with the given fields", () => {
    const member = buildNewMember("Thabo Mokoena", "thabo@example.com", "0821234567");
    expect(member.full_name).toBe("Thabo Mokoena");
    expect(member.email).toBe("thabo@example.com");
    expect(member.phone).toBe("0821234567");
  });

  it("always starts as a pending member role", () => {
    const member = buildNewMember("A", "a@example.com", "0123");
    expect(member.status).toBe("pending");
    expect(member.role).toBe("member");
  });

  it("stamps a Firestore Timestamp join_date", () => {
    const member = buildNewMember("A", "a@example.com", "0123");
    expect(member.join_date).toBeInstanceOf(Timestamp);
  });
});
