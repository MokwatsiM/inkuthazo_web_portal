import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { addClaim, reviewClaim } from "../services/claimService";
import type { Claim, ClaimStatus } from "../types/claim";
import { toFirestoreTimestamp } from "../utils/dateUtils";
import { useNotifications } from "./useNotifications";

export const useClaims = (memberId?: string) => {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useNotifications();

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const claimsRef = collection(db, "claims");
      const q = memberId
        ? query(
            claimsRef,
            where("member_id", "==", memberId),
            orderBy("date", "desc")
          )
        : query(claimsRef, orderBy("date", "desc"));

      const snapshot = await getDocs(q);
      const claimsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Claim[];

      setClaims(claimsData);
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred");
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [memberId]);

  const submitClaim = async (
    data: Omit<Claim, "id" | "members" | "status">,
    files?: File[]
  ) => {
    try {
      const newClaim = await addClaim(data, files);
      setClaims((prev) => [newClaim, ...prev]);
      showSuccess("Claim submitted successfully");
      return newClaim;
    } catch (err) {
      showError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const handleReviewClaim = async (
    id: string,
    status: ClaimStatus,
    notes: string,
    reviewerId: string
  ) => {
    try {
      await reviewClaim(id, status, notes, reviewerId);
      setClaims((prev) =>
        prev.map((claim) =>
          claim.id === id
            ? {
                ...claim,
                status,
                review_notes: notes,
                reviewed_by: reviewerId,
                reviewed_at: toFirestoreTimestamp(new Date()),
              }
            : claim
        )
      );
    } catch (err) {
         showError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  return {
    claims,
    loading,
    error,
    submitClaim,
    reviewClaim: handleReviewClaim,
    refetch: fetchClaims,
  };
};
