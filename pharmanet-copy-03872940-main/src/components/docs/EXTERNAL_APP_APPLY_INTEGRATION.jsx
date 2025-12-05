# External App Integration - Apply Button Setup

## Overview
This guide explains how external applications (WhatsApp, Email, SMS, etc.) can link directly to specific shifts and automatically open the shift details drawer for pharmacists to apply.

## URL Structure

### Basic Format
```
https://your-app-domain.com/BrowseShifts?shiftId=SHIFT_ID
```

### Parameters
- `shiftId` (required): The unique ID of the shift to display

## How It Works

1. **User clicks Apply button** in external app (WhatsApp, Email, etc.)
2. **Redirect to BrowseShifts page** with `shiftId` parameter
3. **Drawer automatically opens** showing shift details
4. **Pharmacist can apply** directly from the drawer

## Implementation Examples

### WhatsApp Message
```
🏥 New Shift Available!
📅 Date: Jan 25, 2025
⏰ Time: 9:00 AM - 5:00 PM
💰 Rate: $65/hr
📍 Location: Toronto Pharmacy

👉 Apply Now: https://your-app.com/BrowseShifts?shiftId=abc123xyz
```

### Email Template
```html
<a href="https://your-app.com/BrowseShifts?shiftId=abc123xyz" 
   style="background: #0891b2; color: white; padding: 12px 24px; 
          text-decoration: none; border-radius: 8px; display: inline-block;">
   Apply for This Shift
</a>
```

### SMS Template
```
New shift posted! $65/hr, Jan 25, 9am-5pm at Toronto Pharmacy. 
Apply here: https://your-app.com/BrowseShifts?shiftId=abc123xyz
```

## Frontend Implementation

The `BrowseShifts` page automatically:
1. Detects the `shiftId` parameter in the URL
2. Opens the `PharmacistShiftDetailsDrawer` component
3. Loads and displays shift details
4. Provides the Apply button for pharmacists

### Code Reference (BrowseShifts.js)
```javascript
// Auto-open drawer if shiftId is in URL
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const shiftId = params.get('shiftId');
  
  if (shiftId && shifts.length > 0) {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      setSelectedShift(shift);
      setShowDrawer(true);
    }
  }
}, [shifts]);
```

## Authentication Handling

- **Logged-in users**: Drawer opens immediately with shift details
- **Non-logged-in users**: Redirected to login, then back to shift after authentication

## Best Practices

### 1. URL Shortening (Recommended)
For SMS and character-limited platforms:
```javascript
// Use a URL shortener
const longUrl = `https://your-app.com/BrowseShifts?shiftId=${shiftId}`;
const shortUrl = await shortenUrl(longUrl); // e.g., bit.ly, tinyurl
```

### 2. Deep Link Format
For mobile apps:
```
pharmanet://shifts/abc123xyz
```

### 3. Tracking Parameters (Optional)
Add tracking to measure campaign effectiveness:
```
https://your-app.com/BrowseShifts?shiftId=abc123xyz&source=whatsapp&campaign=urgent
```

## Multi-Date Shifts

For shifts with multiple dates:
```
https://your-app.com/BrowseShifts?shiftId=SHIFT_ID&date=2025-01-25
```

The `date` parameter highlights a specific date within a multi-date shift posting.

## Testing Your Integration

1. **Create a test shift** in your employer dashboard
2. **Copy the shift ID** from the URL or database
3. **Construct the apply URL**: `https://your-app.com/BrowseShifts?shiftId=YOUR_SHIFT_ID`
4. **Test in different platforms**:
   - WhatsApp Web
   - Email client
   - SMS app
   - Browser directly
5. **Verify drawer opens** with correct shift details

## Error Handling

### Invalid Shift ID
If `shiftId` doesn't exist:
- User sees the normal BrowseShifts page
- No error message (silent fail)
- All shifts are listed

### Expired Shift
If shift date has passed:
- Drawer may still open (for reference)
- Apply button disabled
- "Shift Expired" message shown

## Backend Function (Optional)

Create a backend function to generate shareable links:

```javascript
// functions/generateShiftApplyLink.js
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.user_type !== 'employer') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shiftId } = await req.json();
    const appDomain = Deno.env.get("PUBLIC_APP_DOMAIN");
    
    const applyLink = `${appDomain}/BrowseShifts?shiftId=${shiftId}`;
    
    return Response.json({ 
      applyLink,
      shortLink: applyLink // TODO: Integrate URL shortener
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
```

## Analytics & Tracking

Track apply button clicks from external sources:

```javascript
// Add to PharmacistShiftDetailsDrawer.js
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  
  if (source && selectedShift) {
    // Track external apply click
    base44.functions.invoke('trackApplySource', {
      shiftId: selectedShift.id,
      source: source
    });
  }
}, [selectedShift]);
```

## Security Considerations

1. **No sensitive data in URLs**: Only include shift ID, not payment info
2. **Authentication required**: Apply action requires logged-in user
3. **Shift visibility**: Only shows shifts that are marked as "open"
4. **Rate limiting**: Consider rate limits on shift detail API calls

## Support & Questions

For technical support or questions about this integration:
- Check the `BrowseShifts.js` page implementation
- Review `PharmacistShiftDetailsDrawer.js` component
- Contact platform support team

---

**Last Updated**: November 2025  
**Version**: 1.0  
**Compatibility**: Base44 Platform v3+