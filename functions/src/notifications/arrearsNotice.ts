import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { notify } from "./notify";
import { sendBrevoEmail, BREVO_API_KEY, APP_URL } from "./brevo";
import { emailLayout, buildArrearsStatementHtml } from "./catalogue";

/**
 * Admin-triggered arrears notices. The client computes arrears (same code
 * path as the arrears report) and passes the statement data; this callable
 * verifies the caller's permission, resolves each recipient's email
 * server-side (so the function cannot be used as an open relay), sends a
 * statement email, and writes an in-app notification.
 *
 * Arrears notices are account statements initiated by an admin, so they are
 * sent regardless of the member's `email_notifications` preference.
 */

interface ArrearsNoticeInput {
  memberId: string;
  monthsOwed: number;
  totalAmountOwed: number;
  unpaidMonths: { month: string; amount: number }[];
}

interface SendArrearsNoticesResult {
  sent: number;
  failed: { memberId: string; reason: string }[];
}

const MAX_NOTICES = 100;
const MAX_MONTHS = 48;

const isValidNotice = (notice: unknown): notice is ArrearsNoticeInput => {
  const candidate = notice as ArrearsNoticeInput;
  return (
    typeof candidate?.memberId === "string" &&
    candidate.memberId.length > 0 &&
    typeof candidate.monthsOwed === "number" &&
    typeof candidate.totalAmountOwed === "number" &&
    candidate.totalAmountOwed >= 0 &&
    Array.isArray(candidate.unpaidMonths) &&
    candidate.unpaidMonths.length <= MAX_MONTHS &&
    candidate.unpaidMonths.every(
      (entry) =>
        typeof entry?.month === "string" && typeof entry?.amount === "number"
    )
  );
};

export const sendArrearsNotices = functions
  .runWith({ secrets: [BREVO_API_KEY] })
  .https.onCall(
    async (
      data: { notices: ArrearsNoticeInput[] },
      context
    ): Promise<SendArrearsNoticesResult> => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Must be authenticated"
        );
      }

      // Authorize: caller's role (custom claim) must hold members.view —
      // the same permission that grants access to the Members page, so
      // DC members can send arrears notices too
      const db = getFirestore();
      const role = context.auth.token.role as string | undefined;
      const roleDoc = role ? await db.doc(`roles/${role}`).get() : null;
      const canViewMembers =
        roleDoc?.data()?.permissions?.members?.view === true;
      if (!canViewMembers) {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Requires the members view permission"
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
      const result: SendArrearsNoticesResult = { sent: 0, failed: [] };

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
            subject: "Inkuthazo: Contribution arrears statement",
            html: emailLayout(
              "Contribution arrears statement",
              buildArrearsStatementHtml(
                member.full_name || "Member",
                notice.unpaidMonths,
                notice.totalAmountOwed
              ),
              "View my contributions",
              `${APP_URL.value()}/my-contributions`
            ),
          });

          // In-app record (statement email already sent above)
          await notify(
            {
              type: "arrears_notice",
              key: `arrears_notice_${notice.memberId}_${today}`,
              recipientId: notice.memberId,
              source: { collection: "members", docId: notice.memberId },
              data: {
                amount: notice.totalAmountOwed.toFixed(2),
                monthsOwed: String(notice.monthsOwed),
              },
            },
            { sendEmail: false }
          );

          result.sent++;
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          logger.error(
            `Arrears notice failed for member ${notice.memberId}: ${reason}`
          );
          result.failed.push({ memberId: notice.memberId, reason });
        }
      }

      logger.info(
        `Arrears notices by ${context.auth.uid}: ${result.sent} sent, ${result.failed.length} failed`
      );
      return result;
    }
  );
