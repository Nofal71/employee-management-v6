import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.EDIT_SETTINGS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { id: true, name: true, theme: true },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.EDIT_SETTINGS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, theme } = await request.json()

    const updateData: any = {}

    if (name !== undefined) {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Company name is required" }, { status: 400 })
      }
      updateData.name = name.trim()
    }

    if (theme !== undefined) {
      if (!["light", "dark", "system"].includes(theme)) {
        return NextResponse.json({ error: "Invalid theme value" }, { status: 400 })
      }
      updateData.theme = theme
    }

    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: updateData,
      select: { id: true, name: true, theme: true },
    })

    return NextResponse.json(company)
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
