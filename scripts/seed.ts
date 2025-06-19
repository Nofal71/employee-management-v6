import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Create permissions
  const permissions = [
    { name: "manage_users", description: "Can create, edit, and manage users" },
    { name: "manage_roles", description: "Can create and edit roles and permissions" },
    { name: "view_analytics", description: "Can view dashboard analytics and reports" },
    { name: "delete_users", description: "Can delete users from the system" },
    { name: "edit_settings", description: "Can modify system settings" },
    { name: "manage_projects", description: "Can create, edit, and manage projects" },
    { name: "manage_teams", description: "Can create, edit, and manage all teams" },
    { name: "manage_assigned_teams", description: "Can manage only teams user is assigned to" },
    { name: "view_all_timesheets", description: "Can view all user timesheets" },
    { name: "edit_all_timesheets", description: "Can edit all user timesheets" },
    { name: "manage_timesheets", description: "Can manage timesheet entries for all users" },
    { name: "generate_reports", description: "Can generate and export reports" },
  ]

  console.log("📝 Creating permissions...")
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  // Create company - using findFirst and create instead of upsert
  console.log("🏢 Creating company...")
  let company = await prisma.company.findFirst({
    where: { name: "Acme Corporation" },
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: "Acme Corporation",
      },
    })
  }

  // Create roles
  console.log("👥 Creating roles...")
  const ownerRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Owner",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Owner",
      description: "Full system access",
      companyId: company.id,
      permissions: {
        connect: permissions.map((p) => ({ name: p.name })),
      },
    },
  })

  const employeeRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Employee",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Employee",
      description: "Basic employee access",
      companyId: company.id,
    },
  })

  const teamLeadRole = await prisma.role.upsert({
    where: {
      name_companyId: {
        name: "Team Lead",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Team Lead",
      description: "Can manage assigned teams",
      companyId: company.id,
      permissions: {
        connect: [{ name: "manage_assigned_teams" }, { name: "view_all_timesheets" }],
      },
    },
  })

  // Create owner user
  console.log("👤 Creating owner user...")
  const hashedPassword = await bcrypt.hash("admin123", 12)

  const owner = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {},
    create: {
      email: "admin@acme.com",
      firstName: "Admin",
      lastName: "User",
      password: hashedPassword,
      isActive: true,
      profileCompleted: true,
      mustChangePassword: false,
      companyId: company.id,
      roleId: ownerRole.id,
    },
  })

  // Create sample employee
  console.log("👤 Creating sample employee...")
  const employeePassword = await bcrypt.hash("employee123", 12)

  const employee = await prisma.user.upsert({
    where: { email: "employee@acme.com" },
    update: {},
    create: {
      email: "employee@acme.com",
      firstName: "John",
      lastName: "Doe",
      password: employeePassword,
      isActive: true,
      profileCompleted: true,
      mustChangePassword: false,
      companyId: company.id,
      roleId: employeeRole.id,
    },
  })

  // Create sample team lead
  console.log("👤 Creating sample team lead...")
  const teamLeadPassword = await bcrypt.hash("teamlead123", 12)

  const teamLead = await prisma.user.upsert({
    where: { email: "teamlead@acme.com" },
    update: {},
    create: {
      email: "teamlead@acme.com",
      firstName: "Jane",
      lastName: "Smith",
      password: teamLeadPassword,
      isActive: true,
      profileCompleted: true,
      mustChangePassword: false,
      companyId: company.id,
      roleId: teamLeadRole.id,
    },
  })

  // Create sample projects
  console.log("📁 Creating sample projects...")
  const project1 = await prisma.project.upsert({
    where: {
      name_companyId: {
        name: "Website Redesign",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Website Redesign",
      description: "Complete redesign of company website",
      isActive: true,
      companyId: company.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: {
      name_companyId: {
        name: "Mobile App Development",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Mobile App Development",
      description: "Develop mobile application for iOS and Android",
      isActive: true,
      companyId: company.id,
    },
  })

  // Create sample teams
  console.log("👥 Creating sample teams...")
  const devTeam = await prisma.team.upsert({
    where: {
      name_companyId: {
        name: "Development Team",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "Development Team",
      description: "Frontend and backend developers",
      companyId: company.id,
    },
  })

  const qaTeam = await prisma.team.upsert({
    where: {
      name_companyId: {
        name: "QA Team",
        companyId: company.id,
      },
    },
    update: {},
    create: {
      name: "QA Team",
      description: "Quality assurance and testing team",
      companyId: company.id,
    },
  })

  // Assign team members
  console.log("🔗 Assigning team members...")
  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: devTeam.id,
        userId: employee.id,
      },
    },
    update: {},
    create: {
      teamId: devTeam.id,
      userId: employee.id,
    },
  })

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: qaTeam.id,
        userId: teamLead.id,
      },
    },
    update: {},
    create: {
      teamId: qaTeam.id,
      userId: teamLead.id,
    },
  })

  // Assign projects to teams
  console.log("🔗 Assigning projects to teams...")
  await prisma.teamProject.upsert({
    where: {
      teamId_projectId: {
        teamId: devTeam.id,
        projectId: project1.id,
      },
    },
    update: {},
    create: {
      teamId: devTeam.id,
      projectId: project1.id,
    },
  })

  await prisma.teamProject.upsert({
    where: {
      teamId_projectId: {
        teamId: devTeam.id,
        projectId: project2.id,
      },
    },
    update: {},
    create: {
      teamId: devTeam.id,
      projectId: project2.id,
    },
  })

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Login credentials:")
  console.log("Owner: admin@acme.com / admin123")
  console.log("Employee: employee@acme.com / employee123")
  console.log("Team Lead: teamlead@acme.com / teamlead123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
