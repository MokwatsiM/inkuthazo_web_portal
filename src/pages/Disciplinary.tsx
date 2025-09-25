import React, { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMembers } from "../hooks/useMembers";
import Button from "../components/ui/Button";
import SearchInput from "../components/ui/SearchInput";
import DisciplinaryRecordsList from "../components/disciplinary/DisciplinaryRecordsList";
import AddDisciplinaryRecordModal from "../components/disciplinary/AddDisciplinaryRecordModal";
import ResolveDisciplinaryModal from "../components/disciplinary/ResolveDisciplinaryModal";
import {
  addDisciplinaryRecord,
  resolveDisciplinaryRecord,
  deleteDisciplinaryRecord,
  getAllDisciplinaryRecords,
  getMemberDisciplinaryRecords,
} from "../services/disciplinaryService";
import type { DisciplinaryRecord } from "../types";

const Disciplinary: React.FC = () => {
  const { userDetails } = useAuth();
  const { members } = useMembers();
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<DisciplinaryRecord | null>(null);

  const isDCMember =
    userDetails?.role === "dc_member" || userDetails?.role === "admin";
  const isAdmin = userDetails?.role === "admin";

  useEffect(() => {
    fetchRecords();
  }, [userDetails, selectedMemberId]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let fetchedRecords: any[];

      if (isDCMember) {
        if (selectedMemberId) {
          fetchedRecords = await getMemberDisciplinaryRecords(selectedMemberId);
        } else {
          fetchedRecords = await getAllDisciplinaryRecords();
        }
      } else if (userDetails?.id) {
        fetchedRecords = await getMemberDisciplinaryRecords(userDetails.id);
      } else {
        fetchedRecords = [];
      }

      // Enrich records with member names
      const enrichedRecords = await Promise.all(
        fetchedRecords.map(async (record) => {
          // const member = members.find((m) => m.id === record.member_id);
          return {
            ...record,
            memberName: record?.memberName || "Unknown Member",
          };
        })
      );

      setRecords(enrichedRecords);
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
      await addDisciplinaryRecord(data);
      await fetchRecords();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
    }
  };

  const handleResolveRecord = async (id: string, notes: string) => {
    if (!userDetails?.id) return;

    try {
      await resolveDisciplinaryRecord(id, notes, userDetails.id);
      await fetchRecords();
      setIsResolveModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error("Error resolving disciplinary record:", error);
    }
  };

  const handleDeleteRecord = async (record: DisciplinaryRecord) => {
    try {
      await deleteDisciplinaryRecord(record.id);
      await fetchRecords();
    } catch (error) {
      console.error("Error deleting disciplinary record:", error);
    }
  };

  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.infringement_type.toLowerCase().includes(searchLower) ||
      record.description.toLowerCase().includes(searchLower) ||
      (record as any).memberName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Disciplinary Records</h2>
        {isDCMember && (
          <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
            Add Record
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput
              placeholder="Search records..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
            {isDCMember && (
              <select
                className="block w-full md:w-64 rounded-md border-gray-300 bg-surface dark:bg-surface-dark text-text-primary dark:text-text-primary-dark shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                <option value="">All Members</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-4">Loading records...</div>
          ) : (
            <DisciplinaryRecordsList
              records={filteredRecords}
              onResolve={(record) => {
                setSelectedRecord(record);
                setIsResolveModalOpen(true);
              }}
              onDelete={handleDeleteRecord}
              canResolve={isDCMember}
              canDelete={isAdmin}
            />
          )}
        </div>
      </div>

      {isDCMember && (
        <>
          <AddDisciplinaryRecordModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSubmit={handleAddRecord}
            memberId={selectedMemberId}
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

export default Disciplinary;
