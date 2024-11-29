import React, { useState } from "react";
import { PlusCircle, ExternalLink } from "lucide-react";
import { useContributions } from "../hooks/useContributions";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import SearchInput from "../components/ui/SearchInput";
import AddContributionModal from "../components/contributions/AddContributionModal";
import { formatFirestoreDate } from "../utils/dateUtils";
import type { Contribution } from "../types";

const MyContributions: React.FC = () => {
  const { contributions, loading, addContribution } = useContributions();
  const { userDetails, isApproved } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter contributions to show only the member's own contributions
  const myContributions = contributions.filter(
    (contribution) =>
      contribution.member_id === userDetails?.id &&
      contribution.members?.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleAddContribution = async (
    data: Omit<Contribution, "id" | "members">,
    file?: File
  ) => {
    try {
      if (userDetails) {
        // Set the member_id to the current user's ID
        data.member_id = userDetails.id;
      }
      await addContribution(data, file);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding contribution:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Contributions</h2>
        {isApproved ? (
          <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
            Add Contribution
          </Button>
        ) : (
          <div className="text-yellow-600 bg-yellow-50 px-4 py-2 rounded-md">
            Your account is pending approval from an administrator
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <SearchInput
            placeholder="Search contributions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table headers={["Date", "Type", "Amount", "Proof of Payment"]}>
          {loading ? (
            <tr>
              <td colSpan={4} className="px-6 py-4 text-center">
                Loading...
              </td>
            </tr>
          ) : (
            myContributions.map((contribution) => (
              <tr key={contribution.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatFirestoreDate(contribution.date)}
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
                      View <ExternalLink className="ml-1 w-4 w-4" />
                    </a>
                  ) : (
                    <span className="text-gray-400">No proof attached</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {isApproved && (
        <AddContributionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddContribution}
          isAdmin={false}
        />
      )}
    </div>
  );
};

export default MyContributions;
