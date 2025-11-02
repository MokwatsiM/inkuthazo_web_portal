import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import DependantsList from "./DependantsList";
import AddDependantModal from "./AddDependantModal";
import { addDependant, removeDependant } from "../../services/dependantService";
import type { Member, Dependant } from "../../types";

interface DependantsSectionProps {
  member: Member;
  onUpdate: () => Promise<void>;
}

const DependantsSection: React.FC<DependantsSectionProps> = ({
  member,
  onUpdate,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showMaxDependantsMessage, setShowMaxDependantsMessage] =
    useState(false);

  const dependantsCount = member.dependants?.length || 0;
  const canAddDependant = dependantsCount < 3;

  const handleAddDependant = async (
    data: Omit<Dependant, "id">,
    file: File
  ) => {
    try {
      await addDependant(member.id, data, file);
      await onUpdate();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding dependant:", error);
    }
  };

  const handleDeleteDependant = async (dependant: Dependant) => {
    if (confirm("Are you sure you want to remove this dependant?")) {
      try {
        await removeDependant(member.id, dependant);
        await onUpdate();
      } catch (error) {
        console.error("Error removing dependant:", error);
      }
    }
  };

  const handleAddDependantClick = () => {
    if (!canAddDependant) {
      setShowMaxDependantsMessage(true);
      setTimeout(() => setShowMaxDependantsMessage(false), 3000);
    } else {
      setIsAddModalOpen(true);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg tracking-tight font-semibold text-text-primary dark:text-text-primary-dark">Dependants</h3>
        <div className="relative">
          <button
            onClick={handleAddDependantClick}
            disabled={!canAddDependant}
            className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition ${
              !canAddDependant
                ? 'border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 text-text-tertiary dark:text-text-tertiary-dark opacity-50 cursor-not-allowed'
                : 'border-violet-500/30 bg-violet-600/20 text-violet-700 dark:text-violet-100 hover:bg-violet-600/30 hover:ring-1 hover:ring-violet-400/30 active:scale-[0.98]'
            }`}
          >
            <UserPlus className="h-5 w-5 shrink-0" />
            <span className="hidden md:inline">Add Dependant</span>
            <span className="md:hidden">Add</span>
            {!canAddDependant && (
              <span className="ml-1 text-text-secondary dark:text-text-secondary-dark">({dependantsCount}/3)</span>
            )}
          </button>
          {showMaxDependantsMessage && !canAddDependant && (
            <div className="absolute right-0 top-full mt-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-2 rounded-md shadow-lg z-10 whitespace-nowrap border border-red-200 dark:border-red-800">
              Maximum limit of 3 dependants reached
            </div>
          )}
        </div>
      </div>

      {(member.dependants ?? []).length > 0 ? (
        <DependantsList
          dependants={member.dependants!}
          onDelete={handleDeleteDependant}
        />
      ) : (
        <p className="text-text-secondary dark:text-text-secondary-dark">No dependants added yet.</p>
      )}

      <AddDependantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddDependant}
        currentDependantsCount={dependantsCount}
      />
    </div>
  );
};

export default DependantsSection;
