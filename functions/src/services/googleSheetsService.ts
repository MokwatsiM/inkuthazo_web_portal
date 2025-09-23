import { google } from 'googleapis';
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

// Types for our attendance system
interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: Array<{ id: string; label: string; value: string }>;
  maxRating?: number;
  placeholder?: string;
}

interface Questionnaire {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  questionnaire: Questionnaire;
  qrCode?: string;
  qrToken?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendanceRecord {
  memberId: string;
  memberName: string;
  meetingId: string;
  meetingDate: string;
  responses: Record<string, any>;
  submissionTimestamp: string;
}

interface GoogleSheetsConfig {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;
  private isInitialized = false;

  constructor() {
    this.spreadsheetId = functions.config().google?.sheets_id || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get credentials from Firebase Functions config
      const googleConfig = functions.config().google;

      if (!googleConfig || !googleConfig.private_key || !googleConfig.client_email) {
        throw new Error('Google Sheets configuration not found. Please set Firebase Functions config.');
      }

      const credentials: GoogleSheetsConfig = {
        type: 'service_account',
        project_id: googleConfig.project_id,
        private_key_id: googleConfig.private_key_id,
        private_key: googleConfig.private_key.replace(/\\n/g, '\n'),
        client_email: googleConfig.client_email,
        client_id: googleConfig.client_id,
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: googleConfig.client_cert_url
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;

      functions.logger.info('Google Sheets service initialized successfully');
    } catch (error) {
      functions.logger.error('Failed to initialize Google Sheets service:', error);
      throw new Error('Google Sheets service initialization failed');
    }
  }

  private generateSheetName(meeting: Meeting): string {
    const date = new Date(meeting.date);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const cleanTitle = meeting.title.replace(/[^\w\s-]/g, '').substring(0, 30);
    return `${dateStr}_${cleanTitle}`;
  }

  private generateHeaders(questions: Question[]): string[] {
    const baseHeaders = [
      'Member ID',
      'Member Name',
      'Meeting ID',
      'Meeting Date',
      'Submission Timestamp'
    ];

    const questionHeaders = questions.map(q =>
      q.text.replace(/[^\w\s-]/g, '').substring(0, 50)
    );

    return [...baseHeaders, ...questionHeaders];
  }

  async createSheetForMeeting(meeting: Meeting): Promise<string> {
    await this.initialize();

    const sheetName = this.generateSheetName(meeting);
    const headers = this.generateHeaders(meeting.questionnaire.questions);

    try {
      // Check if sheet already exists
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });

      const existingSheet = response.data.sheets?.find(
        (sheet: any) => sheet.properties.title === sheetName
      );

      if (existingSheet) {
        functions.logger.info(`Sheet ${sheetName} already exists`);
        return sheetName;
      }

      // Create new sheet
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: headers.length + 5,
                  },
                },
              },
            },
          ],
        },
      });

      // Add headers to the new sheet
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });

      // Format headers
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: (await this.getSheetId(sheetName)),
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers.length,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                    textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });

      functions.logger.info(`Created sheet ${sheetName} successfully`);
      return sheetName;
    } catch (error) {
      functions.logger.error('Error creating sheet for meeting:', error);
      throw new Error(`Failed to create Google Sheet for meeting: ${(error as Error).message}`);
    }
  }

  private async getSheetId(sheetName: string): Promise<number> {
    const response = await this.sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
    });

    const sheet = response.data.sheets?.find(
      (sheet: any) => sheet.properties.title === sheetName
    );

    return sheet?.properties?.sheetId || 0;
  }

  async recordAttendance(meeting: Meeting, attendance: AttendanceRecord): Promise<void> {
    await this.initialize();

    const sheetName = this.generateSheetName(meeting);

    try {
      // Ensure sheet exists
      await this.createSheetForMeeting(meeting);

      // Check for duplicate attendance
      const existingData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:E`,
      });

      const rows = existingData.data.values || [];
      const memberExists = rows.some((row: string[]) =>
        row[0] === attendance.memberId && row[2] === attendance.meetingId
      );

      if (memberExists) {
        throw new Error('Member has already submitted attendance for this meeting');
      }

      // Prepare row data
      const rowData = [
        attendance.memberId,
        attendance.memberName,
        attendance.meetingId,
        attendance.meetingDate,
        attendance.submissionTimestamp,
      ];

      // Add responses in the order of questions
      meeting.questionnaire.questions.forEach(question => {
        const response = attendance.responses[question.id];
        rowData.push(Array.isArray(response) ? response.join(', ') : String(response || ''));
      });

      // Append to sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rowData],
        },
      });

      functions.logger.info(`Recorded attendance for member ${attendance.memberId} in meeting ${meeting.id}`);
    } catch (error) {
      functions.logger.error('Error recording attendance:', error);
      throw error;
    }
  }

  async getAttendanceRecords(meeting: Meeting): Promise<AttendanceRecord[]> {
    await this.initialize();

    const sheetName = this.generateSheetName(meeting);

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:Z`,
      });

      const rows = response.data.values || [];
      if (rows.length <= 1) return []; // No data or only headers

      const dataRows = rows.slice(1);

      return dataRows.map((row: string[]) => {
        const responses: Record<string, any> = {};

        // Map question responses
        meeting.questionnaire.questions.forEach((question, index) => {
          const responseIndex = 5 + index; // Skip base columns
          responses[question.id] = row[responseIndex] || '';
        });

        return {
          memberId: row[0],
          memberName: row[1],
          meetingId: row[2],
          meetingDate: row[3],
          submissionTimestamp: row[4],
          responses,
        };
      });
    } catch (error) {
      functions.logger.error('Error fetching attendance records:', error);
      return [];
    }
  }

  async hasUserAttended(meetingId: string, memberId: string, meeting: Meeting): Promise<boolean> {
    await this.initialize();

    const sheetName = this.generateSheetName(meeting);

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A:C`,
      });

      const rows = response.data.values || [];
      return rows.some((row: string[]) =>
        row[0] === memberId && row[2] === meetingId
      );
    } catch (error) {
      functions.logger.error('Error checking attendance:', error);
      return false;
    }
  }

  async exportAttendanceData(meetingId: string): Promise<{ sheetUrl: string; data: any[] }> {
    await this.initialize();

    try {
      // Get meeting data from Firestore
      const db = getFirestore();
      const meetingDoc = await db.collection('meetings').doc(meetingId).get();

      if (!meetingDoc.exists) {
        throw new Error('Meeting not found');
      }

      const meeting = { id: meetingDoc.id, ...meetingDoc.data() } as Meeting;
      const sheetName = this.generateSheetName(meeting);

      // Get attendance data
      const attendanceData = await this.getAttendanceRecords(meeting);

      // Generate shareable URL
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/edit#gid=${await this.getSheetId(sheetName)}`;

      return {
        sheetUrl,
        data: attendanceData
      };
    } catch (error) {
      functions.logger.error('Error exporting attendance data:', error);
      throw error;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();