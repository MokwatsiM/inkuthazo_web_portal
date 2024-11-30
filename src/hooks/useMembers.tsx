// src/hooks/useMembers.tsx
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type { Member } from "../types";
import { archiveMemberContributions } from "../utils/archivedUtils";

interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addMember: (member: Omit<Member, "id" | "join_date">) => Promise<Member>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
}

export const useMembers = (): UseMembersReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async (): Promise<void> => {
    try {
      setLoading(true);
      const membersRef = collection(db, "members");
      const q = query(membersRef, orderBy("full_name"));
      const querySnapshot = await getDocs(q);

      const membersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (
    member: Omit<Member, "id" | "join_date">
  ): Promise<Member> => {
    try {
      const membersRef = collection(db, "members");
      const docRef = await addDoc(membersRef, {
        ...member,
        join_date: Timestamp.now(),
      });

      const newMember = {
        id: docRef.id,
        ...member,
        join_date: Timestamp.now(),
      } as Member;

      setMembers((prev) => [...prev, newMember]);
      return newMember;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const updateMember = async (
    id: string,
    member: Partial<Member>
  ): Promise<void> => {
    try {
      const memberRef = doc(db, "members", id);
      const updateData = {
        ...member,
        ...(member.join_date && {
          join_date: member.join_date,
        }),
      };
      await updateDoc(memberRef, updateData);

      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updateData } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  const deleteMember = async (id: string): Promise<void> => {
    try {
      // First archive all contributions
      await archiveMemberContributions(id);

      // Then delete the member
      const memberRef = doc(db, "members", id);
      await deleteDoc(memberRef);

      setMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    addMember,
    updateMember,
    deleteMember,
  };
};
