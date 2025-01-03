import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  addContribution as addContributionService,
  updateContribution as updateContributionService,
  deleteContribution as deleteContributionService,
  reviewContribution as reviewContributionService,
} from "../services/contributionService";
import { fetchMemberDetails } from "../services/memberService";
import type { Contribution, ContributionStatus } from "../types/contribution";
import { toFirestoreTimestamp } from "../utils/dateUtils";

const ITEMS_PER_PAGE = 10;

interface UseContributionsReturn {
  contributions: Contribution[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  fetchPage: (page: number) => Promise<void>;
  refetch: () => Promise<void>;
  addContribution: (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File | null
  ) => Promise<void>;
  updateContribution: (
    id: string,
    data: Partial<Contribution>,
    file?: File | null
  ) => Promise<void>;
  deleteContribution: (id: string, proofOfPaymentUrl?: string) => Promise<void>;
  reviewContribution: (
    id: string,
    status: ContributionStatus,
    notes: string,
    reviewerId: string
  ) => Promise<void>;
}

export const useContributions = (): UseContributionsReturn => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContributions = async (page: number = 1) => {
    try {
      setLoading(true);
      const contributionsRef = collection(db, "contributions");
      const totalSnapshot = await getDocs(query(contributionsRef));
      const total = totalSnapshot.size;
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

      let q = query(
        contributionsRef,
        orderBy("date", "desc"),
        limit(ITEMS_PER_PAGE)
      );

      // If not first page, start after last doc
      if (page > 1 && lastDoc) {
        q = query(
          contributionsRef,
          orderBy("date", "desc"),
          startAfter(lastDoc),
          limit(ITEMS_PER_PAGE)
        );
      }
      const querySnapshot = await getDocs(q);

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);

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
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async (
    data: Omit<Contribution, "id" | "members" | "status">,
    file?: File | null
  ): Promise<void> => {
    try {
      const newContribution = await addContributionService(data, file);
      setContributions((prev) => [newContribution, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const handleUpdateContribution = async (
    id: string,
    data: Partial<Contribution>,
    file?: File | null
  ): Promise<void> => {
    try {
      const updatedData = await updateContributionService(id, data, file);
      setContributions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
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
      await deleteContributionService(id, proofOfPaymentUrl);
      setContributions((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const handleReviewContribution = async (
    id: string,
    status: ContributionStatus,
    notes: string,
    reviewerId: string
  ): Promise<void> => {
    try {
      await reviewContributionService(id, status, notes, reviewerId);
      setContributions((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status,
                review_notes: notes,
                reviewed_by: reviewerId,
                reviewed_at: toFirestoreTimestamp(new Date()),
              }
            : c
        )
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
    currentPage,
    totalPages,
    hasMore,
    fetchPage: fetchContributions,
    refetch: fetchContributions,
    addContribution: handleAddContribution,
    updateContribution: handleUpdateContribution,
    deleteContribution: handleDeleteContribution,
    reviewContribution: handleReviewContribution,
  };
};
