# Route Protection Documentation

## Overview
The application uses a comprehensive route protection system that controls access based on:
- **Authentication Status**: User must be logged in
- **User Type**: `employer` or `pharmacist`
- **User Role**: `admin` or `user`

## Protection Components

### 1. `RouteProtection` (Main Component)
The core protection component with full customization options.

```jsx
import RouteProtection from "../components/auth/RouteProtection";

<RouteProtection 
  allowedUserTypes={['employer', 'pharmacist']}
  requireAdmin={false}
>
  <YourComponent />
</RouteProtection>
```

**Props:**
- `allowedUserTypes`: Array of user types allowed (e.g., `['employer']`)
- `requireAdmin`: Boolean, requires admin role if true

### 2. Convenience Wrappers

#### `EmployerOnly`
Restricts access to employers only (admins bypass).
```jsx
import { EmployerOnly } from "../components/auth/RouteProtection";

export default function MyPage() {
  return (
    <EmployerOnly>
      <Content />
    </EmployerOnly>
  );
}
```

#### `PharmacistOnly`
Restricts access to pharmacists only (admins bypass).
```jsx
import { PharmacistOnly } from "../components/auth/RouteProtection";

export default function MyPage() {
  return (
    <PharmacistOnly>
      <Content />
    </PharmacistOnly>
  );
}
```

#### `AdminOnly`
Restricts access to administrators only.
```jsx
import { AdminOnly } from "../components/auth/RouteProtection";

export default function AdminPanel() {
  return (
    <AdminOnly>
      <Content />
    </AdminOnly>
  );
}
```

#### `Authenticated`
Requires authentication but allows all user types.
```jsx
import { Authenticated } from "../components/auth/RouteProtection";

export default function Profile() {
  return (
    <Authenticated>
      <Content />
    </Authenticated>
  );
}
```

## Page Access Matrix

### Employer Pages
| Page | Protection | Admin Access |
|------|------------|--------------|
| EmployerDashboard | EmployerOnly | ✅ Yes |
| Pharmacies | EmployerOnly | ✅ Yes |
| MyShifts | EmployerOnly | ✅ Yes |
| PostShift | EmployerOnly | ✅ Yes |
| ManageApplications | EmployerOnly | ✅ Yes |
| AnalyticsReports | EmployerOnly | ✅ Yes |
| FindPharmacists | EmployerOnly | ✅ Yes |

### Pharmacist Pages
| Page | Protection | Admin Access |
|------|------------|--------------|
| PharmacistDashboard | PharmacistOnly | ✅ Yes |
| BrowseShifts | PharmacistOnly | ✅ Yes |
| MyApplications | PharmacistOnly | ✅ Yes |
| MySchedule | PharmacistOnly | ✅ Yes |
| ShiftDetails | PharmacistOnly | ✅ Yes |

### Shared Pages
| Page | Protection | Admin Access |
|------|------------|--------------|
| Profile | Authenticated | ✅ Yes |
| Dashboard | Authenticated | ✅ Yes |
| RoleSelection | Public | ✅ Yes |

## Admin Privileges
Users with `role: 'admin'` have special privileges:
- ✅ Bypass all user type restrictions
- ✅ Access both employer and pharmacist pages
- ✅ Access admin-only pages (if created)
- ✅ View all data across user types

## Security Features
1. **Server-side validation**: User data fetched from authenticated session
2. **Automatic redirects**: Unauthorized users redirected to appropriate dashboard
3. **Role selection enforcement**: Users without user_type sent to setup
4. **Error handling**: Graceful handling of auth failures
5. **Loading states**: Prevents flash of unauthorized content

## Redirect Logic
1. **No user_type** → RoleSelection page
2. **Wrong user_type** → Appropriate dashboard (Employer/Pharmacist)
3. **Not authenticated** → Login page
4. **Admin** → Allow access to all pages

## Implementation Example

```jsx
// pages/MyShifts.js
import { EmployerOnly } from "../components/auth/RouteProtection";

function MyShiftsContent() {
  // Your page logic
  return <div>My Shifts</div>;
}

export default function MyShifts() {
  return (
    <EmployerOnly>
      <MyShiftsContent />
    </EmployerOnly>
  );
}
```

## Testing Access Control
1. **Test as Employer**: Should access employer pages only
2. **Test as Pharmacist**: Should access pharmacist pages only
3. **Test as Admin**: Should access all pages
4. **Test Unauthenticated**: Should redirect to login
5. **Test No user_type**: Should redirect to role selection

## Migration from Old RoleProtection
The old `RoleProtection` component is deprecated but still works:
```jsx
// Old way (deprecated)
import RoleProtection from "../components/auth/RoleProtection";
<RoleProtection requiredRole="employer">...</RoleProtection>

// New way (recommended)
import { EmployerOnly } from "../components/auth/RouteProtection";
<EmployerOnly>...</EmployerOnly>
``