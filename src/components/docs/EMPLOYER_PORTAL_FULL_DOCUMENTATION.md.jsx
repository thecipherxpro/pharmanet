# Employer Portal - Complete Documentation

## Overview
The Employer Portal is designed for pharmacy owners and managers to post shifts, find pharmacists, manage applications, and handle payments. This document explains every page, its purpose, logic, and entity relationships.

---

## 🏠 Pages & Their Functions

### 1. EmployerDashboard (`pages/EmployerDashboard.js`)
**Purpose:** Main landing page after login showing overview of employer's activity.

**Entities Used:**
- `User` - Current employer's profile data
- `Shift` - Lists employer's posted shifts
- `ShiftApplication` - Counts pending applications
- `Pharmacy` - Displays employer's pharmacies
- `EmployerPayment` - Recent payment history

**Key Features:**
- Welcome card with employer profile
- Statistics cards (open shifts, applications, completed shifts)
- Quick actions (Post Shift, Find Pharmacists, etc.)
- Recent shifts carousel
- Pending applications alerts

**Logic Flow:**
1. Fetches user data via `base44.auth.me()`
2. Loads shifts filtered by `employer_email: user.email`
3. Counts applications with `status: "pending"`
4. Displays quick action cards for navigation

---

### 2. PostShift (`pages/PostShift.js`)
**Purpose:** Multi-step wizard for creating new shift postings.

**Entities Used:**
- `Shift` - Creates new shift records
- `Pharmacy` - Employer selects from their pharmacies
- `PricingConfig` - Calculates hourly rates based on urgency

**Steps:**
1. **SelectPharmacyStep** - Choose pharmacy location
2. **DatesTimesStep** - Set shift dates and times (supports multiple dates)
3. **ShiftInfoStep** - Title, description, shift type
4. **RequirementsStep** - Experience, software, certifications needed
5. **ReviewStep** - Final review before posting

**Key Logic:**
```javascript
// Pricing tier calculation based on days ahead
const daysAhead = differenceInDays(shiftDate, today);
if (daysAhead <= 1) pricingTier = "emergency";      // Highest rate
else if (daysAhead <= 3) pricingTier = "very_urgent";
else if (daysAhead <= 7) pricingTier = "urgent";
// ... continues for other tiers
```

**Entity Fields Created:**
```javascript
{
  employer_id: user.id,
  employer_email: user.email,
  pharmacy_id: selectedPharmacy.id,
  pharmacy_name: selectedPharmacy.pharmacy_name,
  pharmacy_address: selectedPharmacy.address,
  pharmacy_city: selectedPharmacy.city,
  schedule: [{ date, start_time, end_time }], // Array of dates
  hourly_rate: calculatedRate,
  pricing_tier: calculatedTier,
  total_hours: calculatedHours,
  total_pay: hourlyRate * totalHours,
  status: "open"
}
```

---

### 3. MyShifts (`pages/MyShifts.js`)
**Purpose:** View and manage all posted shifts with filtering by status.

**Entities Used:**
- `Shift` - All employer's shifts
- `ShiftApplication` - Application counts per shift

**Tabs/Filters:**
- **Open** - Active shifts accepting applications (`status: "open"`)
- **Filled** - Shifts with accepted pharmacist (`status: "filled"`)
- **Completed** - Past shifts (`status: "completed"`)
- **Closed** - Manually closed shifts (`status: "closed"`)
- **Cancelled** - Cancelled shifts (`status: "cancelled"`)

**Actions Available:**
- View shift details
- Edit shift (if still open)
- Repost shift (creates copy with new dates)
- Delete shift (only if no applications)
- Cancel shift (with optional reason)

**Repost Logic:**
```javascript
// Creates new shift copying all data except dates
const newShift = {
  ...originalShift,
  schedule: newDates,
  status: "open",
  reposted_from: originalShift.id,
  reposted_at: new Date().toISOString()
};
```

---

### 4. ShiftDetails (`pages/ShiftDetails.js`)
**Purpose:** Detailed view of a single shift with application management.

**Entities Used:**
- `Shift` - The shift being viewed
- `ShiftApplication` - All applications for this shift
- `PublicPharmacistProfile` - Applicant profiles
- `Pharmacy` - Pharmacy details

**Key Features:**
- Full shift information display
- List of applicants with profiles
- Accept/Reject application buttons
- Pharmacist comparison modal
- Contact information (after acceptance)

**Application Acceptance Flow:**
1. Employer clicks "Accept" on application
2. System checks for payment card on file
3. Charges acceptance fee via Stripe
4. Updates `ShiftApplication.status` to "accepted"
5. Updates `Shift.status` to "filled"
6. Updates `Shift.assigned_to` with pharmacist email
7. Sends notification to pharmacist
8. Rejects all other pending applications

---

