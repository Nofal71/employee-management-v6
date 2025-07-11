"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Users, FolderOpen, Plus, Save, Trash2 } from "lucide-react"
import { hasPermission, PERMISSIONS, canManageTeam } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: {
      name: string
    }
  }
}

interface TeamProject {
  project: {
    id: string
    name: string
    description: string | null
    isActive: boolean
  }
}

interface TeamDetail {
  id: string
  name: string
  description: string | null
  createdAt: string
  members: TeamMember[]
  teamProjects: TeamProject[]
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: {
    name: string
  }
  isActive: boolean
}

interface Project {
  id: string
  name: string
  description: string | null
  isActive: boolean
}

export default function TeamDetailPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<TeamDetail | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showProjectsDialog, setShowProjectsDialog] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const teamId = Array.isArray(params.id) ? params.id[0] : params.id

  const canManageTeams = hasPermission(session?.user?.permissions || [], PERMISSIONS.MANAGE_TEAMS)
  const canManageAssignedTeams = hasPermission(session?.user?.permissions || [], PERMISSIONS.MANAGE_ASSIGNED_TEAMS)

  useEffect(() => {
    if (teamId && session?.user) {
      fetchTeamDetail()
      if (canManageTeams || canManageAssignedTeams) {
        fetchAllUsers()
        fetchAllProjects()
      }
    }
  }, [teamId, session, canManageTeams, canManageAssignedTeams])

  const fetchTeamDetail = async () => {
    try {
      setError("")
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch team details")
      }
    } catch (error) {
      console.error("Failed to fetch team:", error)
      setError("Something went wrong while fetching team details")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setAllUsers((data.users || data || []).filter((u: User) => u.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchAllProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setAllProjects((data || []).filter((p: Project) => p.isActive))
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const openMembersDialog = () => {
    setSelectedMembers(team?.members?.map((m) => m.user.id) || [])
    setShowMembersDialog(true)
  }

  const openProjectsDialog = () => {
    setSelectedProjects(team?.teamProjects?.map((tp) => tp.project.id) || [])
    setShowProjectsDialog(true)
  }

  const updateTeamMembers = async () => {
    if (!teamId) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selectedMembers }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team members updated successfully",
        })
        setShowMembersDialog(false)
        fetchTeamDetail()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update team members",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update members:", error)
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
    if (!teamId) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: selectedProjects }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team projects updated successfully",
        })
        setShowProjectsDialog(false)
        fetchTeamDetail()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to update team projects",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update projects:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const removeMember = async (userId: string) => {
    if (!team || !confirm("Are you sure you want to remove this member from the team?")) {
      return
    }

    const updatedMembers = team.members.filter((m) => m.user.id !== userId).map((m) => m.user.id)

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: updatedMembers }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Member removed successfully",
        })
        fetchTeamDetail()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const removeProject = async (projectId: string) => {
    if (!team || !confirm("Are you sure you want to remove this project from the team?")) {
      return
    }

    const updatedProjects = team.teamProjects.filter((tp) => tp.project.id !== projectId).map((tp) => tp.project.id)

    try {
      const response = await fetch(`/api/teams/${teamId}/projects`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectIds: updatedProjects }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Project removed successfully",
        })
        fetchTeamDetail()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove project",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove project:", error)
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
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

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <ErrorMessage message={error} />
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </MainLayout>
    )
  }

  if (!team) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </MainLayout>
    )
  }

  const teamMemberIds = team.members?.map((m) => m.user.id) || []
  const userCanManage = canManageTeam(session.user.permissions, session.user.id, teamMemberIds)

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">{team.name}</h1>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{team.description || "No description provided"}</p>
                </div>
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p className="text-muted-foreground">{new Date(team.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Team Members ({team.members?.length || 0})</CardTitle>
                </div>
                {userCanManage && (
                  <Button onClick={openMembersDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Members
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!team.members || team.members.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No members assigned</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      {userCanManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.members.map((member) => (
                      <TableRow key={member.user.id}>
                        <TableCell className="font-medium">
                          {member.user.firstName} {member.user.lastName}
                        </TableCell>
                        <TableCell>{member.user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.user.role.name}</Badge>
                        </TableCell>
                        {userCanManage && (
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeMember(member.user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Team Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5" />
                  <CardTitle>Assigned Projects ({team.teamProjects?.length || 0})</CardTitle>
                </div>
                {userCanManage && (
                  <Button onClick={openProjectsDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Projects
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!team.teamProjects || team.teamProjects.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No projects assigned</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      {userCanManage && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {team.teamProjects.map((teamProject) => (
                      <TableRow key={teamProject.project.id}>
                        <TableCell className="font-medium">{teamProject.project.name}</TableCell>
                        <TableCell>{teamProject.project.description || "No description"}</TableCell>
                        <TableCell>
                          <Badge variant={teamProject.project.isActive ? "default" : "secondary"}>
                            {teamProject.project.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        {userCanManage && (
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeProject(teamProject.project.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Manage Members Dialog */}
        <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Team Members</DialogTitle>
              <DialogDescription>Select users to add as team members</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {allUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedMembers.includes(user.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMembers([...selectedMembers, user.id])
                              } else {
                                setSelectedMembers(selectedMembers.filter((id) => id !== user.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.role.name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMembersDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateTeamMembers} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Members
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manage Projects Dialog */}
        <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Team Projects</DialogTitle>
              <DialogDescription>Select projects to assign to this team</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {allProjects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No projects available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProjects([...selectedProjects, project.id])
                              } else {
                                setSelectedProjects(selectedProjects.filter((id) => id !== project.id))
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.description || "No description"}</TableCell>
                        <TableCell>
                          <Badge variant={project.isActive ? "default" : "secondary"}>
                            {project.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowProjectsDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateTeamProjects} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Projects
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
