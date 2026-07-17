import { NotificationType } from "./types";

/**
 * Notification catalogue: pure rendering of every notification type into
 * in-app text and email content. No Firebase imports — unit-testable.
 */

export interface RenderedNotification {
  title: string;
  body: string;
  /** In-app route the notification links to (must exist in src/App.tsx) */
  link: string;
  emailSubject: string;
  emailBodyHtml: string;
  ctaLabel: string;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const withNotes = (base: string, notes?: string): string =>
  notes ? `${base} Note from the reviewer: "${notes}"` : base;

export function renderNotification(
  type: NotificationType,
  data: Record<string, string>
): RenderedNotification {
  const amount = data.amount ? `R${data.amount}` : "your";
  const contributionType = data.contributionType || "contribution";

  switch (type) {
    case "contribution_approved":
      return finalize({
        title: "Contribution approved",
        body: `Your ${contributionType} contribution of ${amount} has been approved.`,
        link: "/my-contributions",
        ctaLabel: "View my contributions",
      });
    case "contribution_rejected":
      return finalize({
        title: "Contribution rejected",
        body: withNotes(
          `Your ${contributionType} contribution of ${amount} was rejected.`,
          data.notes
        ),
        link: "/my-contributions",
        ctaLabel: "View my contributions",
      });
    case "claim_approved":
      return finalize({
        title: "Claim approved",
        body: withNotes(
          `Your claim of ${amount} has been approved. A payout will be processed.`,
          data.notes
        ),
        link: "/claims",
        ctaLabel: "View my claims",
      });
    case "claim_rejected":
      return finalize({
        title: "Claim rejected",
        body: withNotes(`Your claim of ${amount} was rejected.`, data.notes),
        link: "/claims",
        ctaLabel: "View my claims",
      });
    case "credit_approved":
      return finalize({
        title: "Credit approved",
        body: `Your credit request of ${amount} has been approved and is now active.`,
        link: "/my-credit",
        ctaLabel: "View my credit",
      });
    case "credit_rejected":
      return finalize({
        title: "Credit request rejected",
        body: withNotes(`Your credit request was rejected.`, data.notes),
        link: "/my-credit",
        ctaLabel: "View my credit",
      });
    case "credit_needs_info":
      return finalize({
        title: "Credit request needs more information",
        body: withNotes(
          "The reviewers need more information before deciding on your credit request.",
          data.requested
        ),
        link: "/my-credit",
        ctaLabel: "Provide information",
      });
    case "credit_settled":
      return finalize({
        title: "Credit settled",
        body: "Congratulations — your credit has been fully repaid and is now settled.",
        link: "/my-credit",
        ctaLabel: "View my credit",
      });
    case "donation_approved":
      return finalize({
        title: "Donation approved",
        body: `Your donation of ${amount} has been approved. Thank you for your generosity.`,
        link: "/my-donations",
        ctaLabel: "View my donations",
      });
    case "donation_rejected":
      return finalize({
        title: "Donation rejected",
        body: withNotes(`Your donation of ${amount} was rejected.`, data.notes),
        link: "/my-donations",
        ctaLabel: "View my donations",
      });
    case "member_approved":
      return finalize({
        title: "Welcome to Inkuthazo!",
        body: "Your membership has been approved. You now have full access to the portal.",
        link: "/",
        ctaLabel: "Open the portal",
      });
    case "hosting_reminder":
      return finalize({
        title: "You are hosting next month",
        body: `Reminder: you are scheduled to host the society meeting in ${
          data.monthName || "the coming month"
        }${data.year ? ` ${data.year}` : ""}.`,
        link: "/my-hosting-schedule",
        ctaLabel: "View my hosting schedule",
      });
    case "arrears_notice":
      return finalize({
        title: "Contribution arrears notice",
        body: `You have ${data.monthsOwed || "outstanding"} unpaid month(s) totalling ${amount}. Please settle your contributions.`,
        link: "/my-contributions",
        ctaLabel: "View my contributions",
      });
    case "credit_notice":
      return finalize({
        title: "Outstanding credit notice",
        body: `You have an outstanding credit balance of ${amount}. Please continue your repayments to settle it.`,
        link: "/my-credit",
        ctaLabel: "View my credit",
      });
  }
}

const finalize = (input: {
  title: string;
  body: string;
  link: string;
  ctaLabel: string;
}): RenderedNotification => ({
  ...input,
  emailSubject: `Inkuthazo: ${input.title}`,
  emailBodyHtml: `<p>${escapeHtml(input.body)}</p>`,
});

/**
 * Statement table for arrears notice emails: unpaid months with amounts
 * and a total row. Pure — unit-testable.
 */
export function buildArrearsStatementHtml(
  memberName: string,
  unpaidMonths: { month: string; amount: number }[],
  totalAmountOwed: number
): string {
  const rows = unpaidMonths
    .map(
      (entry) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(entry.month)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">R${entry.amount.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<p>Dear ${escapeHtml(memberName)},</p>
    <p>According to our records, your contributions are in arrears.
    Below is a statement of your outstanding months:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:16px 0;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Month</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">Amount owed</th>
      </tr>
      ${rows}
      <tr style="background-color:#fef2f2;">
        <td style="padding:10px 12px;font-weight:bold;">Total outstanding</td>
        <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#dc2626;">R${totalAmountOwed.toFixed(2)}</td>
      </tr>
    </table>
    <p>Please settle the outstanding amount at your earliest convenience.
    If you believe this is incorrect or have already paid, please contact
    the treasurer.</p>`;
}

export interface CreditNoticeLine {
  reason: string;
  issuedDate: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
}

/**
 * Statement table for outstanding-credit notice emails: one row per
 * unsettled credit plus a total row. Pure — unit-testable.
 */
export function buildCreditStatementHtml(
  memberName: string,
  credits: CreditNoticeLine[],
  totalOutstanding: number
): string {
  const rows = credits
    .map(
      (credit) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(credit.issuedDate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(credit.reason)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">R${credit.totalAmount.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">R${credit.totalPaid.toFixed(2)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">R${credit.remainingBalance.toFixed(2)}</td>
      </tr>`
    )
    .join("");

  return `<p>Dear ${escapeHtml(memberName)},</p>
    <p>According to our records, you have credit that has not yet been
    settled. Below is a statement of your outstanding credit:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;margin:16px 0;">
      <tr style="background-color:#f9fafb;">
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Issued</th>
        <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Reason</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">Total</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">Paid</th>
        <th style="padding:8px 12px;text-align:right;border-bottom:1px solid #e5e7eb;">Balance</th>
      </tr>
      ${rows}
      <tr style="background-color:#fef2f2;">
        <td colspan="4" style="padding:10px 12px;font-weight:bold;">Total outstanding</td>
        <td style="padding:10px 12px;text-align:right;font-weight:bold;color:#dc2626;">R${totalOutstanding.toFixed(2)}</td>
      </tr>
    </table>
    <p>Please continue your repayments to settle the balance. If you believe
    this is incorrect or have recently made a payment, please contact the
    treasurer.</p>`;
}

/**
 * Single inline-styled HTML shell for all transactional emails.
 */
export function emailLayout(
  title: string,
  bodyHtml: string,
  ctaLabel: string,
  ctaUrl: string
): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#4F46E5;padding:20px 32px;">
                <h1 style="margin:0;color:#ffffff;font-size:18px;">Inkuthazo Social Club</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">${title}</h2>
                <div style="color:#374151;font-size:14px;line-height:1.6;">${bodyHtml}</div>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                  <tr>
                    <td style="background-color:#4F46E5;border-radius:8px;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">${ctaLabel}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f9fafb;color:#6b7280;font-size:12px;">
                You are receiving this because you are a member of the Inkuthazo Social Club.
                You can turn email notifications off in your profile settings on the portal.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
