import React, { useState } from 'react';
import { PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePayouts } from '../hooks/usePayouts';
import Button from '../components/ui/Button';
import Table from '../components/ui/Table';
import SearchInput from '../components/ui/SearchInput';
import AddPayoutModal from '../components/payouts/AddPayoutModal';
import DeletePayoutModal from '../components/payouts/DeletePayoutModal';
import UpdatePayoutStatusModal from '../components/payouts/UpdatePayoutStatusModal';
import type { Payout } from '../types';

const Payouts: React.FC = () => {
  const { payouts, loading, addPayout, deletePayout, updatePayoutStatus } = usePayouts();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayouts = payouts.filter(payout =>
    payout.members?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payout.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPayout = async (data: Omit<Payout, 'id' | 'date' | 'members'>) => {
    try {
      await addPayout(data);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding payout:', error);
    }
  };

  const handleDeleteClick = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateStatusClick = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsUpdateStatusModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedPayout) {
      await deletePayout(selectedPayout.id);
      setIsDeleteModalOpen(false);
      setSelectedPayout(null);
    }
  };

  const handleUpdateStatusConfirm = async (status: Payout['status']) => {
    if (selectedPayout) {
      await updatePayoutStatus(selectedPayout.id, status);
      setIsUpdateStatusModalOpen(false);
      setSelectedPayout(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payouts</h2>
        <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
          Record Payout
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchInput 
            placeholder="Search payouts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table headers={['Date', 'Member', 'Reason', 'Status', 'Amount', 'Actions']}>
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center">Loading...</td>
            </tr>
          ) : filteredPayouts.map((payout) => (
            <tr key={payout.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(payout.date.toDate(), 'dd MMM yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {payout.members?.full_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {payout.reason}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                  payout.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {payout.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                R {payout.amount.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateStatusClick(payout)}
                    className="p-1 text-blue-600 hover:text-blue-900 transition-colors"
                    title="Update Status"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(payout)}
                    className="p-1 text-red-600 hover:text-red-900 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </div>

      <AddPayoutModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPayout}
      />

      {selectedPayout && (
        <>
          <DeletePayoutModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedPayout(null);
            }}
            onConfirm={handleDeleteConfirm}
            payout={selectedPayout}
          />

          <UpdatePayoutStatusModal
            isOpen={isUpdateStatusModalOpen}
            onClose={() => {
              setIsUpdateStatusModalOpen(false);
              setSelectedPayout(null);
            }}
            onConfirm={handleUpdateStatusConfirm}
            payout={selectedPayout}
          />
        </>
      )}
    </div>
  );
};

export default Payouts;