import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
// import {
//   addContribution,
//   updateContribution,
//   deleteContribution,
// } from "../services/contributionService";
// import { fetchMemberDetails } from "../services/memberService";
import type { Contribution } from "../types";
import { fetchMemberDetails } from "../services/memberService";
import { addContribution, deleteContribution, updateContribution } from "../services/contributionService";

interface UseContributionsReturn {
  contributions: Contribution[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addContribution: (
    contribution: Omit<Contribution, "id" | "members">,
    file?: File
  ) => Promise<Contribution>;
  updateContribution: (
    id: string,
    contribution: Partial<Contribution>,
    file?: File
  ) => Promise<void>;
  deleteContribution: (id: string, proofOfPaymentUrl?: string) => Promise<void>;
}

export const useContributions = (): UseContributionsReturn => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContributions = async (): Promise<void> => {
    try {
      setLoading(true);
      const contributionsRef = collection(db, "contributions");
      const q = query(contributionsRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);

      const contributionsData = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const memberDetails = await fetchMemberDetails(data.member_id);

          return {
            id: doc.id,
            ...data,
            members: {
              full_name: memberDetails?.full_name || "Unknown Member",
            },
          } as Contribution;
        })
      );

      setContributions(contributionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async (
    contribution: Omit<Contribution, "id" | "members">,
    file?: File
  ): Promise<Contribution> => {
    try {
      const newContribution = await addContribution(contribution, file);
      setContributions((prev) => [newContribution, ...prev]);
      return newContribution;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const handleUpdateContribution = async (
    id: string,
    contribution: Partial<Contribution>,
    file?: File
  ): Promise<void> => {
    try {
      const updatedContribution = await updateContribution(
        id,
        contribution,
        file
      );
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedContribution } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const handleDeleteContribution = async (
    id: string,
    proofOfPaymentUrl?: string
  ): Promise<void> => {
    try {
      await deleteContribution(id, proofOfPaymentUrl);
      setContributions((prev) =>
        prev.filter((contribution) => contribution.id !== id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  useEffect(() => {
    fetchContributions();
  }, []);

  return {
    contributions,
    loading,
    error,
    refetch: fetchContributions,
    addContribution: handleAddContribution,
    updateContribution: handleUpdateContribution,
    deleteContribution: handleDeleteContribution,
  };
};
