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
  deleteDisciplinaryRecord,
  getMemberDisciplinaryRecords,
} from "../../services/disciplinaryService";
import type { DisciplinaryRecord, Member } from "../../types";
import logger from "../../utils/logger";

interface DisciplinarySectionProps {
  member: Member;
}

const DisciplinarySection: React.FC<DisciplinarySectionProps> = ({
  member,
}) => {
  const { userDetails } = useAuth();
  const [records, setRecords] = useState<
    (DisciplinaryRecord & { memberName: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<DisciplinaryRecord | null>(null);

  const isDCMember =
    userDetails?.role === "dc_member" || userDetails?.role === "admin";
  const isAdmin = userDetails?.role === "admin";
  const isOwnProfile = userDetails?.id === member.id;

  // Show section if user is DC member or if it's their own profile with records
  const shouldShowSection = isDCMember || (isOwnProfile && records.length > 0);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const fetchedRecords = await getMemberDisciplinaryRecords(member.id);
      // Ensure each record has the member's name
      const enrichedRecords = fetchedRecords.map((record) => ({
        ...record,
        memberName: member.full_name,
      }));
      setRecords(enrichedRecords);
    } catch (error) {
      logger.error("Error fetching disciplinary records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [member.id, member.full_name, fetchRecords]);

  const handleAddRecord = async (
    data: Omit<DisciplinaryRecord, "id" | "status" | "created_at">
  ) => {
    try {
      const newRecord = await addDisciplinaryRecord(data);
      // Add the member name to the new record
      const enrichedRecord = {
        ...newRecord,
        memberName: member.full_name,
      };
      setRecords((prev) => [enrichedRecord, ...prev]);
    } catch (error) {
      logger.error("Error adding disciplinary record:", error);
    }
  };

  const handleResolveRecord = async (id: string, notes: string) => {
    if (!userDetails?.id) return;

    try {
      await resolveDisciplinaryRecord(id, notes, userDetails.id);
      await fetchRecords(); // Refresh the records to get the updated status
    } catch (error) {
      logger.error("Error resolving disciplinary record:", error);
    }
  };

  const handleDeleteRecord = async (record: DisciplinaryRecord) => {
    try {
      await deleteDisciplinaryRecord(record.id);
      setRecords((prev) => prev.filter((r) => r.id !== record.id));
    } catch (error) {
      logger.error("Error deleting disciplinary record:", error);
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
          onDelete={handleDeleteRecord}
          canResolve={isDCMember}
          canDelete={isAdmin}
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
