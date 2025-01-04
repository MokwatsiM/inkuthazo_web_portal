import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import { useMembers } from "../hooks/useMembers";
import { uploadAvatar } from "../services/avatarService";
import EditMemberModal from "../components/members/EditMemberModal";
import MemberProfile from "../components/members/MemberProfile";
import MemberStats from "../components/members/MemberStats";
import ContributionsHistory from "../components/members/ContributionsHistoryStory";
import PayoutsHistory from "../components/members/PayoutsHistoryStory";
import DependantsSection from "../components/dependants/DependantsSection";
import { generateMemberStatement } from "../utils/reportGenerator";
import type { MemberDetail as MemberDetailType } from "../types";
import type { Contribution } from "../types/contribution";
import type { Payout } from "../types/payout";
import MemberActions from "../components/members/MemberActions";
import { generateInvoicePDF } from "../utils/invoice/generator";
import { generateInvoiceDetails } from "../utils/invoice";
import ClaimsSection from "../components/claims/ClaimsSection";
import Card, { CardBody } from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import {  Ghost } from "lucide-react";

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails, isAdmin } = useAuth();
  const { updateMember } = useMembers();
  const [member, setMember] = useState<MemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInvoice = () => {
    if (member) {
      const invoiceDetails = generateInvoiceDetails(
        member.contributions,
        member.join_date
      );
      generateInvoicePDF(member, invoiceDetails);
    }
  };

  const fetchMemberData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch member details
      const memberDoc = await getDoc(doc(db, "members", id));
      if (!memberDoc.exists()) {
        throw new Error("Member not found");
      }

      // Fetch contributions
      const contributionsRef = collection(db, "contributions");
      const contributionsQuery = query(
        contributionsRef,
        where("member_id", "==", id)
      );
      const contributionsSnapshot = await getDocs(contributionsQuery);
      const contributions = contributionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contribution[];

      // Fetch payouts
      const payoutsRef = collection(db, "payouts");
      const payoutsQuery = query(payoutsRef, where("member_id", "==", id));
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payouts = payoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payout[];

      // Combine all data
      setMember({
        id: memberDoc.id,
        ...memberDoc.data(),
        contributions,
        payouts,
      } as MemberDetailType);
    } catch (error) {
      console.error("Error fetching member details:", error);
      setError("Failed to load member details. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    if (!isAdmin && userDetails?.id !== id) {
      navigate("/");
      return;
    }

    fetchMemberData();
  }, [id, isAdmin, userDetails]);

  const handleUpdateMember = async (data: Partial<MemberDetailType>) => {
    if (!member) return;

    try {
      await updateMember(member.id, data);
      await fetchMemberData();
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
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }

  if (!member) {
    return <EmptyState icon={Ghost} title="Member not found" description="" />;
    // <div className="p-8">Member not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Details</h2>
        <MemberActions
          member={member}
          onEdit={() => setIsEditModalOpen(true)}
          onGenerateStatement={() => generateMemberStatement(member)}
          onGenerateInvoice={handleGenerateInvoice}
        />
      </div>
      <Card>
        <CardBody>
          <div className="bg-white rounded-lg shadow p-6">
            <MemberProfile
              member={member}
              onAvatarUpload={handleAvatarUpload}
            />

            <div className="mt-8">
              <MemberStats
                contributions={member.contributions}
                payouts={member.payouts}
              />
            </div>

            <div className="mt-8">
              <DependantsSection member={member} onUpdate={fetchMemberData} />
            </div>

            <div className="mt-8">
              <ClaimsSection member={member} />
            </div>

            <div className="space-y-6 mt-8">
              <ContributionsHistory contributions={member.contributions} />
              <PayoutsHistory payouts={member.payouts} />
            </div>
          </div>
        </CardBody>
      </Card>
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
