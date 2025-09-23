# QR Code Attendance Tracking System

A comprehensive meeting attendance system with QR code scanning and Google Sheets integration for the Inkuthazo Burial Society Portal.

## Features Overview

### Admin Features
- **Meeting Management**: Create, edit, and delete meetings with custom questionnaires
- **QR Code Generation**: Automatic QR code creation for each meeting
- **Real-time Control**: Activate/deactivate meetings instantly
- **Questionnaire Builder**: Dynamic form builder with multiple question types
- **Attendance Analytics**: View and export attendance data
- **Google Sheets Integration**: Automatic data export to spreadsheets

### Member Features
- **QR Code Scanning**: Camera-based QR code scanning for quick check-ins
- **Dynamic Forms**: Complete custom questionnaires for each meeting
- **Attendance History**: View personal attendance records
- **Real-time Validation**: Prevent duplicate submissions and expired QR codes

## File Structure

```
src/
├── components/
│   ├── attendance/
│   │   ├── QRScanner.tsx              # QR code scanner component
│   │   └── AttendanceForm.tsx         # Dynamic attendance form
│   └── meetings/
│       ├── QuestionnaireBuilder.tsx   # Form builder for admins
│       └── CreateMeetingModal.tsx     # Meeting creation/editing modal
├── pages/
│   ├── Meetings.tsx                   # Admin meeting management
│   └── Attendance.tsx                 # Member attendance interface
├── services/
│   ├── meetingService.ts              # Meeting CRUD operations
│   ├── googleSheetsService.browser.ts # Google Sheets integration
│   └── googleSheetsService.ts         # Server-side Google Sheets (reference)
├── types/
│   ├── meeting.ts                     # Meeting and questionnaire types
│   └── attendance.ts                  # Attendance-related types
└── utils/
    └── qrCodeUtils.ts                 # QR code generation and validation
```

## Installation & Setup

### 1. Install Dependencies

The required packages are already installed:
- `qrcode` - QR code generation
- `qr-scanner` - QR code scanning
- `react-qr-scanner` - React QR scanner component
- `googleapis` - Google Sheets API
- `uuid` - Unique ID generation

### 2. Firebase Configuration

The system uses your existing Firebase setup for:
- Meeting storage (`meetings` collection)
- Attendance records (`attendance` collection)
- User authentication and authorization

### 3. Google Sheets Setup (Optional but Recommended)

For production use, set up Google Sheets integration:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable Google Sheets API
   - Enable Google Drive API (for sheet creation)

3. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download JSON key file

4. **Create Spreadsheet**
   - Create a new Google Spreadsheet
   - Share with service account email (Editor permissions)
   - Copy spreadsheet ID from URL

