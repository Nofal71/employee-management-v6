import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const userId = searchParams.get("userId") || session.user.id

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }

    // Get user's total hours
    const totalHoursResult = await prisma.timesheet.aggregate({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      _sum: {
        hours: true,
      },
    })

    // Get user's active projects count
    const totalProjects = await prisma.timesheet.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      select: {
        projectId: true,
      },
      distinct: ["projectId"],
    })

    // Get recent entries
    const recentEntries = await prisma.timesheet.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      },
      include: {
        project: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    const stats = {
      totalHours: totalHoursResult._sum.hours || 0,
      totalProjects: totalProjects.length,
      recentEntries: recentEntries.map((entry) => ({
        project: entry.project.name,
        hours: entry.hours,
        date: entry.date.toISOString(),
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Failed to fetch user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
