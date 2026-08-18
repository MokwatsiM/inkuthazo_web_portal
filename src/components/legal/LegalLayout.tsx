import React from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../ui/ThemeToggle";
import Logo from "../ui/Logo";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

/**
 * Public shell for the Privacy Policy and Terms of Service. No auth — these
 * pages must be reachable by anyone (and by Google's OAuth verification).
 */
const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  lastUpdated,
  children,
}) => (
  <div className="min-h-screen bg-background dark:bg-background-dark">
    <header className="border-b border-line dark:border-line-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="font-bold text-text-primary dark:text-text-primary-dark">
            Inkuthazo Social Club
          </span>
        </Link>
        <ThemeToggle variant="button" />
      </div>
    </header>

    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-text-primary dark:text-text-primary-dark">
        {title}
      </h1>
      <p className="mt-1 text-sm text-text-secondary dark:text-text-secondary-dark">
        Last updated: {lastUpdated}
      </p>

      <div className="prose prose-sm dark:prose-invert max-w-none mt-8 text-text-primary dark:text-text-primary-dark [&_h2]:text-text-primary dark:[&_h2]:text-text-primary-dark [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_p]:mt-2 [&_p]:text-text-secondary dark:[&_p]:text-text-secondary-dark [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-text-secondary dark:[&_li]:text-text-secondary-dark [&_a]:text-brand-600 dark:[&_a]:text-brand-400">
        {children}
      </div>

      <div className="mt-12 pt-6 border-t border-line dark:border-line-dark text-sm">
        <Link
          to="/privacy"
          className="text-brand-600 dark:text-brand-400 hover:underline mr-4"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="text-brand-600 dark:text-brand-400 hover:underline mr-4"
        >
          Terms of Service
        </Link>
        <Link
          to="/"
          className="text-text-secondary dark:text-text-secondary-dark hover:underline"
        >
          Home
        </Link>
      </div>
    </main>
  </div>
);

export default LegalLayout;
