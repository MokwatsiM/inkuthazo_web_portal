import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import Button from "../ui/Button";
import type { Member } from "../../types";
import type { Claim } from "../../types/claim";
import { toFirestoreTimestamp } from "../../utils/dateUtils";

interface AddClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<Claim, "id" | "members" | "status">,
    files?: File[]
  ) => Promise<void>;
  member: Member;
}

interface MemberClaimant {
  id: string;
  type: "member";
  full_name: string;
}

interface DependantClaimant {
  id: string;
  type: "dependant";
  full_name: string;
  relationship: string;
}

type Claimant = MemberClaimant | DependantClaimant;

const AddClaimModal: React.FC<AddClaimModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  member,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    claimantType: "member",
    claimantId: member.id,
    type: "death" as Claim["type"],
    amount: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSteps = 4;

  const claimants: Claimant[] = [
    {
      id: member.id,
      type: "member",
      full_name: member.full_name,
    },
    ...(member.dependants?.map((dep) => ({
      id: dep.id,
      type: "dependant" as const,
      full_name: dep.full_name,
      relationship: dep.relationship,
    })) || []),
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
      // Reset input value so same file can be selected again if needed
      e.target.value = "";
    }
  };

  const nextStep = () => {
    if (currentStep === 2 && !formData.amount) {
      setError("Please specify the claim amount");
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedClaimant = claimants.find(
        (c) => c.id === formData.claimantId
      );
      if (!selectedClaimant) {
        throw new Error("Invalid claimant selected");
      }

      const claimantData = {
        id: selectedClaimant.id,
        type: selectedClaimant.type,
        full_name: selectedClaimant.full_name,
        ...(selectedClaimant.type === "dependant" && {
          relationship: (selectedClaimant as DependantClaimant).relationship,
        }),
      };

      await onSubmit(
        {
          member_id: member.id,
          claimant: claimantData,
          type: formData.type,
          amount: parseFloat(formData.amount),
          date: toFirestoreTimestamp(new Date()),
        },
        selectedFiles
      );

      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to submit claim"
      );
    }
  };

  const steps = [
    { id: 1, title: "Select Claimant" },
    { id: 2, title: "Claim Details" },
    { id: 3, title: "Documentation" },
    { id: 4, title: "Review" },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-line dark:border-line-dark">
        {/* Header with Progress Bar */}
        <div className="bg-surface-hover dark:bg-surface-dark/50 p-6 border-b border-line dark:border-line-dark">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark">
              Submit New Claim
            </h2>
            <button
              onClick={onClose}
              className="text-text-tertiary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative">
            <div className="flex justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center flex-1 z-10`}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${currentStep >= step.id
                      ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                      : "bg-surface dark:bg-surface-dark border-2 border-line dark:border-line-dark text-text-tertiary"}
                  `}>
                    {currentStep > step.id ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : step.id}
                  </div>
                  <span className={`text-[10px] mt-2 font-semibold uppercase tracking-wider transition-colors duration-300 ${currentStep === step.id ? "text-primary-600 dark:text-primary-400" : "text-text-tertiary"
                    }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            {/* Background Line */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-line dark:bg-line-dark -z-0"></div>
            {/* Active Progress Line */}
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary-600 transition-all duration-500 -z-0"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="min-h-[220px]">
            {/* Step 1: Select Claimant */}
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-3">
                  Who is the claim for?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {claimants.map((claimant) => (
                    <button
                      key={claimant.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, claimantId: claimant.id }))}
                      className={`
                        flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                        ${formData.claimantId === claimant.id
                          ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100 ring-1 ring-primary-600"
                          : "border-line dark:border-line-dark hover:border-line-hover dark:hover:border-line-dark bg-surface dark:bg-surface-dark"}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                          ${formData.claimantId === claimant.id ? "bg-primary-600 text-white" : "bg-surface-hover dark:bg-surface-dark/80 text-text-secondary"}
                        `}>
                          {claimant.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm leading-tight">{claimant.full_name}</p>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark capitalize mt-0.5">
                            {claimant.type === "dependant" ? claimant.relationship : "Principal Member"}
                          </p>
                        </div>
                      </div>
                      {formData.claimantId === claimant.id && (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-md">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Claim Details */}
            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                    Claim Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {["death", "funeral"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: type as any }))}
                        className={`
                          p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center
                          ${formData.type === type
                            ? "border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100"
                            : "border-line dark:border-line-dark hover:border-line-hover dark:hover:border-line-dark bg-surface dark:bg-surface-dark"}
                        `}
                      >
                        <span className="capitalize font-bold text-sm">{type} Claim</span>
                        <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark uppercase tracking-wide">
                          {type === 'death' ? 'Final Settlement' : 'Assistance'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-2">
                    Amount (R)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary font-bold">R</span>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      className="block w-full pl-8 pr-4 py-3 cursor-text rounded-xl border border-line dark:border-line-dark bg-surface dark:bg-surface-dark focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-semibold"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: e.target.value }))
                      }
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-text-secondary dark:text-text-secondary-dark">
                    Enter the total amount requested for this claim.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Documentation */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <label className="block text-sm font-semibold text-text-primary dark:text-text-primary-dark mb-4">
                  Supporting Documents
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-line dark:border-line-dark rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary-500 hover:bg-primary-50/10 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-surface-hover dark:bg-surface-dark/80 flex items-center justify-center text-text-tertiary group-hover:text-primary-600 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 transition-all">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">Click to upload documents</p>
                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark mt-1">Accepts PDF, JPG, PNG (Max 5MB per file)</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                  />
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Selected Files ({selectedFiles.length})</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-surface-hover dark:bg-surface-dark/50 rounded-xl border border-line dark:border-line-dark">
                        <div className="flex items-center gap-3">
                          <div className="text-text-tertiary">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-text-primary dark:text-text-primary-dark truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="text-text-tertiary hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-6 border border-primary-100 dark:border-primary-900/30">
                  <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-4">Claim Summary</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                      <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wide">Claimant</p>
                      <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-1">
                        {claimants.find(c => c.id === formData.claimantId)?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wide">Relationship</p>
                      <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-1 capitalize">
                        {claimants.find(c => c.id === formData.claimantId)?.type === 'member' ? 'Principal Member' : (claimants.find(c => c.id === formData.claimantId) as DependantClaimant)?.relationship}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wide">Type</p>
                      <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark mt-1 capitalize">
                        {formData.type} Claim
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wide">Requested Amount</p>
                      <p className="text-sm font-black text-primary-600 dark:text-primary-400 mt-1">
                        R {parseFloat(formData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-surface-hover dark:bg-surface-dark/50 rounded-xl border border-line dark:border-line-dark">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.48V22" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-text-secondary dark:text-text-secondary-dark leading-tight">
                    By clicking submit, you verify that all information provided is accurate and documents are authentic.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-10">
            <Button
              variant="secondary"
              onClick={currentStep === 1 ? onClose : prevStep}
              className="px-6"
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={nextStep} className="px-10 group">
                Continue
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="px-10 bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/20">
                Confirm & Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddClaimModal;
