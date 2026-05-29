# Task 5: AppShell and Dashboard (Control Tower)

## Summary
Built the main application shell with sidebar navigation and the comprehensive Control Tower dashboard for EduFlow OS.

## Files Created
- `src/components/shared/app-shell.tsx` — Main application shell with collapsible sidebar, header, and module routing
- `src/components/dashboard/dashboard-module.tsx` — Control Tower dashboard with KPIs, Recharts visualizations, alerts, and quick actions
- `src/components/landing/landing-page.tsx` — Landing page with hero section and auto-login
- `src/components/landing/login-page.tsx` — Login page with form
- `src/app/globals.css` — Added custom scrollbar styles

## Architecture

### AppShell (`src/components/shared/app-shell.tsx`)
- **Sidebar**: Uses shadcn/ui `Sidebar` component with `collapsible="icon"` mode
  - Logo header with gradient GraduationCap icon
  - 9 navigation items with icons, labels, and tooltip support
  - Active item highlighted with emerald accent + left indicator bar
  - `setModule()` from Zustand store called on click
  - User profile dropdown in footer with name, role, logout
  - Mobile: renders as Sheet drawer automatically
- **Header**: Sticky header with current module name, search bar, notification bell with badge, SidebarTrigger
- **Content Area**: `AnimatePresence` + `motion.div` for smooth module transitions
- **Module Routing**: `ModuleContent` component switches on `AppModule` type

### Dashboard Module (`src/components/dashboard/dashboard-module.tsx`)
- **Data Fetching**: React Query `useQuery` to `/api/dashboard` with 30s stale time
- **5 Rows of Content**:
  1. Top Stats: 4 StatCards (Students, Teachers, Attendance Rate, Fee Collection) with trends and color coding
  2. Charts: Attendance BarChart (14 days) + Performance LineChart (monthly)
  3. Pie Charts: Risk Distribution + Fee Collection Status + Gender Distribution
  4. Alerts & Announcements: Severity-colored alerts + Recent announcements with type badges
  5. Quick Actions: 6 action buttons grid
- **States**: Loading skeletons, error with retry, empty states with helpful messages
- **Animations**: Framer Motion stagger animations on cards

### Color Scheme
- Emerald/teal for primary data and active states
- Orange/amber for warnings
- Rose/red for alerts and critical items
- Sky for neutral/info, Violet for fees
- Color-coded attendance rate (green ≥90%, amber ≥75%, red <75%)

## Lint Fixes
- Removed `useMemo` with optional chaining dependency (React Compiler issue)
- Added missing `Brain` import from lucide-react

## Data Verification
- Dashboard API returns: 80 students, 12 teachers, 77.5% attendance, ₹4,46,000 collected, 7 high-risk students, 5 announcements
- All chart data renders correctly from real API responses
