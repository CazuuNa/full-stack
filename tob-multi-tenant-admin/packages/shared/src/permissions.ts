export const PERMISSION_CODES = {
  PLATFORM_TENANT_READ:'platform.tenant.read',
  PLATFORM_TENANT_CREATE: 'platform.tenant.create',
  PLATFORM_TENANT_UPDATE: 'platform.tenant.update',

  TENANT_USER_READ: 'tenant.user.read',
  TENANT_USER_CREATE: 'tenant.user.create',
  TENANT_USER_UPDATE: 'tenant.user.update',

  ROLE_READ: 'role.read',
  ROLE_CREATE: 'role.create',
  ROLE_UPDATE: 'role.update',

  AUDIT_LOG_READ: 'audit-log.read',

  SETTINGS_READ: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
} as const;

export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export const ALL_PERMISSION_CODES: PermissionCode[] = Object.keys(PERMISSION_CODES).map(key => PERMISSION_CODES[key as keyof typeof PERMISSION_CODES]);

export const DEFAULT_TENANT_ADMIN_PERMISSIONS: PermissionCode[] = [
  PERMISSION_CODES.TENANT_USER_READ,
  PERMISSION_CODES.TENANT_USER_CREATE,
  PERMISSION_CODES.TENANT_USER_UPDATE,
  PERMISSION_CODES.ROLE_READ,
  PERMISSION_CODES.ROLE_CREATE,
  PERMISSION_CODES.ROLE_UPDATE,
  PERMISSION_CODES.AUDIT_LOG_READ,
  PERMISSION_CODES.SETTINGS_READ,
  PERMISSION_CODES.SETTINGS_UPDATE,
];