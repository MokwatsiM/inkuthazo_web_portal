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
  const [formData, setFormData] = useState({
    claimantType: "member",
    claimantId: member.id,
    type: "death" as Claim["type"],
    amount: "",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

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
      setSelectedFiles(files);
    }
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

      await onSubmit(
        {
          member_id: member.id,
          claimant: {
            id: selectedClaimant.id,
            type: selectedClaimant.type,
            full_name: selectedClaimant.full_name,
            relationship:
              selectedClaimant.type === "dependant"
                ? selectedClaimant.relationship
                : undefined,
          },
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Submit New Claim</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Claimant
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.claimantId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, claimantId: e.target.value }))
              }
            >
              {claimants.map((claimant) => (
                <option key={claimant.id} value={claimant.id}>
                  {claimant.full_name}{" "}
                  {claimant.type === "dependant" &&
                    `(${claimant.relationship})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Claim Type
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as Claim["type"],
                }))
              }
            >
              <option value="death">Death Claim</option>
              <option value="funeral">Funeral Assistance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Amount (R)
            </label>
            <input
              type="number"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Supporting Documents
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileChange}
            />
            <div className="mt-1">
              <Button
                type="button"
                variant="secondary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload Documents
              </Button>
            </div>
            {selectedFiles.length > 0 && (
              <ul className="mt-2 text-sm text-gray-500">
                {selectedFiles.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit Claim</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClaimModal;
