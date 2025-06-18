"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, DollarSign } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { formatCurrency } from "@/lib/utils"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  description: string | null
  totalHours: number | null
  isPaid: boolean
  amount: number | null
  invoice: string | null
  isActive: boolean
  createdAt: string
  createdBy: {
    firstName: string
    lastName: string
  }
  _count: {
    timesheets: number
  }
}

export default function ProjectsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalHours: "",
    isPaid: false,
    amount: "",
    invoice: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canManageProjects = hasPermission(session?.user.permissions || [], PERMISSIONS.MANAGE_PROJECTS)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setError("")
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        setError("Failed to fetch projects")
      }
    } catch (error) {
      setError("Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Project name is required"
    }

    if (formData.totalHours && (isNaN(Number(formData.totalHours)) || Number(formData.totalHours) < 0)) {
      errors.totalHours = "Total hours must be a valid positive number"
    }

    if (formData.amount && (isNaN(Number(formData.amount)) || Number(formData.amount) < 0)) {
      errors.amount = "Amount must be a valid positive number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      totalHours: "",
      isPaid: false,
      amount: "",
      invoice: "",
    })
    setFormErrors({})
    setEditingProject(null)
  }

  const handleCreateProject = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalHours: formData.totalHours ? Number(formData.totalHours) : null,
          amount: formData.amount ? Number(formData.amount) : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project created successfully",
        })
        resetForm()
        setIsCreateDialogOpen(false)
        fetchProjects()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to create project" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProject = async () => {
    if (!validateForm() || !editingProject) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalHours: formData.totalHours ? Number(formData.totalHours) : null,
          amount: formData.amount ? Number(formData.amount) : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project updated successfully",
        })
        resetForm()
        fetchProjects()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update project" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleProjectStatus = async (projectId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Project ${isActive ? "activated" : "deactivated"} successfully`,
        })
        fetchProjects()
      } else {
        toast({
          title: "Error",
          description: "Failed to update project status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project deleted successfully",
        })
        fetchProjects()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete project",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || "",
      totalHours: project.totalHours?.toString() || "",
      isPaid: project.isPaid,
      amount: project.amount?.toString() || "",
      invoice: project.invoice || "",
    })
    setFormErrors({})
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!canManageProjects) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to manage projects.</p>
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Projects</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to your organization</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formErrors.general && <ErrorMessage message={formErrors.general} />}

                <div>
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={formErrors.name ? "border-destructive" : ""}
                  />
                  {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Project description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalHours">Total Hours (Optional)</Label>
                    <Input
                      id="totalHours"
                      type="number"
                      min="0"
                      value={formData.totalHours}
                      onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                      className={formErrors.totalHours ? "border-destructive" : ""}
                    />
                    {formErrors.totalHours && <p className="text-sm text-destructive mt-1">{formErrors.totalHours}</p>}
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="isPaid"
                      checked={formData.isPaid}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                    />
                    <Label htmlFor="isPaid">Paid Project</Label>
                  </div>
                </div>

                {formData.isPaid && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className={formErrors.amount ? "border-destructive" : ""}
                      />
                      {formErrors.amount && <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>}
                    </div>

                    <div>
                      <Label htmlFor="invoice">Invoice Number</Label>
                      <Input
                        id="invoice"
                        value={formData.invoice}
                        onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                        placeholder="INV-001"
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm()
                    setIsCreateDialogOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Project Dialog */}
        <Dialog open={!!editingProject} onOpenChange={() => resetForm()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formErrors.general && <ErrorMessage message={formErrors.general} />}

              <div>
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "border-destructive" : ""}
                />
                {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-totalHours">Total Hours (Optional)</Label>
                  <Input
                    id="edit-totalHours"
                    type="number"
                    min="0"
                    value={formData.totalHours}
                    onChange={(e) => setFormData({ ...formData, totalHours: e.target.value })}
                    className={formErrors.totalHours ? "border-destructive" : ""}
                  />
                  {formErrors.totalHours && <p className="text-sm text-destructive mt-1">{formErrors.totalHours}</p>}
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="edit-isPaid"
                    checked={formData.isPaid}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPaid: checked })}
                  />
                  <Label htmlFor="edit-isPaid">Paid Project</Label>
                </div>
              </div>

              {formData.isPaid && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-amount">Amount ($)</Label>
                    <Input
                      id="edit-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={formErrors.amount ? "border-destructive" : ""}
                    />
                    {formErrors.amount && <p className="text-sm text-destructive mt-1">{formErrors.amount}</p>}
                  </div>

                  <div>
                    <Label htmlFor="edit-invoice">Invoice Number</Label>
                    <Input
                      id="edit-invoice"
                      value={formData.invoice}
                      onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                      placeholder="INV-001"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleEditProject} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Project"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && <ErrorMessage message={error} />}

        <Card>
          <CardHeader>
            <CardTitle>Project Management</CardTitle>
            <CardDescription>Manage projects, allocate hours, and track payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{project.description || "No description"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{project.totalHours ? `${project.totalHours}h allocated` : "No limit"}</span>
                        <span className="text-sm text-muted-foreground">{project._count.timesheets}h logged</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {project.isPaid ? (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              {project.amount ? formatCurrency(Number(project.amount)) : "Paid"}
                            </span>
                          </div>
                        ) : (
                          <Badge variant="secondary">Unpaid</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={project.isActive}
                          onCheckedChange={(checked) => toggleProjectStatus(project.id, checked)}
                        />
                        <span className="text-sm">{project.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.createdBy.firstName} {project.createdBy.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteProject(project.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No projects found matching your search." : "No projects created yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
