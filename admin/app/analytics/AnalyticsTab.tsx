'use client';

// ==============================================
// ANALYTICS - Statistiques centralisées marketplace
// ==============================================

import { useState, useCallback } from 'react';
import { Box, Typography, Avatar, Skeleton } from '@mui/material';
import {
  Users, Package, ShoppingCart, DollarSign, TrendingUp, TrendingDown,
  Store, Trophy, Image as ImageIcon, Calendar, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import styles from './analytics.module.scss';
import { useAdminAnalytics } from '@/src/hooks/useAdminData';

// ─── Helpers ───────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('fr-FR');
}

function fmtFull(n: number) {
  return n.toLocaleString('fr-FR');
}

// Formate une date JS en YYYY-MM-DD (pour les inputs date)
function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Formate en label court pour affichage
function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Presets de période
const now = new Date();
const PRESETS = [
  {
    label: '7j',
    from: toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)),
    to:   toInputDate(now),
  },
  {
    label: '30j',
    from: toInputDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)),
    to:   toInputDate(now),
  },
  {
    label: '3m',
    from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
    to:   toInputDate(now),
  },
  {
    label: '6m',
    from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 5, 1)),
    to:   toInputDate(now),
  },
  {
    label: '1an',
    from: toInputDate(new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)),
    to:   toInputDate(now),
  },
  {
    label: 'Tout',
    from: '',
    to:   '',
  },
] as const;

// ─── Constantes ────────────────────────────────

const PIE_COLORS = [
  '#0F5C4A', '#C9A45C', '#3B82F6', '#8B5CF6',
  '#F59E0B', '#EF4444', '#EC4899', '#14B8A6',
  '#F97316', '#6366F1',
];

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING:    'En attente',
  PAID:       'Payé',
  PROCESSING: 'En cours',
  SHIPPED:    'Expédié',
  DELIVERED:  'Livré',
  CANCELLED:  'Annulé',
  REFUNDED:   'Remboursé',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING:    '#F59E0B',
  PAID:       '#3B82F6',
  PROCESSING: '#6366F1',
  SHIPPED:    '#8B5CF6',
  DELIVERED:  '#10B981',
  CANCELLED:  '#EF4444',
  REFUNDED:   '#9CA3AF',
};

const RANK_STYLES: Record<string, { bg: string; color: string }> = {
  gold:    { bg: 'linear-gradient(135deg,#FFD700,#FFA000)', color: '#fff' },
  silver:  { bg: 'linear-gradient(135deg,#C0C0C0,#9E9E9E)', color: '#fff' },
  bronze:  { bg: 'linear-gradient(135deg,#CD7F32,#A0522D)', color: '#fff' },
  default: { bg: '#F0F2F5', color: '#6B7280' },
};

function rankKey(rank: number) {
  return rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default';
}

