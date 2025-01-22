import {
  collection,
  addDoc,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../config/firebase";
import type { Member } from "../types";

interface InvitationData {
  email: string;
  full_name: string;
  phone: string;
  invited_by: string;
  status: "pending" | "accepted" | "expired";
  created_at: Timestamp;
  expires_at: Timestamp;
  invitation_token: string;
}

export const generateInvitationToken = (): string => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

export const inviteMember = async (
  data: Pick<Member, "full_name" | "email" | "phone">,
  inviterId: string
): Promise<void> => {
  try {
    // Check if email is already registered
    const membersRef = collection(db, "members");
    const emailQuery = query(membersRef, where("email", "==", data.email));
    const existingMember = await getDocs(emailQuery);

    if (!existingMember.empty) {
      throw new Error("A member with this email already exists");
    }

    // Check for existing pending invitation
    const invitationsRef = collection(db, "invitations");
    const inviteQuery = query(
      invitationsRef,
      where("email", "==", data.email),
      where("status", "==", "pending")
    );
    const existingInvite = await getDocs(inviteQuery);

    if (!existingInvite.empty) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation record
    const invitationToken = generateInvitationToken();
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + 7 * 24 * 60 * 60 * 1000
    ); // 7 days

    const invitation: InvitationData = {
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      invited_by: inviterId,
      status: "pending",
      created_at: now,
      expires_at: expiresAt,
      invitation_token: invitationToken,
    };

    await addDoc(collection(db, "invitations"), invitation);

    // Send invitation email using Firebase Cloud Function
    const functions = getFunctions();
    const sendInvitation = httpsCallable(functions, "sendMemberInvitation");

    await sendInvitation({
      email: data.email,
      fullName: data.full_name,
      invitationToken,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    throw error;
  }
};

export const validateInvitation = async (
  token: string
): Promise<InvitationData | null> => {
  try {
    const invitationsRef = collection(db, "invitations");
    const tokenQuery = query(
      invitationsRef,
      where("invitation_token", "==", token),
      where("status", "==", "pending")
    );

    const snapshot = await getDocs(tokenQuery);

    if (snapshot.empty) {
      return null;
    }

    const invitation = snapshot.docs[0].data() as InvitationData;

    // Check if invitation has expired
    if (invitation.expires_at.toDate() < new Date()) {
      return null;
    }

    return invitation;
  } catch (error) {
    console.error("Error validating invitation:", error);
    return null;
  }
};