5. **Environment Variables**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local

   # Fill in your Google credentials
   VITE_GOOGLE_PROJECT_ID=your-project-id
   VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   VITE_GOOGLE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
   VITE_GOOGLE_SHEETS_ID=your-spreadsheet-id
   ```

## Usage Guide

### For Administrators

#### Creating a Meeting
1. Navigate to **Meetings** in the admin panel
2. Click **Create Meeting**
3. Fill in meeting details:
   - Title, description, date, time
   - Location (optional)
   - Meeting status (active/inactive)
4. Build questionnaire:
   - Add questions with different types
   - Set required/optional fields
   - Configure options for choice questions
5. Save meeting → QR code is automatically generated

#### Managing Meetings
- **View all meetings** with status indicators
- **Download QR codes** for printing or digital sharing
- **Regenerate QR codes** if needed
- **Toggle meeting status** (active/inactive)
- **View attendance data** in real-time
- **Export to Google Sheets** automatically

#### Question Types Available
- **Short Text**: Single-line text input
- **Long Text**: Multi-line textarea
- **Number**: Numeric input with validation
- **Single Choice**: Radio buttons
- **Multiple Choice**: Checkboxes
- **Yes/No**: Simple boolean choice
- **Rating**: Star rating system (1-10 scale)

### For Members

#### Marking Attendance
1. Navigate to **Attendance** in the member portal
2. Click **Scan QR Code**
3. Allow camera permissions
4. Point camera at the QR code
5. Fill out the attendance form
6. Submit attendance

#### Viewing Attendance History
- See all attended meetings
- View submission timestamps
- Access meeting details

## Security Features

### QR Code Security
- **Time-based validation**: QR codes expire after 24 hours
- **Meeting window validation**: Check-in only during specified times
- **Token-based authentication**: Each QR contains unique validation token
- **Duplicate prevention**: One submission per member per meeting

### Access Control
- **Role-based access**: Admins manage, members attend
- **Authentication required**: Must be logged in to scan QR codes
- **Meeting validation**: Only active meetings accept attendance

## Data Storage

### Firebase Collections

#### Meetings Collection
```javascript
{
  id: "meeting_id",
  title: "Monthly General Meeting",
  description: "Discussion of burial society matters",
  date: "2024-01-15",
  startTime: "10:00",
  endTime: "12:00",
  location: "Community Hall",
  isActive: true,
  qrCode: "data:image/png;base64...", // Base64 QR code
  qrToken: "unique-validation-token",
  questionnaire: {
    id: "questionnaire_id",
    title: "Meeting Attendance Form",
    questions: [
      {
        id: "question_id",
        text: "How did you travel to the meeting?",
        type: "single_select",
        required: true,
        options: [
          { id: "opt1", label: "Car", value: "car" },
          { id: "opt2", label: "Bus", value: "bus" }
        ]
      }
    ]
  },
  createdBy: "admin_user_id",
  createdAt: "2024-01-10T10:00:00Z",
  updatedAt: "2024-01-10T10:00:00Z"
}
```

#### Attendance Collection
```javascript
{
  id: "attendance_id",
  meetingId: "meeting_id",
  memberId: "member_id",
  memberName: "John Doe",
  responses: [
    {
      questionId: "question_id",
      answer: "car"
    }
  ],
  submittedAt: "2024-01-15T10:30:00Z"
}
```

### Google Sheets Structure

Each meeting creates a new sheet with columns:
- Member ID
- Member Name
- Meeting ID
- Meeting Date
- Submission Timestamp
- [Dynamic columns for each question]

## API Integration

The system includes browser-compatible Google Sheets service that works with a backend API. For production deployment, implement these endpoints:

```typescript
// Backend API endpoints needed:
POST /api/google-sheets/create-sheet
POST /api/google-sheets/record-attendance
GET  /api/google-sheets/get-attendance/:meetingId
GET  /api/google-sheets/check-attendance/:meetingId/:memberId
```

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Test on different devices

2. **QR code not scanning**
   - Ensure good lighting
   - Check QR code quality
   - Verify meeting is active

3. **Google Sheets errors**
   - Check service account permissions
   - Verify spreadsheet sharing
   - Confirm API keys are correct

4. **Build errors**
   - The system uses browser-compatible Google Sheets service
   - Server-side integration should be implemented separately

## Future Enhancements

### Planned Features
- **Offline support**: Cache meetings for offline scanning
- **Bulk operations**: Mass import/export of meetings
- **Advanced analytics**: Attendance trends and insights
- **Mobile app**: Dedicated mobile app for better QR scanning
- **Notification system**: Automated reminders and confirmations

### Integration Opportunities
- **SMS notifications**: Meeting reminders via SMS
- **Email integration**: Automated attendance reports
- **Calendar sync**: Import meetings to calendar apps
- **Report generation**: Advanced PDF reports

## Technical Notes

### Performance Considerations
- QR codes are generated once and cached
- Large bundles due to QR scanning libraries
- Consider code splitting for production
- Optimize image sizes for QR codes

### Browser Compatibility
- Requires modern browsers with camera support
- WebRTC required for QR scanning
- Progressive Web App compatible

### Security Best Practices
- Never expose Google service account keys in frontend
- Use backend proxy for Google Sheets operations
- Implement rate limiting for QR scans
- Regular security audits recommended

## Support

For technical support or feature requests, please check the main project documentation or contact the development team.