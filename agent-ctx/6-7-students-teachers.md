# Task 6-7: Students & Teachers Modules

## Summary
Created comprehensive student and teacher management modules for EduFlow OS, replacing the placeholder modules in the AppShell with fully functional CRUD interfaces.

## Files Created
- `src/components/students/students-module.tsx` (~620 lines)
- `src/components/teachers/teachers-module.tsx` (~600 lines)

## Files Modified
- `src/components/shared/app-shell.tsx` — Added imports for StudentsModule and TeachersModule, updated ModuleContent switch cases

## Architecture Decisions
1. **Consistent Pattern**: Both modules follow the same visual and structural pattern as the DashboardModule — StatCard grid → search/filters → data table → detail sheet
2. **Existing API Endpoints**: Leveraged the already-implemented `/api/students` and `/api/teachers` endpoints which support search, filtering, pagination, and creation
3. **Client-side Sort**: Added client-side sorting on top of server-side pagination/filtering for responsive column sorting
4. **Sheet for Detail View**: Used shadcn/ui Sheet (right-side drawer) for detail views instead of dialogs to allow comparison with the table while viewing details
5. **Simulated Detail Data**: For attendance rates, academic performance, behavior logs, and fee status within the detail sheets — these would need dedicated API endpoints in production
6. **Emerald/Teal Accent**: Students module uses emerald as primary accent, Teachers uses teal — matching the dashboard's design language

## Key Components
- **StatCard**: Reused from dashboard pattern with trend indicators
- **RiskBadge/StatusBadge**: Color-coded badges with contextual styling
- **StarRating**: 5-star visual rating component for teachers
- **AddStudentDialog/AddTeacherDialog**: Full form dialogs with zod validation + react-hook-form
- **StudentDetailSheet/TeacherDetailSheet**: Right-side sheets with tabbed content (Attendance, Academic/Subjects, Behavior/Timetable, Fees/Performance)

## Integration
- AppShell's ModuleContent now routes 'students' → StudentsModule and 'teachers' → TeachersModule
- Both modules use `useAppStore().user.schoolId` for API queries
- Both use React Query for data fetching with 15s stale time
- Both use Sonner for toast notifications on create success/failure
