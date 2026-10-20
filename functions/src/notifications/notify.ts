import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/logger";
import { NotificationEvent } from "./types";
import { renderNotification, emailLayout } from "./catalogue";
import { sendBrevoEmail, APP_URL } from "./brevo";
import { sendPush } from "./push";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/** grpc ALREADY_EXISTS status code (thrown by create() on retries) */
const ALREADY_EXISTS = 6;

/**
 * Single choke point for all lifecycle notifications:
 * 1. writes the durable in-app notification doc (idempotent via create()
 *    on a deterministic id — trigger retries dedupe automatically);
 * 2. sends a phone push (FCM) best-effort to the member's devices;
 * 3. sends the email best-effort (a failed send never fails the trigger).
 */
export async function notify(
  event: NotificationEvent,
  options: { sendEmail?: boolean } = {}
): Promise<void> {
  const { sendEmail = true } = options;
  const rendered = renderNotification(event.type, event.data);
  const db = getFirestore();
  const now = Timestamp.now();

  try {
    await db.doc(`notifications/${event.key}`).create({
      user_id: event.recipientId,
      type: event.type,
      title: rendered.title,
      body: rendered.body,
      link: rendered.link,
      read: false,
      created_at: now,
      expires_at: Timestamp.fromMillis(now.toMillis() + NINETY_DAYS_MS),
      source: { collection: event.source.collection, doc_id: event.source.docId },
    });
  } catch (error) {
    if ((error as { code?: number }).code === ALREADY_EXISTS) {
      logger.debug(`Notification ${event.key} already exists, skipping`);
      return;
    }
    throw error;
  }

  let member: FirebaseFirestore.DocumentData | undefined;
  try {
    member = (await db.doc(`members/${event.recipientId}`).get()).data();
  } catch (error) {
    logger.error(`Notification ${event.key}: member lookup failed`, error);
  }

  // Push goes out for every notification, including those whose callers send
  // their own email (sendEmail: false) — it is a separate channel.
  await sendPush(event.recipientId, member, {
    title: rendered.title,
    body: rendered.body,
    link: rendered.link,
    tag: event.key,
  });

  // Callers that send their own richer email (e.g. arrears statements)
  // opt out of the default one
  if (!sendEmail) return;

  try {
    if (!member?.email) {
      logger.warn(`No email for member ${event.recipientId}, in-app only`);
      return;
    }
    if (member.email_notifications === false) {
      return; // member opted out (unset means opted in)
    }

    await sendBrevoEmail({
      to: member.email,
      toName: member.full_name,
      subject: rendered.emailSubject,
      html: emailLayout(
        rendered.title,
        rendered.emailBodyHtml,
        rendered.ctaLabel,
        `${APP_URL.value()}${rendered.link}`
      ),
    });
    logger.info(`Notification ${event.key}: email sent to member ${event.recipientId}`);
  } catch (error) {
    // In-app notification is already written; email is best-effort
    logger.error(`Notification ${event.key}: email send failed`, error);
  }
}
