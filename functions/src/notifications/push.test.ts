import { beforeEach, describe, expect, it, vi } from "vitest";

const sendEachForMulticast = vi.fn();
const deleteDoc = vi.fn();
const getTokens = vi.fn();

vi.mock("firebase-admin/messaging", () => ({
  getMessaging: () => ({ sendEachForMulticast }),
}));
vi.mock("firebase-admin/firestore", () => ({
  getFirestore: () => ({
    collection: () => ({ get: getTokens }),
    doc: (path: string) => ({ delete: () => deleteDoc(path) }),
  }),
}));
vi.mock("firebase-functions/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { sendPush } from "./push";

const content = { title: "T", body: "B", link: "/my-credit", tag: "k1" };
const tokenDocs = (...tokens: string[]) => ({
  docs: tokens.map((token) => ({ data: () => ({ token }) })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendPush", () => {
  it("sends a data-only message to all of the member's devices", async () => {
    getTokens.mockResolvedValue(tokenDocs("a", "b"));
    sendEachForMulticast.mockResolvedValue({ successCount: 2, failureCount: 0, responses: [{}, {}] });

    await sendPush("m1", {}, content);

    const message = sendEachForMulticast.mock.calls[0][0];
    expect(message.tokens).toEqual(["a", "b"]);
    expect(message.data).toEqual({ title: "T", body: "B", link: "/my-credit", tag: "k1" });
    expect(message.notification).toBeUndefined();
  });

  it("does nothing when the member opted out", async () => {
    await sendPush("m1", { push_notifications: false }, content);
    expect(getTokens).not.toHaveBeenCalled();
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("does nothing when the member has no devices", async () => {
    getTokens.mockResolvedValue(tokenDocs());
    await sendPush("m1", undefined, content);
    expect(sendEachForMulticast).not.toHaveBeenCalled();
  });

  it("prunes tokens FCM reports as dead, keeps the rest (AC6.7)", async () => {
    getTokens.mockResolvedValue(tokenDocs("good", "gone", "bad"));
    sendEachForMulticast.mockResolvedValue({
      successCount: 1,
      failureCount: 2,
      responses: [
        {},
        { error: { code: "messaging/registration-token-not-registered" } },
        { error: { code: "messaging/invalid-registration-token" } },
      ],
    });

    await sendPush("m1", {}, content);

    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(deleteDoc).toHaveBeenCalledWith("members/m1/push_tokens/gone");
    expect(deleteDoc).toHaveBeenCalledWith("members/m1/push_tokens/bad");
  });

  it("keeps tokens on transient errors", async () => {
    getTokens.mockResolvedValue(tokenDocs("a"));
    sendEachForMulticast.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [{ error: { code: "messaging/internal-error" } }],
    });
    await sendPush("m1", {}, content);
    expect(deleteDoc).not.toHaveBeenCalled();
  });

  it("never throws when FCM fails (AC6.6)", async () => {
    getTokens.mockResolvedValue(tokenDocs("a"));
    sendEachForMulticast.mockRejectedValue(new Error("fcm down"));
    await expect(sendPush("m1", {}, content)).resolves.toBeUndefined();
  });
});
