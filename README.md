# Project Management System

A full-featured web application for project-based analytics, user and team management, project tracking, role-based access control, timesheet logging, reporting, and configuration settings.

## Features

- **Dashboard**: Analytics with filtering by project, user, date, activity, hours, and revenue
- **User Management**: CRUD operations, role assignment, activation/deactivation
- **Project Management**: CRUD operations, hour allocation, payment tracking
- **Team Management**: CRUD operations, member assignment, project allocation
- **Role Management**: CRUD operations with default roles (Owner, Admin, Team Lead, Employee)
- **Reports**: Monthly reports with filtering capabilities
- **Timesheet**: Role-based access, time entry, calendar integration
- **Settings**: General website settings for Owner role
- **Authentication**: Complete signup/login flow with role-based redirects

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes, Prisma ORM, MySQL
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd project-management-system
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your database connection string:
\`\`\`
DATABASE_URL="mysql://username:password@localhost:3306/project_management"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

4. Set up the database:
\`\`\`bash
npx prisma db push
\`\`\`

5. Seed the database with default permissions:
\`\`\`bash
npx tsx scripts/seed.ts
\`\`\`

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Setup

After creating a company account:

- **Owner Role**: Full access to all features
- **Employee Role**: Basic access (profile, timesheet, assigned teams/projects)
- Additional roles can be created as needed

## Database Schema

The application uses the following main entities:

- **Companies**: Organization data
- **Users**: User accounts with roles and permissions
- **Projects**: Project information with hour allocation and payment tracking
- **Teams**: Team organization and member management
- **Roles**: Role definitions with permissions
- **Permissions**: Granular access control
- **Timesheets**: Time tracking entries
- **Team/Project Assignments**: Many-to-many relationships

## Role-Based Access Control

The system implements granular permissions:

- `manage_users`: Create, edit, activate/deactivate users
- `manage_roles`: Create and edit roles and permissions
- `view_analytics`: Access dashboard analytics
- `delete_users`: Delete user accounts
- `edit_settings`: Modify system settings
- `manage_projects`: Create and manage projects
- `manage_teams`: Create and manage teams
- `view_all_timesheets`: View all user timesheets
- `edit_all_timesheets`: Edit any user's timesheet
- `generate_reports`: Access reporting features

## API Endpoints

- `POST /api/auth/signup` - Create company and owner account
- `GET/POST /api/users` - User management
- `GET/POST /api/projects` - Project management
- `GET/POST /api/timesheet` - Timesheet operations
- `GET /api/dashboard/stats` - Analytics data
- `GET/POST /api/roles` - Role management

## Deployment

The application is ready for deployment on Vercel or any Node.js hosting platform:

1. Set up your production database
2. Configure environment variables
3. Run database migrations: `npx prisma db push`
4. Seed permissions: `npx tsx scripts/seed.ts`
5. Deploy the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
