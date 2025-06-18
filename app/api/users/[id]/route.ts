import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isActive, roleId, firstName, lastName } = await request.json()

    const user = await prisma.user.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(roleId && { roleId }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
      },
      include: {
        role: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Failed to update user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.DELETE_USERS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Failed to delete user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
