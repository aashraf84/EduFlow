---
Task ID: 1
Agent: full-stack-developer
Task: Fix ERP store, dashboard, and missing API routes

Work Log:
- Updated `/src/store/erp-store.ts`: Added `tenantCode` and `schoolId` to `AuthUser` interface, added standalone `tenantCode`, `schoolId`, `setTenantCode`, `setSchoolId` to store state. Updated `setUser` to auto-populate tenantCode/schoolId from user object.
- Fixed `/src/components/dashboard/dashboard-module.tsx`: Replaced `useAppStore` import with `useERPStore`, changed destructuring to get `tenantCode` and `schoolId` from ERP store, added `emptyDashboardData` constant, added `enabled` flag to skip query for OWNER/no-tenant users, added owner-specific empty state with redirect button to Owner Panel.
- Created `/src/app/api/auth/session/route.ts`: GET endpoint returning `{ authenticated: false }` for session check.
- Created `/src/app/api/auth/logout/route.ts`: POST endpoint returning `{ success: true }`.
- Fixed `/src/components/erp/login-page.tsx`: Updated all `onLogin` calls (regular login, demo login success, demo login fallback x2) to include `tenantCode` and `schoolId` from the API response.
- Fixed `/src/app/page.tsx`: Updated `handleLogin` to set `tenantCode` and `schoolId` in the ERP store, and redirect owner users to the 'owner' module on login.
- Fixed `/src/app/api/dashboard/route.ts`: Changed the 400 error for missing schoolCode to return a graceful empty dashboard response. Added handling for "OWNER" schoolCode to also return empty dashboard data.
- Verified owner users land on Owner Panel via `setActiveModule('owner')` in handleLogin.
- Ran `bun run lint` — no errors.

Stage Summary:
- The ERP store now has `tenantCode` and `schoolId` as both AuthUser fields and standalone state, enabling dashboard and other modules to access tenant context.
- Dashboard module uses the active ERP store (`useERPStore`) instead of the deprecated `useAppStore`, fixing the missing tenantCode issue that caused API failures.
- Missing API routes (`/api/auth/session`, `/api/auth/logout`) are now created.
- The dashboard API gracefully handles OWNER and empty schoolCode requests instead of returning errors.
- Owner users are automatically redirected to the Owner Panel on login and see a friendly message if they navigate to the dashboard.