// ─── KPI Card ──────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, bg, trend, loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend?: number | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Box className={styles.overviewCard}>
        <Box className={styles.overviewHeader}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 2 }} />
        </Box>
        <Skeleton variant="text" width="70%" height={40} />
        <Skeleton variant="text" width="40%" />
      </Box>
    );
  }
  const up = (trend ?? 0) >= 0;
  return (
    <Box className={styles.overviewCard}>
      <Box className={styles.overviewHeader}>
        <Typography className={styles.overviewLabel}>{label}</Typography>
        <Box className={styles.overviewIcon} sx={{ background: bg, color }}>
          <Icon size={18} />
        </Box>
      </Box>
      <Typography className={styles.overviewValue}>{value}</Typography>
      <Box>
        {trend !== undefined && trend !== null && (
          <Typography
            component="span"
            className={`${styles.overviewTrend} ${up ? styles.trendUp : styles.trendDown}`}
          >
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {up ? '+' : ''}{trend}%
          </Typography>
        )}
        {sub && (
          <Typography component="span" className={styles.overviewSub}>
            {' '}{sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Composant principal ───────────────────────

export default function AnalyticsTab() {
  // État du filtre : preset actif + dates personnalisées
  const [activePreset, setActivePreset] = useState<string>('1an');
  const [from, setFrom] = useState(PRESETS.find((p) => p.label === '1an')!.from);
  const [to,   setTo]   = useState(PRESETS.find((p) => p.label === '1an')!.to);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setActivePreset(preset.label);
    setFrom(preset.from);
    setTo(preset.to);
  }, []);

  const handleFromChange = (v: string) => {
    setFrom(v);
    setActivePreset('custom');
  };

  const handleToChange = (v: string) => {
    setTo(v);
    setActivePreset('custom');
  };

  const params = from && to ? { from, to } : {};
  const { data, isLoading, refetch } = useAdminAnalytics(params);

  const orderStatusData = (data?.ordersByStatus ?? []).map((s) => ({
    name: ORDER_STATUS_LABELS[s.status] ?? s.status,
    count: s.count,
    revenue: s.revenue,
    color: ORDER_STATUS_COLORS[s.status] ?? '#9CA3AF',
  }));

  const totalOrdersAll = orderStatusData.reduce((a, s) => a + s.count, 0);

  // Label de la période affichée
  const periodLabel = data?.period
    ? `${fmtDateShort(data.period.from)} – ${fmtDateShort(data.period.to)}`
    : '';

  return (
    <Box>

      {/* ===== Barre de filtres ===== */}
      <Box className={styles.filterBar}>
        <Box className={styles.filterLeft}>
          {/* Presets rapides */}
          <Box className={styles.filterPresets}>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`${styles.filterBtn} ${activePreset === p.label ? styles.active : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </Box>

          <Box className={styles.filterDivider} />

          {/* Sélecteur de dates personnalisé */}
          <Box className={styles.filterDateGroup}>
            <Calendar size={14} style={{ color: '#6B7280' }} />
            <Typography className={styles.filterDateLabel}>Du</Typography>
            <input
              type="date"
              className={styles.filterDateInput}
              value={from}
              max={to || toInputDate(now)}
              onChange={(e) => handleFromChange(e.target.value)}
            />
            <Typography className={styles.filterDateLabel}>au</Typography>
            <input
              type="date"
              className={styles.filterDateInput}
              value={to}
              min={from}
              max={toInputDate(now)}
              onChange={(e) => handleToChange(e.target.value)}
            />
          </Box>
        </Box>

        <Box className={styles.filterRight}>
          {periodLabel && (
            <Box className={styles.filterPeriodBadge}>
              <Calendar size={12} />
              {periodLabel}
            </Box>
          )}
          <button
            className={styles.filterBtn}
            onClick={() => refetch()}
            title="Actualiser"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={13} />
          </button>
        </Box>
      </Box>

      {/* ===== KPIs ===== */}
      <Box className={styles.overviewGrid}>
        <KpiCard
          label="CA sur la période"
          value={`${fmt(data?.kpis.totalRevenue ?? 0)} F`}
          sub="vs période précédente"
          icon={DollarSign}
          color="#0F5C4A"
          bg="rgba(15, 92, 74, 0.1)"
          trend={data?.kpis.revenueThisMonth.trend}
          loading={isLoading}
        />
        <KpiCard
          label="Commandes"
          value={fmtFull(data?.kpis.totalOrders ?? 0)}
          sub="sur la période"
          icon={ShoppingCart}
          color="#3B82F6"
          bg="rgba(59,130,246,0.1)"
          trend={data?.kpis.ordersThisMonth.trend}
          loading={isLoading}
        />
        <KpiCard
          label="Nouveaux utilisateurs"
          value={fmtFull(data?.kpis.newUsersThisMonth.value ?? 0)}
          sub={`total : ${fmtFull(data?.kpis.totalUsers ?? 0)}`}
          icon={Users}
          color="#10B981"
          bg="rgba(16,185,129,0.1)"
          trend={data?.kpis.newUsersThisMonth.trend}
          loading={isLoading}
        />
        <KpiCard
          label="Vendeurs"
          value={fmtFull(data?.kpis.totalSellers ?? 0)}
          sub="boutiques enregistrées"
          icon={Store}
          color="#8B5CF6"
          bg="rgba(139,92,246,0.1)"
          loading={isLoading}
        />
        <KpiCard
          label="Produits actifs"
          value={fmtFull(data?.kpis.activeProducts ?? 0)}
          sub="en catalogue"
          icon={Package}
          color="#F59E0B"
          bg="rgba(245,158,11,0.1)"
          loading={isLoading}
        />
      </Box>

      {/* ===== CA 12 mois + Commandes par statut ===== */}
      <Box className={styles.chartsRow}>
        {/* Graphe CA */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Chiffre d&apos;affaires mensuel</Typography>
              <Typography className={styles.cardSubtitle}>
                {periodLabel || 'Sur la période sélectionnée'} · hors annulés
              </Typography>
            </Box>
          </Box>
          <Box className={styles.chartContainer}>
            {isLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueChart ?? []}>
                  <defs>
                    <linearGradient id="gradRevA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F5C4A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0F5C4A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickFormatter={(v) => `${fmt(v)} F`}
                    width={76}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      name === 'revenue'
                        ? `${value.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}`
                        : `${value} commandes`,
                      name === 'revenue' ? 'CA' : 'Commandes',
                    ]}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 13 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F5C4A"
                    strokeWidth={2.5}
                    fill="url(#gradRevA)"
                    name="revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>

        {/* Commandes par statut */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Commandes par statut</Typography>
              <Typography className={styles.cardSubtitle}>
                {isLoading ? '' : `${totalOrdersAll.toLocaleString('fr-FR')} commandes au total`}
              </Typography>
            </Box>
          </Box>

          {/* Pie */}
          <Box sx={{ height: 190, mb: 1.5 }}>
            {isLoading ? (
              <Skeleton variant="circular" width={160} height={160} sx={{ mx: 'auto', mt: 1 }} />
            ) : orderStatusData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune commande</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {orderStatusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} cmd`, '']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Légende */}
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} className={styles.sourceItem} sx={{ py: '6px !important' }}>
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="text" width="20%" />
              </Box>
            ))
            : orderStatusData.map((s) => (
              <Box key={s.name} className={styles.sourceItem} sx={{ py: '7px !important' }}>
                <Box className={styles.sourceLeft}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0, mt: 0.3 }} />
                  <Box>
                    <Typography className={styles.sourceName}>{s.name}</Typography>
                    <Typography className={styles.sourceVisits}>
                      {s.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </Typography>
                  </Box>
                </Box>
                <Typography className={styles.sourcePercent}>
                  {totalOrdersAll > 0 ? Math.round((s.count / totalOrdersAll) * 100) : 0}%
                  &nbsp;·&nbsp;{s.count}
                </Typography>
              </Box>
            ))
          }
        </Box>
      </Box>

      {/* ===== Top Vendeurs + Top Produits ===== */}
      <Box className={styles.countriesGrid}>

        {/* Top Vendeurs */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Top Vendeurs</Typography>
              <Typography className={styles.cardSubtitle}>Classement par chiffre d&apos;affaires</Typography>
            </Box>
          </Box>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} className={styles.countryItem}>
                <Skeleton variant="circular" width={32} height={32} />
                <Box className={styles.countryInfo} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="65%" />
                  <Skeleton variant="rounded" height={6} sx={{ borderRadius: 10, mt: 0.5 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Skeleton variant="text" width={70} />
                  <Skeleton variant="text" width={50} />
                </Box>
              </Box>
            ))
            : (data?.topSellers ?? []).length === 0
              ? (
                <Typography sx={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', py: 4 }}>
                  Aucune donnée de vente
                </Typography>
              )
              : (data?.topSellers ?? []).map((seller) => {
                const maxRev = data?.topSellers?.[0]?.revenue ?? 1;
                const pct = Math.round((seller.revenue / maxRev) * 100);
                const rk = RANK_STYLES[rankKey(seller.rank)];
                return (
                  <Box key={seller.id} className={styles.countryItem}>
                    <Box sx={{
                      width: 30, height: 30, minWidth: 30, borderRadius: '50%',
                      background: rk.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: rk.color,
                    }}>
                      {seller.rank <= 3 ? <Trophy size={13} /> : seller.rank}
                    </Box>
                    <Box className={styles.countryInfo}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.3 }}>
                        <Avatar
                          src={seller.logo ?? undefined}
                          sx={{ width: 20, height: 20, fontSize: 9, bgcolor: '#E5E7EB', color: '#374151' }}
                        >
                          {seller.name.slice(0, 1).toUpperCase()}
                        </Avatar>
                        <Typography className={styles.countryName}>{seller.name}</Typography>
                      </Box>
                      <Box className={styles.countryBar}>
                        <Box className={styles.countryBarFill} style={{ width: `${pct}%` }} />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography className={styles.countryValue}>{fmt(seller.revenue)} F</Typography>
                      <Typography className={styles.countryPercent}>
                        {seller.orderCount} cmd · {seller.productCount} prod
                      </Typography>
                    </Box>
                  </Box>
                );
              })
          }
        </Box>

        {/* Top Produits */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Top Produits</Typography>
              <Typography className={styles.cardSubtitle}>Classement par chiffre d&apos;affaires</Typography>
            </Box>
          </Box>
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <Box key={i} className={styles.countryItem}>
                <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: 1.5 }} />
                <Box className={styles.countryInfo} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="rounded" height={6} sx={{ borderRadius: 10, mt: 0.5 }} />
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Skeleton variant="text" width={70} />
                  <Skeleton variant="text" width={50} />
                </Box>
              </Box>
            ))
            : (data?.topProducts ?? []).length === 0
              ? (
                <Typography sx={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', py: 4 }}>
                  Aucune vente enregistrée
                </Typography>
              )
              : (data?.topProducts ?? []).map((product) => {
                const maxRev = data?.topProducts?.[0]?.revenue ?? 1;
                const pct = Math.round((product.revenue / maxRev) * 100);
                return (
                  <Box key={product.id} className={styles.countryItem}>
                    <Box sx={{
                      width: 42, height: 42, minWidth: 42, borderRadius: 1.5,
                      overflow: 'hidden', background: '#F0F2F5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF',
                    }}>
                      {product.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <ImageIcon size={18} />
                      }
                    </Box>
                    <Box className={styles.countryInfo}>
                      <Typography
                        className={styles.countryName}
                        sx={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {product.name}
                      </Typography>
                      <Box className={styles.countryBar}>
                        <Box className={styles.countryBarFill} style={{ width: `${pct}%` }} />
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography className={styles.countryValue}>{fmt(product.revenue)} F</Typography>
                      <Typography className={styles.countryPercent}>{product.soldCount} ventes</Typography>
                    </Box>
                  </Box>
                );
              })
          }
        </Box>
      </Box>

      {/* ===== Catégories + Volume commandes (barres) + Détail statuts ===== */}
      <Box className={styles.metricsGrid}>

        {/* Répartition catégories */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Produits par catégorie</Typography>
              <Typography className={styles.cardSubtitle}>Produits actifs en catalogue</Typography>
            </Box>
          </Box>

          <Box sx={{ height: 190, mb: 1.5 }}>
            {isLoading ? (
              <Skeleton variant="circular" width={150} height={150} sx={{ mx: 'auto', mt: 1 }} />
            ) : (data?.categoryStats ?? []).length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography sx={{ color: '#9CA3AF', fontSize: 14 }}>Aucune donnée</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="productCount"
                    nameKey="name"
                  >
                    {(data?.categoryStats ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} produits`, 'Actifs']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(v) => (
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Box>

          {/* Barres catégories */}
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} sx={{ mb: 1.25 }}>
                <Skeleton variant="text" width="55%" />
                <Skeleton variant="rounded" height={6} sx={{ borderRadius: 10, mt: 0.4 }} />
              </Box>
            ))
            : (data?.categoryStats ?? []).slice(0, 7).map((cat, i) => {
              const max = data?.categoryStats?.[0]?.productCount ?? 1;
              const pct = Math.round((cat.productCount / max) * 100);
              return (
                <Box key={cat.name} sx={{ mb: 1.25 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500, color: '#374151' }}>{cat.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{cat.productCount}</Typography>
                  </Box>
                  <Box sx={{ height: 6, background: '#F0F2F5', borderRadius: 10, overflow: 'hidden' }}>
                    <Box sx={{
                      height: '100%',
                      width: `${pct}%`,
                      background: PIE_COLORS[i % PIE_COLORS.length],
                      borderRadius: 10,
                      transition: 'width 0.6s ease',
                    }} />
                  </Box>
                </Box>
              );
            })
          }
        </Box>

        {/* Volume commandes par mois */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Volume de commandes</Typography>
              <Typography className={styles.cardSubtitle}>
                {periodLabel || 'Sur la période sélectionnée'}
              </Typography>
            </Box>
          </Box>
          <Box className={styles.chartContainerSm}>
            {isLoading ? (
              <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: 2 }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.revenueChart ?? []} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(value) => [`${value} commandes`, 'Volume']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                  />
                  <Bar dataKey="orders" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Commandes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        </Box>

        {/* Détail statuts commandes */}
        <Box className={styles.card}>
          <Box className={styles.cardHeader}>
            <Box>
              <Typography className={styles.cardTitle}>Détail des commandes</Typography>
              <Typography className={styles.cardSubtitle}>Répartition par statut</Typography>
            </Box>
          </Box>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
              <Box key={i} className={styles.sourceItem}>
                <Box className={styles.sourceLeft}>
                  <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 1.5 }} />
                  <Box>
                    <Skeleton variant="text" width={90} />
                    <Skeleton variant="text" width={70} />
                  </Box>
                </Box>
                <Skeleton variant="text" width={40} />
              </Box>
            ))
            : orderStatusData.map((s) => (
              <Box key={s.name} className={styles.sourceItem}>
                <Box className={styles.sourceLeft}>
                  <Box
                    className={styles.sourceIcon}
                    sx={{ background: `${s.color}18`, color: s.color }}
                  >
                    <ShoppingCart size={16} />
                  </Box>
                  <Box>
                    <Typography className={styles.sourceName}>{s.name}</Typography>
                    <Typography className={styles.sourceVisits}>
                      {s.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography className={styles.sourcePercent}>{s.count}</Typography>
                  <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>cmd</Typography>
                </Box>
              </Box>
            ))
          }
        </Box>
      </Box>
    </Box>
  );
}
