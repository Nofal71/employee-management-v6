import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    if (pathname.startsWith("/auth/")) {
      return NextResponse.next()
    }

    // If user is not authenticated, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }

    // Handle first-time login flow - only redirect if password must be changed AND profile is not completed
    if (token.mustChangePassword && !token.profileCompleted && pathname !== "/auth/change-password") {
      return NextResponse.redirect(new URL("/auth/change-password", req.url))
    }

    // Handle profile completion - only if password doesn't need to be changed
    if (!token.profileCompleted && !token.mustChangePassword && pathname !== "/auth/complete-profile") {
      return NextResponse.redirect(new URL("/auth/complete-profile", req.url))
    }

    // Redirect to dashboard if trying to access auth pages while fully authenticated
    if (pathname.startsWith("/auth/") && token && !token.mustChangePassword && token.profileCompleted) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to auth pages without token
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        // Require token for all other pages
        return !!token
      },
    },
  },
)

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
