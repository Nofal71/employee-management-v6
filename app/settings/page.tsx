"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Save, Building, Palette, Shield, Bell } from "lucide-react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useToast } from "@/hooks/use-toast"

interface CompanySettings {
  id: string
  name: string
  theme: string
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    companyName: "",
    selectedTheme: "system",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const canEditSettings = hasPermission(session?.user.permissions || [], PERMISSIONS.EDIT_SETTINGS)

  useEffect(() => {
    if (canEditSettings) {
      fetchSettings()
    }
  }, [canEditSettings])

  const fetchSettings = async () => {
    try {
      setError("")
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          companyName: data.name,
          selectedTheme: data.theme,
        })
      } else {
        setError("Failed to fetch settings")
      }
    } catch (error) {
      setError("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.companyName.trim()) {
      errors.companyName = "Company name is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveSettings = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.companyName.trim(),
          theme: formData.selectedTheme,
        }),
      })

      if (response.ok) {
        // Update theme immediately
        setTheme(formData.selectedTheme)

        toast({
          title: "Success",
          description: "Settings updated successfully",
        })
        fetchSettings()
      } else {
        const data = await response.json()
        setFormErrors({ general: data.error || "Failed to update settings" })
      }
    } catch (error) {
      setFormErrors({ general: "Something went wrong" })
    } finally {
      setSubmitting(false)
    }
  }

  if (!canEditSettings) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to edit settings.</p>
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
        <div className="flex items-center space-x-2">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        {error && <ErrorMessage message={error} />}

        <div className="grid gap-6">
          {/* Company Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Settings</span>
              </CardTitle>
              <CardDescription>Manage your company information and preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formErrors.general && <ErrorMessage message={formErrors.general} />}

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={formErrors.companyName ? "border-destructive" : ""}
                />
                {formErrors.companyName && <p className="text-sm text-destructive mt-1">{formErrors.companyName}</p>}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={submitting}>
                  {submitting ? (
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
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>Customize the look and feel of your application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.selectedTheme}
                  onValueChange={(value) => setFormData({ ...formData, selectedTheme: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose how the application appears. System will use your device's theme preference.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={submitting}>
                  {submitting ? (
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
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>Manage security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current User Role</Label>
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{session?.user.roleName}</p>
                  <p className="text-sm text-muted-foreground">
                    You have {session?.user.permissions.length} permissions assigned
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Account Information</Label>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email:</span>
                    <span className="text-sm font-medium">{session?.user.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Name:</span>
                    <span className="text-sm font-medium">
                      {session?.user.firstName} {session?.user.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Company:</span>
                    <span className="text-sm font-medium">{settings?.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email updates about your projects</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Get weekly summary reports via email</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
