export type UserRole = 'ADMIN' | 'USER';

export type PermissionAction =
  | 'CREATE_EMPLOYEE'
  | 'UPDATE_EMPLOYEE'
  | 'DELETE_EMPLOYEE'
  | 'CREATE_DUTY'
  | 'UPDATE_DUTY'
  | 'DELETE_DUTY'
  | 'CREATE_OFFICE_ORDER'
  | 'UPDATE_OFFICE_ORDER'
  | 'DELETE_OFFICE_ORDER'
  | 'MANAGE_USERS';

export function hasPermission(role: string, action: PermissionAction): boolean {
  const normRole = role.toUpperCase();
  if (normRole === 'ADMIN') {
    return true;
  }

  // USER role permissions
  switch (action) {
    case 'CREATE_EMPLOYEE':
    case 'DELETE_EMPLOYEE':
    case 'DELETE_DUTY':
    case 'DELETE_OFFICE_ORDER':
    case 'MANAGE_USERS':
      return false;
    case 'UPDATE_EMPLOYEE': // Officers can update self-details (enforced at service layer)
    case 'CREATE_DUTY':
    case 'UPDATE_DUTY':
    case 'CREATE_OFFICE_ORDER':
    case 'UPDATE_OFFICE_ORDER':
      return true;
    default:
      return false;
  }
}
