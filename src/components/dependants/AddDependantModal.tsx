import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import Button from "../ui/Button";
import type { Dependant } from "../../types";

interface AddDependantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Dependant, "id">, file: File) => Promise<void>;
  currentDependantsCount: number;
}

const AddDependantModal: React.FC<AddDependantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentDependantsCount,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    relationship: "spouse" as Dependant["relationship"],
    id_number: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  if (currentDependantsCount >= 3) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Maximum Dependants Reached</h2>
          <p className="text-gray-600 mb-4">
            You have reached the maximum limit of 3 dependants.
          </p>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      // Check file type
      if (!file.type.includes("pdf") && !file.type.includes("image")) {
        setError("File must be a PDF or image");
        return;
      }
      setError(null);
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please upload an ID document");
      return;
    }

    try {
      await onSubmit(
        {
          ...formData,
          date_of_birth: Timestamp.fromDate(new Date(formData.date_of_birth)),
        },
        selectedFile
      );
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to add dependant"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add New Dependant</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.full_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, full_name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  date_of_birth: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <select
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.relationship}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  relationship: e.target.value as Dependant["relationship"],
                }))
              }
            >
              <option value="spouse">Spouse</option>
              <option value="child">Child</option>
              <option value="parent">Parent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              ID Number
            </label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              value={formData.id_number}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, id_number: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              ID Document
            </label>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <div className="mt-1">
              <Button
                type="button"
                variant="secondary"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? selectedFile.name : "Upload ID Document"}
              </Button>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500">
                Selected file: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Dependant</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDependantModal;
