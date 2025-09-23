import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import type {
  HostAssignment,
  HostSchedule,
  GenerateHostScheduleParams,
  Member,
} from "../types";

export const generateHostSchedule = async (
  params: GenerateHostScheduleParams,
  adminId: string
): Promise<HostSchedule> => {
  try {
    // Fetch all eligible members (exclude admins if specified)
    const membersRef = collection(db, "members");
    let memberQuery = query(membersRef, where("status", "in", ["approved", "active"]));

    const membersSnapshot = await getDocs(memberQuery);
    let eligibleMembers = membersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Member))
      .filter(member => {
        // Exclude admins if specified
        if (params.excludeAdmins && member.role === "admin") {
          return false;
        }

        // Exclude specific members if specified
        if (params.excludeMemberIds?.includes(member.id)) {
          return false;
        }

        return true;
      });

    if (eligibleMembers.length === 0) {
      throw new Error("No eligible members found for host assignment");
    }

    // Shuffle the members array for random assignment
    const shuffledMembers = [...eligibleMembers].sort(() => Math.random() - 0.5);

    // Generate assignments for each month
    const assignments: HostAssignment[] = [];

    for (let month = 1; month <= 12; month++) {
      // Calculate second Sunday of the month
      const secondSunday = getSecondSunday(params.year, month);

      // Select a member (cycle through shuffled list)
      const memberIndex = (month - 1) % shuffledMembers.length;
      const selectedMember = shuffledMembers[memberIndex];

      const assignment: Omit<HostAssignment, "id"> = {
        member_id: selectedMember.id,
        member_name: selectedMember.full_name,
        assigned_month: Timestamp.fromDate(secondSunday),
        year: params.year,
        month,
        status: "pending",
        created_at: Timestamp.now(),
        created_by: adminId,
      };

      // Add to Firestore and get the ID
      const assignmentRef = await addDoc(collection(db, "hostAssignments"), assignment);
      assignments.push({ id: assignmentRef.id, ...assignment });
    }

    // Create the schedule record
    const schedule: Omit<HostSchedule, "id"> = {
      year: params.year,
      assignments: assignments,
      generated_at: Timestamp.now(),
      generated_by: adminId,
      last_modified: Timestamp.now(),
      is_finalized: false,
    };

    const scheduleRef = await addDoc(collection(db, "hostSchedules"), schedule);

    return { id: scheduleRef.id, ...schedule };
  } catch (error) {
    console.error("Error generating host schedule:", error);
    throw error;
  }
};

export const getHostScheduleForYear = async (year: number): Promise<HostSchedule | null> => {
  try {
    const schedulesRef = collection(db, "hostSchedules");
    const q = query(schedulesRef, where("year", "==", year));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const scheduleDoc = snapshot.docs[0];
    const scheduleData = scheduleDoc.data() as Omit<HostSchedule, "id">;

    // Fetch the actual assignments from the hostAssignments collection
    const assignmentsRef = collection(db, "hostAssignments");
    const assignmentsQuery = query(
      assignmentsRef,
      where("year", "==", year),
      orderBy("month")
    );
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    const assignments = assignmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as HostAssignment[];

    return {
      id: scheduleDoc.id,
      ...scheduleData,
      assignments,
    };
  } catch (error) {
    console.error("Error fetching host schedule:", error);
    throw error;
  }
};

export const updateHostAssignment = async (
  assignmentId: string,
  updates: Partial<HostAssignment>,
  adminId: string
): Promise<void> => {
  try {
    const assignmentRef = doc(db, "hostAssignments", assignmentId);

    await updateDoc(assignmentRef, {
      ...updates,
      updated_at: Timestamp.now(),
      updated_by: adminId,
    });

    // Update the schedule's last_modified timestamp
    if (updates.year) {
      const schedulesRef = collection(db, "hostSchedules");
      const q = query(schedulesRef, where("year", "==", updates.year));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const scheduleRef = doc(db, "hostSchedules", snapshot.docs[0].id);
        await updateDoc(scheduleRef, {
          last_modified: Timestamp.now(),
        });
      }
    }
  } catch (error) {
    console.error("Error updating host assignment:", error);
    throw error;
  }
};

export const swapHostAssignments = async (
  assignment1Id: string,
  assignment2Id: string,
  adminId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Get both assignments
    const assignment1Ref = doc(db, "hostAssignments", assignment1Id);
    const assignment2Ref = doc(db, "hostAssignments", assignment2Id);

    // Fetch current data
    const [assignment1Snapshot, assignment2Snapshot] = await Promise.all([
      getDocs(query(collection(db, "hostAssignments"), where("__name__", "==", assignment1Id))),
      getDocs(query(collection(db, "hostAssignments"), where("__name__", "==", assignment2Id))),
    ]);

    if (assignment1Snapshot.empty || assignment2Snapshot.empty) {
      throw new Error("One or both assignments not found");
    }

    const assignment1Data = assignment1Snapshot.docs[0].data() as HostAssignment;
    const assignment2Data = assignment2Snapshot.docs[0].data() as HostAssignment;

    // Swap the member assignments
    batch.update(assignment1Ref, {
      member_id: assignment2Data.member_id,
      member_name: assignment2Data.member_name,
      updated_at: Timestamp.now(),
      updated_by: adminId,
    });

    batch.update(assignment2Ref, {
      member_id: assignment1Data.member_id,
      member_name: assignment1Data.member_name,
      updated_at: Timestamp.now(),
      updated_by: adminId,
    });

    await batch.commit();
  } catch (error) {
    console.error("Error swapping host assignments:", error);
    throw error;
  }
};

export const deleteHostSchedule = async (year: number): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Delete all assignments for the year
    const assignmentsRef = collection(db, "hostAssignments");
    const assignmentsQuery = query(assignmentsRef, where("year", "==", year));
    const assignmentsSnapshot = await getDocs(assignmentsQuery);

    assignmentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the schedule
    const schedulesRef = collection(db, "hostSchedules");
    const scheduleQuery = query(schedulesRef, where("year", "==", year));
    const scheduleSnapshot = await getDocs(scheduleQuery);

    scheduleSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting host schedule:", error);
    throw error;
  }
};

export const finalizeHostSchedule = async (year: number, _adminId: string): Promise<void> => {
  try {
    const schedulesRef = collection(db, "hostSchedules");
    const q = query(schedulesRef, where("year", "==", year));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Schedule not found");
    }

    const scheduleRef = doc(db, "hostSchedules", snapshot.docs[0].id);
    await updateDoc(scheduleRef, {
      is_finalized: true,
      last_modified: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error finalizing host schedule:", error);
    throw error;
  }
};

// Helper function to calculate the second Sunday of a given month
function getSecondSunday(year: number, month: number): Date {
  const firstDay = new Date(year, month - 1, 1);
  const firstSunday = new Date(firstDay);

  // Find the first Sunday
  const daysToFirstSunday = (7 - firstDay.getDay()) % 7;
  firstSunday.setDate(1 + daysToFirstSunday);

  // Add 7 days to get the second Sunday
  const secondSunday = new Date(firstSunday);
  secondSunday.setDate(firstSunday.getDate() + 7);

  return secondSunday;
}

export const getHostAssignmentsForMember = async (memberId: string): Promise<HostAssignment[]> => {
  try {
    const assignmentsRef = collection(db, "hostAssignments");
    const q = query(
      assignmentsRef,
      where("member_id", "==", memberId),
      orderBy("assigned_month")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as HostAssignment[];
  } catch (error) {
    console.error("Error fetching member host assignments:", error);
    throw error;
  }
};