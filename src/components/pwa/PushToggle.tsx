import { useCallback, useEffect, useState } from 'react';
import {
  disablePush,
  enablePush,
  getPushState,
  type PushState,
} from '../../services/pushService';
import { useNotifications } from '../../hooks/useNotifications';
import logger from '../../utils/logger';

interface PushToggleProps {
  memberId: string;
  preference: boolean | undefined;
  /** Called after the stored preference changed so parents can refetch. */
  onChanged: () => void | Promise<void>;
}

const HELP: Partial<Record<PushState, string>> = {
  unsupported: "This browser can't receive push notifications.",
  'needs-install':
    'On iPhone, add the app to your Home Screen first (Share → Add to Home Screen), then open it from there to turn this on.',
  blocked:
    'Notifications are blocked for this site. Allow them in your browser or phone settings, then come back.',
};

/** Phone push switch for the member's own profile (docs/specs/pwa R5). */
const PushToggle: React.FC<PushToggleProps> = ({ memberId, preference, onChanged }) => {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const { showError, showSuccess } = useNotifications();

  const refresh = useCallback(
    () => getPushState(preference).then(setState),
    [preference]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async () => {
    if (busy || !state) return;
    setBusy(true);
    try {
      if (state === 'on') {
        await disablePush(memberId);
        showSuccess('Push notifications turned off on this device');
      } else {
        await enablePush(memberId);
        showSuccess('Push notifications turned on');
      }
      await onChanged();
    } catch (error) {
      logger.error('Push toggle failed', error);
      showError(error instanceof Error ? error.message : 'Could not change push notifications');
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  if (!state) return null;
  const available = state === 'on' || state === 'off';
  const on = state === 'on';

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
          {HELP[state] ??
            'Get a notification on this phone when something about your account is reviewed or due.'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label="Push notifications"
        disabled={!available || busy}
        onClick={toggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          on ? 'bg-brand-600 dark:bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            on ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default PushToggle;
