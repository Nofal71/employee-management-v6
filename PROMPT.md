# Project Management System - Complete Generation Prompt

Use this prompt to generate an exact duplicate of this comprehensive project management system:

---

Create a full-featured project management system web application with the following specifications:

## Core Technologies
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, MySQL/PostgreSQL
- **Authentication**: NextAuth.js with credentials provider
- **UI Components**: shadcn/ui components library
- **Charts**: Recharts for analytics and data visualization
- **Icons**: Lucide React icons
- **Styling**: Tailwind CSS with custom theme support

## Database Schema (Prisma)

### Companies
\`\`\`prisma
model Company {
  id        String   @id @default(cuid())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  users     User[]
  projects  Project[]
  teams     Team[]
  roles     Role[]
}
\`\`\`

### Users
\`\`\`prisma
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  firstName         String
  lastName          String
  password          String
  isActive          Boolean   @default(true)
  profileCompleted  Boolean   @default(false)
  mustChangePassword Boolean  @default(false)
  companyId         String
  roleId            String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  company           Company   @relation(fields: [companyId], references: [id])
  role              Role?     @relation(fields: [roleId], references: [id])
  teamMemberships   TeamMember[]
  timesheets        Timesheet[]
  trainings         Training[]  // New training/certification module
}
\`\`\`

### Training/Certification Module
\`\`\`prisma
model Training {
  id               String   @id @default(cuid())
  courseName       String
  courseLink       String?
  courseCategory   String
  organizationName String
  certificateTitle String
  level            String   // beginner, intermediate, advanced
  startDate        DateTime
  endDate          DateTime?
  expectedEndDate  DateTime?
  status           String   // started, in_progress, completed, others
  outcome          String   // certificate, demo, others
  notes            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  userId           String
  user             User     @relation(fields: [userId], references: [id])
}
\`\`\`

### Roles & Permissions
\`\`\`prisma
model Role {
  id          String   @id @default(cuid())
  name        String
  description String?
  isDefault   Boolean  @default(false)
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(fields: [companyId], references: [id])
  users       User[]
  permissions RolePermission[]
  
  @@unique([name, companyId])
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  
  @@id([roleId, permissionId])
}
\`\`\`

### Projects
\`\`\`prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(fields: [companyId], references: [id])
  teams       TeamProject[]
  timesheets  Timesheet[]
  
  @@unique([name, companyId])
}
\`\`\`

### Teams
\`\`\`prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  companyId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(fields: [companyId], references: [id])
  members     TeamMember[]
  projects    TeamProject[]
  
  @@unique([name, companyId])
}

model TeamMember {
  teamId    String
  userId    String
  joinedAt  DateTime @default(now())
  
  team      Team     @relation(fields: [teamId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  
  @@id([teamId, userId])
}

model TeamProject {
  teamId    String
  projectId String
  assignedAt DateTime @default(now())
  
  team      Team     @relation(fields: [teamId], references: [id])
  project   Project  @relation(fields: [projectId], references: [id])
  
  @@id([teamId, projectId])
}
\`\`\`

### Timesheets
\`\`\`prisma
model Timesheet {
  id          String   @id @default(cuid())
  userId      String
  projectId   String
  date        DateTime
  hours       Float
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  project     Project  @relation(fields: [projectId], references: [id])
  
  @@unique([userId, projectId, date])
}
\`\`\`

## Permission System
Implement comprehensive role-based access control with these permissions:

### Core Permissions
- **manage_users**: Create, edit, activate/deactivate users
- **manage_roles**: Create and edit roles and permissions
- **view_analytics**: Access dashboard analytics and reports
- **delete_users**: Delete user accounts permanently
- **edit_settings**: Modify system and company settings

### Project & Team Management
- **manage_projects**: Create, edit, and manage projects
- **manage_teams**: Create, edit, and manage all teams
- **manage_assigned_teams**: **NEW** - Manage only teams user is assigned to (for team leads)

### Timesheet Management
- **view_all_timesheets**: View timesheets for all users
- **edit_all_timesheets**: Edit timesheets for all users
- **manage_timesheets**: Full timesheet management including creating entries for others

### Reporting
- **generate_reports**: Access and generate reports with export functionality

## Authentication & Security

### Authentication Flow
1. **Company Signup**: Creates company and owner account simultaneously
2. **User Login**: Secure credentials-based authentication
3. **Profile Completion**: Required after first login for new users
4. **Password Management**: Secure password change with session update and redirect to dashboard
5. **Role-based Access**: Different permissions and landing pages

### Security Features
- Password hashing with bcrypt (12 rounds)
- JWT-based session management via NextAuth.js
- Role-based route protection with middleware
- API endpoint authorization checks
- Input validation and sanitization
- CSRF protection via NextAuth.js
- Secure cookie handling

## Pages and Features

### 1. Dashboard (/dashboard)
**Features:**
- Analytics cards: total users, projects, teams, active hours
- Interactive charts: project hours distribution, revenue trends, user activity
- Advanced filtering: by project, user, date range
- Personalized experience based on user permissions
- Recent activity feed with real-time updates
- Responsive design with mobile optimization

**Permissions Required:**
- Basic access for all authenticated users
- \`view_analytics\` for full analytics dashboard

### 2. User Management (/users)
**Features:**
- Complete CRUD operations for user accounts
- Advanced user table with sorting, filtering, pagination
- Role assignment and management interface
- User activation/deactivation controls
- Detailed user profile pages (/users/[id])
- Bulk operations for multiple users
- Search functionality with real-time results
- User creation with automatic email invitations

**Permissions Required:**
- \`manage_users\` for full user management
- \`delete_users\` for account deletion

### 3. Project Management (/projects)
**Features:**
- Full project lifecycle management
- Project status tracking and updates
- Team assignment to projects with multi-select interface
- Progress tracking and reporting
- Project archiving and restoration
- Advanced filtering and search capabilities
- Pagination for large project lists

**Permissions Required:**
- \`manage_projects\` for full project management

### 4. Team Management (/teams)
**Features:**
- Team creation and management
- **Enhanced Permission Handling**:
  - Users with \`manage_teams\`: Can see and manage all teams
  - Users with \`manage_assigned_teams\`: Can only see and manage teams they're assigned to
  - Sidebar shows "Teams" for both permission types
- **Clickable team rows** for navigation to detail pages
- **Team Detail Pages (/teams/[id])** with:
  - Complete team information and statistics
  - **Member Management**: Detailed user table with multi-select for adding/removing members
  - **Project Assignment**: Detailed project table with multi-select for assigning/removing projects
  - Team activity history and analytics
- Team-specific permission management for team leads
- Advanced search and filtering
- Pagination for large team datasets

**Permissions Required:**
- \`manage_teams\` for managing all teams
- \`manage_assigned_teams\` for managing only assigned teams (team leads)

### 5. Role Management (/roles)
**Features:**
- Complete role lifecycle management
- Granular permission assignment interface
- Default role protection (cannot delete/modify)
- Role usage statistics and analytics
- Permission descriptions and help text
- Role duplication and templating

**Permissions Required:**
- \`manage_roles\` for full role management

### 6. Timesheet Management (/timesheet)
**Features:**
- **Calendar-based interface** for intuitive time entry
- **Employee Restrictions**:
  - Can only edit current date entries (no historical editing)
  - Only assigned projects visible in dropdown
  - **One entry per project per day** validation
- **Manager Capabilities**:
  - View and edit all user timesheets
  - Create entries on behalf of other users
  - Historical data access and modification
- Time entry editing and deletion with audit trail
- Advanced filtering by user, project, date range
- Export functionality for payroll integration

**Permissions Required:**
- Basic access for personal timesheet management
- \`view_all_timesheets\` for viewing all user data
- \`edit_all_timesheets\` for editing any timesheet
- \`manage_timesheets\` for full management capabilities

### 7. **NEW** Training & Certification Management (/training)
**Features:**
- **Personal Training Dashboard**: Each user can manage their own training records
- **Comprehensive Training Records** with fields:
  - Course Name (required)
  - Course Link (optional URL)
  - Course Category (e.g., Technical, Soft Skills, Compliance)
  - Organization Name (training provider)
  - Certificate Name/Title
  - Level: Beginner, Intermediate, Advanced
  - Start Date (required)
  - End Date (for completed courses)
  - Expected End Date (for ongoing courses)
  - Status: Started, In Progress, Completed, Others
  - Outcome: Certificate, Demo, Others
  - Notes (optional additional information)
- **CRUD Operations**: Create, view, edit, delete training records
- **Advanced Filtering**: By status, level, category, date range
- **Search Functionality**: Search by course name, organization, category
- **Progress Tracking**: Visual indicators for training status
- **Export Capabilities**: Export training records for HR/compliance
- **Responsive Design**: Mobile-friendly interface for on-the-go access

**Access Control:**
- All authenticated users can access their own training records
- Managers with appropriate permissions can view team training records
- HR personnel can access company-wide training analytics

### 8. Reports (/reports)
**Features:**
- Comprehensive reporting dashboard
- Monthly and custom date range reports
- Project-based productivity reports
- User performance analytics
- **Training Reports**: Training completion rates, certification tracking
- Export functionality (CSV, PDF)
- Advanced filtering and grouping options
- Scheduled report generation
- Report sharing and collaboration

**Permissions Required:**
- \`generate_reports\` for full reporting access

### 9. Settings (/settings)
**Features:**
- Company information management
- System configuration options
- Branding and theme customization
- Integration settings
- Backup and restore functionality
- Audit log viewing

**Permissions Required:**
- \`edit_settings\` for system configuration

### 10. Profile Management
**Access Method:**
- **For Owners**: Accessible via header dropdown menu (three dots)
- **For Other Users**: Available in sidebar navigation

**Features:**
- Personal information editing
- Account details and role information
- Password change functionality
- Notification preferences
- Activity history

## UI/UX Requirements

### Layout & Navigation
- **Responsive sidebar navigation** with role-based menu items
- **Dynamic header** displaying company name and user dropdown
- **Collapsible sidebar** for mobile and tablet devices
- **Consistent card-based layouts** throughout the application
- **Loading states** and error handling for all interactions
- **Training icon** (GraduationCap) in sidebar for all users

### Data Tables
- **Pagination** for all large datasets with configurable page sizes
- **Advanced sorting** by multiple columns
- **Real-time search** with debounced input
- **Filtering** by multiple criteria
- **Bulk operations** with multi-select functionality
- **Export options** for data portability

### Forms & Interactions
- **Comprehensive form validation** with real-time feedback
- **Modal dialogs** for CRUD operations
- **Toast notifications** for user feedback
- **Loading spinners** and skeleton screens
- **Optimistic updates** for better user experience
- **Date pickers** for training start/end dates
- **Select dropdowns** for training levels, status, outcomes

### Responsive Design
- **Mobile-first approach** with progressive enhancement
- **Tablet optimization** for medium screen sizes
- **Desktop layouts** with efficient space utilization
- **Touch-friendly interfaces** for mobile devices
- **Keyboard navigation** support for accessibility

## API Architecture

### Authentication Endpoints
\`\`\`typescript
POST /api/auth/signup          // Company and owner creation
POST /api/auth/complete-profile // Profile completion
POST /api/auth/change-password  // Secure password updates (redirects to dashboard)
\`\`\`

### Resource Management APIs
\`\`\`typescript
// User Management
GET    /api/users              // List users with pagination
POST   /api/users              // Create new user
GET    /api/users/[id]         // Get user details
PUT    /api/users/[id]         // Update user
DELETE /api/users/[id]         // Delete user
GET    /api/users/[id]/projects // Get user's assigned projects

// Project Management
GET    /api/projects           // List projects with filtering
POST   /api/projects           // Create project
GET    /api/projects/[id]      // Get project details
PUT    /api/projects/[id]      // Update project
DELETE /api/projects/[id]      // Delete project

// Team Management (Enhanced)
GET    /api/teams              // List teams (all or assigned based on permissions)
GET    /api/teams?assignedOnly=true // List only assigned teams for team leads
POST   /api/teams              // Create team
GET    /api/teams/[id]         // Get team details with members/projects
PUT    /api/teams/[id]         // Update team
DELETE /api/teams/[id]         // Delete team
POST   /api/teams/[id]/members // Add team members
DELETE /api/teams/[id]/members // Remove team members
POST   /api/teams/[id]/projects // Assign projects to team
DELETE /api/teams/[id]/projects // Remove projects from team

// Training Management (NEW)
GET    /api/training           // Get user's training records with filtering
POST   /api/training           // Create new training record
GET    /api/training/[id]      // Get specific training record
PUT    /api/training/[id]      // Update training record
DELETE /api/training/[id]      // Delete training record

// Timesheet Management
GET    /api/timesheet          // Get timesheet entries with filtering
POST   /api/timesheet          // Create timesheet entry
GET    /api/timesheet/[id]     // Get specific entry
PUT    /api/timesheet/[id]     // Update entry
DELETE /api/timesheet/[id]     // Delete entry

// Analytics & Reporting
GET    /api/dashboard/stats    // Dashboard analytics
GET    /api/dashboard/user-stats // User-specific stats
GET    /api/reports            // Generate reports
GET    /api/reports/export     // Export report data

// System Management
GET    /api/company            // Get company information
PUT    /api/settings           // Update system settings
GET    /api/permissions        // List all permissions
\`\`\`

## Advanced Features

### Enhanced Team Management
- **Permission-based Team Access**:
  - \`manage_teams\`: Full access to all teams
  - \`manage_assigned_teams\`: Access only to assigned teams
  - API automatically filters teams based on user permissions
  - Clear UI indicators showing access level

### Training/Certification System
- **Comprehensive Training Tracking**:
  - Personal training dashboard for each user
  - Detailed training records with all relevant fields
  - Progress tracking and status management
  - Integration with reporting system
  - Export capabilities for compliance

### Pagination Implementation
\`\`\`typescript
// Standard pagination parameters
interface PaginationParams {
  page?: number;        // Current page (default: 1)
  limit?: number;       // Items per page (default: 10)
  search?: string;      // Search query
  sortBy?: string;      // Sort field
  sortOrder?: 'asc' | 'desc'; // Sort direction
}

// Pagination response format
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
\`\`\`

### Team Lead Permissions
- Create roles with \`manage_assigned_teams\` permission
- Team leads can only manage teams they are members of
- Restricted access prevents managing all teams
- Separate permission from full team management
- Clear UI feedback showing limited access

### Employee Timesheet Restrictions
- **Date Validation**: Only current date entries allowed for employees
- **Project Filtering**: Only assigned projects visible in dropdowns
- **Duplicate Prevention**: One entry per project per day validation
- **Historical Protection**: Past entries read-only for employees

### Data Export Features
- **CSV Export**: For spreadsheet integration
- **PDF Generation**: For formal reporting
- **Filtered Exports**: Export only filtered/searched data
- **Bulk Operations**: Mass data manipulation

## File Structure
\`\`\`plaintext
project-management-system/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── projects/
│   │   ├── teams/
│   │   ├── roles/
│   │   ├── timesheet/
│   │   ├── training/          # NEW - Training API routes
│   │   ├── reports/
│   │   ├── dashboard/
│   │   ├── company/
│   │   └── settings/
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── change-password/
│   │   └── complete-profile/
│   ├── dashboard/
│   ├── users/
│   │   └── [id]/
│   ├── projects/
│   ├── teams/
│   │   └── [id]/
│   ├── roles/
│   ├── timesheet/
│   ├── training/              # NEW - Training management page
│   ├── reports/
│   ├── settings/
│   ├── profile/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx
│   │   ├── sidebar.tsx        # Updated with training link
│   │   └── header.tsx
│   ├── ui/
│   │   ├── [shadcn-components]
│   │   ├── pagination.tsx
│   │   ├── error-message.tsx
│   │   └── loading-spinner.tsx
│   ├── providers.tsx
│   └── theme-provider.tsx
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── permissions.ts         # Updated with team permission logic
│   └── utils.ts
├── hooks/
│   └── use-toast.ts
├── prisma/
│   └── schema.prisma          # Updated with Training model
├── scripts/
│   └── seed.ts
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── package.json
└── tsconfig.json
\`\`\`

## Environment Variables
\`\`\`env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/project_management"

# Authentication
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email configuration for invitations
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
\`\`\`

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MySQL or PostgreSQL database
- Git for version control

### Installation Steps
\`\`\`bash
# 1. Clone and install dependencies
git clone <repository-url>
cd project-management-system
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database and auth settings

# 3. Set up database
npx prisma db push
npx prisma generate

# 4. Seed initial data
npx tsx scripts/seed.ts

# 5. Start development server
npm run dev
\`\`\`

### Default Login Credentials
After seeding, use these credentials:
- **Owner**: admin@acme.com / admin123
- **Employee**: employee@acme.com / employee123
- **Team Lead**: teamlead@acme.com / teamlead123

## Key Implementation Requirements

### Security Best Practices
- **Password Security**: bcrypt with 12 rounds minimum
- **Session Management**: Secure JWT tokens with proper expiration
- **Input Validation**: Comprehensive validation on all inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Protection**: Proper output encoding and CSP headers
- **CSRF Protection**: Built-in NextAuth.js protection

### Performance Optimization
- **Database Indexing**: Proper indexes on frequently queried fields
- **Query Optimization**: Efficient Prisma queries with proper includes
- **Caching Strategy**: API response caching where appropriate
- **Image Optimization**: Next.js Image component usage
- **Bundle Optimization**: Code splitting and tree shaking

### Error Handling
- **Global Error Boundaries**: React error boundaries for crash prevention
- **API Error Handling**: Consistent error response format
- **Form Validation**: Real-time validation with helpful error messages
- **Network Error Handling**: Retry logic and offline support
- **Logging**: Comprehensive error logging for debugging

### Accessibility
- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling in modals and forms
- **Semantic HTML**: Proper HTML structure and elements

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Critical user flow testing
- **Accessibility Tests**: Automated accessibility checking
- **Performance Tests**: Load testing for scalability

## Production Deployment

### Build Configuration
\`\`\`javascript
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
  images: {
    domains: ['localhost'],
  },
};

export default nextConfig;
\`\`\`

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CDN configured for static assets
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
- [ ] Performance monitoring enabled

Generate this complete system with all specified features, including the new training/certification module and enhanced team management permissions. Ensure proper error handling, comprehensive security measures, responsive design, and production-ready code quality. All TypeScript types should be properly defined, all edge cases handled, and the user experience should be smooth and intuitive.
