"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Team {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count?: {
    members: number
    teamProjects: number
  }
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canManageTeams = hasPermission(session?.user?.permissions || [], PERMISSIONS.MANAGE_TEAMS)
  const canManageAssignedTeams = hasPermission(session?.user?.permissions || [], PERMISSIONS.MANAGE_ASSIGNED_TEAMS)

  useEffect(() => {
    if (session?.user && (canManageTeams || canManageAssignedTeams)) {
      fetchTeams()
    }
  }, [session, canManageTeams, canManageAssignedTeams])

  const fetchTeams = async () => {
    try {
      setError("")
      const response = await fetch("/api/teams")
      if (response.ok) {
        const data = await response.json()
        setTeams(data || [])
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch teams")
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      setError("Failed to fetch teams")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name?.trim()) {
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
      console.error("Failed to create team:", error)
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
      console.error("Failed to update team:", error)
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
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete team",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
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
      name: team.name || "",
      description: team.description || "",
    })
    setFormErrors({})
  }

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`)
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!canManageTeams && !canManageAssignedTeams) {
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
          {canManageTeams && (
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
          )}
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

        {error && <ErrorMessage message={error} />}

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>Manage teams and their assignments</CardDescription>
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
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeams.map((team) => (
                  <TableRow
                    key={team.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTeamClick(team.id)}
                  >
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{team.description || "No description"}</TableCell>
                    <TableCell>{new Date(team.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {canManageTeams && (
                          <Button variant="ghost" size="sm" onClick={() => deleteTeam(team.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
