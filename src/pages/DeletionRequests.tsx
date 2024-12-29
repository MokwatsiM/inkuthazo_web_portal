import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { formatDate } from "../utils/dateUtils";
import { deleteMember } from "../services/deletionService";
import Button from "../components/ui/Button";
import Table from "../components/ui/Table";
import type { Member } from "../types";

interface DeletionRequest {
  id: string;
  member_id: string;
  requested_by: string;
  requested_at: Timestamp;
  status: "pending" | "completed" | "rejected";
  member?: Member;
  requestedBy?: Member;
  member_email: string;
}
interface ExtendedDeletionRequest extends DeletionRequest {
  member?: Member;
  requestedBy?: Member;
}

const DeletionRequests: React.FC = () => {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const requestsRef = collection(db, "deletion_requests");
      const q = query(requestsRef, orderBy("requested_at", "desc"));
      const snapshot = await getDocs(q);

      const requestsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Fetch member details
          const memberDoc = await getDocs(collection(db, "members"));
          const member = memberDoc.docs.find((m) => m.id === data.member_id);
          const requestedBy = memberDoc.docs.find(
            (m) => m.id === data.requested_by
          );

          return {
            id: doc.id,
            ...data,
            requested_at: data.requested_at as Timestamp,
            member: member?.data() as Member,
            requestedBy: requestedBy?.data() as Member,
          } as ExtendedDeletionRequest;
        })
      );

      setRequests(requestsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch deletion requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveRequest = async (request: DeletionRequest) => {
    if (
      !confirm(
        "Are you sure you want to approve this deletion request? This action cannot be undone."
      )
    ) {
      return;
    }

    setProcessing(request.id);
    try {
      // Delete the member document
      await deleteMember(request.member_id);

      // Update request status
      const requestRef = doc(db, "deletion_requests", request.id);
      await updateDoc(requestRef, {
        status: "completed",
        completed_at: new Date(),
      });

      // Refresh the list
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to process deletion request"
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (request: DeletionRequest) => {
    if (!confirm("Are you sure you want to reject this deletion request?")) {
      return;
    }

    setProcessing(request.id);
    try {
      const requestRef = doc(db, "deletion_requests", request.id);
      await updateDoc(requestRef, {
        status: "rejected",
        rejected_at: new Date(),
      });
      await fetchRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject deletion request"
      );
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="p-8">Loading deletion requests...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Deletion Requests</h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <Table
          headers={[
            "Requested Date",
            "Member",
            "Requested By",
            "Status",
            "Actions",
          ]}
        >
          {requests.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                No deletion requests found
              </td>
            </tr>
          ) : (
            requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(request.requested_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.member?.full_name ||
                    request.member_email ||
                    "Unknown Member"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.requestedBy?.full_name || "Unknown Admin"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : request.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.status === "pending" && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleApproveRequest(request)}
                        disabled={processing === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing === request.id
                          ? "Processing..."
                          : "Approve"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleRejectRequest(request)}
                        disabled={processing === request.id}
                        className="bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        {processing === request.id ? "Processing..." : "Reject"}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>
    </div>
  );
};

export default DeletionRequests;
