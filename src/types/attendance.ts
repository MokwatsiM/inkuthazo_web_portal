export * from './meeting';

export interface AttendanceStats {
  totalMeetings: number;
  totalAttendances: number;
  averageAttendance: number;
  memberAttendanceRates: Array<{
    memberId: string;
    memberName: string;
    attendanceRate: number;
    attendedMeetings: number;
    totalMeetings: number;
  }>;
}

export interface MeetingAttendanceStats {
  meetingId: string;
  meetingTitle: string;
  totalMembers: number;
  attendedMembers: number;
  attendanceRate: number;
  responses: Array<{
    questionId: string;
    questionText: string;
    responses: Record<string, number>;
  }>;
}