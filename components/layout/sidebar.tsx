"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  BarChart3,
  Users,
  FolderOpen,
  UserCheck,
  Shield,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  User,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    permission: null, // Everyone can access dashboard
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    permission: null, // Everyone can access their profile
  },
  {
    name: "Training",
    href: "/training",
    icon: GraduationCap,
    permission: null, // Everyone can access their training
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    permission: PERMISSIONS.MANAGE_USERS,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
    permission: PERMISSIONS.MANAGE_PROJECTS,
  },
  {
    name: "Teams",
    href: "/teams",
    icon: UserCheck,
    permission: null, // Special handling for team permissions
    showIf: (permissions: string[]) =>
      hasPermission(permissions, PERMISSIONS.MANAGE_TEAMS) ||
      hasPermission(permissions, PERMISSIONS.MANAGE_ASSIGNED_TEAMS),
  },
  {
    name: "Roles",
    href: "/roles",
    icon: Shield,
    permission: PERMISSIONS.MANAGE_ROLES,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    permission: PERMISSIONS.GENERATE_REPORTS,
  },
  {
    name: "Timesheet",
    href: "/timesheet",
    icon: Clock,
    permission: null, // Everyone can access timesheet
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.EDIT_SETTINGS,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const filteredNavigation = navigation.filter((item) => {
    // Remove profile from sidebar for owners - they'll access it via header dropdown
    if (item.href === "/profile" && hasPermission(session?.user?.permissions || [], PERMISSIONS.EDIT_SETTINGS)) {
      return false
    }

    // Special handling for teams
    if (item.showIf) {
      return item.showIf(session?.user?.permissions || [])
    }

    return !item.permission || hasPermission(session?.user?.permissions || [], item.permission)
  })

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-16 px-4 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">ProjectHub</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
