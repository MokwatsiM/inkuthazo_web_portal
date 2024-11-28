import React, { useState } from 'react';
import { PlusCircle, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useContributions } from '../hooks/useContributions';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import SearchInput from '../components/ui/SearchInput';
import AddContributionModal from '../components/contributions/AddContributionModal';
import EditContributionModal from '../components/contributions/EditContributionModal';
import DeleteContributionModal from '../components/contributions/DeleteContributionModal';
import type { Contribution } from '../types';

const Contributions: React.FC = () => {
  const { contributions, loading, addContribution, updateContribution, deleteContribution } = useContributions();
  const { userDetails, isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [contributionToDelete, setContributionToDelete] = useState<Contribution | null>(null);

  const filteredContributions = contributions.filter(contribution => {
    const matchesSearch = contribution.members?.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    if (isAdmin) {
      return matchesSearch;
    } else {
      return matchesSearch && contribution.member_id === userDetails?.id;
    }
  });

  const handleAddContribution = async (data: Omit<Contribution, 'id' | 'members'>, file?: File) => {
    try {
      if (!isAdmin && userDetails) {
        // For members, automatically set their own member_id
        data.member_id = userDetails.id;
      }
      await addContribution(data, file);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding contribution:', error);
    }
  };

  const handleEditContribution = async (id: string, data: Partial<Contribution>, file?: File) => {
    try {
      await updateContribution(id, data, file);
      setIsEditModalOpen(false);
      setSelectedContribution(null);
    } catch (error) {
      console.error('Error updating contribution:', error);
    }
  };

  const openEditModal = (contribution: Contribution) => {
    setSelectedContribution(contribution);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (contribution: Contribution) => {
    setContributionToDelete(contribution);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (contributionToDelete) {
      try {
        await deleteContribution(contributionToDelete.id, contributionToDelete.proof_of_payment);
        setIsDeleteModalOpen(false);
        setContributionToDelete(null);
      } catch (error) {
        console.error('Error deleting contribution:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{isAdmin ? 'Contributions' : 'My Contributions'}</h2>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          {isAdmin ? 'Record Contribution' : 'Add My Contribution'}
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchInput 
            placeholder="Search by member name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table headers={['Date', 'Member', 'Type', 'Amount', 'Proof of Payment', ...(isAdmin ? ['Actions'] : [])]}>
          {loading ? (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} className="px-6 py-4 text-center">Loading...</td>
            </tr>
          ) : filteredContributions.map((contribution) => (
            <tr key={contribution.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(contribution.date.toDate(), 'dd MMM yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {contribution.members?.full_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap capitalize">
                {contribution.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                R {contribution.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {contribution.proof_of_payment ? (
                  <a
                    href={contribution.proof_of_payment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 flex items-center"
                  >
                    View <ExternalLink className="ml-1 w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-gray-400">No proof attached</span>
                )}
              </td>
              {isAdmin && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(contribution)}
                      className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(contribution)}
                      className="p-1 text-red-600 hover:text-red-900 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </Table>
      </div>

      <AddContributionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddContribution}
        isAdmin={isAdmin}
      />

      {selectedContribution && (
        <EditContributionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedContribution(null);
          }}
          onSubmit={handleEditContribution}
          contribution={selectedContribution}
        />
      )}

      {contributionToDelete && (
        <DeleteContributionModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setContributionToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          contribution={contributionToDelete}
        />
      )}
    </div>
  );
};

export default Contributions;