### 5. ManageApplications (`pages/ManageApplications.js`)
**Purpose:** Centralized view of all applications across all shifts.

**Entities Used:**
- `ShiftApplication` - All applications for employer's shifts
- `Shift` - Shift details for each application
- `PublicPharmacistProfile` - Applicant information

**Filters:**
- By status (pending, accepted, rejected)
- By shift
- By date range

**Bulk Actions:**
- Accept multiple applications (for different shifts)
- Reject multiple applications

---

### 6. FindPharmacists (`pages/FindPharmacists.js`)
**Purpose:** Search and browse available pharmacists to invite to shifts.

**Entities Used:**
- `PublicPharmacistProfile` - Searchable pharmacist database
- `Shift` - Employer's open shifts (for invitations)
- `ShiftInvitation` - Track sent invitations

**Search/Filter Options:**
- Name search
- City/Region filter
- Software experience filter
- Years of experience
- Availability status
- Rating filter

**Invitation Flow:**
1. Employer selects pharmacist
2. Opens "Send Invitation" drawer
3. Selects shift to invite for
4. Adds optional personal message
5. Creates `ShiftInvitation` record
6. Sends email notification to pharmacist

---

### 7. EmployerInvitations (`pages/EmployerInvitations.js`)
**Purpose:** Track all sent shift invitations and their status.

**Entities Used:**
- `ShiftInvitation` - All invitations sent by employer
- `Shift` - Shift details for each invitation

**Invitation Statuses:**
- `pending` - Awaiting pharmacist response
- `accepted` - Pharmacist accepted (converts to application)
- `declined` - Pharmacist declined
- `expired` - 7 days passed without response
- `cancelled` - Employer cancelled invitation

---

### 8. Pharmacies (`pages/Pharmacies.js`)
**Purpose:** Manage employer's pharmacy locations.

**Entities Used:**
- `Pharmacy` - CRUD operations on pharmacy records

**Required Fields:**
```javascript
{
  pharmacy_name: "string",
  address: "string",
  city: "string",
  province: "ON", // Default
  postal_code: "string",
  phone: "string",
  email: "string (optional)",
  manager_name: "string (optional)",
  software: "enum", // Kroll, Fillware, etc.
  is_active: true
}
```

**Validation:**
- At least one pharmacy required before posting shifts
- Phone format validation
- Postal code format validation

---

### 9. EmployerWallet (`pages/EmployerWallet.js`)
**Purpose:** Manage payment methods and view payment history.

**Entities Used:**
- `WalletCard` - Saved payment cards
- `EmployerPayment` - Payment transaction history
- `PaymentDispute` - Any disputed payments

**Payment Types:**
- `acceptance_fee` - Charged when accepting a pharmacist ($25-50)
- `subscription` - Monthly subscription (if applicable)
- `cancellation_credit` - Credited from pharmacist cancellations

**Card Management:**
- Add new cards via Stripe Elements
- Set default payment card
- Remove cards (keep at least one)

---

### 10. EmployerProfile (`pages/EmployerProfile.js`)
**Purpose:** View and edit employer's profile information.

**Entities Used:**
- `User` - Core user data
- `Public_Employer_Profile` - Public-facing profile
- `EmployerVerification` - Verification documents

**Profile Sections:**
- Personal information
- Company/Pharmacy details
- Contact information
- Public profile preview
- Verification status

---

### 11. EmployerSettings (`pages/EmployerSettings.js`)
**Purpose:** Account settings and preferences.

**Entities Used:**
- `User` - User preferences stored here

**Settings Available:**
- Notification preferences (email, push)
- Default shift settings
- Language preference
- Account security
- Delete account option

---

### 12. FilledShiftDetails (`pages/FilledShiftDetails.js`)
**Purpose:** View details of a filled shift with assigned pharmacist info.

**Entities Used:**
- `Shift` - The filled shift
- `ShiftApplication` - Accepted application
- `PublicPharmacistProfile` - Assigned pharmacist details
- `PayrollPreference` - Pharmacist's payroll info (visible after acceptance)

**Features:**
- Full pharmacist contact information
- Payroll details for payment
- Shift check-in/check-out status
- Cancel shift option (with penalty handling)
- Generate invoice option

---

### 13. CompletedShiftDetails (`pages/CompletedShiftDetails.js`)
**Purpose:** View completed shift with review and invoice options.

**Entities Used:**
- `Shift` - Completed shift data
- `Review` - Employer's review of pharmacist
- `PayrollInvoice` - Generated invoice

**Actions:**
- Leave review for pharmacist
- View/download invoice
- Report issue (creates dispute)

---

## 🔄 Entity Relationships

