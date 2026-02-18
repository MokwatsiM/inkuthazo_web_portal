# Credit/Loan Management System - Implementation Plan

## Overview

A comprehensive credit management system that allows the organization to extend loans to members with a complete approval workflow, payment tracking, and settlement management.

## System Flow

```
1. ADMIN creates credit request for member
   ↓
2. CHAIRPERSON reviews credit
   ├→ Approve → Creates expense → Credit becomes ACTIVE
   ├→ Reject → Credit REJECTED
   └→ Request Info → Back to ADMIN → ADMIN provides info → Back to step 2
   ↓
3. MEMBER makes credit payments via contributions
   ├→ Payment 1 of N
   ├→ Payment 2 of N
   └→ Payment N of N
   ↓
4. ADMIN approves each payment contribution
   ↓
5. System tracks total paid vs total owed
   ↓
6. When total_paid >= total_amount → Credit SETTLED
```

## Database Schema

### Credits Collection

```typescript
interface Credit {
  id: string;

  // Member
  member_id: string;
  member_name: string;

  // Credit Details
  reason: string;
  description?: string;

  // Terms
  terms: {
    principal_amount: number;     // e.g., R1000
    additional_fee: number;        // e.g., R100
    total_amount: number;          // R1100
    installments: number;          // e.g., 3 payments
    installment_amount: number;    // R366.67 per payment
  };

  // Status
  status: 'pending_review' | 'needs_info' | 'approved' | 'rejected' | 'active' | 'settled' | 'defaulted';

  // Workflow
  created_by: string;
  created_at: Timestamp;
  review?: {
    reviewed_by: string;
    action: 'approve' | 'reject' | 'request_info';
    notes: string;
    reviewed_at: Timestamp;
  };

  // Payment Tracking
  payments: Array<{
    id: string;
    contribution_id: string;
    amount: number;
    payment_number: number;
    paid_at: Timestamp;
    status: 'pending' | 'approved';
  }>;
  total_paid: number;
  remaining_balance: number;

  // Links
  expense_id?: string;              // Created when approved
  settled_at?: Timestamp;
}
```

## Features to Implement

### Phase 1: Core Credit Management

#### 1.1 Credit Service (`src/services/creditService.ts`)

**Functions:**
- `createCredit()` - Admin creates credit
- `getCredit()` - Get single credit
- `getCredits()` - List credits with filters
- `reviewCredit()` - Chairperson review
- `provideAdditionalInfo()` - Admin responds to info request
- `recordPayment()` - Link contribution to credit
- `checkSettlement()` - Auto-settle when fully paid
- `getCreditSummary()` - Statistics
- `getMemberActiveCredit()` - Check if member has active credit

#### 1.2 Admin Credit Management Page

**Path:** `/credits`
**Access:** Admin only

**Features:**
- Create new credit button
- List all credits with filters
- Status badges
- View/Edit credit
- Respond to info requests
- Track payment progress

**UI Components:**
- CreditList (table/card view)
- CreateCreditModal
- CreditDetailModal
- RespondToInfoRequestModal

#### 1.3 Chairperson Review Interface

**Path:** `/credit-reviews`
**Access:** Admin, Chairperson roles

**Features:**
- List pending credits
- Review details
- Approve/Reject/Request Info
- Add review notes
- View credit history

**UI Components:**
- PendingCreditsQueue
- CreditReviewModal
- ReviewHistoryTimeline

### Phase 2: Member Integration

#### 2.1 Member Credit View

**Path:** `/my-credit`
**Access:** Members

**Features:**
- View active credit details
- See payment schedule
- Track payments made
- View remaining balance
- Payment history

**UI Components:**
- ActiveCreditCard
- PaymentSchedule
- PaymentHistory

#### 2.2 Contribution Integration

**Modify:** `src/types/contribution.ts`

Add new contribution type:
```typescript
export type ContributionType = 'monthly' | 'registration' | 'credit_payment' | 'other';
```

**Modify:** Contribution form
- Show "Credit Payment" option if member has active credit
- Auto-populate amount (installment amount)
- Link contribution to credit
- Show remaining installments

**Workflow:**
1. Member selects "Credit Payment" type
2. System fetches active credit
3. Shows installment amount
4. Member uploads proof
5. Admin approves contribution
6. System updates credit payment tracking
7. Auto-settles if final payment

### Phase 3: Integration & Automation

#### 3.1 Expense Creation

When chairperson approves credit:
```typescript
// Auto-create expense
const expense = {
  title: `Credit to ${member_name}`,
  description: credit.reason,
  amount: credit.terms.total_amount,
  type: 'one-off',
  category: 'others',
  status: 'paid',
  date: Timestamp.now(),
  created_by: credit.created_by,
  payment_date: Timestamp.now(),
  payment_reference: `CREDIT-${credit.id}`,
  credit_id: credit.id  // Link back to credit
};
```

#### 3.2 Payment Tracking

**On contribution approval (if type = 'credit_payment'):**
```typescript
1. Find linked credit
2. Add payment to credit.payments[]
3. Update credit.total_paid
4. Update credit.remaining_balance
5. Check if total_paid >= total_amount
6. If yes: Mark credit as SETTLED
7. Update contribution with credit context
```

#### 3.3 Analytics Integration

**Update Analytics Page:**
- Add credits to income/expense tracking
- Show active credits count
- Track repayment rate
- Default rate monitoring

## Implementation Steps

### Step 1: Types & Service (Backend)
1. ✅ Create `src/types/credit.ts`
2. Create `src/services/creditService.ts`
3. Add audit trail integration

