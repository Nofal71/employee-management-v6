"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Edit, Trash2, Search, GraduationCap } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"

interface Training {
  id: string
  courseName: string
  courseLink?: string
  courseCategory: string
  organizationName: string
  certificateTitle: string
  level: string
  startDate: string
  endDate?: string
  expectedEndDate?: string
  status: string
  outcome: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

const STATUSES = [
  { value: "started", label: "Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "others", label: "Others" },
]

const OUTCOMES = [
  { value: "certificate", label: "Certificate" },
  { value: "demo", label: "Demo" },
  { value: "others", label: "Others" },
]

const CATEGORIES = [
  "Technical Skills",
  "Soft Skills",
  "Leadership",
  "Compliance",
  "Safety",
  "Professional Development",
  "Industry Specific",
  "Others",
]

export default function TrainingPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTraining, setEditingTraining] = useState<Training | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all") // Updated default value
  const [levelFilter, setLevelFilter] = useState<string>("all") // Updated default value
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    courseName: "",
    courseLink: "",
    courseCategory: "",
    organizationName: "",
    certificateTitle: "",
    level: "",
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    expectedEndDate: undefined as Date | undefined,
    status: "",
    outcome: "",
    notes: "",
  })

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/training")
      if (!response.ok) {
        throw new Error("Failed to fetch trainings")
      }
      const data = await response.json()
      setTrainings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      courseName: "",
      courseLink: "",
      courseCategory: "",
      organizationName: "",
      certificateTitle: "",
      level: "",
      startDate: undefined,
      endDate: undefined,
      expectedEndDate: undefined,
      status: "",
      outcome: "",
      notes: "",
    })
    setEditingTraining(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.courseName ||
      !formData.courseCategory ||
      !formData.organizationName ||
      !formData.certificateTitle ||
      !formData.level ||
      !formData.startDate ||
      !formData.status ||
      !formData.outcome
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      const url = editingTraining ? `/api/training/${editingTraining.id}` : "/api/training"
      const method = editingTraining ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate?.toISOString(),
          endDate: formData.endDate?.toISOString(),
          expectedEndDate: formData.expectedEndDate?.toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save training")
      }

      toast({
        title: "Success",
        description: `Training ${editingTraining ? "updated" : "created"} successfully`,
      })

      setIsDialogOpen(false)
      resetForm()
      fetchTrainings()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (training: Training) => {
    setEditingTraining(training)
    setFormData({
      courseName: training.courseName,
      courseLink: training.courseLink || "",
      courseCategory: training.courseCategory,
      organizationName: training.organizationName,
      certificateTitle: training.certificateTitle,
      level: training.level,
      startDate: new Date(training.startDate),
      endDate: training.endDate ? new Date(training.endDate) : undefined,
      expectedEndDate: training.expectedEndDate ? new Date(training.expectedEndDate) : undefined,
      status: training.status,
      outcome: training.outcome,
      notes: training.notes || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training record?")) {
      return
    }

    try {
      const response = await fetch(`/api/training/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete training")
      }

      toast({
        title: "Success",
        description: "Training deleted successfully",
      })

      fetchTrainings()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "started":
        return "outline"
      default:
        return "outline"
    }
  }

  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      training.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.courseCategory.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || training.status === statusFilter
    const matchesLevel = levelFilter === "all" || training.level === levelFilter
    return matchesSearch && matchesStatus && matchesLevel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Training & Certifications
          </h1>
          <p className="text-muted-foreground">Manage your professional development and certifications</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Training
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTraining ? "Edit Training" : "Add New Training"}</DialogTitle>
              <DialogDescription>
                {editingTraining ? "Update your training information" : "Add a new training or certification record"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name *</Label>
                  <Input
                    id="courseName"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    placeholder="Enter course name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseLink">Course Link</Label>
                  <Input
                    id="courseLink"
                    type="url"
                    value={formData.courseLink}
                    onChange={(e) => setFormData({ ...formData, courseLink: e.target.value })}
                    placeholder="https://example.com/course"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courseCategory">Course Category *</Label>
                  <Select
                    value={formData.courseCategory}
                    onValueChange={(value) => setFormData({ ...formData, courseCategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name *</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    placeholder="Training provider"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certificateTitle">Certificate Name/Title *</Label>
                  <Input
                    id="certificateTitle"
                    value={formData.certificateTitle}
                    onChange={(e) => setFormData({ ...formData, certificateTitle: e.target.value })}
                    placeholder="Certificate title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Expected End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.expectedEndDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expectedEndDate ? format(formData.expectedEndDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expectedEndDate}
                        onSelect={(date) => setFormData({ ...formData, expectedEndDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcome">Outcome *</Label>
                  <Select
                    value={formData.outcome}
                    onValueChange={(value) => setFormData({ ...formData, outcome: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map((outcome) => (
                        <SelectItem key={outcome.value} value={outcome.value}>
                          {outcome.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or comments"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <LoadingSpinner /> : editingTraining ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search trainings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Training Records */}
      <Card>
        <CardHeader>
          <CardTitle>Your Training Records</CardTitle>
          <CardDescription>
            {filteredTrainings.length} training record{filteredTrainings.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrainings.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No training records found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || levelFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Start by adding your first training or certification record"}
              </p>
              {statusFilter === "all" && levelFilter === "all" && !searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Training
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrainings.map((training) => (
                    <TableRow key={training.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{training.courseName}</div>
                          <div className="text-sm text-muted-foreground">{training.certificateTitle}</div>
                        </div>
                      </TableCell>
                      <TableCell>{training.organizationName}</TableCell>
                      <TableCell>{training.courseCategory}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {training.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(training.status)} className="capitalize">
                          {training.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(training.startDate), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="capitalize">{training.outcome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(training)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(training.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
