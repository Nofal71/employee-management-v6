import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const training = await prisma.training.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!training) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }

    return NextResponse.json(training)
  } catch (error) {
    console.error("Error fetching training:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      courseName,
      courseLink,
      courseCategory,
      organizationName,
      certificateTitle,
      level,
      startDate,
      endDate,
      expectedEndDate,
      status,
      outcome,
      notes,
    } = body

    // Validation
    if (
      !courseName ||
      !courseCategory ||
      !organizationName ||
      !certificateTitle ||
      !level ||
      !startDate ||
      !status ||
      !outcome
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const validLevels = ["beginner", "intermediate", "advanced"]
    const validStatuses = ["started", "in_progress", "completed", "others"]
    const validOutcomes = ["certificate", "demo", "others"]

    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 })
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json({ error: "Invalid outcome" }, { status: 400 })
    }

    // Check if training exists and belongs to user
    const existingTraining = await prisma.training.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingTraining) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }

    const training = await prisma.training.update({
      where: { id: params.id },
      data: {
        courseName,
        courseLink: courseLink || null,
        courseCategory,
        organizationName,
        certificateTitle,
        level,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        status,
        outcome,
        notes: notes || null,
      },
    })

    return NextResponse.json(training)
  } catch (error) {
    console.error("Error updating training:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if training exists and belongs to user
    const existingTraining = await prisma.training.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingTraining) {
      return NextResponse.json({ error: "Training not found" }, { status: 404 })
    }

    await prisma.training.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Training deleted successfully" })
  } catch (error) {
    console.error("Error deleting training:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
