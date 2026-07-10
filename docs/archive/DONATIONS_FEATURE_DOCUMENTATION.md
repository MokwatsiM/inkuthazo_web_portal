# Donations & Investments Feature - Complete Documentation

## Overview

The Donations & Investments feature is a comprehensive income tracking system that enables the Inkuthazo Social Club to track income from sources other than monthly member contributions. This includes donations, investments, sponsorships, grants, and other forms of income from both members and external parties.

**Key Principle:** Donations from members do NOT count towards their monthly contribution requirements. They are tracked separately as additional income to the society.

## Feature Summary

### What's New
- **Separate Income Tracking**: Track donations/investments independently from monthly contributions
- **Multiple Donor Types**: Support for members, outsiders, and organizations
- **Donation Categories**: Investment, Donation, Sponsorship, Grant, Other
- **Approval Workflow**: Admin review and approval process for all donations
- **Analytics Integration**: Donations are included in financial metrics and fund balance calculations
- **Audit Trail**: Complete logging of all donation operations
- **Receipt Management**: Issue and track donation receipts
- **Bulk Operations**: Bulk approve multiple donations at once

## Database Schema

### Donation Type Definition

Location: [src/types/donation.ts](src/types/donation.ts)

```typescript
export type DonationType = 'investment' | 'donation' | 'sponsorship' | 'grant' | 'other';
export type DonationSource = 'member' | 'outsider' | 'organization';
export type DonationStatus = 'pending' | 'approved' | 'rejected';

export interface Donation {
  id: string;

  // Source information
  source: DonationSource;
  donor_name: string;
  member_id?: string; // Only if source is 'member'
  organization?: string; // For organization donors
  contact_email?: string;
  contact_phone?: string;

  // Donation details
  type: DonationType;
  amount: number;
  date: Timestamp;
  description?: string;
  purpose?: string;

  // Status and approval
  status: DonationStatus;
  proof_of_payment?: string;
  payment_method?: string;
  reference_number?: string;

  // Review information
  review_notes?: string;
  reviewed_by?: string;
  reviewed_at?: Timestamp;

  // Metadata
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;

  // Tax and receipt
  tax_deductible?: boolean;
  receipt_issued?: boolean;
  receipt_number?: string;
}
```

### Firestore Collection

**Collection Name:** `donations`

**Indexes Required:**
```
1. date (ASC), status (ASC)
2. source (ASC), date (ASC)
3. type (ASC), date (ASC)
4. member_id (ASC), date (ASC)
5. status (ASC), date (ASC)
```

## Service Layer

### Donation Service

Location: [src/services/donationService.ts](src/services/donationService.ts)

**Available Functions:**

1. **createDonation(donationData, userId, userName)**
   - Creates a new donation record
   - Sets status to 'pending' by default
   - Logs audit trail

2. **getDonation(donationId)**
   - Retrieves a single donation by ID
   - Returns null if not found

3. **getDonations(filters, limitCount, lastDoc)**
   - Retrieves donations with optional filtering
   - Supports pagination
   - Filters: source, type, status, member_id, date range, amount range

4. **updateDonation(donationId, updates, userId, userName)**
   - Updates donation fields
   - Logs changes to audit trail
   - Updates updated_at timestamp

5. **reviewDonation(donationId, review, userId, userName)**
   - Approve or reject a donation
   - Updates status and review information
   - Logs audit trail

6. **deleteDonation(donationId, userId, userName)**
   - Deletes a donation
   - Logs audit trail

7. **getDonationSummary(startDate, endDate)**
   - Returns comprehensive donation statistics
   - Includes breakdowns by type, source, and status
   - Provides top donors list

8. **getMemberDonations(memberId)**
   - Gets all donations from a specific member
   - Sorted by date descending

9. **issueDonationReceipt(donationId, receiptNumber, userId, userName)**
   - Marks donation as receipt issued
   - Records receipt number
   - Logs audit trail

10. **bulkApproveDonations(donationIds, reviewerId, notes, userId, userName)**
    - Approves multiple donations at once
    - Uses Firestore batch operations
    - Logs audit trail

