'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, InputBase, Badge, Tooltip, Typography, Paper, ClickAwayListener } from '@mui/material';
import {
  Search, Bell, Menu,
  Users, Store, Package, ShoppingCart, ChevronDown, X,
  User, Tag, CheckCheck,
} from 'lucide-react';
import api from '@/src/lib/api';
import { useAdminTab, type AdminTabType } from '@/src/context/AdminTabContext';
import { useAdminSearch, useAdminNotifications, type SearchType, type AdminNotification } from '@/src/hooks/useAdminData';
import styles from './Header.module.scss';

interface HeaderProps {
  onMenuToggle: () => void;
}

const pageTitles: Record<AdminTabType, { title: string; subtitle: string }> = {
  dashboard:      { title: 'Tableau de bord', subtitle: 'Vue d\'ensemble de la marketplace' },
  analytics:      { title: 'Analytiques',     subtitle: 'Statistiques détaillées' },
  users:          { title: 'Utilisateurs',    subtitle: 'Gestion des comptes utilisateurs' },
  'user-detail':  { title: 'Utilisateur',     subtitle: 'Détail du compte' },
  sellers:        { title: 'Vendeurs',         subtitle: 'Gestion des boutiques et vendeurs' },
  'seller-detail':{ title: 'Vendeur',          subtitle: 'Détail de la boutique' },
  products:       { title: 'Produits',         subtitle: 'Catalogue et gestion des produits' },
  'product-detail':{ title: 'Produit',         subtitle: 'Détail du produit' },
  orders:         { title: 'Commandes',        subtitle: 'Suivi et gestion des commandes' },
  'order-detail': { title: 'Commande',         subtitle: 'Détail de la commande' },
  'abandoned-carts': { title: 'Paniers abandonnés', subtitle: 'Suivi et relance des paniers non finalisés' },
  categories:     { title: 'Catégories',       subtitle: 'Organisation du catalogue' },
  promotions:     { title: 'Promotions',       subtitle: 'Gestion des offres promotionnelles' },
  payments:       { title: 'Paiements',        subtitle: 'Transactions et facturation' },
  shipping:       { title: 'Livraisons',       subtitle: 'Suivi des expéditions' },
  notifications:  { title: 'Notifications',    subtitle: 'Centre de notifications' },
  messages:       { title: 'Messages',         subtitle: 'Messagerie interne' },
  newsletter:     { title: 'Newsletter',       subtitle: 'Gestion des abonnés et campagnes' },
  reports:        { title: 'Rapports',         subtitle: 'Rapports et statistiques' },
  settings:       { title: 'Paramètres',       subtitle: 'Configuration de la plateforme' },
  security:       { title: 'Sécurité',         subtitle: 'Sécurité et permissions' },
  team:           { title: 'Équipe',            subtitle: 'Gestion des administrateurs' },
  activity:       { title: "Journal d'activité", subtitle: 'Historique des actions administrateurs' },
  help:           { title: 'Aide',             subtitle: 'Documentation et support' },
  'product-new':  { title: 'Nouveau produit',    subtitle: 'Ajouter un produit au catalogue admin' },
  'product-edit': { title: 'Modifier le produit', subtitle: 'Édition du produit' },
};

