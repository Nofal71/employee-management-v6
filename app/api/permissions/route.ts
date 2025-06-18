import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.MANAGE_ROLES)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(permissions)
  } catch (error) {
    console.error("Failed to fetch permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
