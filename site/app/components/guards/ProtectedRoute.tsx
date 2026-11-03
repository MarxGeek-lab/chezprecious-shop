'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SELLER' | 'ADMIN';
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // if (!isAuthenticated) {
    //   const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    //   router.push(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
    //   return;
    // }

    // if (requiredRole) {
    //   const hasAccess =
    //     user?.role === requiredRole ||
    //     user?.role === 'ADMIN' ||
    //     (requiredRole === 'SELLER' && user?.role === 'STORE_MEMBER');
    //   if (!hasAccess) {
    //     router.push('/');
    //   }
    // }
  }, [isLoading, isAuthenticated, user, requiredRole, redirectTo, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: '#0F5C4A' }} />
        <Typography color="text.secondary">Chargement...</Typography>
      </Box>
    );
  }

  // if (!isAuthenticated) return null;

  return <>{children}</>;
}
