import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_TEAMS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectIds } = await request.json()

    if (!Array.isArray(projectIds)) {
      return NextResponse.json({ error: "projectIds must be an array" }, { status: 400 })
    }

    // Verify team belongs to user's company
    const team = await prisma.team.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId,
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Update team projects in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove all existing project assignments
      await tx.teamProject.deleteMany({
        where: { teamId: params.id },
      })

      // Add new project assignments
      if (projectIds.length > 0) {
        await tx.teamProject.createMany({
          data: projectIds.map((projectId: string) => ({
            teamId: params.id,
            projectId,
          })),
        })
      }
    })

    return NextResponse.json({ message: "Team projects updated successfully" })
  } catch (error) {
    console.error("Failed to update team projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
