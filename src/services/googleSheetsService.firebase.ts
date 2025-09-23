// Firebase Functions-based Google Sheets Service
// This service uses Firebase Functions to securely handle Google Sheets operations

import { getFunctions, httpsCallable } from 'firebase/functions';
import type { AttendanceRecord, Meeting } from '../types/attendance';

interface GoogleSheetsResponse {
  success: boolean;
  message?: string;
  data?: any;
  sheetName?: string;
  sheetUrl?: string;
  hasAttended?: boolean;
}

class GoogleSheetsServiceFirebase {
  private functions;

  constructor() {
    this.functions = getFunctions();
  }

  async createSheetForMeeting(meeting: Meeting): Promise<string> {
    try {
      const createSheet = httpsCallable<
        { meetingId: string },
        GoogleSheetsResponse
      >(this.functions, 'createAttendanceSheet');

      const result = await createSheet({ meetingId: meeting.id });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to create sheet');
      }

      return result.data.sheetName || `${meeting.date}_${meeting.title}`;
    } catch (error) {
      console.error('Error creating sheet for meeting:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create attendance sheet'
      );
    }
  }

  async recordAttendance(meeting: Meeting, attendance: AttendanceRecord): Promise<void> {
    try {
      const recordAttendance = httpsCallable<
        {
          meetingId: string;
          memberId: string;
          memberName: string;
          responses: Record<string, any>;
        },
        GoogleSheetsResponse
      >(this.functions, 'recordAttendanceInSheets');

      const result = await recordAttendance({
        meetingId: attendance.meetingId,
        memberId: attendance.memberId,
        memberName: attendance.memberName,
        responses: attendance.responses,
      });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to record attendance');
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to record attendance'
      );
    }
  }

  async getAttendanceRecords(meeting: Meeting): Promise<AttendanceRecord[]> {
    try {
      const getRecords = httpsCallable<
        { meetingId: string },
        GoogleSheetsResponse
      >(this.functions, 'getAttendanceRecords');

      const result = await getRecords({ meetingId: meeting.id });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to get attendance records');
      }

      return result.data.data || [];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      return [];
    }
  }

  async hasUserAttended(meetingId: string, memberId: string, meeting: Meeting): Promise<boolean> {
    try {
      const checkStatus = httpsCallable<
        { meetingId: string; memberId?: string },
        GoogleSheetsResponse
      >(this.functions, 'checkAttendanceStatus');

      const result = await checkStatus({ meetingId, memberId });

      if (!result.data.success) {
        console.warn('Failed to check attendance status:', result.data.message);
        return false;
      }

      return result.data.hasAttended || false;
    } catch (error) {
      console.error('Error checking attendance status:', error);
      return false;
    }
  }

  async exportAttendanceData(meetingId: string): Promise<{ sheetUrl: string; data: any[] }> {
    try {
      const exportData = httpsCallable<
        { meetingId: string },
        GoogleSheetsResponse
      >(this.functions, 'exportAttendanceData');

      const result = await exportData({ meetingId });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to export attendance data');
      }

      return {
        sheetUrl: result.data.sheetUrl || '',
        data: result.data.data || []
      };
    } catch (error) {
      console.error('Error exporting attendance data:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to export attendance data'
      );
    }
  }

  // Additional helper methods for the frontend

  async checkMyAttendance(meetingId: string): Promise<boolean> {
    try {
      const checkStatus = httpsCallable<
        { meetingId: string },
        GoogleSheetsResponse
      >(this.functions, 'checkAttendanceStatus');

      const result = await checkStatus({ meetingId });

      if (!result.data.success) {
        console.warn('Failed to check my attendance status:', result.data.message);
        return false;
      }

      return result.data.hasAttended || false;
    } catch (error) {
      console.error('Error checking my attendance status:', error);
      return false;
    }
  }

  async getAttendanceStats(meetingId: string): Promise<{
    totalAttendees: number;
    attendanceData: AttendanceRecord[];
  }> {
    try {
      const getRecords = httpsCallable<
        { meetingId: string },
        GoogleSheetsResponse
      >(this.functions, 'getAttendanceRecords');

      const result = await getRecords({ meetingId });

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to get attendance stats');
      }

      const attendanceData = result.data.data || [];

      return {
        totalAttendees: attendanceData.length,
        attendanceData
      };
    } catch (error) {
      console.error('Error getting attendance stats:', error);
      return {
        totalAttendees: 0,
        attendanceData: []
      };
    }
  }
}

export const googleSheetsService = new GoogleSheetsServiceFirebase();