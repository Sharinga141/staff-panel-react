export const PERMS = {
  Admin:      { canEdit: true,  canDelete: true,  seeReferents: true,  seeRoles: true,  seeLogs: true  },
  Superadmin: { canEdit: true,  canDelete: true,  seeReferents: true,  seeRoles: true,  seeLogs: true  },
  User:       { canEdit: true,  canDelete: true,  seeReferents: true,  seeRoles: true,  seeLogs: true  },
  Joueur:     { canEdit: false, canDelete: false, seeReferents: false, seeRoles: false, seeLogs: false }
}

export function getPerms(role) {
  return PERMS[role] || PERMS.User
}

export function getRoleBadgeClass(role) {
  if (role === 'Admin' || role === 'Superadmin') return 'role-admin'
  if (role === 'Joueur') return 'role-joueur'
  return 'role-user'
}