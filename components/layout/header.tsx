"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Session } from "next-auth"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { User, Key, LogOut } from "lucide-react"
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

interface HeaderProps {
  session: Session | null
}

const Header = ({ session }: HeaderProps) => {
  return (
    <header className="bg-white py-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          My App
        </Link>
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || "User Avatar"} />
                  <AvatarFallback>{session?.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasPermission(session?.user.permissions || [], PERMISSIONS.EDIT_SETTINGS) && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href="/auth/change-password">
                  <Key className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
