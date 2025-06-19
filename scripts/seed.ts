import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create permissions
  const permissions = [
    { name: "manage_users", description: "Can manage users" },
    { name: "manage_roles", description: "Can manage roles" },
    { name: "view_analytics", description: "Can view analytics" },
    { name: "delete_users", description: "Can delete users" },
    { name: "edit_settings", description: "Can edit settings" },
    { name: "manage_projects", description: "Can manage projects" },
    { name: "manage_teams", description: "Can manage teams" },
    { name: "view_all_timesheets", description: "Can view all timesheets" },
    { name: "edit_all_timesheets", description: "Can edit all timesheets" },
    { name: "manage_timesheets", description: "Can manage timesheets for all users" },
    { name: "generate_reports", description: "Can generate reports" },
  ]

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
