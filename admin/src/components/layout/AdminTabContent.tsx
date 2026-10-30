'use client';

// ==============================================
// ADMIN TAB CONTENT - Router de contenu par onglet
// ==============================================

import { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Shield } from 'lucide-react';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useAdminAuth } from '@/src/context/AdminAuthContext';
import { canAccessTab } from '@/src/constants/permissions';

// Lazy loading des pages
const DashboardPage = lazy(() => import('@/app/dashboard/DashboardTab'));
const AnalyticsPage = lazy(() => import('@/app/analytics/AnalyticsTab'));
const UsersPage = lazy(() => import('@/app/users/UsersTab'));
const UserDetailPage = lazy(() => import('@/app/users/UserDetailTab'));
const ProductsPage = lazy(() => import('@/app/products/ProductsTab'));
const ProductDetailPage = lazy(() => import('@/app/products/ProductDetailTab'));
const OrdersPage = lazy(() => import('@/app/orders/OrdersTab'));
const OrderDetailPage = lazy(() => import('@/app/orders/OrderDetailTab'));
const SellersPage = lazy(() => import('@/app/sellers/SellersTab'));
const SellerDetailPage = lazy(() => import('@/app/sellers/SellerDetailTab'));
const CategoriesPage = lazy(() => import('@/app/categories/CategoriesTab'));
const PromotionsPage = lazy(() => import('@/app/promotions/PromotionsTab'));
const PaymentsPage = lazy(() => import('@/app/payments/PaymentsTab'));
const ShippingPage = lazy(() => import('@/app/shipping/ShippingTab'));
const NotificationsPage = lazy(() => import('@/app/notifications/NotificationsTab'));
const MessagesPage = lazy(() => import('@/app/messages/MessagesTab'));
const ReportsPage = lazy(() => import('@/app/reports/ReportsTab'));
const SettingsPage = lazy(() => import('@/app/settings/SettingsTab'));
const SecurityPage = lazy(() => import('@/app/security/SecurityTab'));
const TeamPage = lazy(() => import('@/app/team/TeamTab'));
const ActivityPage = lazy(() => import('@/app/activity/ActivityTab'));
const NewsletterPage = lazy(() => import('@/app/newsletter/NewsletterTab'));
const HelpPage = lazy(() => import('@/app/help/HelpTab'));
const NewProductPage  = lazy(() => import('@/app/products/new/page'));
const EditProductPage = lazy(() => import('@/app/products/edit/page'));
const AbandonedCartsPage = lazy(() => import('@/app/abandoned-carts/AbandonedCartsTab'));

// Loading spinner
function LoadingFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <CircularProgress sx={{ color: '#7B1E3A' }} />
    </Box>
  );
}

function AccessDeniedScreen() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2, color: '#6B7280' }}>
      <Shield size={48} strokeWidth={1.5} />
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>Accès refusé</Typography>
      <Typography variant="body2">Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.</Typography>
    </Box>
  );
}

export default function AdminTabContent() {
  const { activeTab } = useAdminTab();
  const { admin } = useAdminAuth();

  if (!canAccessTab(admin?.role, activeTab)) {
    return <AccessDeniedScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'users': return <UsersPage />;
      case 'user-detail': return <UserDetailPage />;
      case 'products': return <ProductsPage />;
      case 'product-detail': return <ProductDetailPage />;
      case 'orders': return <OrdersPage />;
      case 'order-detail': return <OrderDetailPage />;
      case 'sellers': return <SellersPage />;
      case 'seller-detail': return <SellerDetailPage />;
      case 'categories': return <CategoriesPage />;
      case 'promotions': return <PromotionsPage />;
      case 'payments': return <PaymentsPage />;
      case 'shipping': return <ShippingPage />;
      case 'notifications': return <NotificationsPage />;
      case 'messages': return <MessagesPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      case 'security': return <SecurityPage />;
      case 'team': return <TeamPage />;
      case 'activity': return <ActivityPage />;
      case 'newsletter': return <NewsletterPage />;
      case 'help': return <HelpPage />;
      case 'product-new':  return <NewProductPage />;
      case 'product-edit': return <EditProductPage />;
      case 'abandoned-carts': return <AbandonedCartsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Box sx={{ height: '100%', width: '100%' }}>
        {renderContent()}
      </Box>
    </Suspense>
  );
}
