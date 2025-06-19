"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Save } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  role: {
    name: string
    permissions: Array<{
      name: string
      description: string
    }>
  }
  createdAt: string
  company: {
    name: string
  }
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setError("")
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
        })
      } else {
        setError("Failed to fetch profile")
      }
    } catch (error) {
      setError("Failed to fetch profile")
    } finally {
      setLoading(false)
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

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProfile = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        }),
      })

      if (response.ok) {
        // Update session
        await update({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
        })

        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        fetchProfile()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update profile" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <User className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Profile</h1>
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
              <CardDescription>Update your personal details</CardDescription>
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
                  />
                  {formErrors.lastName && <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>}
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Account Information</span>
              </CardTitle>
              <CardDescription>Your account details and company information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{profile?.email}</p>
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Company</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{profile?.company.name}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Member Since</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{profile ? new Date(profile.createdAt).toLocaleDateString() : ""}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role & Permissions</span>
              </CardTitle>
              <CardDescription>Your current role and assigned permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Role</Label>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-sm">
                    {profile?.role.name}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Permissions ({profile?.role.permissions.length || 0})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {profile?.role.permissions.map((permission) => (
                    <div key={permission.name} className="p-3 bg-muted rounded-md">
                      <p className="font-medium text-sm">{permission.description}</p>
                      <p className="text-xs text-muted-foreground">{permission.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
