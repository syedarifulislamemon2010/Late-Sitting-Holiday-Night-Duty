export type UserRole = 'ADMIN' | 'USER' | 'EMPLOYEE';

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

  if (normRole === 'EMPLOYEE') {
    return false; // Employees have no administrative write permissions
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

export function canAccessRoute(role: string, route: string): boolean {
  const normRole = role.toUpperCase();
  if (normRole === 'ADMIN') {
    return true;
  }
  if (normRole === 'EMPLOYEE') {
    // EMPLOYEE role can access /my-portal and /analytics (and their APIs)
    return (
      route === '/my-portal' ||
      route.startsWith('/my-portal/') ||
      route.startsWith('/api/my-portal') ||
      route === '/analytics' ||
      route.startsWith('/analytics/') ||
      route.startsWith('/api/analytics')
    );
  }
  // ADMIN and USER roles can access other routes, but cannot access employee self-service portal
  return route !== '/my-portal' && !route.startsWith('/my-portal/');
}

