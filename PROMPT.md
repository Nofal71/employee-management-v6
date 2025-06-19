# Project Management System - Complete Generation Prompt

Use this prompt to generate an exact duplicate of this project management system:

---

Create a comprehensive project management system web application with the following specifications:

## Core Technologies
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, MySQL
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: shadcn/ui components
- **Charts**: Recharts for analytics
- **Icons**: Lucide React

## Database Schema (Prisma)
Create the following entities with proper relationships:

### Companies
- id, name, createdAt, updatedAt
- One-to-many with Users, Projects, Teams, Roles

### Users  
- id, email, firstName, lastName, password, isActive, profileCompleted, companyId, roleId
- Belongs to Company and Role
- Many-to-many with Teams through TeamMember
- One-to-many with Timesheets

### Roles
- id, name, description, isDefault, companyId
- Many-to-many with Permissions through RolePermission
- One-to-many with Users

### Permissions
- id, name, description
- Many-to-many with Roles through RolePermission

### Projects
- id, name, description, allocatedHours, paidAmount, isActive, companyId
- Many-to-many with Teams through TeamProject
- One-to-many with Timesheets

### Teams
- id, name, description, companyId
- Many-to-many with Users through TeamMember
- Many-to-many with Projects through TeamProject

### Timesheets
- id, userId, projectId, date, hours, description, createdAt
- Belongs to User and Project

## Permission System
Implement granular role-based access control with these permissions:
- manage_users: Create, edit, activate/deactivate users
- manage_roles: Create and edit roles and permissions  
- view_analytics: Access dashboard analytics
- delete_users: Delete user accounts
- edit_settings: Modify system settings
- manage_projects: Create and manage projects
- manage_teams: Create and manage teams
- manage_assigned_teams: Manage only assigned teams (for team leads)
- view_all_timesheets: View all user timesheets
- edit_all_timesheets: Edit any user's timesheet
- manage_timesheets: Full timesheet management including creating entries for others
- generate_reports: Access reporting features

## Default Roles
- **Owner**: All permissions
- **Employee**: No default permissions (basic access only)

## Authentication Flow
1. **Signup**: Creates company and owner account
2. **Login**: Credentials-based authentication
3. **Profile Completion**: Required after first login
4. **Password Change**: Secure password update flow
5. **Role-based Redirects**: Different landing pages based on permissions

## Pages and Features

### 1. Dashboard (/dashboard)
- Analytics cards showing total users, projects, teams, hours
- Charts for project hours, revenue trends, user activity
- Filtering by project, user, date range
- Personalized welcome for users without analytics access
- Recent activity feed

### 2. User Management (/users)
- CRUD operations for users
- Role assignment and management
- User activation/deactivation
- Detailed user view page (/users/[id])
- Pagination for large datasets
- Search and filtering
- Bulk operations

### 3. Project Management (/projects)
- CRUD operations for projects
- Hour allocation and payment tracking
- Project status management
- Team assignment to projects
- Progress tracking
- Pagination and search

### 4. Team Management (/teams)
- CRUD operations for teams
- Team detail page (/teams/[id]) with:
  - Member management with detailed user table and multi-select
  - Project assignment with detailed project table and multi-select
  - Team information and statistics
- Member and project assignment
- Team-based permissions for team leads
- Pagination and search

### 5. Role Management (/roles)
- CRUD operations for roles
- Permission assignment interface
- Default role protection
- Role usage statistics
- Permission descriptions

### 6. Timesheet (/timesheet)
- Calendar-based time entry
- Project-specific time logging
- Restrictions for employees:
  - Can only edit current date entries
  - Only assigned projects visible
  - One entry per project per day
- Full management capabilities for managers
- Time entry editing and deletion
- User-specific and company-wide views

### 7. Reports (/reports)
- Monthly time reports
- Project-based reporting
- User productivity reports
- Export functionality (CSV/PDF)
- Advanced filtering options
- Pagination for large reports

### 8. Settings (/settings)
- Company information management
- System configuration
- Owner-only access
- Company branding settings

### 9. Profile (/profile)
- Personal information editing
- Account details view
- Role and permission display
- Password change link
- Accessible via header dropdown for owners, sidebar for others

## UI/UX Requirements

