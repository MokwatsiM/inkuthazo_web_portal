# Google Sheets Backend Integration Setup

This guide will help you set up the complete Google Sheets integration for the attendance tracking system using Firebase Functions.

## Prerequisites

1. **Google Cloud Project** with Google Sheets API enabled
2. **Service Account** with Google Sheets permissions
3. **Google Spreadsheet** shared with the service account
4. **Firebase Functions** configured and deployed

## Step 1: Google Cloud Setup

### 1.1 Create/Configure Google Cloud Project

```bash
# Go to Google Cloud Console
open https://console.cloud.google.com/

# Create a new project or select existing one
# Enable the following APIs:
# - Google Sheets API
# - Google Drive API (for sheet creation)
```

### 1.2 Create Service Account

```bash
# In Google Cloud Console:
# 1. Go to IAM & Admin → Service Accounts
# 2. Click "Create Service Account"
# 3. Fill in details:
#    - Name: "attendance-sheets-service"
#    - Description: "Service account for attendance tracking Google Sheets"
# 4. Click "Create and Continue"
# 5. Grant roles:
#    - Editor (or custom role with sheets permissions)
# 6. Click "Done"
```

### 1.3 Generate Service Account Key

```bash
# 1. Click on the created service account
# 2. Go to "Keys" tab
# 3. Click "Add Key" → "Create new key"
# 4. Select "JSON" format
# 5. Download the JSON file
# 6. Keep this file secure - DO NOT commit to version control
```

## Step 2: Google Spreadsheet Setup

### 2.1 Create Master Spreadsheet

```bash
# 1. Go to Google Sheets
# 2. Create a new spreadsheet
# 3. Name it: "Inkuthazo Attendance Tracking"
# 4. Copy the spreadsheet ID from the URL:
#    https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

### 2.2 Share with Service Account

```bash
# 1. Click "Share" button in Google Sheets
# 2. Add the service account email (from JSON file: client_email)
# 3. Give "Editor" permissions
# 4. Uncheck "Notify people"
# 5. Click "Share"
```

## Step 3: Firebase Functions Configuration

### 3.1 Set Firebase Functions Config

Extract values from your service account JSON file and run these commands:

```bash
# Navigate to your project directory
cd /path/to/your/project

# Set Google Cloud configuration
firebase functions:config:set google.project_id="YOUR_PROJECT_ID"
firebase functions:config:set google.private_key_id="YOUR_PRIVATE_KEY_ID"
firebase functions:config:set google.private_key="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
firebase functions:config:set google.client_email="YOUR_SERVICE_ACCOUNT_EMAIL"
firebase functions:config:set google.client_id="YOUR_CLIENT_ID"
firebase functions:config:set google.client_cert_url="YOUR_CLIENT_CERT_URL"
firebase functions:config:set google.sheets_id="YOUR_SPREADSHEET_ID"

# Verify configuration
firebase functions:config:get
```

### 3.2 Configure Using Your Actual Credentials

Based on your `.env.example` file, run these commands:

```bash
# Set the actual configuration values
firebase functions:config:set google.project_id="inkuthazo-a0ac7"
firebase functions:config:set google.private_key_id="a54062658837cf54bd2d4c28bb1b02f65aea5966"
firebase functions:config:set google.private_key="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDOTBpn3R8gxkop\n-----END PRIVATE KEY-----\n"
firebase functions:config:set google.client_email="google-sheet-int@inkuthazo-a0ac7.iam.gserviceaccount.com"
firebase functions:config:set google.client_id="106186996188897190315"
firebase functions:config:set google.client_cert_url="https://www.googleapis.com/robot/v1/metadata/x509/google-sheet-int%40inkuthazo-a0ac7.iam.gserviceaccount.com"
firebase functions:config:set google.sheets_id="1eEaHddvKAwJ67cYedbzJH7lc6GAF-nE4Bu8wOd51cjE"
```

## Step 4: Build and Deploy

### 4.1 Build Firebase Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if not already done)
npm install

# Build TypeScript
npm run build

# Test locally (optional)
npm run serve
```

### 4.2 Deploy Functions

```bash
# Deploy Firebase Functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createAttendanceSheet,functions:recordAttendanceInSheets,functions:getAttendanceRecords,functions:checkAttendanceStatus,functions:exportAttendanceData
```

## Step 5: Verify Setup

### 5.1 Test Function Deployment

```bash
# Check functions are deployed
firebase functions:list

# Check logs
firebase functions:log
```

### 5.2 Test in Application

1. **Create a Meeting**:
   - Log in as admin
   - Go to Meetings page
   - Create a new meeting with questionnaire
   - Verify no errors in console

2. **Test QR Attendance**:
   - Generate QR code for the meeting
   - Scan QR code as a member
   - Submit attendance form
   - Check Google Sheets for new data

3. **Verify Google Sheets**:
   - Open your master spreadsheet
   - Look for new sheet tab with meeting data
   - Verify attendance data is recorded

## Step 6: Security Best Practices

### 6.1 Firestore Security Rules

Ensure your Firestore rules are updated (already done in previous steps):

```javascript
// Meetings collection rules
match /meetings/{meetingId} {
  allow read: if isSignedIn();
  allow create: if isAdmin();
  allow update: if isAdmin();
  allow delete: if isAdmin();
}

// Attendance collection rules
match /attendance/{attendanceId} {
  allow read: if isAdmin() || (isSignedIn() && resource.data.memberId == request.auth.uid);
  allow create: if isSignedIn() && request.resource.data.memberId == request.auth.uid;
  allow update: if isAdmin();
  allow delete: if isAdmin();
}
```

### 6.2 Functions Security

The Firebase Functions include built-in security:
- Authentication verification
- Role-based access control
- Input validation
- Error handling

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Function Performance

```bash
# View function logs
firebase functions:log

# Monitor in Firebase Console
open https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

### 7.2 Set Up Alerts

1. Go to Firebase Console → Functions
2. Set up error alerts
3. Monitor execution times
4. Set budget alerts for Cloud Functions usage

## Step 8: Troubleshooting

### Common Issues

1. **"Service account not found"**:
   - Verify service account email is correct
   - Check if service account has proper permissions

2. **"Spreadsheet not found"**:
   - Verify spreadsheet ID is correct
   - Ensure service account has access to spreadsheet

3. **"Insufficient permissions"**:
   - Check Firestore security rules
   - Verify user role in database

4. **"Function timeout"**:
   - Check network connectivity
   - Verify Google Sheets API quotas

### Debug Commands

```bash
# Check function configuration
firebase functions:config:get

# View detailed logs
firebase functions:log --limit 50

# Test functions locally
cd functions && npm run serve

# Check function status
firebase functions:list
```

## API Endpoints Reference

Once deployed, your functions will be available at:

```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/FUNCTION_NAME
```

### Available Functions:

1. **createAttendanceSheet**
   - Creates Google Sheet for meeting
   - Admin only

2. **recordAttendanceInSheets**
   - Records member attendance
   - Member can only submit for themselves

3. **getAttendanceRecords**
   - Gets all attendance for a meeting
   - Admin only

4. **checkAttendanceStatus**
   - Checks if member attended meeting
   - Member can check own status, admin can check any

5. **exportAttendanceData**
   - Exports attendance with shareable link
   - Admin only

## Success Criteria

✅ Firebase Functions deployed successfully
✅ Google Sheets service account configured
✅ Spreadsheet accessible and shared
✅ Functions can create sheets automatically
✅ Attendance data recorded in real-time
✅ Admin can export and view data
✅ Security rules properly configured
✅ Error handling and logging working

Your Google Sheets integration is now fully functional! 🎉