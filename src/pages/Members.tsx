import React, { useState } from "react";
import { Trash2, CheckCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import AddMemberModal from "../components/members/AddMemberModal";
import DeleteMemberModal from "../components/members/DeleteMemberModal";
import ApproveMemberModal from "../components/members/ApproveMemberModal";
import Avatar from "../components/avatar/Avatar";
import { useMembers } from "../hooks/useMembers";
import { formatDate } from "../utils/dateUtils";
import type { Member } from "../types";
import Badge from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import InviteMemberModal from "../components/members/InviteMemberModal";
import { useAuth } from "../hooks/useAuth";
import { inviteMember } from "../services/invitationService";
// import { useAnalytics } from "../hooks/useAnalytics";
// import LoadingSpinner from "../components/ui/LoadingSpinner";

const Members: React.FC = () => {
  const { members, loading, addMember, deleteMember, updateMember } =
    useMembers();
  const { userDetails } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // const analytics = useAnalytics();

  const filteredMembers = members.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleInviteMember = async (
    data: Pick<Member, "full_name" | "email" | "phone">
  ) => {
    if (!userDetails?.id) return;
    try {
      await inviteMember(data, userDetails.id);
    } catch (error) {
      console.error("Error inviting member:", error);
      throw error;
    }
  };

  const handleAddMember = async (data: Omit<Member, "id" | "join_date">) => {
    try {
      await addMember(data);
      setIsAddModalOpen(false);
      // analytics.trackMemberAdded(data);
    } catch (error) {
      console.error("Error adding member:", error);
      // analytics.trackError("ADD_MEMBER_ERROR", error.message);
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
      <PageHeader
        title="Members"
        description="View and manage all members details"
        actions={
          <Button icon={Mail} onClick={() => setIsInviteModalOpen(true)}>
            Invite Member
          </Button>
          // <Button icon={UserPlus} onClick={() => setIsAddModalOpen(true)}>
          //   Add Member
          // </Button>
        }
      />

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
                  {formatDate(member.join_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge
                    variant={
                      member.status === "approved" || member.status === "active"
                        ? "success"
                        : member.status === "pending"
                        ? "error"
                        : "warning"
                    }
                  >
                    {member.status}
                  </Badge>
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

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteMember}
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
