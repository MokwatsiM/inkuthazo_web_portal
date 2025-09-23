import { google } from 'googleapis';
import type { AttendanceRecord, Meeting, Question } from '../types/attendance';

// Note: In a real implementation, these credentials should be stored securely
// as environment variables or in a secure configuration
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
    // This should be configured from environment variables
    this.spreadsheetId = process.env.VITE_GOOGLE_SHEETS_ID || '';
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Get credentials from environment or secure storage
      const credentials: GoogleSheetsConfig = {
        type: "service_account",
        project_id: process.env.VITE_GOOGLE_PROJECT_ID || '',
        private_key_id: process.env.VITE_GOOGLE_PRIVATE_KEY_ID || '',
        private_key: (process.env.VITE_GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        client_email: process.env.VITE_GOOGLE_CLIENT_EMAIL || '',
        client_id: process.env.VITE_GOOGLE_CLIENT_ID || '',
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.VITE_GOOGLE_CLIENT_CERT_URL || ''
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets service:', error);
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
        return sheetName; // Sheet already exists
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
                    columnCount: headers.length + 5, // Extra columns for future use
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

      return sheetName;
    } catch (error) {
      console.error('Error creating sheet for meeting:', error);
      throw new Error('Failed to create Google Sheet for meeting');
    }
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
        range: `${sheetName}!A:E`, // Member ID is in column A
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

    } catch (error) {
      console.error('Error recording attendance:', error);
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

      const headers = rows[0];
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
      console.error('Error fetching attendance records:', error);
      return [];
    }
  }

  async hasUserAttended(meetingId: string, memberId: string, meeting: Meeting): Promise<boolean> {
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
      console.error('Error checking attendance:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();