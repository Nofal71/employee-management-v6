import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const level = searchParams.get("level") || ""

    const where = {
      userId: session.user.id,
      ...(search && {
        OR: [
          { courseName: { contains: search, mode: "insensitive" as const } },
          { organizationName: { contains: search, mode: "insensitive" as const } },
          { courseCategory: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && status !== "all" && { status }),
      ...(level && level !== "all" && { level }),
    }

    const trainings = await prisma.training.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(trainings)
  } catch (error) {
    console.error("Error fetching trainings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const training = await prisma.training.create({
      data: {
        courseName: courseName.trim(),
        courseLink: courseLink?.trim() || null,
        courseCategory: courseCategory.trim(),
        organizationName: organizationName.trim(),
        certificateTitle: certificateTitle.trim(),
        level,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        status,
        outcome,
        notes: notes?.trim() || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(training, { status: 201 })
  } catch (error) {
    console.error("Error creating training:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
