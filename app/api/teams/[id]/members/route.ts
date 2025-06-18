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

    const { userIds } = await request.json()

    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: "userIds must be an array" }, { status: 400 })
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

    // Update team members in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove all existing members
      await tx.teamMember.deleteMany({
        where: { teamId: params.id },
      })

      // Add new members
      if (userIds.length > 0) {
        await tx.teamMember.createMany({
          data: userIds.map((userId: string) => ({
            teamId: params.id,
            userId,
          })),
        })
      }
    })

    return NextResponse.json({ message: "Team members updated successfully" })
  } catch (error) {
    console.error("Failed to update team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
