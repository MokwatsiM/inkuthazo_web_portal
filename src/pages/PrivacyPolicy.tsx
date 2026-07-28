import React from "react";
import LegalLayout from "../components/legal/LegalLayout";

const SUPPORT_EMAIL = "inkuthazoburialclub@gmail.com";

const PrivacyPolicy: React.FC = () => (
  <LegalLayout title="Privacy Policy" lastUpdated="27 July 2026">
    <p>
      This Privacy Policy explains how the Inkuthazo Social Club ("we", "us",
      "the Club") collects, uses, and protects your personal information when
      you use the Inkuthazo Social Club member portal ("the Portal"). The
      Portal is used solely to administer membership of the Club.
    </p>

    <h2>Who we are</h2>
    <p>
      The Inkuthazo Social Club is the data controller for the information
      described here. For any privacy question or request, contact us at{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>

    <h2>Information we collect</h2>
    <p>We collect information you provide and information needed to run the Club:</p>
    <ul>
      <li>
        <strong>Account &amp; profile:</strong> your full name, email address,
        phone number, profile photo (optional), and your membership status and
        role within the Club.
      </li>
      <li>
        <strong>Dependants:</strong> if you register dependants, we store their
        full name, date of birth, relationship to you, identity number, and any
        supporting identity document you upload.
      </li>
      <li>
        <strong>Financial records:</strong> your contributions, credits/loans,
        donations, payouts and claims, including any proof-of-payment documents
        you upload.
      </li>
      <li>
        <strong>Authentication data:</strong> if you sign in with Google, we
        receive your name and email address from Google to create or match your
        account. We do not receive your Google password.
      </li>
      <li>
        <strong>Usage &amp; security data:</strong> basic analytics and
        security signals (e.g. Google reCAPTCHA / Firebase App Check) used to
        protect the Portal from abuse.
      </li>
    </ul>

    <h2>How we use your information</h2>
    <ul>
      <li>To create and manage your membership account.</li>
      <li>To record and administer contributions, claims, credits, donations and payouts.</li>
      <li>To verify your identity and eligibility, and to process claims for dependants.</li>
      <li>
        To send you service messages — email verification, and notifications
        about the status of your contributions, claims, credits, and hosting
        duties. You can turn optional email notifications off in your profile.
      </li>
      <li>To secure the Portal and prevent fraud or misuse.</li>
    </ul>

    <h2>Legal basis</h2>
    <p>
      We process your information to perform the membership agreement between
      you and the Club, to comply with our record-keeping obligations, and on
      the basis of your consent where you provide optional information (such as
      a profile photo). Where South Africa's Protection of Personal Information
      Act (POPIA) applies, we act as the responsible party for your personal
      information.
    </p>

    <h2>How your information is stored and shared</h2>
    <p>
      Your data is stored using Google Firebase (Firestore, Authentication,
      and Cloud Storage), which processes and stores data on our behalf.
      Transactional emails are sent through Brevo. These providers process your
      data only to provide their services to us.
    </p>
    <p>
      We do <strong>not</strong> sell your personal information. We do not share
      it with third parties for their own marketing. We may disclose information
      where required by law.
    </p>

    <h2>Access within the Club</h2>
    <p>
      Certain contribution and payout records are visible to approved members
      for transparency, as is normal for a mutual society. Administrators and
      committee members can access member records to perform their duties.
      Sensitive documents (identity documents, proof of payment) are restricted
      to you and authorised administrators.
    </p>

    <h2>Data retention</h2>
    <p>
      We keep your information for as long as you are a member and for as long
      afterwards as needed to meet the Club's legal, financial and
      record-keeping obligations. In-app notifications are automatically
      deleted after 90 days.
    </p>

    <h2>Your rights</h2>
    <p>
      You may request access to, correction of, or deletion of your personal
      information, and you may object to certain processing. Some information
      must be retained while you remain a member or to meet legal obligations.
      To exercise any right, contact us at{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>

    <h2>Children's information</h2>
    <p>
      The Portal is used by adult members. Where you provide information about
      dependent children for membership and claim purposes, you confirm you are
      authorised to do so on their behalf.
    </p>

    <h2>Changes to this policy</h2>
    <p>
      We may update this Privacy Policy from time to time. The "last updated"
      date above reflects the current version, and continued use of the Portal
      means you accept the updated policy.
    </p>

    <h2>Contact us</h2>
    <p>
      Questions about this policy or your data? Email{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>
  </LegalLayout>
);

export default PrivacyPolicy;
