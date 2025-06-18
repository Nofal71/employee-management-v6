import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_PROJECTS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, totalHours, isPaid, amount, invoice, isActive } = await request.json()

    const updateData: any = {}

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Project name is required" }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null
    }

    if (totalHours !== undefined) {
      updateData.totalHours = totalHours ? Number(totalHours) : null
    }

    if (isPaid !== undefined) {
      updateData.isPaid = isPaid
    }

    if (amount !== undefined) {
      updateData.amount = amount ? Number(amount) : null
    }

    if (invoice !== undefined) {
      updateData.invoice = invoice?.trim() || null
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive
    }

    const project = await prisma.project.update({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
      data: updateData,
      include: {
        createdBy: {
          select: { firstName: true, lastName: true },
        },
        _count: {
          select: { timesheets: true },
        },
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Failed to update project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_PROJECTS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.project.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    return NextResponse.json({ message: "Project deleted successfully" })
  } catch (error) {
    console.error("Failed to delete project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
