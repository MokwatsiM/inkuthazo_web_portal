import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "../config/firebase";
import { converter } from "../utils/firestoreConverter";
import { toFirestoreTimestamp } from "../utils/dateUtils";
import { deleteMemberWithAuth } from "../services/memberService";
import { useAuth } from "./useAuth";
import type { Member } from "../types";
import logger from "../utils/logger";

interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addMember: (member: Omit<Member, "id" | "join_date">) => Promise<Member>;
  updateMember: (id: string, member: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
}

const membersCollection = () =>
  collection(db, "members").withConverter(converter<Member>());

const fetchMembers = async (): Promise<Member[]> => {
  const snapshot = await getDocs(query(membersCollection(), orderBy("full_name")));
  return snapshot.docs.map((docSnapshot) => docSnapshot.data());
};

export const useMembers = (): UseMembersReturn => {
  const { userDetails } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ["members"] });

  const addMemberMutation = useMutation({
    mutationFn: async (
      member: Omit<Member, "id" | "join_date">
    ): Promise<Member> => {
      const join_date = Timestamp.now();
      const docRef = await addDoc(collection(db, "members"), {
        ...member,
        join_date,
      });

      // Log audit trail
      try {
        const { logAuditTrail } = await import("../services/auditService");
        await logAuditTrail(
          userDetails?.id || "admin",
          "MEMBER_CREATE",
          {
            member_id: docRef.id,
            member_name: member.full_name,
            email: member.email,
            role: member.role,
          },
          userDetails?.full_name || "Admin"
        );
      } catch (auditError) {
        logger.error("Failed to log member creation audit trail:", auditError);
      }

      return { id: docRef.id, ...member, join_date } as Member;
    },
    onSuccess: invalidateMembers,
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({
      id,
      member,
    }: {
      id: string;
      member: Partial<Member>;
    }): Promise<void> => {
      const memberRef = doc(db, "members", id);
      const previousMember = members.find((m) => m.id === id);

      const updateData = {
        ...member,
        ...(member.join_date && {
          join_date:
            typeof member.join_date === "string"
              ? toFirestoreTimestamp(member.join_date)
              : member.join_date,
        }),
      };

      await updateDoc(memberRef, updateData);

      // Log audit trail
      try {
        const { logAuditTrail } = await import("../services/auditService");

        // Extract only the fields that changed for the audit log
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        if (previousMember) {
          (Object.keys(updateData) as (keyof Member)[]).forEach((field) => {
            if (
              JSON.stringify(previousMember[field]) !==
              JSON.stringify(updateData[field])
            ) {
              changes[field] = {
                old: previousMember[field],
                new: updateData[field],
              };
            }
          });
        }

        await logAuditTrail(
          userDetails?.id || "system",
          "MEMBER_UPDATE",
          {
            target_member_id: id,
            target_member_name: previousMember?.full_name || "Unknown",
            changes,
            timestamp: new Date().toISOString(),
          },
          userDetails?.full_name || "System"
        );
      } catch (auditError) {
        logger.error("Failed to log member update audit trail:", auditError);
      }
    },
    onSuccess: invalidateMembers,
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      if (!userDetails?.id) {
        throw new Error("User not authenticated");
      }
      await deleteMemberWithAuth(id, userDetails.id);
    },
    onSuccess: invalidateMembers,
  });

  return {
    members,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch: async () => {
      await refetch();
    },
    addMember: (member) => addMemberMutation.mutateAsync(member),
    updateMember: (id, member) =>
      updateMemberMutation.mutateAsync({ id, member }),
    deleteMember: (id) => deleteMemberMutation.mutateAsync(id),
  };
};
