import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !hasPermission(session.user.permissions, PERMISSIONS.GENERATE_REPORTS)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const user = searchParams.get("user")
    const project = searchParams.get("project")
    const team = searchParams.get("team")

    if (format !== "csv" && format !== "pdf") {
      return NextResponse.json({ error: "Invalid format. Use 'csv' or 'pdf'" }, { status: 400 })
    }

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }

    // Build timesheet filter
    const timesheetFilter: any = {
      project: { companyId: session.user.companyId },
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(user && user !== "all" && { userId: user }),
      ...(project && project !== "all" && { projectId: project }),
    }

    // Add team filter if specified
    if (team && team !== "all") {
      timesheetFilter.user = {
        teamMembers: {
          some: {
            teamId: team,
          },
        },
      }
    }

    // Get all timesheets with filters
    const timesheets = await prisma.timesheet.findMany({
      where: timesheetFilter,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        project: {
          select: { name: true, amount: true, isPaid: true },
        },
      },
      orderBy: { date: "asc" },
    })

    if (format === "csv") {
      // Generate CSV
      const csvHeaders = ["Date", "User", "Email", "Project", "Hours", "Description", "Revenue"]
      const csvRows = timesheets.map((entry) => [
        entry.date.toISOString().split("T")[0],
        `${entry.user.firstName} ${entry.user.lastName}`,
        entry.user.email,
        entry.project.name,
        entry.hours.toString(),
        entry.description || "",
        entry.project.isPaid ? entry.project.amount?.toString() || "0" : "0",
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="timesheet-report.csv"`,
        },
      })
    } else {
      // Generate PDF (simplified - in production you'd use a proper PDF library)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Timesheet Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Timesheet Report</h1>
            <p>Period: ${from ? new Date(from).toLocaleDateString() : "All time"} - ${to ? new Date(to).toLocaleDateString() : "Present"}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${timesheets
                .map(
                  (entry) => `
                <tr>
                  <td>${entry.date.toISOString().split("T")[0]}</td>
                  <td>${entry.user.firstName} ${entry.user.lastName}</td>
                  <td>${entry.project.name}</td>
                  <td>${entry.hours}</td>
                  <td>${entry.description || ""}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
        </html>
      `

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="timesheet-report.html"`,
        },
      })
    }
  } catch (error) {
    console.error("Failed to export report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
