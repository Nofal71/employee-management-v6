import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            company: true,
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          roleId: user.roleId,
          roleName: user.role.name,
          mustChangePassword: user.mustChangePassword,
          profileCompleted: user.profileCompleted,
          permissions: user.role.permissions.map((rp) => rp.permission.name),
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.companyId = user.companyId
        token.roleId = user.roleId
        token.roleName = user.roleName
        token.mustChangePassword = user.mustChangePassword
        token.profileCompleted = user.profileCompleted
        token.permissions = user.permissions
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub!
      session.user.companyId = token.companyId as string
      session.user.roleId = token.roleId as string
      session.user.roleName = token.roleName as string
      session.user.mustChangePassword = token.mustChangePassword as boolean
      session.user.profileCompleted = token.profileCompleted as boolean
      session.user.permissions = token.permissions as string[]
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
}
