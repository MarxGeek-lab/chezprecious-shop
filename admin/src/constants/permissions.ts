import type { AdminTabType } from '@/src/context/AdminTabContext';

const MODERATOR_TABS: AdminTabType[] = [
  'dashboard', 'analytics', 'users', 'products', 'orders', 'categories',
  'messages', 'notifications', 'newsletter', 'reports', 'product-new', 'product-edit',
];

const ADMIN_DENIED: AdminTabType[] = ['team'];

export function canAccessTab(role: string | null | undefined, tab: AdminTabType): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'ADMIN') return !ADMIN_DENIED.includes(tab);
  if (role === 'MODERATOR') return MODERATOR_TABS.includes(tab);
  return false;
}
