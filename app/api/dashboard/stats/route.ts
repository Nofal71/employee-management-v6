import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_ANALYTICS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const project = searchParams.get("project")
    const user = searchParams.get("user")

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }

    // Get total users
    const totalUsers = await prisma.user.count({
      where: { companyId: session.user.companyId, isActive: true },
    })

    // Get total projects
    const totalProjects = await prisma.project.count({
      where: { companyId: session.user.companyId, isActive: true },
    })

    // Get timesheet data with filters
    const timesheetFilter: any = {
      project: { companyId: session.user.companyId },
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(project && project !== "all" && { projectId: project }),
      ...(user && user !== "all" && { userId: user }),
    }

    const timesheets = await prisma.timesheet.findMany({
      where: timesheetFilter,
      include: {
        project: { select: { name: true, amount: true, isPaid: true } },
        user: { select: { firstName: true, lastName: true } },
      },
    })

    const totalHours = timesheets.reduce((sum, entry) => sum + Number(entry.hours), 0)

    // Calculate revenue from paid projects
    const paidProjects = await prisma.project.findMany({
      where: {
        companyId: session.user.companyId,
        isPaid: true,
        amount: { not: null },
      },
    })

    const totalRevenue = paidProjects.reduce((sum, project) => sum + Number(project.amount || 0), 0)

    // Project stats
    const projectStats = Object.values(
      timesheets.reduce((acc: any, entry) => {
        const projectName = entry.project.name
        if (!acc[projectName]) {
          acc[projectName] = {
            name: projectName,
            hours: 0,
            revenue: Number(entry.project.amount || 0),
          }
        }
        acc[projectName].hours += Number(entry.hours)
        return acc
      }, {}),
    )

    // User stats
    const userStats = Object.values(
      timesheets.reduce((acc: any, entry) => {
        const userName = `${entry.user.firstName} ${entry.user.lastName}`
        if (!acc[userName]) {
          acc[userName] = {
            name: userName,
            hours: 0,
          }
        }
        acc[userName].hours += Number(entry.hours)
        return acc
      }, {}),
    )

    return NextResponse.json({
      totalUsers,
      totalProjects,
      totalHours,
      totalRevenue,
      projectStats,
      userStats,
    })
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
