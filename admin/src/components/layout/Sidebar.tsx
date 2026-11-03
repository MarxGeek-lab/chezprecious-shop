'use client';

import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import {
  LayoutDashboard,
  Users,
  UsersRound,
  Package,
  ShoppingCart,
  Store,
  FolderTree,
  BarChart3,
  Settings,
  Shield,
  Bell,
  MessageSquare,
  Tag,
  Truck,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  ClipboardList,
  Plus,
  ChevronRight,
  Mail,
  ShoppingBag,
} from 'lucide-react';
import { canAccessTab } from '@/src/constants/permissions';
import { useRouter } from 'next/navigation';
import { useAdminTab, type AdminTabType } from '@/src/context/AdminTabContext';
import { useAdminAuth } from '@/src/context/AdminAuthContext';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavSubItem {
  tab: AdminTabType;
  label: string;
  icon: React.ElementType;
}

interface NavItem {
  tab: AdminTabType;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'orange' | 'red' | 'green';
  subItems?: NavSubItem[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { tab: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { tab: 'analytics', label: 'Analytiques', icon: BarChart3 },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { tab: 'users',    label: 'Utilisateurs', icon: Users, badgeColor: 'orange' },
      // { tab: 'sellers',  label: 'Vendeurs',      icon: Store, badge: '12',   badgeColor: 'green' },
      {
        tab: 'products', label: 'Produits', icon: Package,
        subItems: [
          { tab: 'product-new', label: 'Nouveau produit', icon: Plus },
        ],
      },
      { tab: 'orders',     label: 'Commandes',  icon: ShoppingCart, badgeColor: 'red' },
      { tab: 'categories', label: 'Catégories', icon: FolderTree },
    ],
  },
  {
    title: 'Commerce',
    items: [
      // { tab: 'promotions', label: 'Promotions', icon: Tag },
      { tab: 'payments',        label: 'Paiements',           icon: CreditCard },
      { tab: 'shipping',        label: 'Livraisons',          icon: Truck },
      { tab: 'abandoned-carts', label: 'Paniers abandonnés',  icon: ShoppingBag },
    ],
  },
  {
    title: 'Communication',
    items: [
      { tab: 'notifications', label: 'Notifications', icon: Bell },
      { tab: 'messages',      label: 'Messages',      icon: MessageSquare },
      { tab: 'newsletter',    label: 'Newsletter',    icon: Mail },
      { tab: 'reports',       label: 'Rapports',      icon: FileText },
    ],
  },
  {
    title: 'Système',
    items: [
      { tab: 'team',     label: 'Équipe',    icon: UsersRound },
      { tab: 'activity', label: 'Activité',  icon: ClipboardList },
      { tab: 'settings', label: 'Paramètres',icon: Settings },
      { tab: 'security', label: 'Sécurité',  icon: Shield },
      // { tab: 'help',     label: 'Aide',      icon: HelpCircle },
    ],
  },
];

const badgeClasses: Record<string, string> = {
  orange: styles.navBadgeOrange,
  red: styles.navBadgeRed,
  green: styles.navBadgeGreen,
};

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { activeTab, setActiveTab } = useAdminTab();
  const { admin, logout } = useAdminAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleNavClick = (tab: AdminTabType) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {open && <Box className={styles.overlay} onClick={onClose} />}
      <Box className={`${styles.sidebar} ${open ? styles.open : ''}`}>
        {/* Logo */}
        <Box className={styles.logoArea}>
          <Typography className={styles.logoText}>
            Chez<span>Precious</span>
          </Typography>
        </Box>

        {/* Navigation */}
        <Box component="nav" className={styles.nav}>
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => canAccessTab(admin?.role, item.tab));
            if (visibleItems.length === 0) return null;
            return (
              <Box key={section.title} className={styles.navSection}>
                <Typography className={styles.navSectionTitle}>
                  {section.title}
                </Typography>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.tab;
                  // Un sub-item est actif → considérer le parent comme actif aussi
                  const isParentActive = item.subItems?.some((s) => s.tab === activeTab) ?? false;
                  const showSubItems = (isActive || isParentActive) && item.subItems && item.subItems.length > 0;

                  return (
                    <Box key={item.tab}>
                      <Tooltip title={item.label} placement="right" arrow>
                        <Box
                          className={`${styles.navItem} ${isActive || isParentActive ? styles.active : ''}`}
                          onClick={() => handleNavClick(item.tab)}
                        >
                          <Box className={styles.navIcon}>
                            <Icon size={20} />
                          </Box>
                          <span>{item.label}</span>
                          {item.badge && (
                            <Box className={`${styles.navBadge} ${badgeClasses[item.badgeColor || 'orange']}`}>
                              {item.badge}
                            </Box>
                          )}
                          {item.subItems && item.subItems.length > 0 && (
                            <Box sx={{
                              ml: 'auto', display: 'flex', alignItems: 'center',
                              transition: 'transform 0.15s',
                              transform: showSubItems ? 'rotate(90deg)' : 'none',
                              opacity: 0.5,
                            }}>
                              <ChevronRight size={14} />
                            </Box>
                          )}
                        </Box>
                      </Tooltip>

                      {/* Sub-items */}
                      {showSubItems && item.subItems!.filter((s) => canAccessTab(admin?.role, s.tab)).map((sub) => {
                        const SubIcon = sub.icon;
                        const isSubActive = activeTab === sub.tab;
                        return (
                          <Tooltip key={sub.tab} title={sub.label} placement="right" arrow>
                            <Box
                              className={`${styles.navItem} ${styles.navSubItem} ${isSubActive ? styles.active : ''}`}
                              onClick={() => handleNavClick(sub.tab)}
                            >
                              <Box className={styles.navIcon}>
                                <SubIcon size={16} />
                              </Box>
                              <span>{sub.label}</span>
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>

        {/* Footer - User */}
        <Box className={styles.sidebarFooter}>
          <Box className={styles.userCard}>
            <Avatar
              src={admin?.avatar ?? undefined}
              sx={{ width: 36, height: 36, bgcolor: '#0F5C4A', fontSize: 14 }}
            >
              {admin ? getInitials(admin.fullName, admin.email) : '?'}
            </Avatar>
            <Box className={styles.userInfo}>
              <Typography className={styles.userName}>
                {admin?.fullName || admin?.email || 'Admin'}
              </Typography>
              <Typography className={styles.userRole}>
                {admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrateur'}
              </Typography>
            </Box>
            <Tooltip title="Se déconnecter" placement="top">
              <Box
                component="button"
                onClick={handleLogout}
                sx={{
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'inherit',
                  opacity: 0.6,
                  borderRadius: '4px',
                  '&:hover': { opacity: 1, bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444' },
                  transition: 'all 0.15s',
                }}
              >
                <LogOut size={18} />
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Box>
    </>
  );
}
