# Employer Portal & Public Shift Details - Full Documentation

## Table of Contents
1. [Overview](#overview)
2. [Entity Architecture](#entity-architecture)
3. [Security & RLS Strategy](#security--rls-strategy)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Functions](#backend-functions)
6. [External App Integration](#external-app-integration)
7. [Complete Implementation Examples](#complete-implementation-examples)

---

## Overview

This documentation provides a complete guide for creating a public-facing shift details portal that allows employers to share shift postings via a public link. This can be implemented either as:
- A public page within the existing Base44 app
- A separate Base44 application that consumes the main app's data via API

**Use Case:** An employer posts a shift and wants to share it publicly (e.g., on social media, job boards) without requiring viewers to log in first.

---

## Entity Architecture

### 1. Shift Entity

**File:** `entities/Shift.json`

The `Shift` entity is the core data structure containing all shift details.

#### Key Properties:

```json
{
  "pharmacy_id": "string - Reference to Pharmacy entity",
  "pharmacy_name": "string - Denormalized for display",
  "pharmacy_address": "string - Denormalized",
  "pharmacy_city": "string - Denormalized",
  "pharmacy_province": "string - Denormalized",
  "pharmacy_software": "array - Software used at pharmacy",
  
  "title": "string - Shift title/job title",
  "description": "string - Detailed shift description",
  
  "shift_type": "enum - ['temporary', 'permanent', 'shift_relief', 'urgent']",
  "shift_date": "date - Primary shift date",
  "start_time": "string - HH:MM format",
  "end_time": "string - HH:MM format",
  
  "hourly_rate": "number - Pay rate in CAD",
  "total_hours": "number - Calculated hours",
  "total_pay": "number - Calculated total payment",
  
  "urgency_level": "enum - ['emergency', 'very_urgent', 'urgent', 'short_notice', 'moderate', 'reasonable', 'planned']",
  "days_ahead": "number - Days from posting to shift date",
  
  "status": "enum - ['open', 'filled', 'completed', 'cancelled', 'closed']",
  
  "is_multi_date": "boolean - Whether shift spans multiple dates",
  "shift_dates": "array - Array of date objects for multi-date shifts",
  
  "shift_includes": {
    "assistant_on_site": "boolean",
    "vaccination_injections": "boolean",
    "addiction_dispensing": "boolean",
    "methadone_suboxone": "boolean"
  },
  
  "requirements": {
    "years_experience": "number",
    "software_experience": "array"
  }
}
```

#### Why Denormalization?
Pharmacy data (`pharmacy_name`, `pharmacy_address`, etc.) is duplicated on the Shift entity to:
- Allow public access without exposing the entire Pharmacy entity
- Improve query performance (no joins needed)
- Maintain shift data even if pharmacy details change

### 2. Pharmacy Entity

**File:** `entities/Pharmacy.json`

Contains full pharmacy details, typically kept private.

```json
{
  "pharmacy_name": "string",
  "address": "string",
  "city": "string",
  "province": "string",
  "postal_code": "string",
  "phone": "string",
  "email": "email",
  "manager_name": "string",
  "software": "enum - Pharmacy management software"
}
```

### 3. ShiftApplication Entity

**File:** `entities/ShiftApplication.json`

Tracks applications to shifts (not needed for public view).

---

## Security & RLS Strategy

### Option 1: Fully Public Shifts (Recommended)

**Use Case:** You want anyone to view shift details without login.

**Entity RLS Configuration:**

```json
// entities/Shift.json
{
  "rls": {
    "create": {
      "$or": [
        { "user_condition": { "data.user_type": "employer" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "read": true,  // ← PUBLIC READ ACCESS
    "update": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

**Pros:**
- Simple implementation
- Direct entity access from frontend
- No backend function needed

**Cons:**
- All shift data is publicly visible
- Cannot hide sensitive details (full address, phone numbers)

### Option 2: Controlled Public Access via Backend Function

**Use Case:** You want to show limited information publicly, hiding sensitive details.

**Entity RLS Configuration:**

```json
// Keep RLS restricted to authenticated users
{
  "rls": {
    "read": {
      "$or": [
        { "user_condition": { "data.user_type": "pharmacist" } },
        { "user_condition": { "data.user_type": "employer" } },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

**Backend Function:** Create a proxy that returns sanitized data.

---

## Frontend Implementation

### Public Shift Details Page

**File:** `pages/PublicShiftDetails.js`

This page displays shift details without requiring authentication.

```javascript
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { 
  Calendar, Clock, DollarSign, MapPin, 
  Briefcase, Building2, ChevronRight, 
  CheckCircle2, AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function PublicShiftDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shiftId = searchParams.get("id");
  
  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShift();
  }, [shiftId]);

  const loadShift = async () => {
    if (!shiftId) {
      setError("No shift ID provided");
      setLoading(false);
      return;
    }

    try {
      // Option 1: Direct entity access (if RLS read: true)
      const shifts = await base44.entities.Shift.filter({ id: shiftId });
      
      if (!shifts || shifts.length === 0) {
        setError("Shift not found");
        setLoading(false);
        return;
      }

      const shiftData = shifts[0];
      
      // Only show open shifts publicly
      if (shiftData.status !== 'open') {
        setError("This shift is no longer available");
        setLoading(false);
        return;
      }

      setShift(shiftData);
    } catch (err) {
      console.error("Error loading shift:", err);
      setError("Failed to load shift details");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    // Redirect to login/signup with return URL
    base44.auth.redirectToLogin(window.location.href);
  };

  const getUrgencyColor = (level) => {
    const colors = {
      emergency: "bg-red-100 text-red-800 border-red-300",
      very_urgent: "bg-orange-100 text-orange-800 border-orange-300",
      urgent: "bg-yellow-100 text-yellow-800 border-yellow-300",
      short_notice: "bg-blue-100 text-blue-800 border-blue-300",
      moderate: "bg-green-100 text-green-800 border-green-300",
      reasonable: "bg-teal-100 text-teal-800 border-teal-300",
      planned: "bg-gray-100 text-gray-800 border-gray-300"
    };
    return colors[level] || colors.moderate;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading shift details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Shift Not Available</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {shift.title}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Building2 className="w-5 h-5" />
            <span className="text-lg">{shift.pharmacy_name}</span>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl mb-6">
          <CardContent className="p-6">
            {/* Urgency Badge */}
            <div className="mb-6">
              <Badge className={`${getUrgencyColor(shift.urgency_level)} border px-4 py-2 text-sm font-semibold`}>
                {shift.urgency_level.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            {/* Key Details Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {format(new Date(shift.shift_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Time */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Time</p>
                  <p className="text-lg font-bold text-gray-900">
                    {shift.start_time} - {shift.end_time}
                  </p>
                  <p className="text-sm text-gray-500">{shift.total_hours} hours</p>
                </div>
              </div>

              {/* Pay Rate */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Hourly Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${shift.hourly_rate}/hr
                  </p>
                  <p className="text-sm text-gray-500">Total: ${shift.total_pay}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Location</p>
                  <p className="text-lg font-bold text-gray-900">{shift.pharmacy_city}</p>
                  <p className="text-sm text-gray-500">{shift.pharmacy_province}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {shift.description && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Shift Description
                </h3>
                <p className="text-gray-700 leading-relaxed">{shift.description}</p>
              </div>
            )}

            {/* What's Included */}
            {shift.shift_includes && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">What's Included</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {shift.shift_includes.assistant_on_site && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Assistant on site</span>
                    </div>
                  )}
                  {shift.shift_includes.vaccination_injections && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Vaccination/Injections</span>
                    </div>
                  )}
                  {shift.shift_includes.addiction_dispensing && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Addiction dispensing</span>
                    </div>
                  )}
                  {shift.shift_includes.methadone_suboxone && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Methadone/Suboxone</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Software */}
            {shift.pharmacy_software && shift.pharmacy_software.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Pharmacy Software</h3>
                <div className="flex flex-wrap gap-2">
                  {shift.pharmacy_software.map((software, idx) => (
                    <Badge key={idx} variant="outline" className="px-3 py-1">
                      {software}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply Button */}
        <Card className="shadow-xl bg-gradient-to-r from-blue-600 to-purple-600">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready to Apply?
            </h2>
            <p className="text-blue-100 mb-6">
              Sign in or create an account to apply for this shift
            </p>
            <Button
              onClick={handleApply}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold px-8 py-6 text-lg"
            >
              Login to Apply
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## Backend Functions

### Function 1: Get Public Shift Details (Sanitized)

**File:** `functions/getPublicShiftDetails.js`

Use this approach if you want to control exactly what data is exposed publicly.

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { shift_id } = await req.json();

    if (!shift_id) {
      return Response.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const shifts = await base44.asServiceRole.entities.Shift.filter({ 
      id: shift_id,
      status: 'open' // Only return open shifts
    });

    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Return sanitized data - hide sensitive information
    const publicData = {
      id: shift.id,
      title: shift.title,
      description: shift.description,
      
      // Date/Time info
      shift_date: shift.shift_date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      total_hours: shift.total_hours,
      
      // Pay info
      hourly_rate: shift.hourly_rate,
      total_pay: shift.total_pay,
      
      // Limited location info - hide exact address
      pharmacy_name: shift.pharmacy_name,
      pharmacy_city: shift.pharmacy_city,
      pharmacy_province: shift.pharmacy_province,
      // NOT including: pharmacy_address, pharmacy_phone
      
      // Software
      pharmacy_software: shift.pharmacy_software,
      
      // Shift details
      shift_type: shift.shift_type,
      urgency_level: shift.urgency_level,
      shift_includes: shift.shift_includes,
      requirements: shift.requirements,
      
      // Multi-date info
      is_multi_date: shift.is_multi_date,
      shift_dates: shift.shift_dates,
      
      status: shift.status
    };

    return Response.json({
      success: true,
      shift: publicData
    });

  } catch (error) {
    console.error('Error fetching public shift:', error);
    return Response.json({ 
      error: 'Failed to load shift details' 
    }, { status: 500 });
  }
});
```

**Frontend Usage:**

```javascript
// Instead of direct entity access
const { data } = await base44.functions.invoke('getPublicShiftDetails', {
  shift_id: shiftId
});
setShift(data.shift);
```

### Function 2: Get Share Link

**File:** `functions/generateShiftShareLink.js`

Generates a shareable link for employers.

```javascript
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shift_id } = await req.json();

    // Verify the shift exists and belongs to the user
    const shifts = await base44.entities.Shift.filter({ id: shift_id });
    
    if (!shifts || shifts.length === 0) {
      return Response.json({ error: 'Shift not found' }, { status: 404 });
    }

    const shift = shifts[0];

    // Verify ownership
    if (shift.created_by !== user.email && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate share URL
    const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.app';
    const shareUrl = `${appUrl}/public-shift?id=${shift_id}`;

    return Response.json({
      success: true,
      share_url: shareUrl,
      shift_title: shift.title
    });

  } catch (error) {
    console.error('Error generating share link:', error);
    return Response.json({ 
      error: 'Failed to generate share link' 
    }, { status: 500 });
  }
});
```

---

## External App Integration

### Scenario: Separate Public-Facing Base44 App

If you want to create a completely separate Base44 application for public shift viewing:

#### Step 1: Expose API in Main App

Create a backend function that returns public shift data (as shown above).

#### Step 2: Call from External App

```javascript
// In the external Base44 app
async function fetchShiftFromMainApp(shiftId) {
  const mainAppUrl = 'https://main-app.base44.app';
  
  const response = await fetch(`${mainAppUrl}/functions/getPublicShiftDetails`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ shift_id: shiftId })
  });

  const data = await response.json();
  return data.shift;
}
```

#### Step 3: Handle CORS

In the main app's backend function, add CORS headers:

```javascript
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  // ... rest of the function

  return Response.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
});
```

---

## Complete Implementation Examples

### Example 1: Simple Public Page (RLS read: true)

**Entity:**
```json
{ "rls": { "read": true } }
```

**Page:** Direct entity access, no backend function needed.

### Example 2: Controlled Public Access

**Entity:**
```json
{ "rls": { "read": { /* restricted */ } } }
```

**Backend Function:** Proxy with sanitization.

**Page:** Call backend function instead of entity.

### Example 3: Share Button in Employer Dashboard

```javascript
// components/shift/ShareShiftButton.js
import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function ShareShiftButton({ shiftId }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const { data } = await base44.functions.invoke('generateShiftShareLink', {
      shift_id: shiftId
    });

    await navigator.clipboard.writeText(data.share_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button onClick={handleShare} variant="outline" size="sm">
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </>
      )}
    </Button>
  );
}
```

---

## Summary Checklist

✅ **Entity Setup**
- [ ] Set Shift entity RLS `read: true` OR create proxy function
- [ ] Ensure pharmacy data is denormalized on Shift entity

✅ **Frontend**
- [ ] Create `pages/PublicShiftDetails.js`
- [ ] Handle URL parameters (`?id=...`)
- [ ] Add "Login to Apply" button
- [ ] Style for mobile responsiveness

✅ **Backend (Optional)**
- [ ] Create `getPublicShiftDetails` function for sanitization
- [ ] Create `generateShiftShareLink` function
- [ ] Add CORS headers if needed for external apps

✅ **Employer Features**
- [ ] Add "Share" button to shift cards
- [ ] Generate and copy share links
- [ ] Preview public view

✅ **Security**
- [ ] Verify only open shifts are shown publicly
- [ ] Hide sensitive data (phone, exact address)
- [ ] Rate limit public endpoints if needed

---

## Additional Resources

- Base44 SDK Docs: https://docs.base44.com
- Stripe Integration: https://stripe.com/docs
- React Router: https://reactrouter.com

---

*This documentation was created for Base44 platform applications. Last updated: 2025-11-18*