const SEARCH_TYPES: { value: SearchType; label: string; icon: React.ElementType; tab: AdminTabType }[] = [
  { value: 'all',      label: 'Tout',       icon: Search,      tab: 'users' },
  { value: 'users',    label: 'Utilisateurs', icon: Users,     tab: 'users' },
  { value: 'sellers',  label: 'Vendeurs',   icon: Store,       tab: 'sellers' },
  { value: 'products', label: 'Produits',   icon: Package,     tab: 'products' },
  { value: 'orders',   label: 'Commandes',  icon: ShoppingCart, tab: 'orders' },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#10B981', PENDING: '#F59E0B', INACTIVE: '#6B7280',
  SUSPENDED: '#EF4444', APPROVED: '#10B981', REJECTED: '#EF4444',
  DELIVERED: '#10B981', CANCELLED: '#EF4444', PROCESSING: '#3B82F6',
  SHIPPED: '#8B5CF6', PENDING_PAYMENT: '#F59E0B',
};

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      backgroundColor: STATUS_COLORS[status] ?? '#9CA3AF', flexShrink: 0,
    }} />
  );
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { activeTab, setActiveTab } = useAdminTab();
  const pageInfo = pageTitles[activeTab] || { title: 'Admin', subtitle: 'MarketPlace' };

  const [query, setQuery]           = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [typeOpen, setTypeOpen]     = useState(false);
  const [focused, setFocused]       = useState(false);
  const [notifOpen, setNotifOpen]   = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifData, refetch: refetchNotifs } = useAdminNotifications({ limit: 8, read: '' });

  const inputRef    = useRef<HTMLInputElement>(null);
  const anchorRef   = useRef<HTMLDivElement>(null);
  const typeRef     = useRef<HTMLButtonElement>(null);

  const { data: results, isFetching } = useAdminSearch(query, searchType);

  const showDropdown = focused && query.trim().length >= 2;
  const currentType  = SEARCH_TYPES.find((t) => t.value === searchType)!;
  const TypeIcon     = currentType.icon;

  const totalResults = results
    ? (results.users?.length ?? 0) + (results.sellers?.length ?? 0) +
      (results.products?.length ?? 0) + (results.orders?.length ?? 0)
    : 0;

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleSelectType(t: SearchType) {
    setSearchType(t);
    setTypeOpen(false);
    inputRef.current?.focus();
  }

  const navigateTo = useCallback((tab: AdminTabType, params?: Record<string, string>) => {
    setQuery('');
    setFocused(false);
    setActiveTab(tab, params);
  }, [setActiveTab]);

  // Keyboard: Escape closes dropdowns
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setFocused(false); setTypeOpen(false); setNotifOpen(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const unreadCount = notifData?.meta?.unread ?? 0;
  const notifications = notifData?.notifications ?? [];

  async function markAllRead() {
    await api.patch('/admin/notifications/read-all').catch(() => {});
    refetchNotifs();
  }

  async function markOneRead(id: string) {
    await api.patch(`/admin/notifications/${id}/read`).catch(() => {});
    refetchNotifs();
  }

  function handleNotifClick(n: AdminNotification) {
    markOneRead(n.id);
    setNotifOpen(false);
    setActiveTab('notifications');
  }

  return (
    <Box className={styles.header}>
      <Box className={styles.left}>
        <IconButton className={styles.menuButton} onClick={onMenuToggle}>
          <Menu size={22} />
        </IconButton>
        <Box className={styles.pageInfo}>
          <Typography className={styles.pageTitle}>{pageInfo.title}</Typography>
          <Typography variant='body2' className={styles.pageSubtitle}>{pageInfo.subtitle}</Typography>
        </Box>
      </Box>

      {/* ── Search ── */}
      <ClickAwayListener onClickAway={() => { setFocused(false); setTypeOpen(false); }}>
        <Box className={styles.searchWrapper} ref={anchorRef}>
          <Box
            className={styles.searchBar}
            sx={{ borderColor: focused ? '#D45D00 !important' : undefined }}
          >
            {/* Type selector */}
            <button
              ref={typeRef}
              className={styles.typeSelector}
              onClick={() => setTypeOpen((o) => !o)}
              type="button"
            >
              <TypeIcon size={14} />
              <span>{currentType.label}</span>
              <ChevronDown size={12} style={{ opacity: 0.6, transform: typeOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
            </button>

            <span className={styles.typeDivider} />

            <Search size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
            <InputBase
              inputRef={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={`Rechercher ${currentType.label === 'Tout' ? 'utilisateurs, produits…' : currentType.label.toLowerCase()}…`}
              className={styles.searchInput}
              inputProps={{ 'aria-label': 'Recherche globale' }}
            />
            {query && (
              <IconButton size="small" onClick={handleClear} sx={{ p: '2px', color: '#9CA3AF' }}>
                <X size={14} />
              </IconButton>
            )}
          </Box>

          {/* Type dropdown */}
          {typeOpen && (
            <Paper className={styles.typeDropdown} elevation={4}>
              {SEARCH_TYPES.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    className={`${styles.typeOption} ${t.value === searchType ? styles.typeOptionActive : ''}`}
                    onClick={() => handleSelectType(t.value)}
                    type="button"
                  >
                    <Icon size={15} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </Paper>
          )}

          {/* Results dropdown */}
          {showDropdown && (
            <Paper className={styles.resultsDropdown} elevation={6}>
              {isFetching && !results && (
                <Box className={styles.searchHint}>Recherche en cours…</Box>
              )}

              {results && totalResults === 0 && (
                <Box className={styles.searchEmpty}>
                  <Search size={28} style={{ color: '#D1D5DB', marginBottom: 8 }} />
                  <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Aucun résultat pour « {query} »</Typography>
                </Box>
              )}

              {/* Users */}
              {results && results.users.length > 0 && (
                <Box className={styles.resultGroup}>
                  <Box className={styles.resultGroupHeader}>
                    <Users size={12} />
                    <span>Utilisateurs</span>
                  </Box>
                  {results.users.map((u) => (
                    <button
                      key={u.id}
                      className={styles.resultItem}
                      onClick={() => navigateTo('user-detail', { userId: u.id })}
                      type="button"
                    >
                      <Box className={styles.resultAvatar}>
                        {u.avatar
                          ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : <User size={14} color="#9CA3AF" />
                        }
                      </Box>
                      <Box className={styles.resultInfo}>
                        <span className={styles.resultTitle}>{u.fullName || u.email}</span>
                        <span className={styles.resultSub}>{u.email}</span>
                      </Box>
                      <StatusDot status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </button>
                  ))}
                </Box>
              )}

              {/* Sellers */}
              {results && results.sellers.length > 0 && (
                <Box className={styles.resultGroup}>
                  <Box className={styles.resultGroupHeader}>
                    <Store size={12} />
                    <span>Vendeurs</span>
                  </Box>
                  {results.sellers.map((s) => (
                    <button
                      key={s.id}
                      className={styles.resultItem}
                      onClick={() => navigateTo('seller-detail', { sellerId: s.id })}
                      type="button"
                    >
                      <Box className={styles.resultAvatar}>
                        {s.logo
                          ? <img src={s.logo} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          : <Store size={14} color="#9CA3AF" />
                        }
                      </Box>
                      <Box className={styles.resultInfo}>
                        <span className={styles.resultTitle}>{s.name}</span>
                        <span className={styles.resultSub}>{s.userEmail ?? ''}</span>
                      </Box>
                      <StatusDot status={s.status} />
                    </button>
                  ))}
                </Box>
              )}

              {/* Products */}
              {results && results.products.length > 0 && (
                <Box className={styles.resultGroup}>
                  <Box className={styles.resultGroupHeader}>
                    <Package size={12} />
                    <span>Produits</span>
                  </Box>
                  {results.products.map((p) => (
                    <button
                      key={p.id}
                      className={styles.resultItem}
                      onClick={() => navigateTo('product-detail', { productId: p.id })}
                      type="button"
                    >
                      <Box className={styles.resultAvatar} sx={{ bgcolor: 'rgba(59,130,246,0.1) !important' }}>
                        <Tag size={14} color="#3B82F6" />
                      </Box>
                      <Box className={styles.resultInfo}>
                        <span className={styles.resultTitle}>{p.name}</span>
                        <span className={styles.resultSub}>{p.storeName ?? ''}</span>
                      </Box>
                      <StatusDot status={p.status} />
                    </button>
                  ))}
                </Box>
              )}

              {/* Orders */}
              {results && results.orders.length > 0 && (
                <Box className={styles.resultGroup}>
                  <Box className={styles.resultGroupHeader}>
                    <ShoppingCart size={12} />
                    <span>Commandes</span>
                  </Box>
                  {results.orders.map((o) => (
                    <button
                      key={o.id}
                      className={styles.resultItem}
                      onClick={() => navigateTo('order-detail', { orderId: o.id })}
                      type="button"
                    >
                      <Box className={styles.resultAvatar} sx={{ bgcolor: 'rgba(139,92,246,0.1) !important' }}>
                        <ShoppingCart size={14} color="#8B5CF6" />
                      </Box>
                      <Box className={styles.resultInfo}>
                        <span className={styles.resultTitle}>{o.orderNumber}</span>
                        <span className={styles.resultSub}>{o.customerName} · {o.total.toLocaleString('fr-FR')} FCFA</span>
                      </Box>
                      <StatusDot status={o.status} />
                    </button>
                  ))}
                </Box>
              )}

              {results && totalResults > 0 && (
                <Box className={styles.resultFooter}>
                  {totalResults} résultat{totalResults > 1 ? 's' : ''} · Appuyez sur Entrée pour voir tout
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </ClickAwayListener>

      {/* Actions */}
      <Box className={styles.right}>
        {/* Notifications */}
        <ClickAwayListener onClickAway={() => setNotifOpen(false)}>
          <Box ref={notifRef} sx={{ position: 'relative' }}>
            <Tooltip title="Notifications">
              <IconButton
                className={styles.iconBtn}
                onClick={() => setNotifOpen((o) => !o)}
                sx={notifOpen ? { bgcolor: '#F5F5F7 !important' } : {}}
              >
                <Badge badgeContent={unreadCount || undefined} color="error" max={99}>
                  <Bell size={20} />
                </Badge>
              </IconButton>
            </Tooltip>

            {notifOpen && (
              <Paper className={styles.notifDropdown} elevation={6}>
                {/* Header */}
                <Box className={styles.notifHeader}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                    Notifications {unreadCount > 0 && <span style={{ color: '#EF4444' }}>({unreadCount})</span>}
                  </Typography>
                  {unreadCount > 0 && (
                    <button className={styles.notifMarkAll} onClick={markAllRead} type="button">
                      <CheckCheck size={13} />
                      Tout lire
                    </button>
                  )}
                </Box>

                {/* List */}
                <Box className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <Box className={styles.notifEmpty}>
                      <Bell size={28} style={{ color: '#D1D5DB', marginBottom: 8 }} />
                      <Typography sx={{ fontSize: 13, color: '#6B7280' }}>Aucune notification</Typography>
                    </Box>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        className={`${styles.notifItem} ${!n.isRead ? styles.notifItemUnread : ''}`}
                        onClick={() => handleNotifClick(n)}
                        type="button"
                      >
                        <Box className={styles.notifDot} sx={{ opacity: n.isRead ? 0 : 1 }} />
                        <Box className={styles.notifContent}>
                          <Typography className={styles.notifTitle}>{n.title}</Typography>
                          <Typography className={styles.notifBody}>{n.body}</Typography>
                          <Typography className={styles.notifTime}>
                            {new Date(n.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </button>
                    ))
                  )}
                </Box>

                {/* Footer */}
                <button
                  className={styles.notifFooter}
                  onClick={() => { setNotifOpen(false); setActiveTab('notifications'); }}
                  type="button"
                >
                  Voir toutes les notifications
                </button>
              </Paper>
            )}
          </Box>
        </ClickAwayListener>
      </Box>
    </Box>
  );
}
