import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Download, User, Edit, UserPlus } from "lucide-react";
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
import { addDependant, removeDependant } from "../services/dependantService";
import type {
  MemberDetail as MemberDetailType,
  Contribution,
  Payout,
  Dependant,
} from "../types";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import StatCard from "../components/stats/StatCard";
import EditMemberModal from "../components/members/EditMemberModal";
import AvatarUpload from "../components/avatar/AvatarUpload";
import DependantsList from "../components/dependants/DependantsList";
import AddDependantModal from "../components/dependants/AddDependantModal";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails, isAdmin, refreshUserDetails } = useAuth();
  const { updateMember } = useMembers();
  const [member, setMember] = useState<MemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddDependantModalOpen, setIsAddDependantModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMaxDependantsMessage, setShowMaxDependantsMessage] =
    useState(false);

  const dependantsCount = member?.dependants?.length || 0;
  const canAddDependant = dependantsCount < 3;

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

      const payoutsRef = collection(db, "payouts");
      const payoutsQuery = query(payoutsRef, where("member_id", "==", id));
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payouts = payoutsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Payout[];

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

  const handleUpdateMember = async (data: Partial<MemberDetailType>) => {
    if (!member) return;

    try {
      await updateMember(member.id, data);
      await fetchMemberDetails();
      if (member.id === userDetails?.id) {
        await refreshUserDetails();
      }
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

  const handleAddDependant = async (
    data: Omit<Dependant, "id">,
    file: File
  ) => {
    if (!member) return;

    try {
      await addDependant(member.id, data, file);
      await fetchMemberDetails();
    } catch (error) {
      console.error("Error adding dependant:", error);
    }
  };

  const handleDeleteDependant = async (dependant: Dependant) => {
    if (!member) return;

    try {
      await removeDependant(member.id, dependant);
      await fetchMemberDetails();
    } catch (error) {
      console.error("Error deleting dependant:", error);
    }
  };

  const handleAddDependantClick = () => {
    if (!canAddDependant) {
      setShowMaxDependantsMessage(true);
      setTimeout(() => setShowMaxDependantsMessage(false), 3000);
    } else {
      setIsAddDependantModalOpen(true);
    }
  };

  const generateStatement = () => {
    if (!member) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("Member Statement", 20, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${member.full_name}`, 20, 35);
    doc.text(`Email: ${member.email}`, 20, 45);
    doc.text(`Phone: ${member.phone}`, 20, 55);
    doc.text(
      `Join Date: ${format(member.join_date.toDate(), "dd MMM yyyy")}`,
      20,
      65
    );
    doc.text(`Status: ${member.status}`, 20, 75);

    const contributionsData = member.contributions.map((contribution) => [
      format(contribution.date.toDate(), "dd/MM/yyyy"),
      contribution.type,
      `R ${contribution.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 85,
      head: [["Date", "Type", "Amount"]],
      body: contributionsData,
      headStyles: { fillColor: [79, 70, 229] },
    });

    const payoutsData = member.payouts.map((payout) => [
      format(payout.date.toDate(), "dd/MM/yyyy"),
      payout.reason,
      payout.status,
      `R ${payout.amount.toFixed(2)}`,
    ]);

    const payoutsY = (doc as any).lastAutoTable.finalY + 15;

    doc.text("Payouts", 20, payoutsY);
    autoTable(doc, {
      startY: payoutsY + 10,
      head: [["Date", "Reason", "Status", "Amount"]],
      body: payoutsData,
      headStyles: { fillColor: [79, 70, 229] },
    });

    doc.save(
      `${member.full_name.toLowerCase().replace(/\s+/g, "-")}-statement.pdf`
    );
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

  const totalContributions = member.contributions.reduce(
    (sum, c) => sum + c.amount,
    0
  );
  const totalPayouts = member.payouts.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Details</h2>
        <div className="flex space-x-2">
          <Button icon={Edit} onClick={() => setIsEditModalOpen(true)}>
            Edit Member
          </Button>
          <Button icon={Download} onClick={generateStatement}>
            Generate Statement
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <AvatarUpload member={member} onUpload={handleAvatarUpload} />
          <div>
            <h3 className="text-xl font-semibold">{member.full_name}</h3>
            <p className="text-gray-500">{member.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{member.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Join Date</p>
            <p className="font-medium">
              {format(member.join_date.toDate(), "dd MMM yyyy")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                member.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {member.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                member.role === "admin"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {member.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Contributions"
            value={`R ${totalContributions.toFixed(2)}`}
          />
          <StatCard
            title="Total Payouts"
            value={`R ${totalPayouts.toFixed(2)}`}
          />
          <StatCard
            title="Balance"
            value={`R ${(totalContributions - totalPayouts).toFixed(2)}`}
          />
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Dependants</h3>
            <div className="relative">
              <Button
                icon={UserPlus}
                onClick={handleAddDependantClick}
                disabled={!canAddDependant}
                className={
                  !canAddDependant ? "opacity-50 cursor-not-allowed" : ""
                }
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
        </div>

        <div className="space-y-6 mt-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">
              Contributions History
            </h4>
            <Table headers={["Date", "Type", "Amount"]}>
              {member.contributions.map((contribution) => (
                <tr key={contribution.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(contribution.date.toDate(), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {contribution.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    R {contribution.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </Table>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Payouts History</h4>
            <Table headers={["Date", "Reason", "Status", "Amount"]}>
              {member.payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(payout.date.toDate(), "dd MMM yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payout.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payout.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : payout.status === "approved"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    R {payout.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </div>

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateMember}
        member={member}
      />

      <AddDependantModal
        isOpen={isAddDependantModalOpen}
        onClose={() => setIsAddDependantModalOpen(false)}
        onSubmit={handleAddDependant}
        currentDependantsCount={dependantsCount}
      />
    </div>
  );
};

export default MemberDetail;
