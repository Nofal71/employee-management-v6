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

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    const userId = searchParams.get("userId")

    const canViewAll = hasPermission(session.user.permissions, PERMISSIONS.VIEW_ALL_TIMESHEETS)
    const canManage = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TIMESHEETS)

    const whereClause: any = {
      ...(date && { date: new Date(date) }),
    }

    if (!canViewAll && !canManage) {
      whereClause.userId = session.user.id
    } else if (userId && userId !== "all") {
      whereClause.userId = userId
    }

    const entries = await prisma.timesheet.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Failed to fetch timesheet entries:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, userId, date, hours, description } = await request.json()

    const canManage = hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TIMESHEETS)
    const finalUserId = canManage && userId ? userId : session.user.id

    const entry = await prisma.timesheet.create({
      data: {
        projectId,
        userId: finalUserId,
        date: new Date(date),
        hours: Number.parseFloat(hours),
        description,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error("Failed to create timesheet entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
