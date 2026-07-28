import React, { useState, useEffect, useCallback } from 'react';
import { getFriendlyErrorMessage } from "../../utils/errorMessages";
import { AlertTriangle, CheckCircle2, Mail } from 'lucide-react';
import Modal from '../ui/Modal';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useNotifications } from '../../hooks/useNotifications';
import {
  loadArrearsData,
  sendArrearsNotices,
  SendArrearsNoticesResult,
} from '../../services/arrearsNoticeService';
import type { MemberArrears } from '../../services/reportGenerationService';
import logger from '../../utils/logger';

interface ArrearsNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRand = (amount: number) =>
  `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

/**
 * Admin flow: list members in arrears (computed like the arrears report),
 * choose recipients, and send each a statement email of what they owe.
 */
const ArrearsNoticeModal: React.FC<ArrearsNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSuccess, showError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [members, setMembers] = useState<MemberArrears[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SendArrearsNoticesResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setLoading(true);
    loadArrearsData()
      .then((data) => {
        setMembers(data.members);
        setSelected(new Set(data.members.map((m) => m.memberId)));
      })
      .catch((error) => {
        logger.error('Failed to compute arrears:', error);
        showError('Failed to compute arrears. Please try again.');
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

  const allSelected = members.length > 0 && selected.size === members.length;
  const selectedMembers = members.filter((m) => selected.has(m.memberId));
  const selectedTotal = selectedMembers.reduce(
    (sum, m) => sum + m.totalAmountOwed,
    0
  );

  const handleSend = async () => {
    if (selectedMembers.length === 0) return;
    setSending(true);
    try {
      const sendResult = await sendArrearsNotices(selectedMembers);
      setResult(sendResult);
      if (sendResult.failed.length === 0) {
        showSuccess(`Sent ${sendResult.sent} arrears notice(s)`);
      } else {
        showError(
          `${sendResult.sent} sent, ${sendResult.failed.length} failed — see details`
        );
      }
    } catch (error) {
      logger.error('Failed to send arrears notices:', error);
      showError(
        getFriendlyErrorMessage(error, 'Failed to send arrears notices')
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send arrears notices"
      primaryAction={
        result
          ? undefined
          : {
              label: sending
                ? 'Sending…'
                : `Send ${selectedMembers.length} notice(s)`,
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
                  const member = members.find(
                    (m) => m.memberId === failure.memberId
                  );
                  return (
                    <li key={failure.memberId}>
                      {member?.memberName || failure.memberId}: {failure.reason}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            No members are in arrears. Everyone is up to date!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Each selected member receives an email with a statement of their
              unpaid months. Notices are account statements and are sent even
              if the member opted out of other email notifications.
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
                    : new Set(members.map((m) => m.memberId))
                )
              }
              className="rounded border-gray-300"
            />
            Select all ({members.length})
          </label>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
            {members.map((member) => (
              <label
                key={member.memberId}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(member.memberId)}
                  onChange={() => toggle(member.memberId)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {member.memberName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {member.monthsOwed} month(s) owed
                  </p>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatRand(member.totalAmountOwed)}
                </span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
            <span className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {selectedMembers.length} selected
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

export default ArrearsNoticeModal;