## User Interface

### Pages

#### 1. Donations Management Page

Location: [src/pages/Donations.tsx](src/pages/Donations.tsx)

**Features:**
- KPI cards showing donation metrics
- Advanced filtering (source, type, status, search)
- Card-based donation display
- Quick actions: View, Approve, Reject, Delete
- Create new donation modal
- View donation details modal

**KPI Metrics:**
- Total Donations (count and amount)
- From Members (count and amount)
- From Organizations (count and amount)
- Pending Review (count and amount)

**Filters:**
- **Search**: By donor name, type, source, description
- **Source**: All, Members, Outsiders, Organizations
- **Type**: All, Investment, Donation, Sponsorship, Grant, Other
- **Status**: All, Pending, Approved, Rejected

**Card Display:**
- Color-coded donation types with icons
- Source indicators
- Status badges
- Amount display
- Action buttons based on status

### Components

#### 1. DonationFormModal

Location: [src/components/donations/DonationFormModal.tsx](src/components/donations/DonationFormModal.tsx)

**Features:**
- Source selection (Member, Outsider, Organization)
- Auto-fill donor details when member is selected
- Donation type and amount input
- Date selection
- Description and purpose fields
- Payment method and reference
- Tax deductible checkbox
- Important note about member donations not counting towards contributions

**Form Fields:**
- **Required**: Source, Donor Name, Type, Amount, Date
- **Optional**: Organization, Contact Email/Phone, Description, Purpose, Payment Method, Reference Number, Tax Deductible

**Validation:**
- Member selection required if source is 'member'
- Organization name required if source is 'organization'
- Amount must be positive
- Date cannot be in the future

#### 2. DonationDetailModal

Location: [src/components/donations/DonationDetailModal.tsx](src/components/donations/DonationDetailModal.tsx)

**Features:**
- Comprehensive donation information display
- Status banner with color coding
- Source information section
- Date and type details
- Contact information (if available)
- Description and purpose
- Payment information
- Receipt information (if issued)
- Review information (if reviewed)
- Important note for member donations

**Sections:**
- Status and Amount (header banner)
- Source Information
- Date and Type Details
- Contact Information
- Description & Purpose
- Payment Information
- Receipt Information
- Review Information

## Navigation Integration

### Admin Menu

Location: [src/components/Layout.tsx](src/components/Layout.tsx)

Added to admin menu between "Expenses" and "Disciplinary":
```typescript
{
  path: "/donations",
  icon: Gift,
  label: "Donations",
  color: "text-purple-500",
}
```

### Landing Page Tile

Location: [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx)

Added to admin navigation tiles between "Expenses" and "Disciplinary":
```typescript
{
  title: 'Donations',
  description: 'Investments & contributions',
  icon: Gift,
  iconBg: 'bg-purple-50 dark:bg-purple-900/50',
  iconColor: 'text-purple-600 dark:text-purple-300',
  badge: null,
  badgeBg: 'bg-purple-50',
  badgeColor: 'text-purple-700',
  link: '/donations',
}
```

### Routing

Location: [src/App.tsx](src/App.tsx)

```typescript
<Route
  path="/donations"
  element={
    <ProtectedRoute>
      <FullScreenLayout>
        <RoleBasedRoute allowedRoles={["admin"]}>
          <Donations />
        </RoleBasedRoute>
      </FullScreenLayout>
    </ProtectedRoute>
  }
/>
```

**Access Control:** Admin only

## Analytics Integration

### Updated Analytics Page

Location: [src/pages/Analytics.tsx](src/pages/Analytics.tsx)

**Changes Made:**

1. **Data Fetching:**
   - Added donations collection query
   - Filters for approved donations only
   - Includes in date range filtering

2. **Metrics Calculation:**
   - Added `totalDonations` metric
   - Added `donationCount` metric
   - Updated fund balance calculation: `contributions + donations - payouts - expenses`

3. **KPI Cards:**
   - Changed grid from 4 to 5 columns
   - Added "Donations & Investments" card with purple gradient
   - Shows total amount and donation count

