'use client';

import { usePathname } from 'next/navigation';
import { AdminAuthProvider } from '@/src/context/AdminAuthContext';
import { AdminTabProvider } from '@/src/context/AdminTabContext';
import AuthGuard from '@/src/components/auth/AuthGuard';
import AdminLayout from './AdminLayout';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/set-password'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  return (
    <AdminAuthProvider>
      {isPublic ? (
        children
      ) : (
        <AuthGuard>
          <AdminTabProvider>
            <AdminLayout>
              {children}
            </AdminLayout>
          </AdminTabProvider>
        </AuthGuard>
      )}
    </AdminAuthProvider>
  );
}
