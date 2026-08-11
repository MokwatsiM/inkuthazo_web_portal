import * as functions from "firebase-functions/v1";
import { logger } from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { notify } from "./notify";
import { mapStatusTransition } from "./transitions";
import { BREVO_API_KEY } from "./brevo";
import { NotificationType } from "./types";

const withEmailSecret = functions.runWith({ secrets: [BREVO_API_KEY] });

const formatAmount = (amount: unknown): string =>
  typeof amount === "number" ? amount.toFixed(2) : "";

const millis = (timestamp: unknown): string => {
  const value = timestamp as { toMillis?: () => number } | undefined;
  return value?.toMillis ? String(value.toMillis()) : String(Date.now());
};

/**
 * New contribution submitted -> notify all admins that a review is needed.
 * Fans out to every member with role 'admin' (in-app + email each). The
 * notification key is per-admin + contribution so retries dedupe.
 */
export const onContributionCreated = withEmailSecret.firestore
  .document("contributions/{contributionId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data || data.status !== "pending" || !data.member_id) return;

    const db = getFirestore();

    // Resolve the submitting member's name for the message.
    let memberName = "A member";
    try {
      const member = (await db.doc(`members/${data.member_id}`).get()).data();
      if (member?.full_name) memberName = member.full_name;
    } catch (error) {
      logger.warn("onContributionCreated: could not load member name", error);
    }

    const admins = await db
      .collection("members")
      .where("role", "==", "admin")
      .get();

    if (admins.empty) {
      logger.warn("onContributionCreated: no admins to notify");
      return;
    }

    const contributionType = String(data.type || "").replace("_", " ");
    await Promise.all(
      admins.docs.map((adminDoc) =>
        notify({
          type: "contribution_submitted" as NotificationType,
          key: `contribution_submitted_${context.params.contributionId}_${adminDoc.id}`,
          recipientId: adminDoc.id,
          source: {
            collection: "contributions",
            docId: context.params.contributionId,
          },
          data: {
            memberName,
            amount: formatAmount(data.amount),
            contributionType,
          },
        })
      )
    );

    logger.info(
      `onContributionCreated: notified ${admins.size} admin(s) about ${context.params.contributionId}`
    );
  });

/**
 * Contribution review: pending -> approved/rejected
 */
export const onContributionReviewed = withEmailSecret.firestore
  .document("contributions/{contributionId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const type = mapStatusTransition("contributions", before.status, after.status);
    if (!type || !after.member_id) return;
    if (after.reviewed_by === after.member_id) return; // self-review

    await notify({
      type,
      key: `${type}_${context.params.contributionId}_${millis(after.reviewed_at)}`,
      recipientId: after.member_id,
      source: { collection: "contributions", docId: context.params.contributionId },
      data: {
        amount: formatAmount(after.amount),
        contributionType: String(after.type || "").replace("_", " "),
        notes: after.review_notes || "",
      },
    });
  });

/**
 * Claim review: pending -> approved/rejected
 */
export const onClaimReviewed = withEmailSecret.firestore
  .document("claims/{claimId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const type = mapStatusTransition("claims", before.status, after.status);
    if (!type || !after.member_id) return;
    if (after.reviewed_by === after.member_id) return;

    await notify({
      type,
      key: `${type}_${context.params.claimId}_${millis(after.reviewed_at)}`,
      recipientId: after.member_id,
      source: { collection: "claims", docId: context.params.claimId },
      data: {
        amount: formatAmount(after.amount),
        notes: after.review_notes || "",
      },
    });
  });

/**
 * Credit lifecycle: review outcomes and settlement
 */
export const onCreditStatusChanged = withEmailSecret.firestore
  .document("credits/{creditId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const type = mapStatusTransition("credits", before.status, after.status);
    if (!type || !after.member_id) return;
    if (after.review?.reviewed_by === after.member_id) return;

    // Settlement happens once per credit; reviews carry reviewed_at
    const key =
      type === "credit_settled"
        ? `${type}_${context.params.creditId}`
        : `${type}_${context.params.creditId}_${millis(after.review?.reviewed_at)}`;

    await notify({
      type,
      key,
      recipientId: after.member_id,
      source: { collection: "credits", docId: context.params.creditId },
      data: {
        amount: formatAmount(after.terms?.total_amount),
        notes: after.review?.notes || "",
        requested: after.review?.additional_info_requested || "",
      },
    });
  });

/**
 * Donation review: pending -> approved/rejected. Donations from external
 * donors have no member_id and are skipped.
 */
export const onDonationReviewed = withEmailSecret.firestore
  .document("donations/{donationId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const type = mapStatusTransition("donations", before.status, after.status);
    if (!type || !after.member_id) return;
    if (after.reviewed_by === after.member_id) return;

    await notify({
      type,
      key: `${type}_${context.params.donationId}_${millis(after.reviewed_at)}`,
      recipientId: after.member_id,
      source: { collection: "donations", docId: context.params.donationId },
      data: {
        amount: formatAmount(after.amount),
        notes: after.review_notes || "",
      },
    });
  });

/**
 * Member approval: pending -> approved/active (welcome email).
 * Runs alongside syncMemberClaims (independent functions).
 */
export const onMemberApproved = withEmailSecret.firestore
  .document("members/{memberId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const type = mapStatusTransition("members", before.status, after.status);
    if (type !== "member_approved") return;

    await notify({
      type,
      key: `member_approved_${context.params.memberId}`,
      recipientId: context.params.memberId,
      source: { collection: "members", docId: context.params.memberId },
      data: {},
    });
  });

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Hosting reminder: on the 25th of each month, remind next month's host(s).
 * Idempotent per assignment, so reruns are safe.
 */
export const hostingReminder = withEmailSecret.pubsub
  .schedule("0 8 25 * *")
  .timeZone("Africa/Johannesburg")
  .onRun(async () => {
    const now = new Date();
    // hostAssignments months are 1-12
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const year = currentMonth === 12 ? now.getFullYear() + 1 : now.getFullYear();

    const snapshot = await getFirestore()
      .collection("hostAssignments")
      .where("year", "==", year)
      .where("month", "==", nextMonth)
      .where("status", "in", ["pending", "confirmed"])
      .get();

    logger.info(
      `hostingReminder: ${snapshot.size} assignment(s) for ${year}-${nextMonth}`
    );

    for (const doc of snapshot.docs) {
      const assignment = doc.data();
      if (!assignment.member_id) continue;
      await notify({
        type: "hosting_reminder" as NotificationType,
        key: `hosting_reminder_${doc.id}`,
        recipientId: assignment.member_id,
        source: { collection: "hostAssignments", docId: doc.id },
        data: {
          monthName: MONTH_NAMES[nextMonth - 1],
          year: String(year),
        },
      });
    }
  });
