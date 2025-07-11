export const PERMISSIONS = {
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  VIEW_ANALYTICS: "view_analytics",
  DELETE_USERS: "delete_users",
  EDIT_SETTINGS: "edit_settings",
  MANAGE_PROJECTS: "manage_projects",
  MANAGE_TEAMS: "manage_teams",
  MANAGE_ASSIGNED_TEAMS: "manage_assigned_teams", // Can only manage teams user is assigned to
  VIEW_ALL_TIMESHEETS: "view_all_timesheets",
  EDIT_ALL_TIMESHEETS: "edit_all_timesheets",
  MANAGE_TIMESHEETS: "manage_timesheets",
  GENERATE_REPORTS: "generate_reports",
} as const

export const DEFAULT_PERMISSIONS = {
  OWNER: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.DELETE_USERS,
    PERMISSIONS.EDIT_SETTINGS,
    PERMISSIONS.MANAGE_PROJECTS,
    PERMISSIONS.MANAGE_TEAMS,
    PERMISSIONS.VIEW_ALL_TIMESHEETS,
    PERMISSIONS.EDIT_ALL_TIMESHEETS,
    PERMISSIONS.MANAGE_TIMESHEETS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  EMPLOYEE: [],
}

export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission)
}

export function canManageTeam(userPermissions: string[], userId: string, teamMembers: string[]): boolean {
  // Can manage if has full team management permission
  if (hasPermission(userPermissions, PERMISSIONS.MANAGE_TEAMS)) {
    return true
  }

  // Can manage if has assigned team permission and is member of the team
  if (hasPermission(userPermissions, PERMISSIONS.MANAGE_ASSIGNED_TEAMS)) {
    return teamMembers.includes(userId)
  }

  return false
}
