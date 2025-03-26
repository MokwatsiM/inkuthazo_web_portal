import React, { useState } from "react";
import Button from "../ui/Button";
import type { DisciplinaryRecord } from "../../types";

interface ResolveDisciplinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, notes: string) => Promise<void>;
  record: DisciplinaryRecord;
}

const ResolveDisciplinaryModal: React.FC<ResolveDisciplinaryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  record,
}) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(record.id, notes);
      onClose();
    } catch (error) {
      console.error("Error resolving disciplinary record:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Resolve Disciplinary Record</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Resolution Notes
            </label>
            <textarea
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide details about how this infringement was resolved..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Resolving..." : "Resolve Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveDisciplinaryModal;
