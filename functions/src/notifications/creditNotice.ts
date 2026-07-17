import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { notify } from "./notify";
import { sendBrevoEmail, BREVO_API_KEY, APP_URL } from "./brevo";
import {
  emailLayout,
  buildCreditStatementHtml,
  CreditNoticeLine,
} from "./catalogue";

/**
 * Admin-triggered outstanding-credit notices, mirroring the arrears-notice
 * flow: the client computes which members have unsettled credit and passes
 * the statement data; this callable verifies the caller's permission,
 * resolves each recipient's email server-side (no open relay), sends a
 * statement email, and writes an in-app notification.
 *
 * Credit notices are account statements initiated by an admin, so they are
 * sent regardless of the member's `email_notifications` preference.
 */

interface CreditNoticeInput {
  memberId: string;
  totalOutstanding: number;
  credits: CreditNoticeLine[];
}

interface SendCreditNoticesResult {
  sent: number;
  failed: { memberId: string; reason: string }[];
}

const MAX_NOTICES = 100;
const MAX_CREDITS_PER_MEMBER = 20;

const isValidLine = (line: unknown): line is CreditNoticeLine => {
  const candidate = line as CreditNoticeLine;
  return (
    typeof candidate?.reason === "string" &&
    typeof candidate.issuedDate === "string" &&
    typeof candidate.totalAmount === "number" &&
    typeof candidate.totalPaid === "number" &&
    typeof candidate.remainingBalance === "number"
  );
};

const isValidNotice = (notice: unknown): notice is CreditNoticeInput => {
  const candidate = notice as CreditNoticeInput;
  return (
    typeof candidate?.memberId === "string" &&
    candidate.memberId.length > 0 &&
    typeof candidate.totalOutstanding === "number" &&
    candidate.totalOutstanding >= 0 &&
    Array.isArray(candidate.credits) &&
    candidate.credits.length > 0 &&
    candidate.credits.length <= MAX_CREDITS_PER_MEMBER &&
    candidate.credits.every(isValidLine)
  );
};

export const sendCreditNotices = functions
  .runWith({ secrets: [BREVO_API_KEY] })
  .https.onCall(
    async (
      data: { notices: CreditNoticeInput[] },
      context
    ): Promise<SendCreditNoticesResult> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Must be authenticated"
        );
      }

      // Authorize: caller's role (custom claim) must hold credits.view —
      // the same permission that grants access to the Credits page
      const db = getFirestore();
      const role = context.auth.token.role as string | undefined;
      const roleDoc = role ? await db.doc(`roles/${role}`).get() : null;
      const canViewCredits =
        roleDoc?.data()?.permissions?.credits?.view === true;
      if (!canViewCredits) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Requires the credits view permission"
        );
      }

      const notices = data?.notices;
      if (!Array.isArray(notices) || notices.length === 0) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "notices must be a non-empty array"
        );
      }
      if (notices.length > MAX_NOTICES) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `At most ${MAX_NOTICES} notices per call`
        );
      }
      if (!notices.every(isValidNotice)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "One or more notices are malformed"
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const result: SendCreditNoticesResult = { sent: 0, failed: [] };

      for (const notice of notices) {
        try {
          // Recipient email resolved server-side, never from the payload
          const member = (await db.doc(`members/${notice.memberId}`).get()).data();
          if (!member?.email) {
            result.failed.push({
              memberId: notice.memberId,
              reason: "Member not found or has no email address",
            });
            continue;
          }

          await sendBrevoEmail({
            to: member.email,
            toName: member.full_name,
            subject: "Inkuthazo: Outstanding credit statement",
            html: emailLayout(
              "Outstanding credit statement",
              buildCreditStatementHtml(
                member.full_name || "Member",
                notice.credits,
                notice.totalOutstanding
              ),
              "View my credit",
              `${APP_URL.value()}/my-credit`
            ),
          });

          // In-app record (statement email already sent above)
          await notify(
            {
              type: "credit_notice",
              key: `credit_notice_${notice.memberId}_${today}`,
              recipientId: notice.memberId,
              source: { collection: "credits", docId: notice.memberId },
              data: {
                amount: notice.totalOutstanding.toFixed(2),
              },
            },
            { sendEmail: false }
          );

          result.sent++;
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          logger.error(
            `Credit notice failed for member ${notice.memberId}: ${reason}`
          );
          result.failed.push({ memberId: notice.memberId, reason });
        }
      }

      logger.info(
        `Credit notices by ${context.auth.uid}: ${result.sent} sent, ${result.failed.length} failed`
      );
      return result;
    }
  );
