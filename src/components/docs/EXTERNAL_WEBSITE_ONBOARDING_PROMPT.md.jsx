# Pharmanet External Website - Shift Posting Onboarding Tutorial

## Build Prompt for External Base44 App

---

### 🎯 PROJECT OVERVIEW

Create an interactive onboarding tutorial page for Pharmanet that showcases how employers post shifts. The page features:
1. A **sticky top progress banner** showing the current step
2. A **smartphone mockup** displaying an exact visualization of the shift posting flow
3. Step-by-step instructions with explanations

---

## 📋 FULL BUILD PROMPT

```
Create an interactive onboarding tutorial page called "HowToPostShift" that demonstrates the Pharmanet shift posting process for employers.

### LAYOUT STRUCTURE:

1. **STICKY TOP BANNER (Progress Tracker)**
   - Fixed position at top of viewport
   - Shows 5 steps: Pharmacy → Schedule → Details → Requirements → Review
   - Current step highlighted in teal (#0D9488)
   - Completed steps show checkmark
   - Step titles visible on desktop, numbers only on mobile
   - Background: white with subtle shadow
   - Height: 60px desktop, 50px mobile

2. **MAIN CONTENT AREA**
   - Two-column layout on desktop (60% phone mockup, 40% instructions)
   - Stacked on mobile (phone mockup first, then instructions)
   - Centered max-width container (1200px)
   - Padding: 24px

3. **SMARTPHONE MOCKUP (Left/Top)**
   - Realistic iPhone-style frame with:
     - Rounded corners (40px radius)
     - Black bezel (12px)
     - Notch at top
     - Home indicator at bottom
   - Inner screen dimensions: 375px × 812px (scaled to fit)
   - Screen shows exact Pharmanet UI for current step
   - Subtle shadow and 3D perspective tilt (optional)

4. **INSTRUCTIONS PANEL (Right/Bottom)**
   - Step number badge (teal circle)
   - Step title (bold, 24px)
   - Description paragraph
   - Bullet points for key actions
   - "What happens here" explanation box
   - Navigation buttons: Back / Next Step

---

### STEP-BY-STEP CONTENT:

#### STEP 1: SELECT PHARMACY
**Phone Screen Shows:**
- Header: "Post New Shift" with back arrow
- Progress bar (step 1 of 5 highlighted)
- Section title: "Select Pharmacy"
- Subtitle: "Choose the location for your shift"
- Pharmacy cards with:
  - Pharmacy icon (Building2)
  - Pharmacy name (e.g., "HealthFirst Pharmacy")
  - Address with MapPin icon
  - Software badge (e.g., "Kroll")
  - Business hours indicator with Clock icon
  - Selected state: teal border, teal background tint, checkmark

**Instructions Panel:**
```
Step 1: Choose Your Pharmacy

Select the pharmacy location where you need coverage.

• Tap on a pharmacy card to select it
• Selected pharmacy shows a teal border and checkmark
• Each card displays the pharmacy name, address, and software used
• Business hours are shown if configured

💡 What happens here:
The shift will be linked to this pharmacy's location, software requirements, and business hours. Pharmacists will see this information when browsing available shifts.
```

---

#### STEP 2: SCHEDULE YOUR SHIFTS
**Phone Screen Shows - Sub-step 2A (Choose Method):**
- Header: "Schedule Your Shifts"
- Subtitle: "Select how you want to set date and time"
- Two large option cards:

  **Card 1 - Recurring Shifts (Recommended):**
  - Teal gradient icon with CalendarRange
  - Title: "Add Recurring Shifts"
  - Badge: "Recommended"
  - Description: "Quickly add multiple shifts using your pharmacy's business hours"
  - Highlight box: "Uses your Pharmacy Business Hours & Working Days!"
  - Arrow indicator

  **Card 2 - Custom Shifts:**
  - Purple gradient icon with CalendarPlus
  - Title: "Add Custom Shifts"
  - Description: "Manually select specific dates and times for each shift"
  - Highlight box: "Add shifts by selecting custom dates & hours"
  - Arrow indicator

**Instructions Panel (Choose Method):**
```
Step 2: Schedule Your Shifts

Choose how you want to add shift dates and times.

OPTION A: Recurring Shifts (Recommended)
• Best for weekly schedules
• Automatically uses your pharmacy's business hours
• Select start date, number of weeks, and working days
• System generates shifts based on your pharmacy's open hours

OPTION B: Custom Shifts
• Best for one-off or irregular shifts
• Manually pick each date and time
• Full control over individual shift timing

