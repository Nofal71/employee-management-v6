declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      companyId: string
      roleId: string
      roleName: string
      mustChangePassword: boolean
      profileCompleted: boolean
      permissions: string[]
    }
  }

  interface User {
    companyId: string
    roleId: string
    roleName: string
    mustChangePassword: boolean
    profileCompleted: boolean
    permissions: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    companyId: string
    roleId: string
    roleName: string
    mustChangePassword: boolean
    profileCompleted: boolean
    permissions: string[]
  }
}
