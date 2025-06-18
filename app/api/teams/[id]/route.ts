import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const team = await prisma.team.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        teamProjects: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Failed to update team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.team.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Failed to delete team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
