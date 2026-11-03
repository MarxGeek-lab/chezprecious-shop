'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Select, MenuItem, Chip,
  LinearProgress, CircularProgress,
} from '@mui/material';
import {
  FileText, Download, Calendar, BarChart3, TrendingUp,
  Users, ShoppingCart, DollarSign, Eye, Clock, RefreshCw,
  PieChart, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  useAdminAnalytics,
  exportProductsCsv,
  exportOrdersCsv,
  exportUsersCsv,
  exportSellersCsv,
} from '@/src/hooks/useAdminData';
import styles from '@/src/styles/pages.module.scss';

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(n);
}

const PERIOD_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

function getPeriodDates(period: string) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - PERIOD_DAYS[period]);
  return {
    from: from.toISOString().split('T')[0],
    to:   to.toISOString().split('T')[0],
  };
}

interface ExportItem {
  id: number;
  name: string;
  type: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  frequency: string;
  onExport: () => void;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  ready:      { label: 'Disponible',  class: styles.badgeSuccess },
  generating: { label: 'En cours',    class: styles.badgeWarning },
  scheduled:  { label: 'Planifié',    class: styles.badgeInfo },
};

export default function ReportsTab() {
  const [period, setPeriod] = useState('month');
  const [exportingId, setExportingId] = useState<number | null>(null);

  const dates = getPeriodDates(period);
  const { data: analytics, isLoading } = useAdminAnalytics(dates);

  async function handleExport(id: number, fn: () => Promise<void>) {
    setExportingId(id);
    try { await fn(); } finally { setExportingId(null); }
  }

  const exports: ExportItem[] = [
    {
      id: 1,
      name: 'Export utilisateurs (CSV)',
      type: 'Utilisateurs',
      icon: Users,
      iconColor: '#0F5C4A',
      iconBg: 'rgba(15, 92, 74, 0.1)',
      frequency: 'À la demande',
      onExport: () => exportUsersCsv(),
    },
    {
      id: 2,
      name: 'Export commandes (CSV)',
      type: 'Commandes',
      icon: ShoppingCart,
      iconColor: '#8B5CF6',
      iconBg: 'rgba(139,92,246,0.1)',
      frequency: 'À la demande',
      onExport: () => exportOrdersCsv(),
    },
    {
      id: 3,
      name: 'Export produits (CSV)',
      type: 'Produits',
      icon: PieChart,
      iconColor: '#EC4899',
      iconBg: 'rgba(236,72,153,0.1)',
      frequency: 'À la demande',
      onExport: () => exportProductsCsv(),
    },
    {
      id: 4,
      name: 'Export vendeurs (CSV)',
      type: 'Vendeurs',
      icon: BarChart3,
      iconColor: '#3B82F6',
      iconBg: 'rgba(59,130,246,0.1)',
      frequency: 'À la demande',
      onExport: () => exportSellersCsv(),
    },
  ];

  const kpis = analytics?.kpis;

  const quickStats = kpis
    ? [
        {
          label: 'CA total',
          value: fmt(kpis.totalRevenue),
          change: kpis.revenueThisMonth.trend !== null
            ? `${kpis.revenueThisMonth.trend > 0 ? '+' : ''}${kpis.revenueThisMonth.trend.toFixed(1)}%`
            : null,
          up: (kpis.revenueThisMonth.trend ?? 0) >= 0,
        },
        {
          label: 'Commandes',
          value: kpis.totalOrders.toLocaleString('fr-FR'),
          change: kpis.ordersThisMonth.trend !== null
            ? `${kpis.ordersThisMonth.trend > 0 ? '+' : ''}${kpis.ordersThisMonth.trend.toFixed(1)}%`
            : null,
          up: (kpis.ordersThisMonth.trend ?? 0) >= 0,
        },
        {
          label: 'Nouveaux utilisateurs',
          value: kpis.totalUsers.toLocaleString('fr-FR'),
          change: kpis.newUsersThisMonth.trend !== null
            ? `${kpis.newUsersThisMonth.trend > 0 ? '+' : ''}${kpis.newUsersThisMonth.trend.toFixed(1)}%`
            : null,
          up: (kpis.newUsersThisMonth.trend ?? 0) >= 0,
        },
        {
          label: 'Vendeurs actifs',
          value: kpis?.totalSellers?.toLocaleString('fr-FR'),
          change: null,
          up: true,
        },
      ]
    : null;

  return (
    <Box>
      {/* Quick stats */}
      <Box className={styles.statsRow}>
        {isLoading && !quickStats
          ? Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} className={styles.statCard} sx={{ justifyContent: 'center' }}>
                <CircularProgress size={24} sx={{ color: '#0F5C4A' }} />
              </Box>
            ))
          : (quickStats ?? []).map((stat) => (
              <Box key={stat.label} className={styles.statCard}>
                <Box>
                  <Typography className={styles.statValue}>{stat.value}</Typography>
                  <Typography className={styles.statLabel}>{stat.label}</Typography>
                  {stat.change && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      {stat.up
                        ? <ArrowUpRight size={14} color="#10B981" />
                        : <ArrowDownRight size={14} color="#EF4444" />}
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: stat.up ? '#10B981' : '#EF4444' }}>
                        {stat.change}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
      </Box>

      {/* Revenue chart summary */}
      {analytics?.revenueChart && analytics.revenueChart.length > 0 && (
        <Box className={styles.card} sx={{ mb: 2 }}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Chiffre d'affaires mensuel</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {analytics.revenueChart.slice(-6).map((row) => {
              const maxRevenue = Math.max(...analytics.revenueChart.map((r) => r.revenue), 1);
              const pct = Math.round((row.revenue / maxRevenue) * 100);
              return (
                <Box key={row.month} sx={{ flex: 1, minWidth: 80, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 1 }}>{row.month}</Typography>
                  <Box sx={{
                    height: 80, bgcolor: '#F3F4F6', borderRadius: '8px 8px 0 0',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <Box sx={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: `${pct}%`, bgcolor: '#0F5C4A', borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s',
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 600, mt: 0.5 }}>
                    {fmt(row.revenue)}
                  </Typography>
                  <Typography sx={{ fontSize: 10, color: '#9CA3AF' }}>{row.orders} cmd.</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Exports list */}
      <Box className={styles.card}>
        <Box className={styles.cardHeader}>
          <Typography className={styles.cardTitle}>Exports disponibles</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Select
              size="small" value={period}
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ minWidth: 130, fontSize: 14, borderRadius: '10px' }}
            >
              <MenuItem value="week">Cette semaine</MenuItem>
              <MenuItem value="month">Ce mois</MenuItem>
              <MenuItem value="quarter">Ce trimestre</MenuItem>
              <MenuItem value="year">Cette année</MenuItem>
            </Select>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {exports.map((report: any) => {
            const Icon = report.icon;
            const isExporting = exportingId === report.id;
            return (
              <Box
                key={report.id}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 2,
                  borderRadius: '12px', border: '1px solid #F3F4F6',
                  '&:hover': { bgcolor: '#FAFAFA', borderColor: '#E5E7EB' },
                  transition: 'all 0.2s',
                }}
              >
                <Box sx={{
                  width: 48, height: 48, minWidth: 48, borderRadius: '12px',
                  bgcolor: report.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={24} color={report.iconColor} />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1A1A2E', mb: 0.3 }}>
                    {report.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={report.type} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                    <Typography sx={{ fontSize: 12, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Calendar size={12} /> {report.frequency}
                    </Typography>
                  </Box>
                </Box>

                <span className={`${styles.badge} ${statusConfig.ready.class}`}>{statusConfig.ready.label}</span>

                <IconButton
                  className={styles.actionBtn}
                  size="small"
                  disabled={isExporting}
                  onClick={() => handleExport(report.id, report.onExport)}
                >
                  {isExporting ? <CircularProgress size={16} /> : <Download size={16} />}
                </IconButton>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Orders by status */}
      {analytics?.ordersByStatus && analytics.ordersByStatus.length > 0 && (
        <Box className={styles.card}>
          <Typography className={styles.cardTitle} sx={{ mb: 2 }}>Répartition des commandes par statut</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {analytics.ordersByStatus.map((row) => {
              const total = analytics.ordersByStatus.reduce((s, r) => s + r.count, 0);
              const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
              return (
                <Box key={row.status}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{row.status}</Typography>
                    <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                      {row.count} ({pct}%) — {fmt(row.revenue)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate" value={pct}
                    sx={{
                      height: 6, borderRadius: 3, bgcolor: '#F3F4F6',
                      '& .MuiLinearProgress-bar': { bgcolor: '#0F5C4A', borderRadius: 3 },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
