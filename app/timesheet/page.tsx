"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { formatHours } from "@/lib/utils"

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  description: string
  project: {
    id: string
    name: string
  }
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Project {
  id: string
  name: string
}

export default function TimesheetPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimesheetEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    projectId: "",
    hours: "",
    description: "",
  })

  const canViewAllTimesheets = hasPermission(session?.user.permissions || [], PERMISSIONS.VIEW_ALL_TIMESHEETS)
  const canEditAllTimesheets = hasPermission(session?.user.permissions || [], PERMISSIONS.EDIT_ALL_TIMESHEETS)

  useEffect(() => {
    fetchEntries()
    fetchProjects()
  }, [selectedDate])

  const fetchEntries = async () => {
    try {
      const params = new URLSearchParams({
        date: selectedDate.toISOString().split("T")[0],
      })

      if (!canViewAllTimesheets) {
        params.append("userId", session?.user.id || "")
      }

      const response = await fetch(`/api/timesheet?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Failed to fetch timesheet entries:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.filter((p: any) => p.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleCreateEntry = async () => {
    try {
      const response = await fetch("/api/timesheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEntry,
          date: selectedDate.toISOString().split("T")[0],
          hours: Number.parseFloat(newEntry.hours),
        }),
      })

      if (response.ok) {
        setNewEntry({ projectId: "", hours: "", description: "" })
        setIsCreateDialogOpen(false)
        fetchEntries()
      }
    } catch (error) {
      console.error("Failed to create timesheet entry:", error)
    }
  }

  const deleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/timesheet/${entryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEntries()
      }
    } catch (error) {
      console.error("Failed to delete timesheet entry:", error)
    }
  }

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Timesheet</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Time Entry</DialogTitle>
                <DialogDescription>Log time for {selectedDate.toLocaleDateString()}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="project">Project</Label>
                  <Select
                    value={newEntry.projectId}
                    onValueChange={(value) => setNewEntry({ ...newEntry, projectId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={newEntry.hours}
                    onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="What did you work on?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateEntry}>Add Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Time Entries for {selectedDate.toLocaleDateString()}</CardTitle>
              <CardDescription>Total hours: {formatHours(totalHours)}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No time entries for this date</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canViewAllTimesheets && <TableHead>User</TableHead>}
                      <TableHead>Project</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        {canViewAllTimesheets && (
                          <TableCell>
                            {entry.user.firstName} {entry.user.lastName}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">{entry.project.name}</TableCell>
                        <TableCell>{formatHours(entry.hours)}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {(canEditAllTimesheets || entry.user.id === session?.user.id) && (
                              <>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
