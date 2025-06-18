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

    const projects = await prisma.project.findMany({
      where: { companyId: session.user.companyId },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: { timesheets: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Failed to fetch projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_PROJECTS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, totalHours, isPaid, amount, invoice } = await request.json()

    const project = await prisma.project.create({
      data: {
        name,
        description,
        totalHours: totalHours ? Number.parseInt(totalHours) : null,
        isPaid: isPaid || false,
        amount: amount ? Number.parseFloat(amount) : null,
        invoice,
        companyId: session.user.companyId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error("Failed to create project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
