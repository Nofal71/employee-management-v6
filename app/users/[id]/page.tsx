"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, User, Shield, Calendar } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface UserDetails {
  id: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  role: {
    id: string
    name: string
  }
  createdAt: string
  lastLoginAt: string | null
}

interface Role {
  id: string
  name: string
}

export default function UserDetailsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    roleId: "",
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const canManageUsers = hasPermission(session?.user.permissions || [], PERMISSIONS.MANAGE_USERS)
  const canViewUsers = hasPermission(session?.user.permissions || [], PERMISSIONS.VIEW_USERS)

  useEffect(() => {
    if (!canManageUsers && !canViewUsers) {
      router.push("/users")
      return
    }
    fetchUser()
    fetchRoles()
  }, [params.id, canManageUsers, canViewUsers])

  const fetchUser = async () => {
    try {
      setError("")
      const response = await fetch(`/api/users/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.role.id,
          isActive: data.isActive,
        })
      } else {
        setError("Failed to fetch user details")
      }
    } catch (error) {
      setError("Failed to fetch user details")
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required"
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required"
    }

    if (!formData.roleId) {
      errors.roleId = "Role is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!canManageUsers) return
    if (!validateForm()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          roleId: formData.roleId,
          isActive: formData.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        })
        fetchUser()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update user" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSaving(false)
    }
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

  if (!canManageUsers && !canViewUsers) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view user details.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8" />
              <h1 className="text-3xl font-bold">User Details</h1>
            </div>
          </div>
          {canManageUsers && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="grid gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
              <CardDescription>
                {canManageUsers ? "Update user's personal details" : "User's personal information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formErrors.general && <ErrorMessage message={formErrors.general} />}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={formErrors.firstName ? "border-destructive" : ""}
                    disabled={!canManageUsers}
                  />
                  {formErrors.firstName && <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={formErrors.lastName ? "border-destructive" : ""}
                    disabled={!canManageUsers}
                  />
                  {formErrors.lastName && <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{user?.email}</p>
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role & Status</span>
              </CardTitle>
              <CardDescription>
                {canManageUsers ? "Manage user's role and account status" : "User's role and status information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                {canManageUsers ? (
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  >
                    <SelectTrigger className={formErrors.roleId ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-md">
                    <Badge variant="secondary">{user?.role.name}</Badge>
                  </div>
                )}
                {formErrors.roleId && <p className="text-sm text-destructive mt-1">{formErrors.roleId}</p>}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Account Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.isActive ? "User can access the system" : "User access is disabled"}
                  </p>
                </div>
                {canManageUsers ? (
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                ) : (
                  <Badge variant={user?.isActive ? "default" : "secondary"}>
                    {user?.isActive ? "Active" : "Inactive"}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>Account creation and activity information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Member Since</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{user ? new Date(user.createdAt).toLocaleDateString() : ""}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Last Login</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">
                      {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
