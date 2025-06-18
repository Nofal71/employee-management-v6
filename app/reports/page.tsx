"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Download, FileText, Calendar, Users, FolderOpen } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { formatCurrency, formatHours } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface ReportData {
  summary: {
    totalHours: number
    totalRevenue: number
    totalProjects: number
    totalUsers: number
  }
  userHours: Array<{
    userId: string
    userName: string
    hours: number
    projects: number
  }>
  projectHours: Array<{
    projectId: string
    projectName: string
    hours: number
    revenue: number
    users: number
  }>
  teamHours: Array<{
    teamId: string
    teamName: string
    hours: number
    members: number
  }>
  dailyHours: Array<{
    date: string
    hours: number
  }>
}

interface User {
  id: string
  firstName: string
  lastName: string
}

interface Project {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  })
  const [selectedUser, setSelectedUser] = useState<string>("all")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [selectedTeam, setSelectedTeam] = useState<string>("all")
  const [exporting, setExporting] = useState(false)

  const canGenerateReports = hasPermission(session?.user.permissions || [], PERMISSIONS.GENERATE_REPORTS)

  useEffect(() => {
    if (canGenerateReports) {
      fetchReportData()
      fetchFilters()
    }
  }, [dateRange, selectedUser, selectedProject, selectedTeam, canGenerateReports])

  const fetchReportData = async () => {
    try {
      setError("")
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        user: selectedUser,
        project: selectedProject,
        team: selectedTeam,
      })

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        setError("Failed to fetch report data")
      }
    } catch (error) {
      setError("Failed to fetch report data")
    } finally {
      setLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const [usersRes, projectsRes, teamsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/projects"),
        fetch("/api/teams"),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.filter((user: any) => user.isActive))
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData.filter((project: any) => project.isActive))
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }
    } catch (error) {
      console.error("Failed to fetch filter data:", error)
    }
  }

  const exportReport = async (format: "csv" | "pdf") => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        user: selectedUser,
        project: selectedProject,
        team: selectedTeam,
        format,
      })

      const response = await fetch(`/api/reports/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${dateRange.from.toISOString().split("T")[0]}-to-${dateRange.to.toISOString().split("T")[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Success",
          description: `Report exported as ${format.toUpperCase()}`,
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to export report",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  if (!canGenerateReports) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to generate reports.</p>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Reports</h1>

          <div className="flex flex-col sm:flex-row gap-4">
            <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                      <p className="text-2xl font-bold">{formatHours(reportData.summary.totalHours)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(reportData.summary.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FolderOpen className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                      <p className="text-2xl font-bold">{reportData.summary.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
                <CardDescription>Download the current report in different formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={() => exportReport("csv")} disabled={exporting}>
                    {exporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                    Export CSV
                  </Button>
                  <Button onClick={() => exportReport("pdf")} disabled={exporting}>
                    {exporting ? <LoadingSpinner size="sm" className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}
                    Export PDF
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Hours</CardTitle>
                  <CardDescription>Hours logged per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.dailyHours}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Hours Distribution</CardTitle>
                  <CardDescription>Hours logged per user</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.userHours}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ userName, hours }) => `${userName}: ${formatHours(hours)}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="hours"
                      >
                        {reportData.userHours.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Summary</CardTitle>
                  <CardDescription>Hours and projects per user</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Projects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.userHours.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">{user.userName}</TableCell>
                          <TableCell>{formatHours(user.hours)}</TableCell>
                          <TableCell>{user.projects}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Summary</CardTitle>
                  <CardDescription>Hours and revenue per project</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.projectHours.map((project) => (
                        <TableRow key={project.projectId}>
                          <TableCell className="font-medium">{project.projectName}</TableCell>
                          <TableCell>{formatHours(project.hours)}</TableCell>
                          <TableCell>{formatCurrency(project.revenue)}</TableCell>
                          <TableCell>{project.users}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Team Summary */}
            {reportData.teamHours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Summary</CardTitle>
                  <CardDescription>Hours per team</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Members</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.teamHours.map((team) => (
                        <TableRow key={team.teamId}>
                          <TableCell className="font-medium">{team.teamName}</TableCell>
                          <TableCell>{formatHours(team.hours)}</TableCell>
                          <TableCell>{team.members}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  )
}
