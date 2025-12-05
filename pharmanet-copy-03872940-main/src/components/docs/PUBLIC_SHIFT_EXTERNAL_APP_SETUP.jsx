# Public Shift Portal - External App Setup Guide

This guide explains how to set up your external Base44 app (shifts.pharmanet.ca) to display shift details from the main Pharmanet app.

---

## Overview

The external app will:
1. Receive shift links like: `https://shifts.pharmanet.ca/PublicShift?id=SHIFT_ID`
2. Call the main app's API to fetch shift details
3. Display the shift with an "Apply Now" button that redirects to main app

---

## Step 1: Create the PublicShift Page

Create a new page in your external app: `pages/PublicShift.js`

```jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Calendar, Clock, DollarSign, MapPin, Building2, 
  Briefcase, AlertCircle, Loader2, ExternalLink 
} from "lucide-react";
import { format } from "date-fns";

export default function PublicShift() {
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShift();
  }, []);

  const loadShift = async () => {
    try {
      // Get shift ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const shiftId = urlParams.get('id');

      if (!shiftId) {
        setError('No shift ID provided');
        setLoading(false);
        return;
      }

      // Call main app's API endpoint
      const MAIN_APP_URL = 'https://pharmanet.base44.com'; // Replace with your main app URL
      const response = await fetch(
        `${MAIN_APP_URL}/api/functions/getPublicShiftDetails?shift_id=${shiftId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setShift(data.shift);
      } else {
        setError(data.error || 'Shift not found');
      }
    } catch (err) {
      console.error('Error loading shift:', err);
      setError('Failed to load shift details');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Redirect to main app with shift ID
    const MAIN_APP_URL = 'https://pharmanet.base44.com'; // Replace with your main app URL
    window.location.href = `${MAIN_APP_URL}/ShiftDetails?id=${shift.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading shift details...</p>
        </div>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Shift not found or no longer available'}</p>
          <Button 
            onClick={() => window.location.href = 'https://pharmanet.base44.com'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Browse More Shifts
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pharmacy Shift Opportunity
          </h1>
          <p className="text-gray-600">
            View details and apply for this shift
          </p>
        </div>

        {/* Main Shift Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {shift.pharmacy_name}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{shift.pharmacy_city}, {shift.pharmacy_province}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                ${shift.hourly_rate}<span className="text-lg">/hr</span>
              </div>
              <p className="text-sm text-gray-600">Total: ${shift.total_pay}</p>
            </div>
          </div>

          {/* Shift Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-semibold text-gray-900">
                  {shift.start_time} - {shift.end_time}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Shift Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {shift.shift_type?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Total Hours</p>
                <p className="font-semibold text-gray-900">
                  {shift.total_hours} hours
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {shift.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{shift.description}</p>
            </div>
          )}

          {/* Software */}
          {shift.pharmacy_software?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Pharmacy Software</h3>
              <div className="flex flex-wrap gap-2">
                {shift.pharmacy_software.map((software, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {software}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <Button
            onClick={handleApply}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            Apply for This Shift
            <ExternalLink className="w-5 h-5 ml-2" />
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            You'll be redirected to Pharmanet.ca to complete your application
          </p>
        </Card>

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600">
          <p>Powered by <span className="font-semibold">Pharmanet</span></p>
          <p className="mt-2">
            <a 
              href="https://pharmanet.base44.com" 
              className="text-blue-600 hover:underline"
            >
              Browse all available shifts →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 2: Configure Main App URL

In the code above, replace `https://pharmanet.base44.com` with your actual main app URL in **3 places**:

1. Line 26: API endpoint URL
2. Line 62: Apply redirect URL
3. Line 148: Footer browse link

**Find your main app URL:**
- Go to your main Pharmanet Base44 app dashboard
- Look for the app URL (e.g., `https://your-app-slug.base44.com`)

---

## Step 3: API Endpoint Format

The external app calls this endpoint on your main app:

```
https://YOUR-MAIN-APP-URL.base44.com/api/functions/getPublicShiftDetails?shift_id=SHIFT_ID
```

**Important Notes:**
- The function `getPublicShiftDetails` is already created in your main app
- It uses service role access (no authentication required)
- It returns sanitized public shift data
- It only shows open/filled shifts (not cancelled/closed)

---

## Step 4: Test the Flow

1. **Generate a share link** from your main app:
   - Go to My Shifts
   - Click WhatsApp or Share button on any shift
   - This generates: `https://shifts.pharmanet.ca/PublicShift?id=SHIFT_ID`

2. **Visit the link** in the external app:
   - It should load the shift details
   - Click "Apply for This Shift"
   - Should redirect to main app's ShiftDetails page

3. **Main app login flow**:
   - If user is logged in → shows application form
   - If not logged in → redirects to login first

---

## Step 5: Environment Variables (Optional)

For cleaner code, you can store the main app URL as an environment variable:

In your external app dashboard → Settings → Environment Variables:
```
MAIN_APP_URL=https://your-main-app-slug.base44.com
```

Then use it in code:
```jsx
const MAIN_APP_URL = import.meta.env.MAIN_APP_URL || 'https://pharmanet.base44.com';
```

---

## Troubleshooting

### Issue: "Shift Not Found"
- Check that the shift ID is correct in the URL
- Verify the shift status is not 'cancelled' or 'closed'
- Check browser console for API errors

### Issue: CORS Errors
- Base44 apps automatically handle CORS between apps
- If issues persist, contact Base44 support

### Issue: "Page Not Found"
- Ensure page is named exactly `PublicShift.js` (case-sensitive)
- Check that the page file is in the `pages/` folder

---

## Summary

✅ External app calls main app's public API  
✅ No authentication required for viewing  
✅ Apply button redirects to main app for login/application  
✅ Clean separation between public portal and main app  

Your public shift portal is now live at `https://shifts.pharmanet.ca/PublicShift?id=SHIFT_ID`!