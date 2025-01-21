import { logEvent } from 'firebase/analytics';
import { analytics } from '../../config/firebase';
import type {  Contribution } from '../../types/contribution';
import type {  Payout } from '../../types/payout';
import type { Member } from '../../types/';




// User Events
export const trackUserSignIn = (method: string) => {
  logEvent(analytics, 'login', { method });
};

export const trackUserSignUp = (method: string) => {
  logEvent(analytics, 'sign_up', { method });
};

// Member Events
export const trackMemberAdded = (member: Member) => {
  logEvent(analytics, 'member_added', {
    member_id: member.id,
    member_role: member.role,
    member_status: member.status
  });
};

export const trackMemberUpdated = (member: Member) => {
  logEvent(analytics, 'member_updated', {
    member_id: member.id,
    member_role: member.role,
    member_status: member.status
  });
};

export const trackMemberDeleted = (memberId: string) => {
  logEvent(analytics, 'member_deleted', {
    member_id: memberId
  });
};

// Contribution Events
export const trackContributionAdded = (contribution: Contribution) => {
  logEvent(analytics, 'contribution_added', {
    contribution_id: contribution.id,
    member_id: contribution.member_id,
    amount: contribution.amount,
    type: contribution.type
  });
};

export const trackContributionUpdated = (contribution: Contribution) => {
  logEvent(analytics, 'contribution_updated', {
    contribution_id: contribution.id,
    member_id: contribution.member_id,
    amount: contribution.amount,
    type: contribution.type
  });
};

export const trackContributionDeleted = (contributionId: string) => {
  logEvent(analytics, 'contribution_deleted', {
    contribution_id: contributionId
  });
};

// Payout Events
export const trackPayoutAdded = (payout: Payout) => {
  logEvent(analytics, 'payout_added', {
    payout_id: payout.id,
    member_id: payout.member_id,
    amount: payout.amount,
    status: payout.status
  });
};

export const trackPayoutStatusUpdated = (payout: Payout) => {
  logEvent(analytics, 'payout_status_updated', {
    payout_id: payout.id,
    member_id: payout.member_id,
    status: payout.status
  });
};

export const trackPayoutDeleted = (payoutId: string) => {
  logEvent(analytics, 'payout_deleted', {
    payout_id: payoutId
  });
};

// Report Events
export const trackReportGenerated = (reportType: string, period: string) => {
  logEvent(analytics, 'report_generated', {
    report_type: reportType,
    period
  });
};

// Error Events
export const trackError = (errorCode: string, errorMessage: string) => {
  logEvent(analytics, 'error', {
    error_code: errorCode,
    error_message: errorMessage
  });
};

// Page View Events
export const trackPageView = (pageName: string, pageTitle: string) => {
  logEvent(analytics, 'page_view', {
    page_name: pageName,
    page_title: pageTitle
  });
};