### Step 2: Admin Interface
1. Create `src/pages/Credits.tsx`
2. Create `src/components/credits/CreateCreditModal.tsx`
3. Create `src/components/credits/CreditDetailModal.tsx`
4. Create `src/components/credits/CreditListCard.tsx`
5. Add navigation item

### Step 3: Chairperson Interface
1. Create `src/pages/CreditReviews.tsx`
2. Create `src/components/credits/ReviewCreditModal.tsx`
3. Add to chairperson navigation

### Step 4: Member Interface
1. Create `src/pages/MyCredit.tsx`
2. Update contribution form for credit payments
3. Add validation logic

### Step 5: Integration
1. Update `ContributionType` enum
2. Modify contribution service
3. Auto-create expense on approval
4. Auto-settle on full payment

### Step 6: Analytics & Reporting
1. Add credits to dashboard
2. Update analytics page
3. Create credit reports

### Step 7: Testing & Rules
1. Update Firestore rules
2. Test workflows
3. Test edge cases
4. Build and deploy

## Firestore Rules

```javascript
// Credits collection
match /credits/{creditId} {
  // Admins can read all credits
  // Members can only read their own credits
  allow read: if isAdmin() ||
    (isSignedIn() && resource.data.member_id == request.auth.uid);

  // Only admins can create credits
  allow create: if isAdmin();

  // Admins and chairpersons can update (for reviews and payments)
  allow update: if isAdmin() ||
    (isSignedIn() && get(/databases/$(database)/documents/members/$(request.auth.uid)).data.role in ['admin', 'chairperson']);

  // Only admins can delete
  allow delete: if isAdmin();
}
```

## UI/UX Design

### Admin Credit Creation Form

```
┌─────────────────────────────────────┐
│ Create Member Credit                │
├─────────────────────────────────────┤
│ Member: [Dropdown Select]           │
│ Reason: [Input Text]                │
│ Description: [Textarea]             │
│                                     │
│ ┌─ Credit Terms ─────────────────┐ │
│ │ Principal Amount: R [____]     │ │
│ │ Additional Fee: R [____]       │ │
│ │ Total Amount: R 0.00 (calc)    │ │
│ │ Installments: [__] payments    │ │
│ │ Per Payment: R 0.00 (calc)     │ │
│ └────────────────────────────────┘ │
│                                     │
│ [Cancel]  [Create Credit Request]  │
└─────────────────────────────────────┘
```

### Chairperson Review Interface

```
┌─────────────────────────────────────┐
│ Review Credit Request               │
├─────────────────────────────────────┤
│ Member: John Doe                    │
│ Amount: R 1,100 (R1000 + R100 fee) │
│ Reason: Medical Emergency           │
│ Installments: 3 payments of R366.67 │
│                                     │
│ ┌─ Your Decision ────────────────┐ │
│ │ ○ Approve Credit               │ │
│ │ ○ Reject Credit                │ │
│ │ ○ Request More Information     │ │
│ │                                 │ │
│ │ Notes: [Textarea]              │ │
│ └────────────────────────────────┘ │
│                                     │
│ [Cancel]  [Submit Review]          │
└─────────────────────────────────────┘
```

### Member Credit View

```
┌─────────────────────────────────────┐
│ My Active Credit                    │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Credit Amount: R 1,100          │ │
│ │ Paid: R 733.34                  │ │
│ │ Remaining: R 366.66             │ │
│ │ ━━━━━━━━━━━━━━━░░░ 67%         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Payment Schedule:                   │
│ ✓ Payment 1/3 - R 366.67 - Paid    │
│ ✓ Payment 2/3 - R 366.67 - Paid    │
│ ○ Payment 3/3 - R 366.66 - Pending │
│                                     │
│ [Make Credit Payment] →             │
└─────────────────────────────────────┘
```

## Key Business Logic

### Credit Approval Flow
```typescript
if (action === 'approve') {
  1. Update credit status to 'approved'
  2. Create expense entry
  3. Update credit with expense_id
  4. Change status to 'active'
  5. Send notification to member
}
```

### Payment Processing
```typescript
on contribution approval {
  if (contribution.type === 'credit_payment') {
    1. Find credit by ID
    2. Validate payment amount
    3. Add to credit.payments[]
    4. Update total_paid
    5. Calculate remaining_balance
    6. If remaining_balance <= 0:
       - Mark credit as 'settled'
       - Set settled_at timestamp
    7. Log audit trail
  }
}
```

### Validation Rules
- Member can only have ONE active credit at a time
- Installment payments must match or exceed installment_amount
- Total payments cannot exceed total_amount
- Credit cannot be deleted if payments have been made
- Only pending_review credits can be reviewed
- Only needs_info credits can receive additional info

## Next Steps

This is a comprehensive feature. Due to its size and complexity, I recommend:

1. **Do you want me to proceed with full implementation?**
   - This will create ~15-20 new files
   - Modify ~5 existing files
   - Take significant time to implement

2. **Or would you prefer a phased approach?**
   - Phase 1: Core credit creation & review (Admin + Chairperson)
   - Phase 2: Member payment integration
   - Phase 3: Analytics and reporting

3. **Or start with simplified version?**
   - Basic credit tracking without chairperson review
   - Simple payment tracking
   - Then add complexity later

**Please let me know how you'd like to proceed, and I'll start implementation!**

---

**Estimated Implementation:**
- Full system: ~2-3 hours of development
- Files to create: ~18 files
- Files to modify: ~6 files
- Lines of code: ~3000+ lines

**Status:** ⏸️ Awaiting your decision on implementation approach
