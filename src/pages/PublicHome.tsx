import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Wallet,
  ShieldCheck,
  HandCoins,
  CalendarClock,
  FileText,
} from "lucide-react";
import { ThemeToggle } from "../components/ui/ThemeToggle";

/**
 * Public marketing/home page shown to logged-out visitors at "/". Its job is
 * to state the app's name and clearly explain its purpose — required for
 * Google's OAuth verification, and useful for anyone landing on the site.
 * Signed-in users are routed to the app before this renders (see App.tsx).
 */
const features = [
  {
    icon: Users,
    title: "Membership",
    body: "Register members and dependants, and manage approvals in one place.",
  },
  {
    icon: Wallet,
    title: "Contributions",
    body: "Record monthly contributions and keep a transparent payment history.",
  },
  {
    icon: ShieldCheck,
    title: "Claims & payouts",
    body: "Submit and review claims, and track payouts through to settlement.",
  },
  {
    icon: HandCoins,
    title: "Credits & donations",
    body: "Administer member credits, repayments and donations to the society.",
  },
  {
    icon: CalendarClock,
    title: "Meetings & hosting",
    body: "Coordinate meeting attendance and members' hosting schedules.",
  },
  {
    icon: FileText,
    title: "Statements & reports",
    body: "Generate member statements and financial reports on demand.",
  },
];

const PublicHome: React.FC = () => (
  <div className="min-h-screen bg-background dark:bg-background-dark">
    <header className="border-b border-line dark:border-line-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Inkuthazo Social Club" className="h-8 w-8" />
          <span className="font-bold text-text-primary dark:text-text-primary-dark">
            Inkuthazo Social Club
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle variant="button" />
          <Link
            to="/auth/login"
            className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>

    <main>
      {/* Hero — clearly states name + purpose */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 text-center">
        <img
          src="/logo.png"
          alt="Inkuthazo Social Club"
          className="h-16 w-16 mx-auto mb-6"
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-text-primary dark:text-text-primary-dark">
          Inkuthazo Social Club
        </h1>
        <p className="mt-4 text-lg text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto">
          The Inkuthazo Social Club member portal is a private web application
          for administering our social society — managing members and their
          dependants, recording monthly contributions, and processing claims,
          credits, donations and payouts.
        </p>
        <p className="mt-3 text-sm text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto">
          Access is limited to Club members. Sign in or create an account to
          get started; new members are reviewed and approved by an
          administrator.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/auth/login"
            className="inline-flex items-center rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700"
          >
            Sign in
          </Link>
          <Link
            to="/auth/register"
            className="inline-flex items-center rounded-lg border border-line dark:border-line-dark bg-surface dark:bg-surface-dark px-5 py-2.5 text-sm font-semibold text-text-primary dark:text-text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Create an account
          </Link>
        </div>
      </section>

      {/* What the app does */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-text-secondary dark:text-text-secondary-dark">
          What the portal does
        </h2>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="mt-4 font-semibold text-text-primary dark:text-text-primary-dark">
                {title}
              </h3>
              <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>

    <footer className="border-t border-line dark:border-line-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-text-secondary dark:text-text-secondary-dark space-y-2">
        <div>
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2 text-text-tertiary dark:text-text-tertiary-dark">
            ·
          </span>
          <Link to="/terms" className="hover:underline">
            Terms of Service
          </Link>
        </div>
        <p>© 2026 Inkuthazo Social Club. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

export default PublicHome;
