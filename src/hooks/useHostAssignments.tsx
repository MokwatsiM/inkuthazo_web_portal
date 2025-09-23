import { useState, useEffect } from "react";
import {
  generateHostSchedule,
  getHostScheduleForYear,
  updateHostAssignment,
  swapHostAssignments,
  deleteHostSchedule,
  finalizeHostSchedule,
  getHostAssignmentsForMember,
} from "../services/hostAssignmentService";
import { useAuth } from "./useAuth";
import type {
  HostSchedule,
  HostAssignment,
  GenerateHostScheduleParams,
} from "../types";

interface UseHostAssignmentsReturn {
  schedule: HostSchedule | null;
  loading: boolean;
  error: string | null;
  generateSchedule: (params: GenerateHostScheduleParams) => Promise<void>;
  updateAssignment: (assignmentId: string, updates: Partial<HostAssignment>) => Promise<void>;
  swapAssignments: (assignment1Id: string, assignment2Id: string) => Promise<void>;
  deleteSchedule: (year: number) => Promise<void>;
  finalizeSchedule: (year: number) => Promise<void>;
  refetchSchedule: (year: number) => Promise<void>;
}

export const useHostAssignments = (year: number): UseHostAssignmentsReturn => {
  const { userDetails } = useAuth();
  const [schedule, setSchedule] = useState<HostSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async (targetYear: number = year): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const fetchedSchedule = await getHostScheduleForYear(targetYear);
      setSchedule(fetchedSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching host schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSchedule = async (params: GenerateHostScheduleParams): Promise<void> => {
    if (!userDetails?.id) {
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);
      setError(null);
      const newSchedule = await generateHostSchedule(params, userDetails.id);
      setSchedule(newSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = async (
    assignmentId: string,
    updates: Partial<HostAssignment>
  ): Promise<void> => {
    if (!userDetails?.id) {
      throw new Error("User not authenticated");
    }

    try {
      await updateHostAssignment(assignmentId, updates, userDetails.id);

      // Update local state
      if (schedule) {
        const updatedAssignments = schedule.assignments.map(assignment =>
          assignment.id === assignmentId ? { ...assignment, ...updates } : assignment
        );
        setSchedule({ ...schedule, assignments: updatedAssignments });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update assignment");
      throw err;
    }
  };

  const swapAssignments = async (assignment1Id: string, assignment2Id: string): Promise<void> => {
    if (!userDetails?.id) {
      throw new Error("User not authenticated");
    }

    try {
      await swapHostAssignments(assignment1Id, assignment2Id, userDetails.id);

      // Update local state
      if (schedule) {
        const assignment1Index = schedule.assignments.findIndex(a => a.id === assignment1Id);
        const assignment2Index = schedule.assignments.findIndex(a => a.id === assignment2Id);

        if (assignment1Index !== -1 && assignment2Index !== -1) {
          const updatedAssignments = [...schedule.assignments];
          const assignment1 = updatedAssignments[assignment1Index];
          const assignment2 = updatedAssignments[assignment2Index];

          // Swap member details
          updatedAssignments[assignment1Index] = {
            ...assignment1,
            member_id: assignment2.member_id,
            member_name: assignment2.member_name,
          };
          updatedAssignments[assignment2Index] = {
            ...assignment2,
            member_id: assignment1.member_id,
            member_name: assignment1.member_name,
          };

          setSchedule({ ...schedule, assignments: updatedAssignments });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to swap assignments");
      throw err;
    }
  };

  const deleteSchedule = async (targetYear: number): Promise<void> => {
    try {
      await deleteHostSchedule(targetYear);
      if (targetYear === year) {
        setSchedule(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete schedule");
      throw err;
    }
  };

  const finalizeSchedule = async (targetYear: number): Promise<void> => {
    if (!userDetails?.id) {
      throw new Error("User not authenticated");
    }

    try {
      await finalizeHostSchedule(targetYear, userDetails.id);

      // Update local state
      if (schedule && schedule.year === targetYear) {
        setSchedule({ ...schedule, is_finalized: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finalize schedule");
      throw err;
    }
  };

  const refetchSchedule = async (targetYear: number = year): Promise<void> => {
    await fetchSchedule(targetYear);
  };

  useEffect(() => {
    fetchSchedule(year);
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    schedule,
    loading,
    error,
    generateSchedule,
    updateAssignment,
    swapAssignments,
    deleteSchedule,
    finalizeSchedule,
    refetchSchedule,
  };
};

// Hook for members to view their assignments
export const useMemberHostAssignments = (memberId?: string) => {
  const [assignments, setAssignments] = useState<HostAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        const memberAssignments = await getHostAssignmentsForMember(memberId);
        setAssignments(memberAssignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch assignments");
        console.error("Error fetching member assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [memberId]);

  return { assignments, loading, error };
};