💡 What happens here:
This determines how your shift schedule is created. Recurring is faster for regular coverage needs; Custom gives you precise control.
```

**Phone Screen Shows - Sub-step 2B (Recurring Config):**
- Back arrow to return to method selection
- Header: "Recurring Shifts"
- Subtitle: "Configure your recurring schedule"

- **Card 1 - Select Duration:**
  - Step badge "1" in teal circle
  - Start Date picker
  - Number of Weeks selector (1-4 buttons)

- **Card 2 - Select Working Days:**
  - Step badge "2" in teal circle
  - 7-day grid (Mon-Sun)
  - Open days in teal when selected
  - Closed days grayed out
  - Each day shows opening time

- **Summary Box:**
  - Teal gradient background
  - Calendar icon
  - "Total Shifts to Add: X"
  - Calculation text: "X weeks × Y days = Z shifts"
  - "Add Shifts" button (teal)

**Instructions Panel (Recurring):**
```
Recurring Shifts Configuration

Set up your weekly shift pattern:

1. SELECT DURATION
   • Pick your start date
   • Choose 1-4 weeks of coverage

2. SELECT WORKING DAYS
   • Tap days when you need coverage
   • Days your pharmacy is closed are grayed out
   • Selected days show in teal

3. REVIEW & ADD
   • See total shifts calculated
   • Tap "Add Shifts" to generate schedule

💡 What happens here:
The system creates shift entries for each selected day, using your pharmacy's business hours as the default times. You can adjust individual shifts in the next screen.
```

**Phone Screen Shows - Sub-step 2C (Review Shifts):**
- Back arrow
- Header: "Your Shifts"
- Subtitle: "X shifts added"
- Badge: "X/10" (max shifts indicator)

- **Shift Cards (for each shift):**
  - Header bar with shift number badge
  - Duplicate and Remove buttons
  - Date picker showing selected date
  - Formatted date display (e.g., "Mon, Dec 2, 2024")
  - Time pickers (start/end)
  - 12-hour format display

  - **Rate Section:**
    - Toggle: "Set Custom Rate" with Switch
    - When OFF: Shows dynamic rate with urgency badge
      - Rate display: "$XX/hr (Dynamic)"
      - Urgency badge (color-coded)
    - When ON: Editable rate input
      - Minimum rate enforced
      - Warning if below minimum

- **Add Another Shift Button:**
  - Dashed border
  - Plus icon
  - "Add Another Shift"

- **Pricing Legend:**
  - Gray background box
  - Title: "Dynamic Pricing (Minimum Rates)"
  - Color-coded badges:
    - Red: $90 Same day
    - Orange: $65 1 day
    - Amber: $60 2-4 days
    - Blue: $56 5-13 days
    - Green: $50 14+ days

**Instructions Panel (Review Shifts):**
```
Review & Customize Your Shifts

Fine-tune each shift in your schedule:

SHIFT CARDS
• Each shift shows date, start time, and end time
• Duplicate a shift to copy its settings
• Remove shifts you don't need (must keep at least 1)

DYNAMIC PRICING
• Rates are automatically calculated based on urgency
• Same-day shifts = $90/hr minimum
• Planned shifts (14+ days ahead) = $50/hr minimum

CUSTOM RATES
• Toggle "Set Custom Rate" to override
• Custom rate must meet or exceed the dynamic minimum
• Offer higher rates to attract top pharmacists faster

💡 What happens here:
This is where you finalize your shift schedule. The dynamic pricing ensures fair compensation based on how urgently you need coverage.
```

---

#### STEP 3: SHIFT DETAILS
**Phone Screen Shows:**
- Header: "Shift Details"
- Subtitle: "Describe your shift to attract qualified pharmacists"

- **Title Field:**
  - Label: "Shift Title *" with FileText icon
  - Character counter: "X/20 min"
  - Input field with placeholder
  - AI Enhance button (Sparkles icon, purple)
  - Helper text: "Click the sparkle icon to enhance your title with AI"
  - Validation message if < 20 chars

- **Description Field:**
  - Label: "Description *" with Briefcase icon
  - Character counter: "X/32 min"
  - Textarea with placeholder
  - AI Enhance button (Sparkles icon, purple)
  - Helper text: "Click the sparkle icon to enhance your description with AI"
  - Validation message if < 32 chars

- **Shift Type Selection:**
  - Label: "Shift Type *" with Clock icon
  - 2x2 grid of cards:
    - Temporary (Short-term coverage)
    - Permanent (Long-term position)
    - Shift Relief (Regular relief work)
    - Urgent (Immediate need)
  - Selected card: teal border, teal background, checkmark

**Instructions Panel:**
```
Step 3: Describe Your Shift

Create an attractive listing that stands out:

SHIFT TITLE (Minimum 20 characters)
• Write a clear, descriptive title
• Example: "Full-Day Pharmacist Needed - Busy Retail Location"
• Use AI enhance (✨) to improve your title

