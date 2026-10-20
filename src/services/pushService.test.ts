import { describe, it, expect } from "vitest";
import { resolvePushState } from "./pushService";

const base = {
  hasApis: true,
  ios: false,
  standalone: false,
  permission: "default" as NotificationPermission | "none",
  preference: undefined as boolean | undefined,
};

describe("resolvePushState", () => {
  it("asks iPhone users to install first (AC5.3)", () => {
    expect(resolvePushState({ ...base, ios: true, standalone: false })).toBe("needs-install");
  });

  it("allows push on an installed iPhone app", () => {
    expect(resolvePushState({ ...base, ios: true, standalone: true })).toBe("off");
  });

  it("reports unsupported browsers", () => {
    expect(resolvePushState({ ...base, hasApis: false, permission: "none" })).toBe("unsupported");
  });

  it("reports blocked when permission was denied (AC5.4)", () => {
    expect(resolvePushState({ ...base, permission: "denied" })).toBe("blocked");
  });

  it("is on only when permission is granted and the member opted in", () => {
    expect(resolvePushState({ ...base, permission: "granted", preference: true })).toBe("on");
    expect(resolvePushState({ ...base, permission: "granted", preference: false })).toBe("off");
    expect(resolvePushState({ ...base, permission: "granted" })).toBe("off");
  });
});