4. **Cash Flow Chart:**
   - Added "Donations" to the chart keys
   - Purple color for donations (`#a855f7`)
   - Monthly breakdown includes donation amounts
   - Net flow calculation includes donations as income

**Before:**
```typescript
const fundBalance = totalContributions - totalPayouts - totalExpenses;
```

**After:**
```typescript
const fundBalance = totalContributions + totalDonations - totalPayouts - totalExpenses;
```

## Audit Trail

### Audit Log Actions

Added to [src/components/audit/AuditLogVisualizer.tsx](src/components/audit/AuditLogVisualizer.tsx):

```
DONATION_CREATE - When a donation is created
DONATION_UPDATE - When donation details are updated
DONATION_REVIEW - When a donation is approved/rejected
DONATION_DELETE - When a donation is deleted
DONATION_RECEIPT_ISSUED - When a receipt is issued
DONATION_BULK_APPROVE - When multiple donations are bulk approved
```

### Audit Log Details

Each donation operation logs:
- User ID and name
- Action type
- Donation ID
- Donor name
- Amount
- Type and source
- For updates: field changes (old vs new values)
- For reviews: status change and review notes

## Design System

### Colors and Gradients

**Donation Type Colors:**
- Investment: Teal (`from-teal-500 to-teal-600`)
- Donation: Purple (`from-purple-500 to-purple-600`)
- Sponsorship: Blue (`from-blue-500 to-blue-600`)
- Grant: Indigo (`from-indigo-500 to-indigo-600`)
- Other: Gray (`from-gray-500 to-gray-600`)

**Status Colors:**
- Pending: Amber (`bg-amber-100 text-amber-800`)
- Approved: Green (`bg-green-100 text-green-800`)
- Rejected: Red (`bg-red-100 text-red-800`)

**Source Colors:**
- Member: Blue
- Outsider: Purple
- Organization: Teal

### Icons

- **Investment**: `TrendingUp`
- **Donation**: `Gift`
- **Sponsorship**: `Award`
- **Grant**: `Target`
- **Other**: `DollarSign`
- **Member Source**: `Users`
- **Organization Source**: `Building2`

### Modern UI Elements

- Rounded corners: `rounded-[20px]` for cards
- Shadows: `shadow-[0_10px_30px_rgba(0,0,0,0.05)]`
- Hover effects: `hover:shadow-[0_12px_35px_rgba(0,0,0,0.08)]`
- Gradient backgrounds for emphasis
- Color-coded badges and icons
- Smooth transitions

## Use Cases

### 1. Member Makes Additional Donation

**Scenario:** A member wants to donate R500 to the funeral fund as a gift, separate from their monthly contribution.

**Process:**
1. Admin navigates to Donations page
2. Clicks "Add Donation"
3. Selects "Member" as source
4. Selects the member from dropdown (auto-fills name and contact)
5. Enters amount: R500
6. Selects type: "Donation"
7. Adds description: "Additional contribution to funeral fund"
8. Submits form
9. Donation created with status "Pending"
10. Admin reviews and approves
11. Donation appears in analytics, increases fund balance
12. Member's monthly contribution requirement unchanged

### 2. Organization Sponsorship

**Scenario:** Local business sponsors R10,000 for the annual Christmas party.

**Process:**
1. Admin navigates to Donations page
2. Clicks "Add Donation"
3. Selects "Organization" as source
4. Enters organization name: "ABC Supermarket"
5. Enters contact information
6. Amount: R10,000
7. Type: "Sponsorship"
8. Purpose: "Annual Christmas Party 2026"
9. Adds payment reference number
10. Submits and approves
11. Can issue receipt if tax deductible

### 3. Investment Return

**Scenario:** The society receives R2,000 interest from a savings account.

**Process:**
1. Admin creates donation
2. Source: "Outsider" or "Organization" (bank)
3. Type: "Investment"
4. Amount: R2,000
5. Description: "Interest from savings account"
6. Reference: Bank statement number
7. Approve
8. Appears in analytics as additional income

