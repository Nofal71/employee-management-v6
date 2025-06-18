import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { PERMISSIONS } from "@/lib/permissions"

export async function POST(request: NextRequest) {
  try {
    const { companyName, firstName, lastName, email, password } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create company and owner user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: { name: companyName },
      })

      // Create default permissions
      const permissions = await Promise.all([
        tx.permission.upsert({
          where: { name: PERMISSIONS.MANAGE_USERS },
          update: {},
          create: { name: PERMISSIONS.MANAGE_USERS, description: "Can manage users" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.MANAGE_ROLES },
          update: {},
          create: { name: PERMISSIONS.MANAGE_ROLES, description: "Can manage roles" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.VIEW_ANALYTICS },
          update: {},
          create: { name: PERMISSIONS.VIEW_ANALYTICS, description: "Can view analytics" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.DELETE_USERS },
          update: {},
          create: { name: PERMISSIONS.DELETE_USERS, description: "Can delete users" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.EDIT_SETTINGS },
          update: {},
          create: { name: PERMISSIONS.EDIT_SETTINGS, description: "Can edit settings" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.MANAGE_PROJECTS },
          update: {},
          create: { name: PERMISSIONS.MANAGE_PROJECTS, description: "Can manage projects" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.MANAGE_TEAMS },
          update: {},
          create: { name: PERMISSIONS.MANAGE_TEAMS, description: "Can manage teams" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.VIEW_ALL_TIMESHEETS },
          update: {},
          create: { name: PERMISSIONS.VIEW_ALL_TIMESHEETS, description: "Can view all timesheets" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.EDIT_ALL_TIMESHEETS },
          update: {},
          create: { name: PERMISSIONS.EDIT_ALL_TIMESHEETS, description: "Can edit all timesheets" },
        }),
        tx.permission.upsert({
          where: { name: PERMISSIONS.GENERATE_REPORTS },
          update: {},
          create: { name: PERMISSIONS.GENERATE_REPORTS, description: "Can generate reports" },
        }),
      ])

      // Create Owner role
      const ownerRole = await tx.role.create({
        data: {
          name: "Owner",
          description: "Company owner with full access",
          companyId: company.id,
          isDefault: true,
        },
      })

      // Create Employee role
      const employeeRole = await tx.role.create({
        data: {
          name: "Employee",
          description: "Basic employee access",
          companyId: company.id,
          isDefault: true,
        },
      })

      // Assign all permissions to Owner role
      await Promise.all(
        permissions.map((permission) =>
          tx.rolePermission.create({
            data: {
              roleId: ownerRole.id,
              permissionId: permission.id,
            },
          }),
        ),
      )

      // Create owner user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          companyId: company.id,
          roleId: ownerRole.id,
          mustChangePassword: false,
          profileCompleted: true,
        },
      })

      return { company, user }
    })

    return NextResponse.json({ message: "Company and owner account created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
