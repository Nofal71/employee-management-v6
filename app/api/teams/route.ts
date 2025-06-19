import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canManageTeams = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS)
    const canManageAssignedTeams = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ASSIGNED_TEAMS)

    if (!canManageTeams && !canManageAssignedTeams) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    let teams

    if (canManageTeams) {
      // Can see all teams
      teams = await prisma.team.findMany({
        where: {
          companyId: session.user.companyId,
        },
        include: {
          _count: {
            select: {
              members: true,
              teamProjects: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    } else {
      // Can only see teams they're assigned to
      teams = await prisma.team.findMany({
        where: {
          companyId: session.user.companyId,
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
        include: {
          _count: {
            select: {
              members: true,
              teamProjects: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return NextResponse.json(teams || [])
  } catch (error) {
    console.error("Failed to fetch teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    // Check if team name already exists in company
    const existingTeam = await prisma.team.findFirst({
      where: {
        name: name.trim(),
        companyId: session.user.companyId,
      },
    })

    if (existingTeam) {
      return NextResponse.json({ error: "Team name already exists" }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Failed to create team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
