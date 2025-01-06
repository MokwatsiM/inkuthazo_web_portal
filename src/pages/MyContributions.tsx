import React, { useState, useEffect } from "react";
import { PlusCircle, ExternalLink, FileX } from "lucide-react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import PageHeader from "../components/ui/PageHeader";
import SearchInput from "../components/ui/SearchInput";
import AddContributionModal from "../components/contributions/AddContributionModal";
import StatCard from "../components/stats/StatCard";
import { formatDate } from "../utils/dateUtils";
import type { Contribution } from "../types/contribution";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import EmptyState from "../components/ui/EmptyState";
import Card, { CardBody, CardHeader } from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const MyContributions: React.FC = () => {
  const { userDetails, isApproved } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchMyContributions = async () => {
      if (!userDetails?.id) return;

      try {
        setLoading(true);
        const contributionsRef = collection(db, "contributions");
        const q = query(
          contributionsRef,
          where("member_id", "==", userDetails.id),
          orderBy("date", "desc")
        );

        const snapshot = await getDocs(q);
        const contributionsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          members: { full_name: userDetails.full_name },
        })) as Contribution[];

        setContributions(contributionsData);
      } catch (error) {
        console.error("Error fetching contributions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyContributions();
  }, [userDetails?.id, userDetails?.full_name]);

  const filteredContributions = contributions.filter((contribution) =>
    contribution.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats = {
    approved: filteredContributions.filter((c) => c.status === "approved"),
    pending: filteredContributions.filter((c) => c.status === "pending"),
    rejected: filteredContributions.filter((c) => c.status === "rejected"),
  };

  const totalApprovedAmount = stats.approved.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const handleAddContribution = async (
    data: Omit<Contribution, "id" | "members" | "status">
    // file?: File
  ) => {
    try {
      if (userDetails) {
        data.member_id = userDetails.id;
      }
      // Add contribution logic here
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding contribution:", error);
    }
  };

  return (
    <div>
      {isApproved ? (
        <PageHeader
          title="My Contributions"
          description="View and manage your contributions"
          actions={
            <Button icon={PlusCircle} onClick={() => setIsAddModalOpen(true)}>
              Add Contribution
            </Button>
          }
        />
      ) : (
        <div className="text-yellow-600 bg-yellow-50 px-4 py-2 rounded-md">
          Your account is pending approval from an administrator
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Approved"
          value={`R ${totalApprovedAmount.toFixed(2)}`}
          className="bg-green-50"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending.length.toString()}
          className="bg-yellow-50"
        />
        <StatCard
          title="Rejected"
          value={stats.rejected.length.toString()}
          className="bg-red-50"
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <Card>
          <div className="p-4 border-b">
            <CardHeader>
              <SearchInput
                placeholder="Search by contribution type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardHeader>
          </div>
          <CardBody>
            <Table
              headers={[
                "Date",
                "Type",
                "Amount",
                "Status",
                "Notes",
                "Proof of Payment",
              ]}
            >
              {loading ? (
                <LoadingSpinner />
              ) : filteredContributions.length === 0 ? (
                <div className="text-center">
                  <EmptyState
                    icon={FileX}
                    title="No contributions found"
                    description="Start by adding your first contribution"
                  />
                </div>
              ) : (
                filteredContributions.map((contribution) => (
                  <tr key={contribution.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(contribution.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {contribution.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      R {contribution.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          contribution.status === "approved"
                            ? "success"
                            : contribution.status === "rejected"
                            ? "error"
                            : "warning"
                        }
                      >
                        {contribution.status}
                      </Badge>
                      {/* <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                           contribution.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : contribution.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {contribution.status}
                      </span> */}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contribution.review_notes || "-"}
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
          </CardBody>
        </Card>
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
