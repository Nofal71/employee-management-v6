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

  // Create company
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

  // Check if owner role exists
  let ownerRole = await prisma.role.findFirst({
    where: {
      name: "Owner",
      companyId: company.id,
    },
  })

  if (!ownerRole) {
    ownerRole = await prisma.role.create({
      data: {
        name: "Owner",
        description: "Full system access",
        companyId: company.id,
      },
    })

    // Connect permissions to owner role using RolePermission junction table
    for (const permission of permissions) {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permission.name },
      })

      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: ownerRole.id,
              permissionId: permissionRecord.id,
            },
          },
          update: {},
          create: {
            roleId: ownerRole.id,
            permissionId: permissionRecord.id,
          },
        })
      }
    }
  }

  // Check if employee role exists
  let employeeRole = await prisma.role.findFirst({
    where: {
      name: "Employee",
      companyId: company.id,
    },
  })

  if (!employeeRole) {
    employeeRole = await prisma.role.create({
      data: {
        name: "Employee",
        description: "Basic employee access",
        companyId: company.id,
      },
    })
  }

  // Check if team lead role exists
  let teamLeadRole = await prisma.role.findFirst({
    where: {
      name: "Team Lead",
      companyId: company.id,
    },
  })

  if (!teamLeadRole) {
    teamLeadRole = await prisma.role.create({
      data: {
        name: "Team Lead",
        description: "Can manage assigned teams",
        companyId: company.id,
      },
    })

    // Connect specific permissions to team lead role
    const teamLeadPermissions = ["manage_assigned_teams", "view_all_timesheets"]
    for (const permissionName of teamLeadPermissions) {
      const permissionRecord = await prisma.permission.findUnique({
        where: { name: permissionName },
      })

      if (permissionRecord) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: teamLeadRole.id,
              permissionId: permissionRecord.id,
            },
          },
          update: {},
          create: {
            roleId: teamLeadRole.id,
            permissionId: permissionRecord.id,
          },
        })
      }
    }
  }

  // Create owner user
  console.log("👤 Creating owner user...")
  const hashedPassword = await bcrypt.hash("admin123", 12)

  let owner = await prisma.user.findUnique({
    where: { email: "admin@acme.com" },
  })

  if (!owner) {
    owner = await prisma.user.create({
      data: {
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
  }

  // Create sample employee
  console.log("👤 Creating sample employee...")
  const employeePassword = await bcrypt.hash("employee123", 12)

  let employee = await prisma.user.findUnique({
    where: { email: "employee@acme.com" },
  })

  if (!employee) {
    employee = await prisma.user.create({
      data: {
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
  }

  // Create sample team lead
  console.log("👤 Creating sample team lead...")
  const teamLeadPassword = await bcrypt.hash("teamlead123", 12)

  let teamLead = await prisma.user.findUnique({
    where: { email: "teamlead@acme.com" },
  })

  if (!teamLead) {
    teamLead = await prisma.user.create({
      data: {
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
  }

  // Create sample projects
  console.log("📁 Creating sample projects...")
  let project1 = await prisma.project.findFirst({
    where: {
      name: "Website Redesign",
      companyId: company.id,
    },
  })

  if (!project1) {
    project1 = await prisma.project.create({
      data: {
        name: "Website Redesign",
        description: "Complete redesign of company website",
        isActive: true,
        companyId: company.id,
        createdById: owner.id,
      },
    })
  }

  let project2 = await prisma.project.findFirst({
    where: {
      name: "Mobile App Development",
      companyId: company.id,
    },
  })

  if (!project2) {
    project2 = await prisma.project.create({
      data: {
        name: "Mobile App Development",
        description: "Develop mobile application for iOS and Android",
        isActive: true,
        companyId: company.id,
        createdById: owner.id,
      },
    })
  }

  // Create sample teams
  console.log("👥 Creating sample teams...")
  let devTeam = await prisma.team.findFirst({
    where: {
      name: "Development Team",
      companyId: company.id,
    },
  })

  if (!devTeam) {
    devTeam = await prisma.team.create({
      data: {
        name: "Development Team",
        description: "Frontend and backend developers",
        companyId: company.id,
      },
    })
  }

  let qaTeam = await prisma.team.findFirst({
    where: {
      name: "QA Team",
      companyId: company.id,
    },
  })

  if (!qaTeam) {
    qaTeam = await prisma.team.create({
      data: {
        name: "QA Team",
        description: "Quality assurance and testing team",
        companyId: company.id,
      },
    })
  }

  // Assign team members
  console.log("🔗 Assigning team members...")
  const existingDevMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: devTeam.id,
        userId: employee.id,
      },
    },
  })

  if (!existingDevMember) {
    await prisma.teamMember.create({
      data: {
        teamId: devTeam.id,
        userId: employee.id,
      },
    })
  }

  const existingQaMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: qaTeam.id,
        userId: teamLead.id,
      },
    },
  })

  if (!existingQaMember) {
    await prisma.teamMember.create({
      data: {
        teamId: qaTeam.id,
        userId: teamLead.id,
      },
    })
  }

  // Assign projects to teams
  console.log("🔗 Assigning projects to teams...")
  const existingProject1Assignment = await prisma.teamProject.findUnique({
    where: {
      teamId_projectId: {
        teamId: devTeam.id,
        projectId: project1.id,
      },
    },
  })

  if (!existingProject1Assignment) {
    await prisma.teamProject.create({
      data: {
        teamId: devTeam.id,
        projectId: project1.id,
      },
    })
  }

  const existingProject2Assignment = await prisma.teamProject.findUnique({
    where: {
      teamId_projectId: {
        teamId: devTeam.id,
        projectId: project2.id,
      },
    },
  })

  if (!existingProject2Assignment) {
    await prisma.teamProject.create({
      data: {
        teamId: devTeam.id,
        projectId: project2.id,
      },
    })
  }

  console.log("✅ Database seeded successfully!")
  console.log("\n📋 Login credentials:")
  console.log("Owner: admin@acme.com / admin123")
  console.log("Employee: employee@acme.com / employee123")
  console.log("Team Lead: teamlead@acme.com / teamlead123")
  console.log("\n🔑 Permissions assigned:")
  console.log("- Owner: All permissions")
  console.log("- Team Lead: manage_assigned_teams, view_all_timesheets")
  console.log("- Employee: No special permissions")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
