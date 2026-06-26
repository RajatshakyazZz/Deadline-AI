export const PERMISSIONS = {
  CREATE_TASK: 'create_task',
  DELETE_TASK: 'delete_task', 
  UPDATE_TASK: 'update_task',
  VIEW_TASK: 'view_task',
  USE_AI: 'use_ai',
  SYNC_CALENDAR: 'sync_calendar',
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export function canPerform(user: any, permission: PermissionType): boolean {
  if (!user) return false;
  
  // All authenticated users have all permissions
  // (single-user app — but structure allows future roles)
  const AUTHENTICATED_PERMISSIONS = Object.values(PERMISSIONS) as string[];
  return AUTHENTICATED_PERMISSIONS.includes(permission);
}
