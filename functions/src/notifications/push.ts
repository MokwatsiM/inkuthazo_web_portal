import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { logger } from "firebase-functions/logger";

/** FCM error codes meaning the device token is permanently dead. */
const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export interface PushContent {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped, e.g. /my-credit */
  link: string;
  /** Stable key so a retried/duplicate event replaces rather than stacks */
  tag: string;
}

/**
 * Sends a phone push to every registered device of a member.
 *
 * Best effort: never throws (the in-app notification is already written).
 * Data-only on purpose — the service worker displays it, so a `notification`
 * payload would show twice. Dead tokens are pruned (docs/specs/pwa AC6.7).
 */
export async function sendPush(
  memberId: string,
  member: { push_notifications?: boolean } | undefined,
  content: PushContent
): Promise<void> {
  try {
    if (member?.push_notifications === false) return; // opted out

    const db = getFirestore();
    const snapshot = await db.collection(`members/${memberId}/push_tokens`).get();
    const tokens = snapshot.docs
      .map((d) => d.data().token as string | undefined)
      .filter((t): t is string => Boolean(t));
    if (tokens.length === 0) return;

    const response = await getMessaging().sendEachForMulticast({
      tokens,
      data: {
        title: content.title,
        body: content.body,
        link: content.link,
        tag: content.tag,
      },
      webpush: { headers: { Urgency: "high" }, fcmOptions: { link: content.link } },
    });

    const dead: string[] = [];
    response.responses.forEach((result, i) => {
      const code = result.error?.code;
      if (code && DEAD_TOKEN_CODES.has(code)) dead.push(tokens[i]);
    });
    if (dead.length > 0) {
      await Promise.all(
        dead.map((token) => db.doc(`members/${memberId}/push_tokens/${token}`).delete())
      );
    }
    logger.info(
      `Push to member ${memberId}: ${response.successCount} sent, ` +
        `${response.failureCount} failed, ${dead.length} pruned`
    );
  } catch (error) {
    logger.error(`Push to member ${memberId} failed`, error);
  }
}
