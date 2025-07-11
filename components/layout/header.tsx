"use client"

import { useSession, signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, User, Sun, Moon, Monitor } from "lucide-react"
import Link from "next/link"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"

export function Header() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [companyName, setCompanyName] = useState("Project Management")

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const response = await fetch("/api/company")
        if (response.ok) {
          const data = await response.json()
          if (data?.name) {
            setCompanyName(data.name)
          }
        }
      } catch (error) {
        console.error("Failed to fetch company name:", error)
        // Keep default name on error
      }
    }

    if (session) {
      fetchCompanyName()
    }
  }, [session])

  if (!session) return null

  const initials =
    session.user.firstName && session.user.lastName
      ? `${session.user.firstName[0]}${session.user.lastName[0]}`
      : session.user.email?.[0]?.toUpperCase() || "U"

  const canEditSettings = hasPermission(session.user.permissions || [], PERMISSIONS.EDIT_SETTINGS)

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/dashboard" className="font-bold text-lg">
            {companyName}
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {session.user.firstName && session.user.lastName
                      ? `${session.user.firstName} ${session.user.lastName}`
                      : session.user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Role: {session.user.roleName || "Employee"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEditSettings && (
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
