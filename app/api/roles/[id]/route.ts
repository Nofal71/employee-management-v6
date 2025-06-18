import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, permissions } = await request.json()

    // Check if role exists and belongs to company
    const existingRole = await prisma.role.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    // Update role in transaction
    const role = await prisma.$transaction(async (tx) => {
      // Update role basic info
      const updatedRole = await tx.role.update({
        where: { id: params.id },
        data: {
          ...(name && !existingRole.isDefault && { name: name.trim() }),
          description: description?.trim() || null,
        },
      })

      // Update permissions if provided
      if (Array.isArray(permissions)) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: params.id },
        })

        // Add new permissions
        if (permissions.length > 0) {
          await tx.rolePermission.createMany({
            data: permissions.map((permissionId: string) => ({
              roleId: params.id,
              permissionId,
            })),
          })
        }
      }

      return updatedRole
    })

    return NextResponse.json(role)
  } catch (error) {
    console.error("Failed to update role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if role exists and belongs to company
    const role = await prisma.role.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }

    if (role.isDefault) {
      return NextResponse.json({ error: "Cannot delete default roles" }, { status: 400 })
    }

    if (role._count.users > 0) {
      return NextResponse.json({ error: "Cannot delete role with assigned users" }, { status: 400 })
    }

    await prisma.role.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Role deleted successfully" })
  } catch (error) {
    console.error("Failed to delete role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
