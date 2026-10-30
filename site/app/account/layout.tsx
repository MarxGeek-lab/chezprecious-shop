'use client';

// ==============================================
// LAYOUT DASHBOARD UTILISATEUR (Tab System)
// ==============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Drawer,
  useMediaQuery,
  Badge,
} from '@mui/material';
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  MapPin,
  Heart,
  Star,
  Shield,
  LogOut,
  Menu as MenuIcon,
  X,
  MessageSquare,
  Bell,
  Store,
  ArrowLeft,
} from 'lucide-react';
import { ProtectedRoute } from '@/app/components/guards';
import { useAuth } from '@/app/context/AuthContext';
import { useWishlist } from '@/app/context/WishlistContext';
import { AccountTabProvider, useAccountTab, type AccountTabType } from '@/app/context/AccountTabContext';
import AccountTabContent from './AccountTabContent';
import { ordersApi } from '@/app/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useCustomerUnreadCount } from '@/app/hooks/useMessages';
import { useNotificationUnreadCount } from '@/app/hooks/useNotifications';
import styles from './account.module.scss';

interface NavItem {
  label: string;
  tab: AccountTabType;
  icon: React.ReactNode;
  badge?: number;
}

function AccountLayoutInner() {
  const router = useRouter();
  // Mobile phone: < 640px — bottom nav
  // Tablet: 640–1023px — hamburger + drawer
  // Desktop: >= 1024px — sidebar
  const isMobilePhone = useMediaQuery('(max-width: 639px)');
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab } = useAccountTab();
  const { itemCount: wishlistCount } = useWishlist();
  const { data: unreadMessages = 0 } = useCustomerUnreadCount();
  const { data: unreadNotifCount = 0 } = useNotificationUnreadCount();
  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'list'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (!token) return { orders: [] };
      const { data } = await ordersApi.list();
      return data;
    },
    retry: false,
  });
  const ordersCount = ordersData?.orders?.length ?? 0;

  const navItems: NavItem[] = [
    { label: 'Tableau de bord', tab: 'dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Mes commandes', tab: 'orders', icon: <ShoppingBag size={20} />, badge: ordersCount || undefined },
    { label: 'Mon profil', tab: 'profile', icon: <User size={20} /> },
    { label: 'Mes adresses', tab: 'addresses', icon: <MapPin size={20} /> },
    { label: 'Mes favoris', tab: 'wishlist', icon: <Heart size={20} />, badge: wishlistCount || undefined },
    { label: 'Mes avis', tab: 'reviews', icon: <Star size={20} /> },
    { label: 'Sécurité', tab: 'security', icon: <Shield size={20} /> },
    { label: 'Messages', tab: 'messages', icon: <MessageSquare size={20} />, badge: unreadMessages || undefined },
    { label: 'Notifications', tab: 'notifications', icon: <Bell size={20} />, badge: unreadNotifCount || undefined },
  ];

  // Bottom nav items (5 most important)
  const bottomNavItems: NavItem[] = [
    { label: 'Accueil', tab: 'dashboard', icon: <LayoutDashboard size={22} /> },
    { label: 'Commandes', tab: 'orders', icon: <ShoppingBag size={22} />, badge: ordersCount || undefined },
    { label: 'Favoris', tab: 'wishlist', icon: <Heart size={22} />, badge: wishlistCount || undefined },
    { label: 'Messages', tab: 'messages', icon: <MessageSquare size={22} />, badge: unreadMessages || undefined },
    { label: 'Profil', tab: 'profile', icon: <User size={22} /> },
  ];

  // Prevent browser back button from leaving the account area
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, setActiveTab]);

  const handleNavClick = (tab: AccountTabType) => {
    setActiveTab(tab);
    if (isMobile) setMobileOpen(false);
  };

  const sidebarNav = (
    <>
      {/* User Header */}
      <Box className={styles.sidebarHeader}>
        <Avatar className={styles.userAvatar} src={user?.avatar || undefined}>
          {user?.fullName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
        </Avatar>
        <Box>
          <Typography className={styles.userName}>{user?.fullName || 'Utilisateur'}</Typography>
          <Typography className={styles.userEmail}>{user?.email || ''}</Typography>
        </Box>
      </Box>

      {/* Navigation Links */}
      <Box className={styles.navBody}>
        <List disablePadding className={styles.navLinks}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.tab}
              className={`${styles.navItem} ${activeTab === item.tab ? styles.active : ''}`}
              onClick={() => handleNavClick(item.tab)}
            >
              <ListItemIcon className={styles.navIcon}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { className: styles.navLabel } }}
              />
              {item.badge && <Box className={styles.navBadge}>{item.badge}</Box>}
            </ListItemButton>
          ))}
        </List>

        {/* Logout + Switch to seller */}
        <Box className={styles.navFooter}>
          <Divider />
          <ListItemButton
            className={styles.navItem}
            onClick={() => router.push('/')}
          >
            <ListItemIcon className={styles.navIcon}>
              <ArrowLeft size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Retour au site"
              slotProps={{ primary: { className: styles.navLabel } }}
            />
          </ListItemButton>
          <Divider />
          {user?.role === 'SELLER' && (
            <ListItemButton
              component={Link}
              href="/seller"
              className={styles.navItem}
              sx={{ color: '#D45D00' }}
            >
              <ListItemIcon className={styles.navIcon} sx={{ color: '#D45D00' }}>
                <Store size={20} />
              </ListItemIcon>
              <ListItemText
                primary="Espace vendeur"
                slotProps={{ primary: { className: styles.navLabel } }}
              />
            </ListItemButton>
          )}
          <ListItemButton
            className={`${styles.navItem} ${styles.logoutItem}`}
            onClick={async () => {
              await logout();
              router.push('/');
            }}
          >
            <ListItemIcon className={styles.navIcon}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText
              primary="Déconnexion"
              slotProps={{ primary: { className: styles.navLabel } }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </>
  );

  return (
    <Box className={styles.accountLayout}>
      {/* Mobile Header Bar — tablette + téléphone */}
      {isMobile && (
        <Box className={styles.mobileHeader}>
          <IconButton onClick={() => setMobileOpen(true)} className={styles.burgerBtn}>
            <MenuIcon size={24} />
          </IconButton>
          <Typography className={styles.mobileTitle}>Mon compte</Typography>
          <IconButton onClick={() => router.push('/')} size="small" title="Retour au site">
            <ArrowLeft size={20} />
          </IconButton>
        </Box>
      )}

      {/* Sidebar - Desktop (>= 1024px) */}
      {!isMobile && (
        <Box className={styles.sidebar}>
          <Paper className={styles.sidebarCard} elevation={0}>
            {sidebarNav}
          </Paper>
        </Box>
      )}

      {/* Sidebar - Mobile/Tablet Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            border: 'none',
          },
        }}
      >
        <Box className={styles.drawerHeader}>
          <Typography variant="h6">Mon compte</Typography>
          <IconButton onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </IconButton>
        </Box>
        {sidebarNav}
      </Drawer>

      {/* Main Content - Tab Content */}
      <Box className={`${styles.mainContent} ${isMobilePhone ? styles.mainContentMobile : ''}`}>
        <AccountTabContent />
      </Box>

      {/* Bottom Navigation — mobile phone only (< 640px) */}
      {isMobilePhone && (
        <Box className={styles.bottomNav}>
          {bottomNavItems.map((item) => (
            <Box
              key={item.tab}
              className={`${styles.bottomNavItem} ${activeTab === item.tab ? styles.bottomNavActive : ''}`}
              onClick={() => setActiveTab(item.tab)}
            >
              <Box className={styles.bottomNavIcon}>
                {item.icon}
                {item.badge ? (
                  <Box className={styles.bottomNavBadge}>
                    {item.badge > 9 ? '9+' : item.badge}
                  </Box>
                ) : null}
              </Box>
              <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>{item.label}</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AccountTabProvider>
        <AccountLayoutInner />
      </AccountTabProvider>
    </ProtectedRoute>
  );
}
