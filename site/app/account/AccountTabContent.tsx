'use client';

import React, { Suspense, lazy } from 'react';
import { useAccountTab } from '@/app/context/AccountTabContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const DashboardPage = lazy(() => import('./page'));
const OrdersPage = lazy(() => import('./orders/page'));
const ProfilePage = lazy(() => import('./profile/page'));
const AddressesPage = lazy(() => import('./addresses/page'));
const WishlistPage = lazy(() => import('./wishlist/page'));
const ReviewsPage = lazy(() => import('./reviews/page'));
const SecurityPage = lazy(() => import('./security/page'));
const MessagesPage = lazy(() => import('./messages/page'));
const NotificationsPage = lazy(() => import('./notifications/page'));

function LoadingSkeleton() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '400px',
        gap: 2,
      }}
    >
      <CircularProgress size={40} sx={{ color: '#0F5C4A' }} />
      <Typography color="text.secondary" sx={{ fontSize: 14 }}>
        Chargement....
      </Typography>
    </Box>
  );
}

export default function AccountTabContent() {
  const { activeTab } = useAccountTab();

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return <ProfilePage />;
      case 'addresses':
        return <AddressesPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'reviews':
        return <ReviewsPage />;
      case 'security':
        return <SecurityPage />;
      case 'messages':
        return <MessagesPage />;
      case 'notifications':
        return <NotificationsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Box sx={{ height: '100%', width: '100%' }}>
        {renderTabContent()}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, height: '80px', flexShrink: 0 }} />
      </Box>
    </Suspense>
  );
}
