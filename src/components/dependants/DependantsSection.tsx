import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import Button from "../ui/Button";
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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Dependants</h3>
        <div className="relative">
          <Button
            icon={UserPlus}
            onClick={handleAddDependantClick}
            disabled={!canAddDependant}
            className={!canAddDependant ? "opacity-50 cursor-not-allowed" : ""}
          >
            Add Dependant
            {!canAddDependant && (
              <span className="ml-2">({dependantsCount}/3)</span>
            )}
          </Button>
          {showMaxDependantsMessage && !canAddDependant && (
            <div className="absolute right-0 top-full mt-2 bg-red-100 text-red-800 px-4 py-2 rounded-md shadow-lg z-10 whitespace-nowrap">
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
        <p className="text-gray-500">No dependants added yet.</p>
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
