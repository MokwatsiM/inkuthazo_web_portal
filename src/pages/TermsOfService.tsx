import React from "react";
import LegalLayout from "../components/legal/LegalLayout";

const SUPPORT_EMAIL = "inkuthazoburialclub@gmail.com";

const TermsOfService: React.FC = () => (
  <LegalLayout title="Terms of Service" lastUpdated="27 July 2026">
    <p>
      These Terms of Service ("Terms") govern your use of the Inkuthazo Social
      Club member portal ("the Portal"), operated by the Inkuthazo Social Club
      ("the Club", "we", "us"). By creating an account or using the Portal, you
      agree to these Terms.
    </p>

    <h2>1. Eligibility and accounts</h2>
    <ul>
      <li>
        The Portal is provided for members and prospective members of the Club.
      </li>
      <li>
        New accounts require verification of your email address and approval by
        a Club administrator before full access is granted.
      </li>
      <li>
        You are responsible for the accuracy of the information you provide and
        for keeping your login credentials secure. You must notify us of any
        unauthorised use of your account.
      </li>
    </ul>

    <h2>2. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use the Portal for any unlawful purpose or in breach of these Terms.</li>
      <li>Access, or attempt to access, data belonging to other members without authorisation.</li>
      <li>Upload false, misleading, or fraudulent information or documents.</li>
      <li>Interfere with, disrupt, or attempt to compromise the security of the Portal.</li>
    </ul>

    <h2>3. Membership, contributions and claims</h2>
    <p>
      The Portal is a tool for administering Club membership. It records
      contributions, credits, donations, payouts and claims. The Portal does
      not itself create membership rights or obligations — those are governed
      by the Club's constitution and rules. Amounts, approvals and payouts
      shown in the Portal are subject to verification by the Club and to the
      Club's rules.
    </p>

    <h2>4. Your content</h2>
    <p>
      You retain ownership of the information and documents you upload (such as
      identity documents and proof of payment). You grant the Club permission to
      store and use that content for the purpose of administering your
      membership and any claims. You are responsible for ensuring you are
      entitled to share information about dependants.
    </p>

    <h2>5. Availability</h2>
    <p>
      We aim to keep the Portal available but do not guarantee uninterrupted
      access. The Portal relies on third-party services (including Google
      Firebase) and may be unavailable due to maintenance or factors outside our
      control. We may modify or discontinue features at any time.
    </p>

    <h2>6. Termination</h2>
    <p>
      We may suspend or terminate your access if you breach these Terms, if your
      Club membership ends, or where required to protect the Club or its
      members. You may stop using the Portal at any time.
    </p>

    <h2>7. Limitation of liability</h2>
    <p>
      The Portal is provided "as is". To the extent permitted by law, the Club
      is not liable for any indirect or consequential loss arising from your use
      of the Portal, or for losses caused by third-party service providers or
      circumstances beyond our reasonable control. Nothing in these Terms limits
      liability that cannot be limited by law.
    </p>

    <h2>8. Privacy</h2>
    <p>
      Your use of the Portal is also governed by our{" "}
      <a href="/privacy">Privacy Policy</a>, which explains how we handle your
      personal information.
    </p>

    <h2>9. Changes to these Terms</h2>
    <p>
      We may update these Terms from time to time. The "last updated" date above
      reflects the current version. Continued use of the Portal after changes
      means you accept the updated Terms.
    </p>

    <h2>10. Contact</h2>
    <p>
      Questions about these Terms? Email{" "}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>
  </LegalLayout>
);

export default TermsOfService;
