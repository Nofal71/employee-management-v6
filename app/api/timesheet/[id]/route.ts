import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const canEditAll = hasPermission(session.user.permissions, PERMISSIONS.EDIT_ALL_TIMESHEETS)

    // Get the timesheet entry
    const entry = await prisma.timesheet.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: { companyId: true },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: "Timesheet entry not found" }, { status: 404 })
    }

    // Check if user has permission to delete this entry
    if (!canEditAll && entry.userId !== session.user.id) {
      return NextResponse.json({ error: "You can only delete your own timesheet entries" }, { status: 403 })
    }

    // Check if entry belongs to user's company
    if (entry.project.companyId !== session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.timesheet.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Timesheet entry deleted successfully" })
  } catch (error) {
    console.error("Failed to delete timesheet entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
