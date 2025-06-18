"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, Users, FolderOpen } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface Team {
  id: string
  name: string
  description: string | null
  createdAt: string
  members: Array<{
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
  teamProjects: Array<{
    project: {
      id: string
      name: string
    }
  }>
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface Project {
  id: string
  name: string
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [managingMembers, setManagingMembers] = useState<Team | null>(null)
  const [managingProjects, setManagingProjects] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canManageTeams = hasPermission(session?.user.permissions || [], PERMISSIONS.MANAGE_TEAMS)

  useEffect(() => {
    if (canManageTeams) {
      fetchTeams()
      fetchUsers()
      fetchProjects()
    }
  }, [canManageTeams])

  const fetchTeams = async () => {
    try {
      setError("")
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      } else {
        setError("Failed to fetch teams")
      }
    } catch (error) {
      setError("Failed to fetch teams")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: any) => user.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data.filter((project: any) => project.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Team name is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
    setFormErrors({})
    setEditingTeam(null)
    setSelectedMembers([])
    setSelectedProjects([])
  }

  const handleCreateTeam = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team created successfully",
        })
        resetForm()
        setIsCreateDialogOpen(false)
        fetchTeams()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to create team" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTeam = async () => {
    if (!validateForm() || !editingTeam) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${editingTeam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team updated successfully",
        })
        resetForm()
        fetchTeams()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update team" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team deleted successfully",
        })
        fetchTeams()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete team",
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

  const openEditDialog = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      description: team.description || "",
    })
    setFormErrors({})
  }

  const openMembersDialog = (team: Team) => {
    setManagingMembers(team)
    setSelectedMembers(team.members.map((m) => m.user.id))
  }

  const openProjectsDialog = (team: Team) => {
    setManagingProjects(team)
    setSelectedProjects(team.teamProjects.map((tp) => tp.project.id))
  }

  const updateTeamMembers = async () => {
    if (!managingMembers) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${managingMembers.id}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedMembers }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team members updated successfully",
        })
        setManagingMembers(null)
        setSelectedMembers([])
        fetchTeams()
      } else {
        toast({
          title: "Error",
          description: "Failed to update team members",
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
      setSubmitting(false)
    }
  }

  const updateTeamProjects = async () => {
    if (!managingProjects) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${managingProjects.id}/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: selectedProjects }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team projects updated successfully",
        })
        setManagingProjects(null)
        setSelectedProjects([])
        fetchTeams()
      } else {
        toast({
          title: "Error",
          description: "Failed to update team projects",
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
      setSubmitting(false)
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!canManageTeams) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to manage teams.</p>
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
          <h1 className="text-3xl font-bold">Teams</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>Add a new team to your organization</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formErrors.general && <ErrorMessage message={formErrors.general} />}

                <div>
                  <Label htmlFor="name">Team Name</Label>
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
                    placeholder="Team description..."
                  />
                </div>
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
                <Button onClick={handleCreateTeam} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Team Dialog */}
        <Dialog open={!!editingTeam} onOpenChange={() => resetForm()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team</DialogTitle>
              <DialogDescription>Update team information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formErrors.general && <ErrorMessage message={formErrors.general} />}

              <div>
                <Label htmlFor="edit-name">Team Name</Label>
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
                  placeholder="Team description..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleEditTeam} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Team"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Members Dialog */}
        <Dialog open={!!managingMembers} onOpenChange={() => setManagingMembers(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Team Members</DialogTitle>
              <DialogDescription>Add or remove members from {managingMembers?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`member-${user.id}`}
                    checked={selectedMembers.includes(user.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedMembers([...selectedMembers, user.id])
                      } else {
                        setSelectedMembers(selectedMembers.filter((id) => id !== user.id))
                      }
                    }}
                  />
                  <Label htmlFor={`member-${user.id}`} className="flex-1">
                    {user.firstName} {user.lastName} ({user.email})
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManagingMembers(null)}>
                Cancel
              </Button>
              <Button onClick={updateTeamMembers} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Members"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Projects Dialog */}
        <Dialog open={!!managingProjects} onOpenChange={() => setManagingProjects(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Team Projects</DialogTitle>
              <DialogDescription>Assign projects to {managingProjects?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div key={project.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`project-${project.id}`}
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProjects([...selectedProjects, project.id])
                      } else {
                        setSelectedProjects(selectedProjects.filter((id) => id !== project.id))
                      }
                    }}
                  />
                  <Label htmlFor={`project-${project.id}`} className="flex-1">
                    {project.name}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManagingProjects(null)}>
                Cancel
              </Button>
              <Button onClick={updateTeamProjects} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Projects"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && <ErrorMessage message={error} />}

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Manage teams, members, and project assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
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
                  <TableHead>Members</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{team.description || "No description"}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {team.members.length}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => openMembersDialog(team)}>
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          <FolderOpen className="h-3 w-3 mr-1" />
                          {team.teamProjects.length}
                        </Badge>
                        <Button variant="ghost" size="sm" onClick={() => openProjectsDialog(team)}>
                          Manage
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTeams.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No teams found matching your search." : "No teams created yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
