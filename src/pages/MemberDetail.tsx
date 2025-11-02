import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import { InvoiceGeneratorWithProgress } from "../components/invoice/InvoiceGenerator";
import ClaimsSection from "../components/claims/ClaimsSection";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { Ghost, Edit, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const MemberDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userDetails, isAdmin } = useAuth();
  const { updateMember } = useMembers();
  const [member, setMember] = useState<MemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);


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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <div className="min-h-screen -mt-6 -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-surface/70 dark:supports-[backdrop-filter]:bg-surface-dark/70 bg-surface/80 dark:bg-surface-dark/80 border-b border-line dark:border-line-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center h-12 text-sm text-text-secondary dark:text-text-secondary-dark overflow-x-auto" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">Dashboard</Link>
            <ChevronRight className="mx-2 h-4 w-4 text-text-tertiary dark:text-text-tertiary-dark shrink-0" />
            <Link to="/members" className="hover:text-text-primary dark:hover:text-text-primary-dark transition-colors">Members</Link>
            <ChevronRight className="mx-2 h-4 w-4 text-text-tertiary dark:text-text-tertiary-dark shrink-0" />
            <span className="text-text-primary dark:text-text-primary-dark truncate">{member.full_name}</span>
          </nav>

          {/* Title Row + Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="h-12 w-12 rounded-full ring-1 ring-line dark:ring-line-dark object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full ring-1 ring-line dark:ring-line-dark bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg font-semibold">
                    {member.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-surface dark:ring-surface-dark ${
                  member.status === 'active' || member.status === 'approved' ? 'bg-emerald-500' : 'bg-red-500'
                }`} title={member.status}></span>
              </div>
              <div>
                <h1 className="text-2xl tracking-tight font-semibold text-text-primary dark:text-text-primary-dark">Member Details</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
                    member.status === 'active' || member.status === 'approved'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                      : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      member.status === 'active' || member.status === 'approved' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></span>
                    {member.status}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-sky-600 dark:text-sky-300 capitalize">
                    {member.role}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-2 py-0.5 text-text-secondary dark:text-text-secondary-dark">
                    Joined {format(member.join_date.toDate(), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                icon={Edit}
                onClick={() => setIsEditModalOpen(true)}
                size="medium"
                className="hover:border-line-hover dark:hover:border-line-dark hover:ring-1 hover:ring-line-hover dark:hover:ring-line-dark"
              >
                <span className="hidden sm:inline">Edit Member</span>
                <span className="sm:hidden">Edit</span>
              </Button>
              <button
                onClick={() => generateMemberStatement(member)}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3.5 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-200 hover:bg-indigo-600/30 hover:ring-1 hover:ring-indigo-400/30 active:scale-[0.98] transition"
              >
                <FileText className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline">Generate Statement</span>
                <span className="sm:hidden">Statement</span>
              </button>
              <InvoiceGeneratorWithProgress
                member={member}
                contributions={member.contributions}
                showProgress={true}
              />
            </div>
          </div>

          {/* Section Anchor Nav */}
          <div className="flex gap-2 pb-3 -mb-px overflow-x-auto">
            <button onClick={() => scrollToSection('profile')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Profile
            </button>
            <button onClick={() => scrollToSection('metrics')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Overview
            </button>
            <button onClick={() => scrollToSection('dependants')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Dependants
            </button>
            <button onClick={() => scrollToSection('claims')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Claims
            </button>
            <button onClick={() => scrollToSection('contributions')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Contributions
            </button>
            <button onClick={() => scrollToSection('payouts')} className="inline-flex items-center gap-2 rounded-md border border-line dark:border-line-dark bg-surface/50 dark:bg-surface-dark/50 px-3 py-1.5 text-xs text-text-secondary dark:text-text-secondary-dark hover:bg-surface-hover dark:hover:bg-surface-dark hover:border-line-hover dark:hover:border-line-dark transition">
              Payouts
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Profile + Summary */}
          <section id="profile" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <MemberProfile
                  member={member}
                  onAvatarUpload={handleAvatarUpload}
                />
              </div>

              {/* Metrics */}
              <div id="metrics" className="lg:col-span-2">
                <MemberStats
                  contributions={member.contributions}
                  payouts={member.payouts}
                />
              </div>
            </div>
          </section>

          {/* Dependants */}
          <section id="dependants" className="pt-10">
            <DependantsSection member={member} onUpdate={fetchMemberData} />
          </section>

          {/* Claims */}
          <section id="claims" className="pt-10">
            <ClaimsSection member={member} />
          </section>

          {/* Contributions */}
          <section id="contributions" className="pt-10">
            <ContributionsHistory contributions={member.contributions} />
          </section>

          {/* Payouts */}
          <section id="payouts" className="pt-10">
            <PayoutsHistory payouts={member.payouts} />
          </section>
        </div>
      </main>

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
