import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.GENERATE_REPORTS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const user = searchParams.get("user")
    const project = searchParams.get("project")
    const team = searchParams.get("team")

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }

    // Build timesheet filter
    const timesheetFilter: any = {
      project: { companyId: session.user.companyId },
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(user && user !== "all" && { userId: user }),
      ...(project && project !== "all" && { projectId: project }),
    }

    // Add team filter if specified
    if (team && team !== "all") {
      timesheetFilter.user = {
        teamMembers: {
          some: {
            teamId: team,
          },
        },
      }
    }

    // Get all timesheets with filters
    const timesheets = await prisma.timesheet.findMany({
      where: timesheetFilter,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, name: true, amount: true, isPaid: true },
        },
      },
    })

    // Calculate summary
    const totalHours = timesheets.reduce((sum, entry) => sum + Number(entry.hours), 0)
    const paidProjects = await prisma.project.findMany({
      where: {
        companyId: session.user.companyId,
        isPaid: true,
        amount: { not: null },
        ...(project && project !== "all" && { id: project }),
      },
    })
    const totalRevenue = paidProjects.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    // Get counts
    const totalProjects = await prisma.project.count({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        ...(project && project !== "all" && { id: project }),
      },
    })

    const totalUsers = await prisma.user.count({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        ...(user && user !== "all" && { id: user }),
      },
    })

    // User hours aggregation
    const userHours = Object.values(
      timesheets.reduce((acc: any, entry) => {
        const userId = entry.user.id
        const userName = `${entry.user.firstName} ${entry.user.lastName}`
        if (!acc[userId]) {
          acc[userId] = {
            userId,
            userName,
            hours: 0,
            projects: new Set(),
          }
        }
        acc[userId].hours += Number(entry.hours)
        acc[userId].projects.add(entry.project.id)
        return acc
      }, {}),
    ).map((user: any) => ({
      ...user,
      projects: user.projects.size,
    }))

    // Project hours aggregation
    const projectHours = Object.values(
      timesheets.reduce((acc: any, entry) => {
        const projectId = entry.project.id
        const projectName = entry.project.name
        if (!acc[projectId]) {
          acc[projectId] = {
            projectId,
            projectName,
            hours: 0,
            revenue: Number(entry.project.amount || 0),
            users: new Set(),
          }
        }
        acc[projectId].hours += Number(entry.hours)
        acc[projectId].users.add(entry.user.id)
        return acc
      }, {}),
    ).map((project: any) => ({
      ...project,
      users: project.users.size,
    }))

    // Team hours aggregation (if teams exist)
    const teamHours: any[] = []
    if (team === "all" || !team) {
      const teams = await prisma.team.findMany({
        where: { companyId: session.user.companyId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      })

      for (const teamData of teams) {
        const teamUserIds = teamData.members.map((m) => m.user.id)
        const teamTimesheets = timesheets.filter((t) => teamUserIds.includes(t.user.id))
        const teamTotalHours = teamTimesheets.reduce((sum, entry) => sum + Number(entry.hours), 0)

        if (teamTotalHours > 0) {
          teamHours.push({
            teamId: teamData.id,
            teamName: teamData.name,
            hours: teamTotalHours,
            members: teamData.members.length,
          })
        }
      }
    }

    // Daily hours aggregation
    const dailyHours = Object.entries(
      timesheets.reduce((acc: any, entry) => {
        const date = entry.date.toISOString().split("T")[0]
        if (!acc[date]) {
          acc[date] = 0
        }
        acc[date] += Number(entry.hours)
        return acc
      }, {}),
    )
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const reportData = {
      summary: {
        totalHours,
        totalRevenue,
        totalProjects,
        totalUsers,
      },
      userHours,
      projectHours,
      teamHours,
      dailyHours,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error("Failed to generate report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
