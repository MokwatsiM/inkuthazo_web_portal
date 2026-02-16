import React, { useState, useMemo } from "react";
import { Trash2, CheckCircle, Mail, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { isAfter, isBefore, subDays } from "date-fns";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import ViewToggle, { ViewType } from "../components/ui/ViewToggle";
import AddMemberModal from "../components/members/AddMemberModal";
import DeleteMemberModal from "../components/members/DeleteMemberModal";
import ApproveMemberModal from "../components/members/ApproveMemberModal";
import MemberCard from "../components/members/MemberCard";
import MemberFilters, { FilterOptions } from "../components/members/MemberFilters";
import BatchActions from "../components/members/BatchActions";
import Avatar from "../components/avatar/Avatar";
import { useMembers } from "../hooks/useMembers";
import { formatDate } from "../utils/dateUtils";
import type { Member, MemberStatus } from "../types";
import { StatusPill } from "../components/ui/Badge";
import PageHeader from "../components/ui/PageHeader";
import InviteMemberModal from "../components/members/InviteMemberModal";
import { useAuth } from "../hooks/useAuth";
import { inviteMember } from "../services/invitationService";
import { LoadingSkeleton, LoadingCard } from "../components/ui/LoadingOverlay";
// import { useAnalytics } from "../hooks/useAnalytics";

const Members: React.FC = () => {
  const { members, loading, addMember, deleteMember, updateMember } =
    useMembers();
  const { userDetails } = useAuth();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // UI states
  const [currentView, setCurrentView] = useState<ViewType>("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    joinDateRange: { start: '', end: '' },
    quickFilter: 'all',
  });

  // Filtered members with enhanced filtering
  const filteredMembers = useMemo(() => {
    let filtered = members.filter((member) => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = filters.status.length === 0 ||
        filters.status.includes(member.status);

      // Date range filter
      let matchesDateRange = true;
      if (filters.joinDateRange.start || filters.joinDateRange.end) {
        const joinDate = member.join_date.toDate();
        if (filters.joinDateRange.start) {
          matchesDateRange = matchesDateRange &&
            isAfter(joinDate, new Date(filters.joinDateRange.start));
        }
        if (filters.joinDateRange.end) {
          matchesDateRange = matchesDateRange &&
            isBefore(joinDate, new Date(filters.joinDateRange.end));
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Apply quick filters
    switch (filters.quickFilter) {
      case 'recent':
        filtered = filtered.filter(member =>
          isAfter(member.join_date.toDate(), subDays(new Date(), 30))
        );
        break;
      case 'pending':
        filtered = filtered.filter(member => member.status === 'pending');
        break;
      case 'active':
        filtered = filtered.filter(member => member.status === 'active');
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [members, searchTerm, filters]);
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

  // Selection handlers
  const handleMemberSelect = (member: Member, selected: boolean) => {
    if (selected) {
      setSelectedMembers(prev => [...prev, member]);
    } else {
      setSelectedMembers(prev => prev.filter(m => m.id !== member.id));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedMembers([...filteredMembers]);
    } else {
      setSelectedMembers([]);
    }
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  // Batch action handlers
  const handleBulkApprove = async (memberIds: string[]) => {
    for (const id of memberIds) {
      await updateMember(id, { status: "approved" });
    }
  };

  const handleBulkDelete = async (memberIds: string[]) => {
    for (const id of memberIds) {
      await deleteMember(id);
    }
  };

  const handleBulkStatusChange = async (memberIds: string[], status: MemberStatus) => {
    for (const id of memberIds) {
      await updateMember(id, { status });
    }
  };

  const handleBulkEmail = (memberIds: string[]) => {
    const selectedMembersData = members.filter(m => memberIds.includes(m.id));
    console.log('Bulk email to:', selectedMembersData.map(m => m.email));
    // Implement bulk email functionality
  };

  const handleBulkExport = (memberIds: string[]) => {
    const selectedMembersData = members.filter(m => memberIds.includes(m.id));
    console.log('Bulk export:', selectedMembersData);
    // Implement bulk export functionality
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="View and manage all member details"
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
            />
            <Button icon={Mail} onClick={() => setIsInviteModalOpen(true)}>
              Invite Member
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <MemberFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={members.length}
        filteredCount={filteredMembers.length}
      />

      {/* Batch Actions */}
      <BatchActions
        selectedMembers={selectedMembers}
        onClearSelection={clearSelection}
        onBulkApprove={handleBulkApprove}
        onBulkDelete={handleBulkDelete}
        onBulkEmail={handleBulkEmail}
        onBulkExport={handleBulkExport}
        onBulkStatusChange={handleBulkStatusChange}
      />

      {/* Search and Content */}
      <div className="bg-white dark:bg-surface-dark rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <SearchInput
              placeholder="Search members..."
              value={searchTerm}
              onChange={setSearchTerm}
              fullWidth={false}
              className="max-w-md"
            />

            {currentView === "list" && filteredMembers.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMembers.length === filteredMembers.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500"
                />
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">Select all</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="p-6">
            {currentView === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <LoadingCard key={i} className="h-64" />
                ))}
              </div>
            ) : (
              <LoadingSkeleton lines={10} className="space-y-4" />
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-text-tertiary dark:text-text-tertiary-dark mb-4" />
            <h3 className="text-lg font-medium text-text-primary dark:text-text-primary-dark mb-2">
              No members found
            </h3>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-6">
              {searchTerm || filters.status.length > 0 || filters.quickFilter !== 'all'
                ? "Try adjusting your search or filters"
                : "Get started by inviting your first member"
              }
            </p>
            {(!searchTerm && filters.status.length === 0 && filters.quickFilter === 'all') && (
              <Button icon={Plus} onClick={() => setIsInviteModalOpen(true)}>
                Invite First Member
              </Button>
            )}
          </div>
        ) : currentView === "grid" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onApprove={handleApproveClick}
                  onDelete={handleDeleteClick}
                  isSelected={selectedMembers.some(m => m.id === member.id)}
                  onSelect={handleMemberSelect}
                />
              ))}
            </div>
          </div>
        ) : (
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
            {filteredMembers.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMembers.some(m => m.id === member.id)}
                      onChange={(e) => handleMemberSelect(member, e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-line dark:border-line-dark rounded focus:ring-primary-500"
                    />
                    <Avatar member={member} size="sm" />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-text-primary dark:text-text-primary-dark">{member.full_name}</div>
                    <div className="text-sm text-gray-500">ID: {member.id.slice(0, 8)}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                  {member.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                  {member.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary dark:text-text-primary-dark">
                  {formatDate(member.join_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusPill status={member.status as any} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/members/${member.id}`}
                      className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                    >
                      View
                    </Link>
                    {member.status === "pending" && (
                      <button
                        onClick={() => handleApproveClick(member)}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Approve"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteClick(member)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
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
