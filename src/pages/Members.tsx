import React, { useState } from "react";
import { UserPlus, Trash2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import AddMemberModal from "../components/members/AddMemberModal";
import DeleteMemberModal from "../components/members/DeleteMemberModal";
import ApproveMemberModal from "../components/members/ApproveMemberModal";
import Avatar from "../components/avatar/Avatar";
import { useMembers } from "../hooks/useMembers";
import type { Member } from "../types";

const Members: React.FC = () => {
  const { members, loading, addMember, deleteMember, updateMember } =
    useMembers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = members.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = async (data: Omit<Member, "id" | "join_date">) => {
    try {
      await addMember(data);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  const handleDeleteClick = (member: Member) => {
    setSelectedMember(member);
    setIsDeleteModalOpen(true);
  };

  const handleApproveClick = (member: Member) => {
    setSelectedMember(member);
    setIsApproveModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMember) {
      await deleteMember(selectedMember.id);
      setIsDeleteModalOpen(false);
      setSelectedMember(null);
    }
  };

  const handleApproveConfirm = async () => {
    if (selectedMember) {
      await updateMember(selectedMember.id, { status: "approved" });
      setIsApproveModalOpen(false);
      setSelectedMember(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Members</h2>
        <Button icon={UserPlus} onClick={() => setIsAddModalOpen(true)}>
          Add Member
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchInput
            placeholder="Search members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table
          headers={[
            "",
            "Name",
            "Email",
            "Phone",
            "Join Date",
            "Status",
            "Actions",
          ]}
        >
          {loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : (
            filteredMembers.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Avatar member={member} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {member.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{member.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{member.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(member.join_date.toDate(), "dd MMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.status === "approved" || member.status === "active"
                        ? "bg-green-100 text-green-800"
                        : member.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/members/${member.id}`}
                      className="text-indigo-600 hover:text-indigo-900 mr-2"
                    >
                      View Details
                    </Link>
                    {member.status === "pending" && (
                      <button
                        onClick={() => handleApproveClick(member)}
                        className="p-1 text-green-600 hover:text-green-900 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(member)}
                      className="p-1 text-red-600 hover:text-red-900 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddMember}
      />

      {selectedMember && (
        <>
          <DeleteMemberModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedMember(null);
            }}
            onConfirm={handleDeleteConfirm}
            member={selectedMember}
          />

          <ApproveMemberModal
            isOpen={isApproveModalOpen}
            onClose={() => {
              setIsApproveModalOpen(false);
              setSelectedMember(null);
            }}
            onConfirm={handleApproveConfirm}
            member={selectedMember}
          />
        </>
      )}
    </div>
  );
};

export default Members;