```
User (Employer)
  │
  ├── Pharmacy (1:Many)
  │     └── Shift (1:Many)
  │           ├── ShiftApplication (1:Many)
  │           │     └── PublicPharmacistProfile (reference)
  │           ├── ShiftInvitation (1:Many)
  │           ├── ShiftCheckIn (1:1)
  │           └── Review (1:1)
  │
  ├── WalletCard (1:Many)
  ├── EmployerPayment (1:Many)
  └── Public_Employer_Profile (1:1)
```

---

## 💰 Payment Flow

### Acceptance Fee Flow
```
1. Employer accepts application
   ↓
2. System checks WalletCard exists
   ↓
3. Calls `chargeEmployerForAcceptance` function
   ↓
4. Stripe charges default card
   ↓
5. Creates EmployerPayment record
   ↓
6. Updates ShiftApplication status
   ↓
7. Sends notifications
```

### Cancellation Credit Flow
```
1. Pharmacist cancels accepted shift
   ↓
2. System calculates penalty based on hours before shift
   ↓
3. Charges pharmacist's card (via ShiftCancellation)
   ↓
4. Credits portion to employer (EmployerPayment with type: "cancellation_credit")
```

---

## 🔔 Notification Triggers

| Event | Notification Created | Recipient |
|-------|---------------------|-----------|
| New application received | `shift_application_received` | Employer |
| Application accepted | `shift_application_accepted` | Pharmacist |
| Invitation accepted | `shift_invitation_accepted` | Employer |
| Pharmacist cancelled | `shift_cancelled` | Employer |
| Shift completed | `shift_completed` | Both |
| Review received | `review_received` | Pharmacist |

---

## 🛡️ Row Level Security (RLS)

### Shift Entity
```javascript
{
  create: { user_condition: { "data.user_type": "employer" } },
  read: true, // All can read open shifts
  update: { employer_email: "{{user.email}}" },
  delete: { employer_email: "{{user.email}}" }
}
```

### ShiftApplication Entity
```javascript
{
  read: {
    $or: [
      { pharmacist_email: "{{user.email}}" },
      // Employer can read if they own the shift
    ]
  }
}
```

### Pharmacy Entity
```javascript
{
  create: { user_condition: { "data.user_type": "employer" } },
  read: { created_by: "{{user.email}}" },
  update: { created_by: "{{user.email}}" },
  delete: { created_by: "{{user.email}}" }
}
```

---

## 📱 Mobile vs Desktop

### Desktop Features
- Retractable sidebar navigation
- Floating notification/avatar pill
- Multi-column layouts
- Bulk action toolbars

### Mobile Features
- Bottom navigation bar
- Full-width cards
- Swipe gestures (where applicable)
- Sticky headers

---

## 🔧 Backend Functions Used

| Function | Purpose | Called From |
|----------|---------|-------------|
| `chargeEmployerForAcceptance` | Charges acceptance fee | ShiftDetails |
| `handleEmployerShiftCancellation` | Cancels shift, handles refunds | ShiftDetails |
| `sendShiftInvitationEmail` | Sends invitation email | FindPharmacists |
| `generateInvoicePDF` | Creates downloadable invoice | CompletedShiftDetails |
| `updateEmployerProfile` | Updates employer data | EmployerProfile |
| `syncPublicEmployerProfile` | Syncs public profile | EmployerProfile |
| `verifyEmployer` | Handles verification docs | EmployerProfile |

---

## 🚀 Onboarding Flow

1. **RoleSelection** - User selects "Employer"
2. **EmployerOnboarding** - Multi-step wizard:
   - Personal information
   - Company details
   - Add first pharmacy
   - Agreement acceptance
   - Payment card setup
3. **EmployerDashboard** - Redirect after completion

**Onboarding Gate:**
All employer pages check `onboarding_completed` flag. If incomplete, redirects to onboarding.

---

## 📊 Analytics & Reporting

### AnalyticsReports Page
- Total shifts posted
- Fill rate percentage
- Average time to fill
- Total spent on fees
- Pharmacist ratings given
- Most used pharmacies

---

## 🔐 Security Considerations

1. **Payment cards** - Never stored directly, only Stripe tokens
2. **Pharmacist contact info** - Only visible after shift acceptance
3. **Payroll details** - RLS ensures only relevant employer sees them
4. **Admin override** - Admins can access all data for support

---

## 📝 Common Workflows

### Posting a Shift
1. Navigate to PostShift
2. Select pharmacy → Set dates → Add details → Set requirements → Review → Post
3. Shift created with `status: "open"`
4. Appears in BrowseShifts for pharmacists

### Accepting an Application
1. View ShiftDetails
2. Compare applicants (optional)
3. Click "Accept" on chosen applicant
4. Confirm payment charge
5. Shift marked as filled
6. Contact info revealed

### Inviting a Pharmacist
1. Navigate to FindPharmacists
2. Search/filter for suitable candidates
3. Click "Invite to Shift"
4. Select open shift
5. Add personal message
6. Send invitation
7. Track in EmployerInvitations

---

*Last Updated: November 2024*