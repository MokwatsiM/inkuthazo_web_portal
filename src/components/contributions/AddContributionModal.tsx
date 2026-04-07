import { AlertCircle, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { getMemberActiveCredit } from "../../services/creditService";
import { getMemberDisciplinaryRecords } from "../../services/disciplinaryService";
import { Member, DisciplinaryRecord } from "../../types";
import type { Contribution } from "../../types/contribution";
import type { Credit } from "../../types/credit";
import { toFirestoreTimestamp } from "../../utils/dateUtils";
import Button from "../ui/Button";
import logger from "../../utils/logger";


interface AddContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File
  ) => Promise<void>;
  isAdmin: boolean;
  members?: Member[];
  memberId?: string; // Optional pre-selected member ID (used when admin adds contribution from member profile)
}

const AddContributionModal: React.FC<AddContributionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isAdmin,
  members,
  memberId,
}) => {
  const { user } = useAuth();
  const { showError } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    member_id: "",
    amount: "",
    type: "monthly" as Contribution["type"],
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
  const [activeCredit, setActiveCredit] = useState<Credit | null>(null);
  const [loadingCredit, setLoadingCredit] = useState(false);
  const [memberHasCredit, setMemberHasCredit] = useState(false);

  const [pendingPenalties, setPendingPenalties] = useState<DisciplinaryRecord[]>([]);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState<string>("");
  const [loadingPenalties, setLoadingPenalties] = useState(false);

  // Fetch active credit when member is selected (to check if they have one)
  useEffect(() => {
    const checkMemberCredit = async () => {
      // Determine the member_id to check:
      // - If memberId prop is provided (from member profile page): use that
      // - For admins (without memberId prop): use the selected member from dropdown (formData.member_id)
      // - For regular members: use their own user ID (user.uid)
      const memberIdToCheck = memberId || (isAdmin ? formData.member_id : user?.uid);

      if (!memberIdToCheck) {
        logger.debug('No member_id available, skipping credit check');
        setActiveCredit(null);
        setMemberHasCredit(false);
        return;
      }

      logger.debug('Checking for active credit for member:', memberIdToCheck);
      setLoadingCredit(true);
      try {
        const credit = await getMemberActiveCredit(memberIdToCheck);
        logger.debug('Credit fetch result:', credit);
        setActiveCredit(credit);
        setMemberHasCredit(!!credit);
      } catch (error) {
        logger.error('Error fetching active credit:', error);
        setActiveCredit(null);
        setMemberHasCredit(false);
      } finally {
        setLoadingCredit(false);
      }

      logger.debug('Checking for pending disciplinary penalties for member:', memberIdToCheck);
      setLoadingPenalties(true);
      try {
        const records = await getMemberDisciplinaryRecords(memberIdToCheck);
        const penalties = records.filter(r => r.status === 'pending' && r.penalty_amount && r.penalty_amount > 0);
        setPendingPenalties(penalties);
        if (penalties.length === 1) {
          setSelectedPenaltyId(penalties[0].id);
        } else {
          setSelectedPenaltyId(""); // reset if multiple or 0
        }
      } catch (error) {
        logger.error('Error fetching disciplinary records:', error);
        setPendingPenalties([]);
      } finally {
        setLoadingPenalties(false);
      }
    };

    checkMemberCredit();
  }, [formData.member_id, user?.uid, isAdmin, memberId]);

  // Separate effect to auto-populate amount when credit_payment is selected
  useEffect(() => {
    if (activeCredit && formData.type === 'credit_payment' && !formData.amount) {
      const suggestedAmount = Math.min(
        activeCredit.terms.installment_amount,
        activeCredit.remaining_balance
      );
      logger.debug('Auto-setting suggested amount:', suggestedAmount);
      setFormData((prev) => ({
        ...prev,
        amount: suggestedAmount.toFixed(2)
      }));
    } else if (formData.type === 'infringement_penalty') {
      const selectedPenalty = pendingPenalties.find(p => p.id === selectedPenaltyId);
      if (selectedPenalty && selectedPenalty.penalty_amount && !formData.amount) {
        setFormData((prev) => ({
          ...prev,
          amount: selectedPenalty.penalty_amount!.toFixed(2)
        }));
      }
    }
  }, [formData.type, activeCredit, selectedPenaltyId, pendingPenalties]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine the member_id to use:
    // - If memberId prop is provided (from member profile page): use that
    // - For admins (without memberId prop): use the selected member from dropdown
    // - For regular members: use their own user ID
    const memberIdToSubmit = memberId || (isAdmin ? formData.member_id : user?.uid);

    if (!memberIdToSubmit) {
      showError('Unable to determine member ID');
      return;
    }

    // Validate credit payment
    if (formData.type === 'credit_payment') {
      if (!activeCredit) {
        showError('No active credit found for this member');
        return;
      }

      const paymentAmount = parseFloat(formData.amount);
      if (paymentAmount > activeCredit.remaining_balance) {
        showError(`Payment amount cannot exceed remaining balance of R${activeCredit.remaining_balance.toFixed(2)}`);
        return;
      }
    }

    if (formData.type === 'infringement_penalty') {
      if (pendingPenalties.length === 0) {
        showError('No pending penalties found for this member');
        return;
      }
      if (!selectedPenaltyId) {
        showError('Please select a specific penalty to pay');
        return;
      }
    }

    try {
      // Build contribution data object
      const contributionData: any = {
        member_id: memberIdToSubmit,
        amount: parseFloat(formData.amount),
        type: formData.type,
        date: toFirestoreTimestamp(new Date(formData.date)),
      };

      // Only include credit_id if it's a credit payment
      if (formData.type === 'credit_payment' && activeCredit?.id) {
        contributionData.credit_id = activeCredit.id;
      }

      // Include disciplinary record ID if it's a penalty payment
      if (formData.type === 'infringement_penalty' && selectedPenaltyId) {
        contributionData.disciplinary_record_id = selectedPenaltyId;
      }

      await onSubmit(
        contributionData as Omit<Contribution, "id" | "members" | "status">,
        selectedFile
      );

      onClose();
      setFormData({
        member_id: "",
        amount: "",
        type: "monthly",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedFile(undefined);
      setActiveCredit(null);
      setSelectedPenaltyId("");
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to add contribution"
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-surface dark:bg-surface-dark rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-text-primary dark:text-text-primary-dark">Record New Contribution</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isAdmin && members && members.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                  Member
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-input border border-line dark:border-line-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                  value={formData.member_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      member_id: e.target.value,
                    }))
                  }
                >
                  <option value="">Select a member</option>

                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Credit Alert - Show when member has active credit */}
            {memberHasCredit && formData.member_id && formData.type !== 'credit_payment' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-300">
                      Active Credit Detected
                    </p>
                    <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                      This member has an active credit with a remaining balance of R{activeCredit?.remaining_balance.toFixed(2)}.
                      You can select "Credit Payment" from the Type dropdown to make a payment towards their credit.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Penalty Alert - Show when member has pending penalties */}
            {pendingPenalties.length > 0 && formData.member_id && formData.type !== 'infringement_penalty' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-300">
                      Pending Penalty Detected
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                      This member has {pendingPenalties.length} pending disciplinary penalty(s).
                      You can select "Infringement Penalty" from the Type dropdown to record a penalty payment.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Amount (R)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Type
              </label>
              <select
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as Contribution["type"],
                  }))
                }
              >
                <option value="monthly">Monthly</option>
                <option value="registration">Registration</option>
                <option value="credit_payment">Credit Payment</option>
                <option value="infringement_penalty">Infringement Penalty</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Credit Payment Info */}
            {formData.type === 'credit_payment' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                {loadingCredit ? (
                  <p className="text-sm text-blue-800 dark:text-blue-200">Loading credit information...</p>
                ) : activeCredit ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Active Credit Found
                        </p>
                        <div className="mt-2 space-y-1 text-xs text-blue-800 dark:text-blue-200">
                          <p><strong>Reason:</strong> {activeCredit.reason}</p>
                          <p><strong>Total Amount:</strong> R{activeCredit.terms.total_amount.toFixed(2)}</p>
                          <p><strong>Remaining Balance:</strong> R{activeCredit.remaining_balance.toFixed(2)}</p>
                          <p><strong>Suggested Payment:</strong> R{activeCredit.terms.installment_amount.toFixed(2)}</p>
                          <p><strong>Payments Made:</strong> {activeCredit.payments.length} of {activeCredit.terms.installments}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      No active credit found for this member. Credit payments can only be made for active credits.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Penalty Payment Info */}
            {formData.type === 'infringement_penalty' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                {loadingPenalties ? (
                  <p className="text-sm text-red-800 dark:text-red-200">Loading penalty information...</p>
                ) : pendingPenalties.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 dark:text-red-300">
                          Active Penalties Found
                        </p>
                      </div>
                    </div>

                    {pendingPenalties.length > 1 ? (
                      <div>
                        <label className="block text-xs font-medium text-red-900 dark:text-red-300 mb-1">
                          Select Penalty
                        </label>
                        <select
                          required
                          className="block w-full text-sm rounded-md border-red-300 focus:border-red-500 focus:ring-red-500 bg-white dark:bg-surface-dark text-text-primary dark:text-text-primary-dark"
                          value={selectedPenaltyId}
                          onChange={(e) => setSelectedPenaltyId(e.target.value)}
                        >
                          <option value="">Select a penalty to pay</option>
                          {pendingPenalties.map((penalty) => (
                            <option key={penalty.id} value={penalty.id}>
                              {penalty.infringement_type} - R{penalty.penalty_amount?.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1 text-xs text-red-800 dark:text-red-200">
                        <p><strong>Type:</strong> {pendingPenalties[0].infringement_type}</p>
                        <p><strong>Description:</strong> {pendingPenalties[0].description}</p>
                        <p><strong>Penalty Amount:</strong> R{pendingPenalties[0].penalty_amount?.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      No pending disciplinary penalties found for this member. Penalty payments can only be made for active penalties.
                    </p>
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Date
              </label>
              <input
                type="date"
                required
                className="mt-1 block w-full rounded-input border border-line dark:border-line-dark bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-primary-500 focus:ring focus:ring-primary-200"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary-dark">
                Proof of Payment
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                required={!isAdmin} // Required for members, optional for admins
              />
              <div className="mt-1 flex items-center">
                <Button
                  type="button"
                  variant="secondary"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? selectedFile.name : "Upload File"}
                </Button>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-text-secondary dark:text-text-secondary-dark">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Record Contribution</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContributionModal;
