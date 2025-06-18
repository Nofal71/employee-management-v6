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
import { Plus, Search, Edit, Trash2, Shield } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface Role {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  createdAt: string
  permissions: Array<{
    permission: {
      id: string
      name: string
      description: string | null
    }
  }>
  _count: {
    users: number
  }
}

interface Permission {
  id: string
  name: string
  description: string | null
}

export default function RolesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canManageRoles = hasPermission(session?.user.permissions || [], PERMISSIONS.MANAGE_ROLES)

  useEffect(() => {
    if (canManageRoles) {
      fetchRoles()
      fetchPermissions()
    }
  }, [canManageRoles])

  const fetchRoles = async () => {
    try {
      setError("")
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      } else {
        setError("Failed to fetch roles")
      }
    } catch (error) {
      setError("Failed to fetch roles")
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/permissions")
      if (response.ok) {
        const data = await response.json()
        setPermissions(data)
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = "Role name is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
    })
    setSelectedPermissions([])
    setFormErrors({})
    setEditingRole(null)
  }

  const handleCreateRole = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          permissions: selectedPermissions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role created successfully",
        })
        resetForm()
        setIsCreateDialogOpen(false)
        fetchRoles()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to create role" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRole = async () => {
    if (!validateForm() || !editingRole) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          permissions: selectedPermissions,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role updated successfully",
        })
        resetForm()
        fetchRoles()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update role" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  const deleteRole = async (roleId: string) => {
    if (!confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Role deleted successfully",
        })
        fetchRoles()
      } else {
        const data = await response.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete role",
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

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
    })
    setSelectedPermissions(role.permissions.map((rp) => rp.permission.id))
    setFormErrors({})
  }

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (!canManageRoles) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to manage roles.</p>
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
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Add a new role with specific permissions</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {formErrors.general && <ErrorMessage message={formErrors.general} />}

                <div>
                  <Label htmlFor="name">Role Name</Label>
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
                    placeholder="Role description..."
                  />
                </div>

                <div>
                  <Label>Permissions</Label>
                  <div className="grid gap-2 mt-2 max-h-64 overflow-y-auto border rounded-md p-4">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, permission.id])
                            } else {
                              setSelectedPermissions(selectedPermissions.filter((id) => id !== permission.id))
                            }
                          }}
                        />
                        <Label htmlFor={`permission-${permission.id}`} className="flex-1">
                          <div>
                            <div className="font-medium">{permission.name.replace(/_/g, " ").toUpperCase()}</div>
                            {permission.description && (
                              <div className="text-sm text-muted-foreground">{permission.description}</div>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
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
                <Button onClick={handleCreateRole} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Role"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Role Dialog */}
        <Dialog open={!!editingRole} onOpenChange={() => resetForm()}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>Update role information and permissions</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formErrors.general && <ErrorMessage message={formErrors.general} />}

              <div>
                <Label htmlFor="edit-name">Role Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={formErrors.name ? "border-destructive" : ""}
                  disabled={editingRole?.isDefault}
                />
                {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
                {editingRole?.isDefault && (
                  <p className="text-sm text-muted-foreground mt-1">Default roles cannot be renamed</p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Role description..."
                />
              </div>

              <div>
                <Label>Permissions</Label>
                <div className="grid gap-2 mt-2 max-h-64 overflow-y-auto border rounded-md p-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPermissions([...selectedPermissions, permission.id])
                          } else {
                            setSelectedPermissions(selectedPermissions.filter((id) => id !== permission.id))
                          }
                        }}
                      />
                      <Label htmlFor={`edit-permission-${permission.id}`} className="flex-1">
                        <div>
                          <div className="font-medium">{permission.name.replace(/_/g, " ").toUpperCase()}</div>
                          {permission.description && (
                            <div className="text-sm text-muted-foreground">{permission.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleEditRole} disabled={submitting}>
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Role"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && <ErrorMessage message={error} />}

        <Card>
          <CardHeader>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>Manage roles and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
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
                  <TableHead>Users</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span>{role.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{role.description || "No description"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{role._count.users} users</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.permissions.length} permissions</Badge>
                    </TableCell>
                    <TableCell>
                      {role.isDefault ? (
                        <Badge variant="default">Default</Badge>
                      ) : (
                        <Badge variant="secondary">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredRoles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "No roles found matching your search." : "No roles created yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