### 4. Grant Award

**Scenario:** The society receives R50,000 grant from local government.

**Process:**
1. Admin creates donation
2. Source: "Organization"
3. Organization: "City Council"
4. Type: "Grant"
5. Amount: R50,000
6. Purpose: "Community Development Program"
7. Add all relevant documentation details
8. Approve
9. Tracked separately in reports

## Important Distinctions

### Donations vs Contributions

| Aspect | Donations | Contributions |
|--------|-----------|---------------|
| **Source** | Members, Outsiders, Organizations | Members only |
| **Purpose** | Additional income, investments, sponsorships | Monthly membership dues |
| **Impact on Member Status** | None | Required for active membership |
| **Approval Required** | Yes | Yes |
| **Tracked Separately** | Yes | Yes |
| **Included in Fund Balance** | Yes | Yes |
| **Required for Members** | No | Yes (monthly) |

### Key Rules

1. **Member Donations DO NOT**:
   - Count towards monthly contribution requirements
   - Affect member status or standing
   - Replace regular monthly payments
   - Influence penalty calculations

2. **Member Donations DO**:
   - Increase overall fund balance
   - Appear in financial analytics
   - Generate audit trail
   - Can receive receipts
   - Get tracked separately from contributions

3. **All Donations**:
   - Require admin approval
   - Are logged in audit trail
   - Can be filtered and searched
   - Support receipt issuance
   - Include in analytics

## Reports and Analytics

### Donation Metrics Available

1. **Total Donations**: Count and sum of all approved donations
2. **By Source**: Breakdown by member/outsider/organization
3. **By Type**: Breakdown by investment/donation/sponsorship/grant/other
4. **By Status**: Pending/approved/rejected counts
5. **Top Donors**: List of highest contributors
6. **Monthly Trends**: Donation amounts per month
7. **Fund Impact**: How donations affect overall balance

### Financial Impact

**Fund Balance Calculation:**
```
Fund Balance = Contributions + Donations - Payouts - Expenses
```

**Income Breakdown:**
- Regular income: Member contributions
- Additional income: Donations & investments
- Total income: Contributions + Donations

**Net Flow:**
```
Net Flow = (Contributions + Donations) - (Payouts + Expenses)
```

## Security and Permissions

### Access Control

- **View Donations**: Admin only
- **Create Donations**: Admin only
- **Approve/Reject**: Admin only
- **Delete**: Admin only
- **View Analytics**: Admin only

### Data Validation

- All monetary amounts must be positive
- Dates cannot be in the future
- Required fields enforced
- Source-specific fields validated (e.g., member_id required if source is 'member')
- Email format validation
- Phone format validation

### Audit Trail

Every donation operation is logged with:
- Timestamp
- User performing action
- Action type
- Before/after values (for updates)
- Full donation details

## Testing Checklist

### Functional Testing

- [ ] Create donation from member
- [ ] Create donation from outsider
- [ ] Create donation from organization
- [ ] Auto-fill works when member is selected
- [ ] Approve donation
- [ ] Reject donation
- [ ] Delete donation
- [ ] View donation details
- [ ] Filter by source
- [ ] Filter by type
- [ ] Filter by status
- [ ] Search by donor name
- [ ] Issue receipt
- [ ] Bulk approve multiple donations
- [ ] Verify donation appears in analytics
- [ ] Verify fund balance includes donations
- [ ] Verify member donations don't affect contribution status
- [ ] Verify audit logs are created

### UI Testing

- [ ] KPI cards display correctly
- [ ] Cards have proper styling and colors
- [ ] Icons display for all types
- [ ] Status badges show correct colors
- [ ] Filters work as expected
- [ ] Search filters results correctly
- [ ] Modals open and close properly
- [ ] Form validation works
- [ ] Success/error messages display
- [ ] Responsive design on mobile
- [ ] Dark mode works properly

### Integration Testing

- [ ] Donations query works with Firestore
- [ ] Analytics includes donation data
- [ ] Fund balance calculates correctly
- [ ] Cash flow chart shows donations
- [ ] Audit logs created properly
- [ ] Navigation links work
- [ ] Role-based access control functions

