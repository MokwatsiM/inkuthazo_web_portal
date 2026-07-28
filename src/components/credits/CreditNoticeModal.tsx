import React, { useState, useEffect, useCallback } from 'react';
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import { AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../../hooks/useNotifications';
import {
  loadOutstandingCredits,
  sendCreditNotices,
  OutstandingCreditGroup,
  SendCreditNoticesResult,
} from '../../services/creditNoticeService';
import logger from '../../utils/logger';

interface CreditNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRand = (amount: number) =>
  `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

/**
 * Admin flow: list members with unsettled credit, choose recipients, and
 * send each a statement email of what they still owe. Mirrors the
 * arrears-notice modal on the Members page.
 */
const CreditNoticeModal: React.FC<CreditNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [groups, setGroups] = useState<OutstandingCreditGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SendCreditNoticesResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setLoading(true);
    loadOutstandingCredits()
      .then((data) => {
        setGroups(data);
        setSelected(new Set(data.map((group) => group.memberId)));
      })
      .catch((error) => {
        logger.error('Failed to load outstanding credits:', error);
        showError('Failed to load outstanding credits. Please try again.');
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = useCallback((memberId: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  const allSelected = groups.length > 0 && selected.size === groups.length;
  const selectedGroups = groups.filter((group) => selected.has(group.memberId));
  const selectedTotal = selectedGroups.reduce(
    (sum, group) => sum + group.totalOutstanding,
    0
  );

  const handleSend = async () => {
    if (selectedGroups.length === 0) return;
    setSending(true);
    try {
      const sendResult = await sendCreditNotices(selectedGroups);
      setResult(sendResult);
      if (sendResult.failed.length === 0) {
        showSuccess(`Sent ${sendResult.sent} credit notice(s)`);
      } else {
        showError(
          `${sendResult.sent} sent, ${sendResult.failed.length} failed — see details`
        );
      }
    } catch (error) {
      logger.error('Failed to send credit notices:', error);
      showError(
        getFriendlyErrorMessage(error, 'Failed to send credit notices')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send credit notices"
      primaryAction={
        result
          ? undefined
          : {
              label: sending
                ? 'Sending…'
                : `Send ${selectedGroups.length} notice(s)`,
              onClick: handleSend,
              loading: sending,
            }
      }
      secondaryAction={{ label: result ? 'Close' : 'Cancel', onClick: onClose }}
    >
      {loading ? (
        <div className="py-10 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {result.sent} statement email(s) sent. Members also received an
              in-app notification.
            </p>
          </div>
          {result.failed.length > 0 && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                {result.failed.length} failed:
              </p>
              <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                {result.failed.map((failure) => {
                  const group = groups.find(
                    (g) => g.memberId === failure.memberId
                  );
                  return (
                    <li key={failure.memberId}>
                      {group?.memberName || failure.memberId}: {failure.reason}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : groups.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            No members have outstanding credit. Everything is settled!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Each selected member receives an email with a statement of their
              unsettled credit. Notices are account statements and are sent
              even if the member opted out of other email notifications.
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected(
                  allSelected
                    ? new Set()
                    : new Set(groups.map((group) => group.memberId))
                )
              }
              className="rounded border-gray-300"
            />
            Select all ({groups.length})
          </label>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            {groups.map((group) => (
              <label
                key={group.memberId}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(group.memberId)}
                  onChange={() => toggle(group.memberId)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {group.memberName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {group.credits.length} credit(s) outstanding
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatRand(group.totalOutstanding)}
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {selectedGroups.length} selected
            </span>
            <span className="font-semibold">
              Total outstanding: {formatRand(selectedTotal)}
            </span>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreditNoticeModal;
