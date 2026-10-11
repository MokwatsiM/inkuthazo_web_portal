import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { isIos, isStandalone } from './platform';

/**
 * Invites members to install the portal to their home screen
 * (docs/specs/pwa R1 / D7).
 *
 * - Android / Chromium: captures `beforeinstallprompt` and shows an
 *   "Install" button that opens the browser's native install dialog.
 * - iPhone / iPad: iOS has no install API, so we show the
 *   Share → "Add to Home Screen" steps instead.
 * - Hidden when already running as an installed app, and for 30 days after
 *   the member dismisses it.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 30;

const recentlyDismissed = (): boolean => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const rememberDismissal = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Storage unavailable (private mode) — just hide for this session.
  }
};

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [hidden, setHidden] = useState(() => isStandalone() || recentlyDismissed());

  useEffect(() => {
    if (hidden) return;

    if (isIos()) {
      setShowIos(true);
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // we show our own button instead of the mini-infobar
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      setHidden(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [hidden]);

  const dismiss = () => {
    rememberDismissal();
    setHidden(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') setHidden(true);
  };

  if (hidden || (!deferredPrompt && !showIos)) return null;

  return (
    <div className="relative mb-6 rounded-2xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-4 sm:p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install suggestion"
        className="absolute top-2 right-2 p-2 rounded-lg text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <img
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="w-12 h-12 rounded-xl shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">
            Install the Inkuthazo app
          </p>

          {deferredPrompt ? (
            <>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Open the portal from your home screen, full-screen and faster —
                and still see your details when you have no signal.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                Install app
              </button>
            </>
          ) : (
            <ol className="mt-2 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="font-semibold">1.</span> Tap
                <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-label="Share" />
                <span>Share in the browser toolbar</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold">2.</span> Choose
                <PlusSquare className="w-4 h-4" aria-hidden="true" />
                <span>
                  <strong>Add to Home Screen</strong>
                </span>
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
