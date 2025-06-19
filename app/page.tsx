"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (session?.user) {
      // Check if user needs to complete profile or change password
      if (session.user.mustChangePassword && !session.user.profileCompleted) {
        router.push("/auth/change-password")
      } else if (!session.user.profileCompleted && !session.user.mustChangePassword) {
        router.push("/auth/complete-profile")
      } else {
        router.push("/dashboard")
      }
    } else {
      router.push("/auth/login")
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
