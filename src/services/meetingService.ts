import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  Meeting,
  Attendance,
  AttendanceRecord,
  QRValidationResponse,
  MeetingListResponse,
  AttendanceListResponse,
} from '../types/attendance';
import {
  generateQRToken,
  generateQRCode,
  parseQRCodeData,
  validateMeetingToken,
  isWithinValidTimeWindow,
} from '../utils/qrCodeUtils';
import { googleSheetsService } from './googleSheetsService.firebase';

class MeetingService {
  private readonly MEETINGS_COLLECTION = 'meetings';
  private readonly ATTENDANCE_COLLECTION = 'attendance';

  // Helper method to clean objects for Firebase (remove undefined values)
  private cleanObjectForFirebase(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObjectForFirebase(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          // Convert empty strings to null for optional fields
          if (value === '' && ['description', 'endTime', 'location'].includes(key)) {
            cleaned[key] = null;
          } else {
            cleaned[key] = this.cleanObjectForFirebase(value);
          }
        }
      }
      return cleaned;
    }

    return obj;
  }

  async createMeeting(meetingData: Omit<Meeting, 'id' | 'qrCode' | 'qrToken' | 'createdAt' | 'updatedAt'>): Promise<Meeting> {
    try {
      // Clean the data by removing undefined values
      const cleanMeetingData = this.cleanObjectForFirebase(meetingData);

      // Log the data being saved for debugging
      console.log('Meeting data to save:', cleanMeetingData);

      // Generate QR token and code
      const qrToken = generateQRToken();
      const tempMeetingId = 'temp_' + Date.now(); // Temporary ID for QR generation
      const qrCode = await generateQRCode(tempMeetingId, qrToken);

      const now = new Date().toISOString();
      const meetingWithQR: Omit<Meeting, 'id'> = {
        ...cleanMeetingData,
        qrCode,
        qrToken,
        createdAt: now,
        updatedAt: now,
      };

      // Log the final data for debugging
      console.log('Final meeting data with QR:', meetingWithQR);

      // Save to Firestore
      const docRef = await addDoc(collection(db, this.MEETINGS_COLLECTION), meetingWithQR);

      // Update QR code with actual meeting ID
      const actualQrCode = await generateQRCode(docRef.id, qrToken);
      await updateDoc(docRef, { qrCode: actualQrCode });

      const savedMeeting: Meeting = {
        id: docRef.id,
        ...meetingWithQR,
        qrCode: actualQrCode,
      };

      // Create Google Sheet for this meeting (optional - will work without it)
      try {
        await googleSheetsService.createSheetForMeeting(savedMeeting);
        console.log('Google Sheet created successfully for meeting');
      } catch (error) {
        console.warn('Google Sheets integration not available yet:', error);
        console.log('Meeting created successfully without Google Sheets integration');
      }

      return savedMeeting;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw new Error('Failed to create meeting');
    }
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Remove read-only fields
      delete updateData.id;
      delete updateData.createdAt;

      // Clean the data by removing undefined values
      const cleanUpdateData = this.cleanObjectForFirebase(updateData);

      await updateDoc(doc(db, this.MEETINGS_COLLECTION, meetingId), cleanUpdateData);
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw new Error('Failed to update meeting');
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.MEETINGS_COLLECTION, meetingId));
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw new Error('Failed to delete meeting');
    }
  }

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    try {
      const docSnap = await getDoc(doc(db, this.MEETINGS_COLLECTION, meetingId));
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Meeting;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw new Error('Failed to fetch meeting');
    }
  }

  async getMeetings(limit?: number): Promise<MeetingListResponse> {
    try {
      let q = query(
        collection(db, this.MEETINGS_COLLECTION),
        orderBy('date', 'desc')
      );

      if (limit) {
        q = query(q);
      }

      const querySnapshot = await getDocs(q);
      const meetings: Meeting[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Meeting[];

      return {
        meetings,
        total: meetings.length,
      };
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw new Error('Failed to fetch meetings');
    }
  }

  async getActiveMeetings(): Promise<Meeting[]> {
    try {
      const q = query(
        collection(db, this.MEETINGS_COLLECTION),
        where('isActive', '==', true),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Meeting[];
    } catch (error) {
      console.error('Error fetching active meetings:', error);
      throw new Error('Failed to fetch active meetings');
    }
  }

  async validateQRCode(qrData: string, memberId: string): Promise<QRValidationResponse> {
    try {
      const parsedData = parseQRCodeData(qrData);
      if (!parsedData) {
        return { valid: false, error: 'Invalid QR code format' };
      }

      const meeting = await this.getMeeting(parsedData.meetingId);
      if (!meeting) {
        return { valid: false, error: 'Meeting not found' };
      }

      if (!meeting.isActive) {
        return { valid: false, error: 'Meeting is not active' };
      }

      // Validate token
      if (!validateMeetingToken(meeting.qrToken || '', parsedData.token)) {
        return { valid: false, error: 'Invalid meeting token' };
      }

      // Check time window
      if (!isWithinValidTimeWindow(meeting.date, meeting.startTime, meeting.endTime)) {
        return { valid: false, error: 'Check-in time window has expired' };
      }

      // Check if member already attended (check Firestore first for speed)
      const firestoreAttendanceQuery = query(
        collection(db, this.ATTENDANCE_COLLECTION),
        where('meetingId', '==', meeting.id),
        where('memberId', '==', memberId)
      );
      const firestoreCheck = await getDocs(firestoreAttendanceQuery);

      if (!firestoreCheck.empty) {
        return { valid: false, alreadyAttended: true, error: 'You have already checked in for this meeting' };
      }

      // Also check Google Sheets if available (optional)
      try {
        const sheetsAlreadyAttended = await googleSheetsService.hasUserAttended(
          meeting.id,
          memberId,
          meeting
        );

        if (sheetsAlreadyAttended) {
          return { valid: false, alreadyAttended: true, error: 'You have already checked in for this meeting' };
        }
      } catch (error) {
        console.warn('Could not check Google Sheets for duplicate attendance:', error);
      }

      return { valid: true, meeting };
    } catch (error) {
      console.error('Error validating QR code:', error);
      return { valid: false, error: 'Failed to validate QR code' };
    }
  }

  async submitAttendance(
    meetingId: string,
    memberId: string,
    memberName: string,
    responses: Record<string, any>
  ): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      // Check if already attended (check both Firestore and Google Sheets)
      // First check Firestore for faster response
      const firestoreAttendanceQuery = query(
        collection(db, this.ATTENDANCE_COLLECTION),
        where('meetingId', '==', meetingId),
        where('memberId', '==', memberId)
      );
      const firestoreCheck = await getDocs(firestoreAttendanceQuery);

      if (!firestoreCheck.empty) {
        throw new Error('Attendance already submitted for this meeting');
      }

      // Also check Google Sheets if available
      try {
        const sheetsAlreadyAttended = await googleSheetsService.hasUserAttended(
          meetingId,
          memberId,
          meeting
        );

        if (sheetsAlreadyAttended) {
          throw new Error('Attendance already submitted for this meeting');
        }
      } catch (error) {
        console.warn('Could not check Google Sheets attendance, using Firestore only:', error);
      }

      const now = new Date().toISOString();

      // Save to Firestore
      const attendance: Omit<Attendance, 'id'> = {
        meetingId,
        memberId,
        memberName,
        responses: Object.entries(responses).map(([questionId, answer]) => ({
          questionId,
          answer,
        })),
        submittedAt: now,
      };

      // Clean the attendance data
      const cleanAttendance = this.cleanObjectForFirebase(attendance);

      await addDoc(collection(db, this.ATTENDANCE_COLLECTION), cleanAttendance);

      // Save to Google Sheets (optional - will work without it)
      try {
        const attendanceRecord: AttendanceRecord = {
          memberId,
          memberName,
          meetingId,
          meetingDate: meeting.date,
          responses,
          submissionTimestamp: now,
        };

        await googleSheetsService.recordAttendance(meeting, attendanceRecord);
        console.log('Attendance recorded in Google Sheets successfully');
      } catch (error) {
        console.warn('Google Sheets integration not available for attendance:', error);
        console.log('Attendance recorded successfully in Firestore');
      }

    } catch (error) {
      console.error('Error submitting attendance:', error);
      throw error;
    }
  }

  async getAttendanceForMeeting(meetingId: string): Promise<AttendanceListResponse> {
    try {
      const q = query(
        collection(db, this.ATTENDANCE_COLLECTION),
        where('meetingId', '==', meetingId),
        orderBy('submittedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const attendances: Attendance[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];

      return {
        attendances,
        total: attendances.length,
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw new Error('Failed to fetch attendance records');
    }
  }

  async getMemberAttendance(memberId: string): Promise<Attendance[]> {
    try {
      const q = query(
        collection(db, this.ATTENDANCE_COLLECTION),
        where('memberId', '==', memberId),
        orderBy('submittedAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
    } catch (error) {
      console.error('Error fetching member attendance:', error);
      throw new Error('Failed to fetch member attendance');
    }
  }

  async regenerateQRCode(meetingId: string): Promise<string> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      const newToken = generateQRToken();
      const newQRCode = await generateQRCode(meetingId, newToken);

      await this.updateMeeting(meetingId, {
        qrToken: newToken,
        qrCode: newQRCode,
      });

      return newQRCode;
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      throw new Error('Failed to regenerate QR code');
    }
  }

  async toggleMeetingStatus(meetingId: string): Promise<void> {
    try {
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) {
        throw new Error('Meeting not found');
      }

      await this.updateMeeting(meetingId, {
        isActive: !meeting.isActive,
      });
    } catch (error) {
      console.error('Error toggling meeting status:', error);
      throw new Error('Failed to toggle meeting status');
    }
  }
}

export const meetingService = new MeetingService();