## Troubleshooting

### Common Issues

**Issue:** Donation not appearing in analytics
- **Solution**: Ensure donation status is 'approved'. Only approved donations are included in analytics.

**Issue:** Member donation affecting contribution status
- **Solution**: This should not happen. Donations are tracked in separate collection and do not affect contribution calculations.

**Issue:** Cannot select member in form
- **Solution**: Ensure member has 'approved' status. Only approved members appear in dropdown.

**Issue:** Fund balance incorrect
- **Solution**: Check that all donations are properly approved. Verify calculation includes both contributions and donations.

**Issue:** Audit logs not showing donation actions
- **Solution**: Ensure auditService is properly imported and called in donationService functions.

## Future Enhancements (Optional)

1. **Recurring Donations**
   - Support for monthly/quarterly donation schedules
   - Automatic creation of recurring donation records

2. **Donation Campaigns**
   - Create specific fundraising campaigns
   - Track donations per campaign
   - Progress meters and goals

3. **Thank You Letters**
   - Auto-generate thank you letters
   - Email templates for donors
   - Personalized messages

4. **Tax Certificates**
   - Generate tax deduction certificates
   - Annual tax summary for donors
   - PDF export functionality

5. **Donor Portal**
   - Allow donors to view their donation history
   - Self-service receipt download
   - Recurring donation management

6. **Advanced Analytics**
   - Donor retention metrics
   - Donation trends and forecasting
   - Comparative analysis (year over year)
   - Donor segmentation

7. **Integration with Accounting**
   - Export to accounting software
   - Reconciliation tools
   - Financial report generation

8. **Mobile App**
   - Quick donation recording from mobile
   - Receipt scanning and upload
   - Push notifications for new donations

## Technical Notes

### Performance Considerations

- Donations are queried separately from contributions
- Indexes should be created for commonly filtered fields
- Pagination implemented for large donation lists
- Batch operations used for bulk approvals

### Scalability

- Firestore collection can handle millions of documents
- Queries are indexed for optimal performance
- Pagination prevents loading all donations at once
- Batch size limited to 500 for bulk operations

### Maintenance

- Regular review of donation data
- Archive old donations if needed
- Monitor collection size
- Update indexes as query patterns change

## Summary

The Donations & Investments feature provides a comprehensive solution for tracking additional income sources beyond member contributions. It maintains clear separation between regular membership dues and optional donations while seamlessly integrating with the existing financial tracking and analytics systems.

**Key Benefits:**
- ✅ Clear separation from monthly contributions
- ✅ Flexible donation types and sources
- ✅ Complete audit trail
- ✅ Integrated with analytics
- ✅ Modern, user-friendly interface
- ✅ Comprehensive filtering and search
- ✅ Approval workflow
- ✅ Receipt management

**Files Created/Modified:**
- Created: [src/types/donation.ts](src/types/donation.ts)
- Created: [src/services/donationService.ts](src/services/donationService.ts)
- Created: [src/pages/Donations.tsx](src/pages/Donations.tsx)
- Created: [src/components/donations/DonationFormModal.tsx](src/components/donations/DonationFormModal.tsx)
- Created: [src/components/donations/DonationDetailModal.tsx](src/components/donations/DonationDetailModal.tsx)
- Modified: [src/components/Layout.tsx](src/components/Layout.tsx) - Added navigation menu item
- Modified: [src/pages/LandingPage.tsx](src/pages/LandingPage.tsx) - Added navigation tile
- Modified: [src/App.tsx](src/App.tsx) - Added route
- Modified: [src/pages/Analytics.tsx](src/pages/Analytics.tsx) - Integrated donations metrics
- Modified: [src/components/audit/AuditLogVisualizer.tsx](src/components/audit/AuditLogVisualizer.tsx) - Added audit actions

**Build Status:** ✅ Successfully built with no errors

---

**Status:** ✅ Complete and Ready for Production

**Last Updated:** 2026-02-17
