export type UserRole = 'ADMIN' | 'OWNER' | 'CUSTOMER';

export function isStaff(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'OWNER';
}

export function isAdmin(role?: string | null): boolean {
  return role === 'ADMIN';
}
