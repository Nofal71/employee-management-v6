import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roles = await prisma.role.findMany({
      where: { companyId: session.user.companyId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Failed to fetch roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, permissions } = await request.json()

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: {
          name,
          description,
          companyId: session.user.companyId,
        },
      })

      if (permissions && permissions.length > 0) {
        await Promise.all(
          permissions.map((permissionId: string) =>
            tx.rolePermission.create({
              data: {
                roleId: newRole.id,
                permissionId,
              },
            }),
          ),
        )
      }

      return newRole
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error("Failed to create role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
