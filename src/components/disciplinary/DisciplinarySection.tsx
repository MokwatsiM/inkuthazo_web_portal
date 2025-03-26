import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";
import DisciplinaryRecordsList from "./DisciplinaryRecordsList";
import AddDisciplinaryRecordModal from "./AddDisciplinaryRecordModal";
import ResolveDisciplinaryModal from "./ResolveDisciplinaryModal";
import {
  addDisciplinaryRecord,
  resolveDisciplinaryRecord,
  getMemberDisciplinaryRecords,
} from "../../services/disciplinaryService";
import type { DisciplinaryRecord, Member } from "../../types";

interface DisciplinarySectionProps {
  member: Member;
}

const DisciplinarySection: React.FC<DisciplinarySectionProps> = ({
  member,
}) => {
  const { userDetails } = useAuth();
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<DisciplinaryRecord | null>(null);

  const isDCMember =
    userDetails?.role === "dc_member" || userDetails?.role === "admin";
  const isOwnProfile = userDetails?.id === member.id;

  // Show section if user is DC member or if it's their own profile with records
  const shouldShowSection = isDCMember || (isOwnProfile && records.length > 0);

  useEffect(() => {
    fetchRecords();
  }, [member.id]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const fetchedRecords = await getMemberDisciplinaryRecords(member.id);
      setRecords(fetchedRecords);
    } catch (error) {
      console.error("Error fetching disciplinary records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async (
    data: Omit<DisciplinaryRecord, "id" | "status" | "created_at">
  ) => {
    try {
      const newRecord = await addDisciplinaryRecord(data);
      setRecords((prev) => [newRecord, ...prev]);
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
    }
  };

  const handleResolveRecord = async (id: string, notes: string) => {
    if (!userDetails?.id) return;

    try {
      await resolveDisciplinaryRecord(id, notes, userDetails.id);
      await fetchRecords();
    } catch (error) {
      console.error("Error resolving disciplinary record:", error);
    }
  };

  if (!shouldShowSection) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Disciplinary Records</h3>
        {isDCMember && (
          <Button
            icon={PlusCircle}
            onClick={() => setIsAddModalOpen(true)}
            className="md:w-auto w-10 h-10 md:h-auto md:p-2 p-0 rounded-full md:rounded-lg"
          >
            <span className="hidden md:inline">Add Record</span>
            <span className="md:hidden sr-only">Add</span>
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-4">Loading records...</div>
      ) : (
        <DisciplinaryRecordsList
          records={records}
          onResolve={(record) => {
            setSelectedRecord(record);
            setIsResolveModalOpen(true);
          }}
          canResolve={isDCMember}
        />
      )}

      {isDCMember && (
        <>
          <AddDisciplinaryRecordModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddRecord}
            memberId={member.id}
          />

          {selectedRecord && (
            <ResolveDisciplinaryModal
              isOpen={isResolveModalOpen}
              onClose={() => {
                setIsResolveModalOpen(false);
                setSelectedRecord(null);
              }}
              onSubmit={handleResolveRecord}
              record={selectedRecord}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DisciplinarySection;
