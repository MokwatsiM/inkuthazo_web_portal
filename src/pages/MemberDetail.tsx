import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, Edit } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import { useMembers } from "../hooks/useMembers";
import { uploadAvatar } from "../services/avatarService";
import Button from "../components/ui/Button";
import EditMemberModal from "../components/members/EditMemberModal";
import MemberProfile from "../components/members/MemberProfile";
import MemberStats from "../components/members/MemberStats";
import ContributionsHistory from "../components/members/ContributionsHistoryStory";
import PayoutsHistory from "../components/members/PayoutsHistoryStory";
import DependantsSection from "../components/dependants/DependantsSection";
import { generateMemberStatement } from "../utils/reportGenerator";
import type { MemberDetail as MemberDetailType } from "../types";

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails, isAdmin } = useAuth();
  const { updateMember } = useMembers();
  const [member, setMember] = useState<MemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    if (!isAdmin && userDetails?.id !== id) {
      navigate("/");
      return;
    }

    fetchMemberDetails();
  }, [id, isAdmin, userDetails]);

  const fetchMemberDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const memberDoc = await getDoc(doc(db, "members", id));
      if (!memberDoc.exists()) {
        throw new Error("Member not found");
      }

      setMember({
        id: memberDoc.id,
        ...memberDoc.data(),
      } as MemberDetailType);
    } catch (error) {
      console.error("Error fetching member details:", error);
      setError("Failed to load member details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (data: Partial<MemberDetailType>) => {
    if (!member) return;

    try {
      await updateMember(member.id, data);
      await fetchMemberDetails();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating member:", error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!member) return;

    try {
      const avatarUrl = await uploadAvatar(member.id, file);
      await handleUpdateMember({ avatar_url: avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!member) {
    return <div className="p-8">Member not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Details</h2>
        <div className="flex space-x-2">
          <Button icon={Edit} onClick={() => setIsEditModalOpen(true)}>
            Edit Member
          </Button>
          <Button
            icon={Download}
            onClick={() => generateMemberStatement(member)}
          >
            Generate Statement
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <MemberProfile member={member} onAvatarUpload={handleAvatarUpload} />

        <div className="mt-8">
          <MemberStats
            contributions={member.contributions}
            payouts={member.payouts}
          />
        </div>

        <div className="mt-8">
          <DependantsSection member={member} onUpdate={fetchMemberDetails} />
        </div>

        <div className="space-y-6 mt-8">
          <ContributionsHistory contributions={member.contributions} />
          <PayoutsHistory payouts={member.payouts} />
        </div>
      </div>

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateMember}
        member={member}
      />
    </div>
  );
};

export default MemberDetail;
