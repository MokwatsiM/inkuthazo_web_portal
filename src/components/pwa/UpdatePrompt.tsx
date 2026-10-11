import React, { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import logger from '../../utils/logger';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

/**
 * Registers the service worker and tells the member when a new version is
 * available (docs/specs/pwa R4 / D2). The app never reloads by itself — the
 * member taps "Refresh" when they're ready, so nothing is lost mid-form.
 */
const UpdatePrompt: React.FC = () => {
  const [updating, setUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Installed apps can stay open for days; check for new deploys hourly
      // and whenever the app comes back to the foreground.
      const check = () => {
        if (registration.installing || !navigator.onLine) return;
        registration.update().catch((err) => logger.debug('SW update check failed', swUrl, err));
      };
      setInterval(check, UPDATE_CHECK_INTERVAL_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
    onRegisterError(error) {
      logger.error('Service worker registration failed', error);
    },
  });

  if (!needRefresh) return null;

  const handleRefresh = async () => {
    setUpdating(true);
    // Activates the waiting worker; the page reloads into the new version.
    await updateServiceWorker(true);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-md bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          A new version is available
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Refresh to get the latest updates.
        </p>
      </div>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={updating}
        className="shrink-0 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
      >
        {updating ? 'Refreshing…' : 'Refresh'}
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update notice"
        className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default UpdatePrompt;