### Layout
- Responsive sidebar navigation with role-based menu items
- Dynamic header with company name and user dropdown
- Collapsible sidebar for mobile
- Consistent card-based layouts
- Loading states and error handling

### Components
- Data tables with sorting, filtering, pagination
- Modal dialogs for CRUD operations
- Form validation and error display
- Toast notifications for actions
- Loading spinners and skeletons
- Responsive design for all screen sizes

### Styling
- Modern, professional design using Tailwind CSS
- Consistent color scheme and typography
- Hover states and smooth transitions
- Accessible design with proper ARIA labels
- Dark/light mode support via theme provider

## API Structure

### Authentication Endpoints
- POST /api/auth/signup - Company and owner creation
- POST /api/auth/complete-profile - Profile completion
- POST /api/auth/change-password - Password updates

### Resource Endpoints
- /api/users - User CRUD with pagination and search
- /api/projects - Project CRUD with filtering
- /api/teams - Team CRUD with member/project management
- /api/roles - Role CRUD with permission management
- /api/timesheet - Timesheet CRUD with date filtering
- /api/reports - Report generation and export
- /api/dashboard/stats - Analytics data
- /api/settings - Company settings management

## Security Features
- Password hashing with bcrypt
- JWT-based session management
- Role-based route protection
- API endpoint authorization
- Input validation and sanitization
- CSRF protection
- Secure cookie handling

## Advanced Features

### Pagination
- Implement pagination for all data tables
- Configurable page sizes
- Search integration with pagination
- Loading states during page changes

### Team Lead Permissions
- Special permission for managing only assigned teams
- Restricted access to team management
- Cannot manage all teams, only assigned ones

### Timesheet Restrictions
- Employees can only log time for current date
- Only assigned projects visible to employees
- One entry per project per day validation
- Historical data protection for employees

### Data Export
- CSV export for reports
- PDF generation for formal reports
- Filtered data export
- Bulk data operations

## File Structure
\`\`\`
project-management-system/
├── app/
│   ├── api/
│   ├── auth/
│   ├── dashboard/
│   ├── users/
│   ├── projects/
│   ├── teams/
│   ├── roles/
│   ├── timesheet/
│   ├── reports/
│   ├── settings/
│   ├── profile/
│   └── layout.tsx
├── components/
│   ├── layout/
│   ├── ui/
│   └── providers.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── permissions.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── seed.ts
└── middleware.ts
\`\`\`

## Environment Variables
\`\`\`
DATABASE_URL="mysql://username:password@localhost:3306/project_management"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

## Installation Instructions
1. Clone and install dependencies
2. Set up MySQL database
3. Configure environment variables
4. Run Prisma migrations: `npx prisma db push`
5. Seed permissions: `npx tsx scripts/seed.ts`
6. Start development server: `npm run dev`

## Key Implementation Notes
- Use Server Components where possible for better performance
- Implement proper error boundaries and loading states
- Add comprehensive form validation
- Use optimistic updates for better UX
- Implement proper TypeScript types throughout
- Add comprehensive error handling and logging
- Use proper database indexing for performance
- Implement rate limiting for API endpoints

Generate this complete system with all features, proper error handling, responsive design, and production-ready code quality.
\`\`\`

Finally, let me update the seed script to include the new permission:

```ts file="scripts/seed.ts"
[v0-no-op-code-block-prefix]const permissions = [
  {
    name: "manage_users",
    description: "Create, edit, and manage user accounts",
  },
  {
    name: "manage_roles", 
    description: "Create and edit roles and permissions",
  },
  {
    name: "view_analytics",
    description: "Access dashboard analytics and reports",
  },
  {
    name: "delete_users",
    description: "Delete user accounts permanently",
  },
  {
    name: "edit_settings",
    description: "Modify system and company settings",
  },
  {
    name: "manage_projects",
    description: "Create and manage projects",
  },
  {
    name: "manage_teams",
    description: "Create and manage all teams",
  },
  {
    name: "manage_assigned_teams",
    description: "Manage only assigned teams (for team leads)",
  },
  {
    name: "view_all_timesheets",
    description: "View timesheets for all users",
  },
  {
    name: "edit_all_timesheets", 
    description: "Edit timesheets for all users",
  },
  {
    name: "manage_timesheets",
    description: "Full timesheet management including creating entries for others",
  },
  {
    name: "generate_reports",
    description: "Access and generate reports",
  },
]
