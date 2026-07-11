Attendance Feature Enhancements - Implementation Plan
Current State
The QR attendance feature is fully functional with:

Admin: Create sessions, generate QR codes, view attendees, export CSV
Member: Scan QR codes, view attendance history
Security: Firebase rules protect all operations
Proposed Enhancements
Priority 1: High Value, Low Effort
1. Link Sessions to Calendar Events
Connect attendance sessions to existing calendar events for better organization.

Changes:

Add event selector in 
CreateSessionModal
Auto-populate meeting title/date from selected event
Show linked event details on session cards
Effort: ~2 hours

2. Attendance Statistics on Admin Dashboard
Add attendance metrics to the main dashboard.

Changes:

Create AttendanceStats component with:
Total check-ins this month
Average attendance per meeting
Top attended meetings
Add widget to Dashboard page
Effort: ~3 hours

3. QR Code Session Extension
Allow admins to extend expiring sessions without creating new QR codes.

Changes:

Add "Extend" button on 
AttendanceSessionCard
Update attendanceService with extendSession() function
Modal to select new expiry time
Effort: ~1.5 hours

Priority 2: Medium Value, Medium Effort
4. Real-time Check-in Updates
Show live attendance count without page refresh.

Changes:

Use Firestore onSnapshot for real-time listener
Add animated counter/notification when new check-in occurs
Optional sound notification for admins
Effort: ~3 hours

5. Attendance Reports Integration
Include attendance data in existing reports.

Changes:

Add "Attendance Report" tab in Reports page
Report filters: date range, member, meeting
Summary: attendance rate per member
Export to PDF/CSV
Effort: ~4 hours

6. Late Arrival Tracking
Track when members arrive after meeting start time.

Changes:

Add is_late field to attendance records
Compare check-in time vs meeting start time
Show late arrivals with different indicator
Include in reports
Effort: ~2 hours

Priority 3: Nice to Have
7. Session Templates
Save and reuse session configurations for recurring meetings.

Changes:

New session_templates Firestore collection
"Save as Template" option when creating sessions
Template selector in create modal
Effort: ~3 hours

8. Email Notifications
Send notifications when members check in (optional setting).

Changes:

Cloud Function to send emails
Admin notification preferences
Email templates for check-in alerts
Effort: ~4 hours (requires Cloud Functions)

9. Bulk Manual Entry
Allow admins to manually add attendance for members without phones.

Changes:

"Add Manual Entry" button on session detail
Member search/select dropdown
Record with check_in_method: "manual"
Effort: ~2 hours

Recommended Implementation Order
Phase	Enhancement	Effort
1	Calendar Integration	2h
1	QR Extension	1.5h
2	Dashboard Statistics	3h
2	Late Tracking	2h
3	Real-time Updates	3h
4	Reports Integration	4h
5	Templates & Manual Entry	5h
6	Email Notifications	4h
Total Estimated Effort: ~24.5 hours

Questions for Review
Which enhancements would you like to prioritize?
Is email notification important for your use case?
Should attendance data be integrated into member profiles?