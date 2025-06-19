import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only access their own projects unless they have management permissions
    if (session.user.id !== params.id && !session.user.permissions.includes("manage_users")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get projects assigned to user through team memberships
    const userProjects = await prisma.teamMember.findMany({
      where: {
        userId: params.id,
      },
      include: {
        team: {
          include: {
            teamProjects: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    // Flatten the projects
    const projects = userProjects.flatMap((um) => um.team.teamProjects.map((tp) => ({ project: tp.project })))

    // Remove duplicates
    const uniqueProjects = projects.filter(
      (project, index, self) => index === self.findIndex((p) => p.project.id === project.project.id),
    )

    return NextResponse.json(uniqueProjects)
  } catch (error) {
    console.error("Failed to fetch user projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
