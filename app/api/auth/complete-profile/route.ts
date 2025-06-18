import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { firstName, lastName } = await request.json()

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 })
    }

    // Update user profile
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileCompleted: true,
      },
    })

    return NextResponse.json({ message: "Profile completed successfully" })
  } catch (error) {
    console.error("Complete profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