DESCRIPTION (Minimum 32 characters)
• Describe responsibilities and environment
• Mention what makes this opportunity great
• Use AI enhance (✨) to make it more compelling

SHIFT TYPE
• Temporary: One-time or short-term coverage
• Permanent: Ongoing position
• Shift Relief: Regular recurring relief
• Urgent: Immediate/emergency coverage

💡 What happens here:
A well-written listing attracts more qualified applicants. The AI enhancement helps you create professional, appealing descriptions quickly.
```

---

#### STEP 4: REQUIREMENTS
**Phone Screen Shows:**
- Header: "Requirements"
- Subtitle: "Set preferences for your ideal candidate"

- **Card 1 - Shift Includes:**
  - Toggle switches for:
    - Assistant On Site
    - Vaccination/Injections
    - Addiction Dispensing
    - Methadone/Suboxone
  - Each with descriptive label

- **Card 2 - Requirements:**
  - Years of Experience slider/input (0-10+)
  - Software Experience multi-select badges:
    - Kroll, Paperless Kroll, Fillware
    - PharmaClik, Nexxsys, Commander
    - Assyst, PrimeRx, McKesson, Other
  - Selected software highlighted in blue

**Instructions Panel:**
```
Step 4: Set Requirements (Optional)

Specify what your shift includes and candidate preferences:

SHIFT INCLUDES
• Assistant On Site - Pharmacy assistant available
• Vaccination/Injections - Immunization services
• Addiction Dispensing - Controlled substance dispensing
• Methadone/Suboxone - OAT program participation

REQUIREMENTS
• Years of Experience - Minimum experience level (0 = any)
• Software Experience - Select required pharmacy software

💡 What happens here:
These are optional filters. Setting requirements helps match you with pharmacists who have the specific skills you need. Leave blank to see all applicants.
```

---

#### STEP 5: REVIEW & CONFIRM
**Phone Screen Shows:**
- Header: "Review & Confirm"
- Subtitle: "Double-check everything looks good"

- **Pharmacy Card:**
  - Building2 icon (blue background)
  - Pharmacy name and address
  - Software badge

- **Shift Information Card:**
  - FileText icon (purple background)
  - Title, Description, Type badge

- **Schedule Card:**
  - Calendar icon (green background)
  - "Schedule (X shifts)" header
  - Each shift row showing:
    - Clock icon
    - Date (formatted)
    - Time range
    - Hours duration
    - Hourly rate (color-coded if custom)
    - Shift total

- **Shift Includes Card (if any selected):**
  - CheckCircle2 icon (teal background)
  - Badges for selected options

- **Requirements Card (if any set):**
  - Shield icon (blue background)
  - Experience requirement
  - Software badges

- **Total Payout Card:**
  - Teal gradient background
  - DollarSign icon
  - "Total Payout" label
  - Number of shifts
  - Large total amount

- **Footer Navigation:**
  - Back button
  - "Post X Shifts" button (teal, prominent)

**Instructions Panel:**
```
Step 5: Review & Post

Verify all details before publishing:

REVIEW CHECKLIST
✓ Correct pharmacy selected
✓ Shift title and description are accurate
✓ All dates and times are correct
✓ Rates are appropriate for urgency
✓ Requirements match your needs

POSTING
• Tap "Post Shift" or "Post X Shifts"
• Your shift(s) immediately become visible to pharmacists
• You'll receive notifications when pharmacists apply

