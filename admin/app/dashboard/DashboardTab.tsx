'use client';

// ==============================================
// DASHBOARD - Page principale Super Admin
// ==============================================

import { Box, Typography, Avatar, Chip, Skeleton } from '@mui/material';
import { useAdminTab } from '@/src/context/AdminTabContext';
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  UserPlus,
  FolderTree,
  Tag,
  ArrowUpRight,
  Store,
  Trophy,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import styles from './dashboard.module.scss';
import { useAdminDashboard } from '@/src/hooks/useAdminData';

// ─── Constantes ───────────────────────────────

const PIE_COLORS = ['#FF2C2C', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

const statusClasses: Record<string, string> = {
  PENDING:    styles.statusPending,
  PAID:       styles.statusProcessing,
  PROCESSING: styles.statusProcessing,
  SHIPPED:    styles.statusProcessing,
  DELIVERED:  styles.statusDelivered,
  CANCELLED:  styles.statusCancelled,
  REFUNDED:   styles.statusCancelled,
};

const statusLabels: Record<string, string> = {
  PENDING:    'En attente',
  PAID:       'Payé',
  PROCESSING: 'En cours',
  SHIPPED:    'Expédié',
  DELIVERED:  'Livré',
  CANCELLED:  'Annulé',
  REFUNDED:   'Remboursé',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('fr-FR');
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  return (
    <Box className={`${styles.kpiTrend} ${up ? styles.trendUp : styles.trendDown}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{value}%
    </Box>
  );
}

function KpiSkeleton() {
  return (
    <Box className={styles.kpiCard}>
      <Skeleton variant="rounded" width={52} height={52} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="70%" height={36} />
        <Skeleton variant="text" width="30%" />
      </Box>
    </Box>
  );
}

export default function DashboardTab() {
  const { setActiveTab } = useAdminTab();
  const { data, isLoading } = useAdminDashboard();

  return (
    <Box>
      {/* Quick Actions */}
      <Box className={styles.quickActions}>
        <Box className={styles.quickAction} onClick={() => setActiveTab('product-new')}>
          <Box className={styles.quickActionIcon}><Plus size={22} /></Box>
          <Typography className={styles.quickActionLabel}>Ajouter un produit</Typography>
        </Box>
        <Box className={styles.quickAction} onClick={() => setActiveTab('users')}>
          <Box className={styles.quickActionIcon}><UserPlus size={22} /></Box>
          <Typography className={styles.quickActionLabel}>Nouvel utilisateur</Typography>
        </Box>
        <Box className={styles.quickAction} onClick={() => setActiveTab('categories')}>
          <Box className={styles.quickActionIcon}><FolderTree size={22} /></Box>
          <Typography className={styles.quickActionLabel}>Gérer catégories</Typography>
        </Box>
        <Box className={styles.quickAction} onClick={() => setActiveTab('promotions')}>
          <Box className={styles.quickActionIcon}><Tag size={22} /></Box>
          <Typography className={styles.quickActionLabel}>Créer promotion</Typography>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Box className={styles.kpiGrid}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <Box className={styles.kpiCard}>
              <Box className={`${styles.kpiIcon} ${styles.kpiIconOrange}`}>
                <DollarSign size={24} />
              </Box>
              <Box className={styles.kpiInfo}>
                <Typography className={styles.kpiLabel}>CA ce mois</Typography>
                <Typography className={styles.kpiValue}>{fmtMoney(data?.kpis.revenue.value ?? 0)} F</Typography>
                <Trend value={data?.kpis.revenue.trend ?? null} />
              </Box>
            </Box>

            <Box className={styles.kpiCard}>
              <Box className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>
                <ShoppingCart size={24} />
              </Box>
              <Box className={styles.kpiInfo}>
                <Typography className={styles.kpiLabel}>Commandes ce mois</Typography>
                <Typography className={styles.kpiValue}>{(data?.kpis.orders.value ?? 0).toLocaleString('fr-FR')}</Typography>
                <Trend value={data?.kpis.orders.trend ?? null} />
              </Box>
            </Box>

            <Box className={styles.kpiCard}>
              <Box className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>
                <Users size={24} />
              </Box>
              <Box className={styles.kpiInfo}>
                <Typography className={styles.kpiLabel}>Utilisateurs</Typography>
                <Typography className={styles.kpiValue}>{(data?.kpis.users.value ?? 0).toLocaleString('fr-FR')}</Typography>
                <Trend value={data?.kpis.users.trend ?? null} />
              </Box>
            </Box>

            <Box className={styles.kpiCard}>
              <Box className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}>
                <Package size={24} />
              </Box>
              <Box className={styles.kpiInfo}>
                <Typography className={styles.kpiLabel}>Produits actifs</Typography>
                <Typography className={styles.kpiValue}>{(data?.kpis.products.value ?? 0).toLocaleString('fr-FR')}</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    icon={<Store size={11} />}
                    label={`${data?.kpis?.sellers?.value ?? 0} vendeurs`}
                    size="small"
                    sx={{ fontSize: 11, height: 20 }}
                  />
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Charts */}
      <Box className={styles.chartsGrid}>
        {/* Revenue Area Chart */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Chiffre d&apos;affaires (12 derniers mois)</Typography>
          </Box>
          <Box className={styles.chartContainer}>
            {isLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueChart ?? []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF2C2C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF2C2C" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(v) => `${fmt(v)} F`}
                    width={72}
                  />
                  <Tooltip
                    formatter={(value: any) => [value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }), 'CA']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FF2C2C"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>

        {/* Categories Pie Chart */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Produits par catégorie</Typography>
          </Box>
          <Box className={styles.chartContainer}>
            {isLoading ? (
              <Skeleton variant="circular" width={180} height={180} sx={{ mx: 'auto', mt: 4 }} />
            ) : (data?.categoryChart?.length ?? 0) === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune donnée</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categoryChart}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data?.categoryChart ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span style={{ fontSize: 12, color: '#6B7280' }}>{value}</span>
                    )}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} produits`, 'Actifs']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>
      </Box>

      {/* Recent Activity */}
      <Box className={styles.activityGrid}>
        {/* Recent Orders */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Commandes récentes</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.25 }}>
                {isLoading ? '' : `${data?.recentOrders.length ?? 0} dernières commandes`}
              </Typography>
            </Box>
            <Box
              onClick={() => setActiveTab('orders')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: '#FF2C2C', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Voir tout <ArrowUpRight size={14} />
            </Box>
          </Box>
          <table className={styles.table}>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={styles.tableRow}>
                    <td><Skeleton variant="text" width={110} /></td>
                    <td><Skeleton variant="text" width={130} /></td>
                    <td><Skeleton variant="text" width={80} /></td>
                    <td><Skeleton variant="rounded" width={70} height={20} /></td>
                    <td><Skeleton variant="text" width={40} /></td>
                  </tr>
                ))
                : (data?.recentOrders ?? []).map((order) => (
                  <tr key={order.id} className={styles.tableRow}>
                    <td>
                      <Typography className={styles.orderId}>{order.orderNumber}</Typography>
                    </td>
                    <td>
                      <Box className={styles.customer}>
                        <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: '#E5E7EB', color: '#374151' }}>
                          {order.customerName.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography className={styles.customerName}>{order.customerName}</Typography>
                      </Box>
                    </td>
                    <td style={{ fontWeight: 600 }}>{order.total.toLocaleString('fr-FR')} F</td>
                    <td>
                      <Box className={`${styles.statusBadge} ${statusClasses[order.status] ?? ''}`}>
                        {statusLabels[order.status] ?? order.status}
                      </Box>
                    </td>
                    <td style={{ color: '#9CA3AF', fontSize: 12 }}>{fmtDate(order.createdAt)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Box>

        {/* Top Sellers */}
        {/* <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Meilleurs vendeurs</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.25 }}>Par chiffre d&apos;affaires</Typography>
            </Box>
            <Box
              onClick={() => setActiveTab('sellers')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: '#FF2C2C', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Voir tout <ArrowUpRight size={14} />
            </Box>
          </Box>
          <Box>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} className={styles.sellerItem}>
                  <Skeleton variant="circular" width={28} height={28} />
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                  <Skeleton variant="text" width={60} />
                </Box>
              ))
              : (data?.topSellers ?? []).map((seller) => {
                const rankClass =
                  seller.rank === 1 ? styles.rank1 :
                  seller.rank === 2 ? styles.rank2 :
                  seller.rank === 3 ? styles.rank3 : styles.rankDefault;
                const dotClass =
                  seller.status === 'APPROVED' ? styles.dotApproved :
                  seller.status === 'REJECTED' ? styles.dotRejected : styles.dotPending;
                return (
                  <Box key={seller.id} className={styles.sellerItem}>
                    <Box className={`${styles.sellerRank} ${rankClass}`}>
                      {seller.rank <= 3 ? <Trophy size={12} /> : seller.rank}
                    </Box>
                    <Avatar
                      src={seller.logo ?? undefined}
                      sx={{ width: 36, height: 36, fontSize: 13, bgcolor: '#F0F2F5', color: '#374151' }}
                    >
                      {seller.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box className={styles.sellerInfo}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Typography className={styles.sellerName}>{seller.name}</Typography>
                        <Box className={`${styles.statusDot} ${dotClass}`} />
                      </Box>
                      <Typography className={styles.sellerProducts}>
                        {seller.productCount} produits · {seller.orderCount} cmd
                      </Typography>
                    </Box>
                    <Typography className={styles.sellerRevenue}>
                      {fmtMoney(seller.revenue)} F
                    </Typography>
                  </Box>
                );
              })
            }
          </Box>
        </Box> */}
      </Box>

      {/* Top Products + Category breakdown */}
      <Box className={styles.bottomGrid}>
        {/* Top Products */}
        {/* <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Top produits</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.25 }}>Par chiffre d&apos;affaires</Typography>
            </Box>
            <Box
              onClick={() => setActiveTab('products')}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, color: '#FF2C2C', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Voir tout <ArrowUpRight size={14} />
            </Box>
          </Box>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} className={styles.productItem}>
                <Skeleton variant="circular" width={26} height={26} />
                <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 1.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="65%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="text" width={60} />
              </Box>
            ))
            : (data?.topProducts ?? []).length === 0 ? (
              <Typography sx={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', py: 3 }}>
                Aucune vente enregistrée
              </Typography>
            ) : (data?.topProducts ?? []).map((product) => {
              const rankClass =
                product.rank === 1 ? styles.rank1 :
                product.rank === 2 ? styles.rank2 :
                product.rank === 3 ? styles.rank3 : styles.rankDefault;
              return (
                <Box key={product.id} className={styles.productItem}>
                  <Box className={`${styles.productRank} ${rankClass}`}>
                    {product.rank <= 3 ? <Trophy size={11} /> : product.rank}
                  </Box>
                  <Box className={styles.productImg}>
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </Box>
                  <Box className={styles.productInfo}>
                    <Typography className={styles.productName}>{product.name}</Typography>
                    <Typography className={styles.productSold}>{product.soldCount} ventes</Typography>
                  </Box>
                  <Typography className={styles.productRevenue}>
                    {fmtMoney(product.revenue)} F
                  </Typography>
                </Box>
              );
            })
          }
        </Box> */}

        {/* Analytics CTA */}
        <Box className={styles.card} sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Statistiques analytiques</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.25 }}>Vue complète de la boutique</Typography>
            </Box>
          </Box> */}

          {/* Category bars */}
          {/* <Box sx={{ flex: 1 }}>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ mb: 1.5 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rounded" height={8} sx={{ borderRadius: 10, mt: 0.5 }} />
                </Box>
              ))
              : (data?.categoryChart ?? []).slice(0, 6).map((cat, i) => {
                const max = data?.categoryChart?.[0]?.value ?? 1;
                const pct = Math.round((cat.value / max) * 100);
                const colors = ['#FF2C2C', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];
                return (
                  <Box key={cat.name} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{cat.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{cat.value} produits</Typography>
                    </Box>
                    <Box sx={{ height: 8, background: '#F0F2F5', borderRadius: 10, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, background: colors[i % colors.length], borderRadius: 10, transition: 'width 0.6s ease' }} />
                    </Box>
                  </Box>
                );
              })
            }
          </Box>

          <Box
            onClick={() => setActiveTab('analytics')}
            sx={{
              mt: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              padding: '10px 16px',
              background: 'rgba(255, 44, 44,0.08)',
              borderRadius: 2,
              color: '#FF2C2C',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 0.2s',
              '&:hover': { background: 'rgba(255, 44, 44,0.15)' },
            }}
          >
            Voir les analytics complètes <ArrowUpRight size={15} />
          </Box> */}
        </Box>
      </Box>
    </Box>
  );
}
