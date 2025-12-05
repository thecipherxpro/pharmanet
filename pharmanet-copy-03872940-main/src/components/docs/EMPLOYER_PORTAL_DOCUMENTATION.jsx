# Employer Portal Documentation

## Overview

The Employer Portal provides a comprehensive system for pharmacy employers to manage their accounts, profiles, shift postings, and interactions with pharmacists. This documentation covers the Account Settings, Profile Management, and Public Profile visibility features.

---

## Table of Contents

1. [Employer Account Settings](#employer-account-settings)
2. [Employer Profile Management](#employer-profile-management)
3. [Public Employer Profile](#public-employer-profile)
4. [Entity Schemas](#entity-schemas)
5. [Verification Process](#verification-process)
6. [Security & Access Control](#security--access-control)

---

## Employer Account Settings

**Page:** `pages/EmployerAccount`  
**Route Protection:** `EmployerOnly`  
**Entity:** `Employer_Profile`

### Purpose
The Account Settings page allows employers to complete and manage their verification profile. This is required for account verification and full platform access.

### Features

#### 1. **Personal Information**
Required fields for employer identity verification:
- **Full Legal Name** - Legal name of the account holder
- **Email** - Account email (auto-filled, non-editable)
- **Phone Number** - Contact phone number
- **Date of Birth** - Required for identity verification
- **Languages Spoken** - Multiple language selection with badge UI

#### 2. **Personal Address**
Residential address for verification:
- Street Address
- City
- Province (Canadian provinces dropdown)
- Postal Code (auto-uppercase formatting)

#### 3. **Business Information**
- **Main Business Name** - Primary pharmacy/business name
- **Business Registration ID** - 9-digit Canadian Business Number (CBN)
  - Input validation: digits only, max 9 characters
  - Used for business verification

#### 4. **Main Business Address**
Primary business location:
- Street Address
- City
- Province
- Postal Code

### UI/UX Design

**Design Philosophy:** Minimal, monochrome, mobile-first
- Clean white background
- Black text and borders
- Gray accents for secondary info
- Compact card-based layout
- Sticky header with verification status
- Bottom sticky save button

**Status Indicators:**
```jsx
{isVerified && (
  <Badge className="bg-black text-white">
    <CheckCircle2 /> Verified
  </Badge>
)}

{isPending && (
  <Badge variant="outline">
    Pending Review
  </Badge>
)}
```

### Profile Avatar Management
- Integrated `ProfileAvatar` component
- Click to upload functionality
- Avatar syncs with User entity
- Toast notifications for success/errors

### Data Persistence
```javascript
// Create new profile
await base44.entities.Employer_Profile.create(profileData);

// Update existing profile
await base44.entities.Employer_Profile.update(profile.id, profileData);
```

### Verification States
1. **Incomplete** - Missing required fields
2. **Pending** - Submitted for admin review (`verification_status: 'pending'`)
3. **Verified** - Admin approved (`verification_status: 'verified'`)
4. **Rejected** - Admin rejected (`verification_status: 'rejected'`)

---

## Employer Profile Management

**Page:** `pages/EmployerProfile`  
**Route Protection:** `EmployerOnly`  
**Entity:** `Public_Employer_Profile`

### Purpose
The Profile page displays public-facing employer information visible to pharmacists. Employers can control visibility of contact information.

### Features

#### 1. **Profile Header**
- Profile avatar with edit capability
- Full name display
- Email (with visibility toggle)
- Phone (with visibility toggle)
- Company bio/description
- Verification badge (if verified)

#### 2. **Statistics Display**
Real-time metrics shown to pharmacists:
- Number of pharmacies owned/managed
- Total filled shifts
- Account active since date

```javascript
const stats = [
  {
    label: "Pharmacies",
    value: publicProfile?.number_of_pharmacies || 0,
    icon: Building2
  },
  {
    label: "Filled Shifts",
    value: filledShiftsCount,
    icon: CheckCircle2
  },
  {
    label: "Active Since",
    value: formatDate(user?.created_date),
    icon: Calendar
  }
];
```

#### 3. **Contact Visibility Controls**
Employers can control when their contact info is visible:

```javascript
// Email Visibility
<Switch
  checked={publicProfile?.contact_email_public || false}
  onCheckedChange={handleEmailVisibilityToggle}
/>

// Phone Visibility
<Switch
  checked={publicProfile?.contact_phone_public || false}
  onCheckedChange={handlePhoneVisibilityToggle}
/>
```

**Visibility Options:**
- **Public** - Visible to all pharmacists
- **After Booking Only** - Visible only after shift acceptance

#### 4. **Navigation Actions**
- **Account Settings** - Link to `EmployerAccount` page
- **Get Verified** - Link to verification requirements/submission

### Data Loading
```javascript
// Fetch user data
const userData = await base44.auth.me();

// Fetch public profile
const publicProfiles = await base44.entities.Public_Employer_Profile.filter({
  user_id: userData.id
});

// Count filled shifts
const filledShifts = await base44.entities.Shift.filter({
  created_by: userData.email,
  status: 'filled'
});
```

---

## Public Employer Profile

**Entity:** `Public_Employer_Profile`  
**Visibility:** Readable by all users (pharmacists, employers, admins)

### Purpose
The public profile is what pharmacists see when browsing employers or viewing shift postings. It contains employer reputation data and visibility controls.

### Key Fields

#### Identity & Contact
- `user_id` - Reference to User entity
- `employer_email` - Employer's email
- `phone` - Contact phone
- `contact_email_public` - Boolean: show email publicly
- `contact_phone_public` - Boolean: show phone publicly

#### Business Information
- `bio` - Company description/bio
- `number_of_pharmacies` - Total pharmacies owned/managed
- `pharmacies_locations` - Array of cities where pharmacies are located
- `website` - Company website URL

#### Reputation & Metrics
- `rating` - Average rating from pharmacists (0-5)
- `total_shifts_posted` - Total shifts posted
- `total_hires` - Total pharmacists hired
- `response_rate` - Application response rate percentage
- `average_response_time` - Average response time in hours
- `profile_views` - Number of profile views

#### Preferences
- `preferred_shift_types` - Array: ["temporary", "permanent", "shift_relief", "urgent"]
- `software_used` - Array of pharmacy software names
- `benefits_offered` - Array of benefits for permanent positions
- `workplace_culture` - Description of workplace culture

#### Verification & Status
- `is_verified` - Boolean: verified by admin
- `is_active` - Boolean: profile active and searchable
- `profile_visibility` - Enum: "public", "pharmacists_only", "hidden"
- `featured` - Boolean: featured employer status
- `profile_completeness` - Percentage (0-100)
- `active_since` - Date joined platform
- `last_active` - Last activity timestamp

#### Social Proof
```javascript
endorsements: [{
  pharmacist_id: "string",
  pharmacist_name: "string",
  endorsement: "string",
  date: "date-time"
}]
```

### RLS (Row Level Security)
```javascript
{
  create: {
    $or: [
      { user_condition: { user_type: "employer" } },
      { user_condition: { role: "admin" } }
    ]
  },
  read: true, // Public read access
  update: {
    $or: [
      { user_id: "{{user.id}}" },
      { user_condition: { role: "admin" } }
    ]
  },
  delete: {
    $or: [
      { user_id: "{{user.id}}" },
      { user_condition: { role: "admin" } }
    ]
  }
}
```

---

## Entity Schemas

### Employer_Profile (Private)

**Purpose:** Stores sensitive verification data visible only to the employer and admins.

```json
{
  "name": "Employer_Profile",
  "properties": {
    "user_id": "string",
    "full_name": "string",
    "email": "string (email)",
    "phone": "string",
    "date_of_birth": "string (date)",
    "personal_address": [{
      "street": "string",
      "city": "string",
      "province": "string",
      "postal_code": "string"
    }],
    "languages_spoken": ["string"],
    "main_business_name": "string",
    "business_registration_id": "string",
    "main_business_address": [{
      "street": "string",
      "city": "string",
      "province": "string",
      "postal_code": "string"
    }],
    "verification_status": "pending|verified|rejected",
    "verified_at": "string (date-time)",
    "verified_by": "string"
  },
  "required": [
    "user_id",
    "full_name",
    "email",
    "phone",
    "date_of_birth",
    "personal_address",
    "languages_spoken"
  ]
}
```

**RLS Rules:**
- **Create:** User owns the profile OR admin
- **Read:** User owns the profile OR admin
- **Update:** User owns the profile OR admin
- **Delete:** Admin only

### Public_Employer_Profile (Public)

**Purpose:** Public-facing employer information visible to pharmacists.

**Key Differences from Private Profile:**
1. No sensitive personal information (DOB, residential address)
2. Business-focused data (stats, ratings, reviews)
3. Publicly readable by all users
4. Contains reputation and social proof data

---

## Verification Process

### Step 1: Account Completion
Employer fills out required fields in `EmployerAccount` page:
- Personal information
- Personal address
- Business information
- Business address

### Step 2: Submission
When all required fields are complete, profile can be submitted for review:
```javascript
await base44.entities.Employer_Profile.create({
  ...formData,
  verification_status: 'pending'
});
```

### Step 3: Admin Review
Admin reviews submission in `AdminUsers` or dedicated verification page:
- Verifies business registration ID
- Confirms business address
- Validates personal information

### Step 4: Approval/Rejection
Admin updates verification status:
```javascript
await base44.entities.Employer_Profile.update(profileId, {
  verification_status: 'verified', // or 'rejected'
  verified_at: new Date().toISOString(),
  verified_by: adminEmail
});
```

### Step 5: Public Profile Sync
Upon verification, public profile is updated:
```javascript
await base44.entities.Public_Employer_Profile.update(publicProfileId, {
  is_verified: true
});
```

---

## Security & Access Control

### Route Protection
All employer pages use `EmployerOnly` route protection:

```javascript
import { EmployerOnly } from "../components/auth/RouteProtection";

export default function EmployerAccount() {
  return (
    <EmployerOnly>
      <EmployerAccountContent />
    </EmployerOnly>
  );
}
```

### Data Access Rules

**Employer_Profile (Private):**
- ✅ Employer can view/edit their own profile
- ✅ Admins can view/edit all profiles
- ❌ Other users cannot access

**Public_Employer_Profile:**
- ✅ All users can view (read-only)
- ✅ Owner can edit their own profile
- ✅ Admins can edit all profiles

### Avatar Upload Security
```javascript
// Avatar upload restricted to profile owner
const handleAvatarUpload = async (newAvatarUrl) => {
  await base44.auth.updateMe({ avatar_url: newAvatarUrl });
  // Triggers profile sync event
};
```

---

## Integration Points

### 1. Shift Posting
When employers post shifts, their verification status affects visibility:
```javascript
if (!employerProfile?.verification_status === 'verified') {
  // Show warning about limited visibility
}
```

### 2. Pharmacist Applications
Pharmacists see public profile when viewing shift details:
```javascript
const employerPublicProfile = await base44.entities.Public_Employer_Profile.filter({
  employer_email: shift.created_by
});
```

### 3. Contact Visibility
Contact info visibility is checked before display:
```javascript
const showEmail = publicProfile.contact_email_public || userHasBookedShift;
const showPhone = publicProfile.contact_phone_public || userHasBookedShift;
```

### 4. Statistics Updates
Stats are updated automatically via backend functions:
- `total_shifts_posted` - Incremented on shift creation
- `total_hires` - Incremented on application acceptance
- `profile_views` - Tracked when profile is viewed

---

## Best Practices

### For Employers
1. **Complete Profile First** - Fill out all required fields for verification
2. **Set Contact Visibility** - Choose when to reveal contact information
3. **Add Business Details** - Complete business info for better visibility
4. **Maintain Reputation** - Respond promptly to maintain high response rate

### For Developers
1. **Always Check Verification Status** - Before allowing critical actions
2. **Respect Visibility Settings** - Honor contact visibility preferences
3. **Update Stats Accurately** - Keep profile statistics up to date
4. **Handle Missing Profiles** - Gracefully handle cases where profiles don't exist yet

### Security Considerations
1. **Never Expose Private Profile Data** - Keep `Employer_Profile` data restricted
2. **Validate Business IDs** - Verify business registration IDs during approval
3. **Audit Verification Changes** - Log all verification status changes
4. **Rate Limit Profile Updates** - Prevent abuse of profile update endpoints

---

## Common Patterns

### Creating a New Employer Profile
```javascript
const createEmployerProfile = async (userData) => {
  // Create private profile
  const privateProfile = await base44.entities.Employer_Profile.create({
    user_id: userData.id,
    full_name: userData.full_name,
    email: userData.email,
    // ... other required fields
    verification_status: 'pending'
  });

  // Create public profile
  const publicProfile = await base44.entities.Public_Employer_Profile.create({
    user_id: userData.id,
    employer_email: userData.email,
    is_verified: false,
    is_active: true,
    profile_visibility: 'pharmacists_only'
  });

  return { privateProfile, publicProfile };
};
```

### Checking Verification Before Action
```javascript
const canPostShift = async (userId) => {
  const profile = await base44.entities.Employer_Profile.filter({ user_id: userId });
  return profile[0]?.verification_status === 'verified';
};
```

### Updating Contact Visibility
```javascript
const toggleContactVisibility = async (profileId, field, value) => {
  await base44.entities.Public_Employer_Profile.update(profileId, {
    [field]: value // contact_email_public or contact_phone_public
  });
};
```

---

## Troubleshooting

### Profile Not Loading
**Issue:** Profile data not appearing  
**Solution:** Check if profile exists for user_id, create if missing

### Verification Status Not Updating
**Issue:** Status remains 'pending' after admin approval  
**Solution:** Ensure both `Employer_Profile` and `Public_Employer_Profile` are updated

### Contact Info Not Visible
**Issue:** Contact info hidden even when public  
**Solution:** Check `contact_email_public` and `contact_phone_public` flags

### Avatar Not Uploading
**Issue:** Avatar upload fails  
**Solution:** Check file size limits, format support, and storage permissions

---

## Future Enhancements

### Potential Features
1. **Profile Completeness Score** - Visual indicator of profile completion
2. **Verification Documents** - Upload supporting documents for verification
3. **Multi-Location Support** - Manage multiple pharmacy locations
4. **Team Management** - Add team members with different permission levels
5. **Analytics Dashboard** - View profile views, application rates, etc.
6. **Badges & Achievements** - Reward consistent, high-quality employers
7. **Premium Profiles** - Featured placement and enhanced visibility

---

## Related Documentation
- [Route Protection](./ROUTE_PROTECTION_DOCS)
- [Security Matrix](./SECURITY_DOCUMENTATION)
- [Shift Management](./EMPLOYER_PORTAL_PUBLIC_SHIFT_DOCS)
- [Public Profile External Integration](./PUBLIC_SHIFT_EXTERNAL_APP_SETUP)

---

## Support & Contact
For questions or issues with the Employer Portal:
- Check logs in browser console
- Review Base44 dashboard for backend errors
- Contact admin for verification issues
- Submit bug reports through proper channels