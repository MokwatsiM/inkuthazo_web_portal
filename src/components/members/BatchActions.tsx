import React, { useState } from "react";
import {
  CheckCircle,
  Trash2,
  Mail,
  Download,
  UserCheck,
  UserX,
  MoreHorizontal
} from "lucide-react";
import Button from "../ui/Button";
import { ConfirmModal } from "../ui/Modal";
import type { Member } from "../../types";

interface BatchActionsProps {
  selectedMembers: Member[];
  onClearSelection: () => void;
  onBulkApprove?: (memberIds: string[]) => Promise<void>;
  onBulkDelete?: (memberIds: string[]) => Promise<void>;
  onBulkEmail?: (memberIds: string[]) => void;
  onBulkExport?: (memberIds: string[]) => void;
  onBulkStatusChange?: (memberIds: string[], status: string) => Promise<void>;
}

const BatchActions: React.FC<BatchActionsProps> = ({
  selectedMembers,
  onClearSelection,
  onBulkApprove,
  onBulkDelete,
  onBulkEmail,
  onBulkExport,
  onBulkStatusChange,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedCount = selectedMembers.length;
  const pendingCount = selectedMembers.filter(m => m.status === 'pending').length;
  const activeCount = selectedMembers.filter(m => m.status === 'active').length;

  if (selectedCount === 0) return null;

  const handleBulkAction = async (action: () => Promise<void>) => {
    try {
      setIsProcessing(true);
      await action();
      onClearSelection();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!onBulkApprove) return;
    const pendingMemberIds = selectedMembers
      .filter(m => m.status === 'pending')
      .map(m => m.id);

    if (pendingMemberIds.length > 0) {
      await handleBulkAction(() => onBulkApprove(pendingMemberIds));
    }
    setShowApproveConfirm(false);
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    const memberIds = selectedMembers.map(m => m.id);
    await handleBulkAction(() => onBulkDelete(memberIds));
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">
                  {selectedCount}
                </span>
              </div>
              <span className="text-sm font-medium text-primary-900">
                {selectedCount === 1 ? '1 member selected' : `${selectedCount} members selected`}
              </span>
            </div>

            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-primary-700">
              {pendingCount > 0 && (
                <span>{pendingCount} pending</span>
              )}
              {activeCount > 0 && (
                <span>{activeCount} active</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary actions */}
            {pendingCount > 0 && onBulkApprove && (
              <Button
                size="small"
                variant="primary"
                icon={CheckCircle}
                onClick={() => setShowApproveConfirm(true)}
                disabled={isProcessing}
              >
                Approve ({pendingCount})
              </Button>
            )}

            {onBulkEmail && (
              <Button
                size="small"
                variant="secondary"
                icon={Mail}
                onClick={() => onBulkEmail(selectedMembers.map(m => m.id))}
                disabled={isProcessing}
              >
                Email
              </Button>
            )}

            {onBulkExport && (
              <Button
                size="small"
                variant="secondary"
                icon={Download}
                onClick={() => onBulkExport(selectedMembers.map(m => m.id))}
                disabled={isProcessing}
              >
                Export
              </Button>
            )}

            {/* Status change actions */}
            {onBulkStatusChange && (
              <div className="flex items-center gap-1">
                <Button
                  size="small"
                  variant="ghost"
                  icon={UserCheck}
                  onClick={() => handleBulkAction(() =>
                    onBulkStatusChange!(selectedMembers.map(m => m.id), 'active')
                  )}
                  disabled={isProcessing}
                  title="Mark as active"
                >
                  <span className="sr-only">Mark as active</span>
                </Button>
                <Button
                  size="small"
                  variant="ghost"
                  icon={UserX}
                  onClick={() => handleBulkAction(() =>
                    onBulkStatusChange!(selectedMembers.map(m => m.id), 'inactive')
                  )}
                  disabled={isProcessing}
                  title="Mark as inactive"
                >
                  <span className="sr-only">Mark as inactive</span>
                </Button>
              </div>
            )}

            {/* Destructive actions */}
            {onBulkDelete && (
              <Button
                size="small"
                variant="danger"
                icon={Trash2}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
              >
                Delete
              </Button>
            )}

            {/* Clear selection */}
            <Button
              size="small"
              variant="ghost"
              onClick={onClearSelection}
              disabled={isProcessing}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation modals */}
      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleBulkApprove}
        title="Approve Members"
        message={`Are you sure you want to approve ${pendingCount} pending ${pendingCount === 1 ? 'member' : 'members'}?`}
        confirmLabel="Approve"
        variant="warning"
        loading={isProcessing}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Members"
        message={`Are you sure you want to delete ${selectedCount} ${selectedCount === 1 ? 'member' : 'members'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={isProcessing}
      />
    </>
  );
};

export default BatchActions;