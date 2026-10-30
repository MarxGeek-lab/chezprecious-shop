'use client';

import { usePathname } from 'next/navigation';
import ProtectedRoute from './ProtectedRoute';

const PUBLIC_PATHS = ['/login', '/forgot-password', '/set-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