💡 What happens next:
Once posted, qualified pharmacists in the GTA will see your shifts and can apply. Review applications in your dashboard and accept the best candidate.
```

---

### NAVIGATION & INTERACTIONS:

1. **Progress Banner:**
   - Clickable steps (only completed + current)
   - Smooth scroll to step on click
   - Updates as user navigates

2. **Phone Mockup:**
   - Animated transitions between screens
   - Hover states on interactive elements
   - Touch-friendly on mobile

3. **Navigation Buttons:**
   - "Back" returns to previous step
   - "Next Step" advances (with validation)
   - Final step shows "Complete Tutorial"

4. **Responsive Behavior:**
   - Desktop: Side-by-side layout
   - Tablet: Stacked with smaller phone mockup
   - Mobile: Full-width phone mockup, instructions below

---

### DESIGN SPECIFICATIONS:

**Colors:**
- Primary: Teal (#0D9488, #14B8A6)
- Secondary: Purple (#7C3AED, #8B5CF6)
- Success: Green (#22C55E)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Background: Gray-50 (#F9FAFB)
- Cards: White with gray-200 border

**Typography:**
- Font: Inter
- Headings: Bold, gray-900
- Body: Regular, gray-600
- Labels: Medium, gray-700

**Spacing:**
- Section padding: 24px
- Card padding: 16-20px
- Gap between elements: 12-16px

**Shadows:**
- Phone mockup: lg shadow with slight blur
- Cards: sm shadow
- Sticky banner: md shadow

**Animations:**
- Step transitions: 300ms ease-out
- Button hover: scale 1.02
- Card selection: border color + background fade

---

### COMPONENT STRUCTURE:

```
pages/HowToPostShift.js
├── components/tutorial/
│   ├── TutorialProgressBanner.jsx
│   ├── PhoneMockup.jsx
│   ├── InstructionsPanel.jsx
│   ├── steps/
│   │   ├── Step1Pharmacy.jsx
│   │   ├── Step2Schedule.jsx
│   │   ├── Step3Details.jsx
│   │   ├── Step4Requirements.jsx
│   │   └── Step5Review.jsx
│   └── mockup-screens/
│       ├── PharmacyScreen.jsx
│       ├── ScheduleMethodScreen.jsx
│       ├── ScheduleRecurringScreen.jsx
│       ├── ScheduleReviewScreen.jsx
│       ├── DetailsScreen.jsx
│       ├── RequirementsScreen.jsx
│       └── ReviewScreen.jsx
```

---

### SAMPLE DATA FOR MOCKUPS:

**Pharmacy:**
```json
{
  "name": "HealthFirst Pharmacy",
  "address": "123 Main Street, Toronto",
  "software": "Kroll",
  "business_hours": [
    {"day": "monday", "is_open": true, "open_time": "09:00", "close_time": "18:00"},
    {"day": "tuesday", "is_open": true, "open_time": "09:00", "close_time": "18:00"},
    {"day": "wednesday", "is_open": true, "open_time": "09:00", "close_time": "18:00"},
    {"day": "thursday", "is_open": true, "open_time": "09:00", "close_time": "18:00"},
    {"day": "friday", "is_open": true, "open_time": "09:00", "close_time": "18:00"},
    {"day": "saturday", "is_open": true, "open_time": "10:00", "close_time": "16:00"},
    {"day": "sunday", "is_open": false}
  ]
}
```

**Sample Shifts:**
```json
[
  {
    "date": "2024-12-02",
    "start_time": "09:00",
    "end_time": "18:00",
    "hourly_rate": 56,
    "is_manual_rate": false
  },
  {
    "date": "2024-12-03",
    "start_time": "09:00",
    "end_time": "18:00",
    "hourly_rate": 56,
    "is_manual_rate": false
  }
]
```

**Shift Details:**
```json
{
  "title": "Full-Day Pharmacist Needed - Busy Retail Location",
  "description": "Join our friendly team at a high-volume community pharmacy. Great staff support and modern facilities.",
  "shiftType": "temporary"
}
```

---

### ACCESSIBILITY:

- All interactive elements keyboard accessible
- ARIA labels for screen readers
- Sufficient color contrast (WCAG AA)
- Focus indicators visible
- Alt text for all icons/images

---

### FINAL NOTES:

This tutorial page serves as:
1. Marketing content for potential employers
2. Onboarding guide for new users
3. Reference documentation for existing users

Ensure the phone mockup screens are EXACT replicas of the actual Pharmanet app UI to provide accurate expectations and reduce user confusion when they use the real application.
```

---

## 🚀 QUICK START

Copy the full prompt above into a new Base44 app and the AI will generate:
1. The main tutorial page
2. All sub-components
3. Phone mockup screens
4. Responsive styling
5. Step navigation logic

---

## 📱 PHONE MOCKUP CSS REFERENCE

```css
.phone-frame {
  width: 320px;
  height: 650px;
  background: #000;
  border-radius: 40px;
  padding: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.phone-screen {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 32px;
  overflow: hidden;
  position: relative;
}

.phone-notch {
  width: 120px;
  height: 28px;
  background: #000;
  border-radius: 0 0 14px 14px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.phone-home-indicator {
  width: 120px;
  height: 5px;
  background: #000;
  border-radius: 3px;
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}
```

---

## ✅ CHECKLIST FOR IMPLEMENTATION

- [ ] Sticky progress banner with 5 steps
- [ ] Phone mockup with realistic frame
- [ ] Step 1: Pharmacy selection screen
- [ ] Step 2a: Method selection screen
- [ ] Step 2b: Recurring configuration screen
- [ ] Step 2c: Shift review screen
- [ ] Step 3: Details screen with AI enhance
- [ ] Step 4: Requirements screen
- [ ] Step 5: Review summary screen
- [ ] Instructions panel for each step
- [ ] Navigation buttons (Back/Next)
- [ ] Responsive design
- [ ] Smooth animations
- [ ] Accessibility compliance

---

*Documentation created for Pharmanet - Pharmacy Shift Management Platform*
*Version 1.0 | Last Updated: November 2024*