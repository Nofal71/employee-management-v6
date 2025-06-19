import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS, canManageTeam } from "@/lib/permissions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Fetch team with members and projects
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: session.user.companyId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        teamProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                isActive: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if user can view this team
    const teamMemberIds = team.members.map((m) => m.user.id)
    const canView =
      hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS) ||
      canManageTeam(session.user.permissions, session.user.id, teamMemberIds)

    if (!canView) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    return NextResponse.json(team)
  } catch (error) {
    console.error("Failed to fetch team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Check if team exists and user can manage it
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: session.user.companyId,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const teamMemberIds = existingTeam.members.map((m) => m.userId)
    const canManage = canManageTeam(session.user.permissions, session.user.id, teamMemberIds)

    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    console.error("Failed to update team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teamId = params.id
    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    // Check if team exists and user can manage it
    const existingTeam = await prisma.team.findFirst({
      where: {
        id: teamId,
        companyId: session.user.companyId,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!existingTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const teamMemberIds = existingTeam.members.map((m) => m.userId)
    const canManage = canManageTeam(session.user.permissions, session.user.id, teamMemberIds)

    if (!canManage) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete team (cascade will handle members and projects)
    await prisma.team.delete({
      where: { id: teamId },
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Failed to delete team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
