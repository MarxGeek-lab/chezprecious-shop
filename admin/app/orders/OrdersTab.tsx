'use client';

// ==============================================
// COMMANDES - Données réelles API
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, Avatar, IconButton, InputBase,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Pagination,
  Skeleton, CircularProgress,
} from '@mui/material';
import {
  Search, Eye, Download, ShoppingCart, Clock, Truck, CheckCircle,
} from 'lucide-react';
import { useAdminOrders, exportOrdersCsv } from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';
import styles from '@/src/styles/pages.module.scss';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' F';
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

const orderStatusConfig: Record<string, { label: string; class: string }> = {
  PENDING:    { label: 'En attente',  class: styles.badgeWarning },
  CONFIRMED:  { label: 'Confirmé',    class: styles.badgeInfo },
  PROCESSING: { label: 'En cours',    class: styles.badgeInfo },
  SHIPPED:    { label: 'Expédié',     class: styles.badgeInfo },
  DELIVERED:  { label: 'Livré',       class: styles.badgeSuccess },
  CANCELLED:  { label: 'Annulé',      class: styles.badgeError },
  REFUNDED:   { label: 'Remboursé',   class: styles.badgeDefault },
};

const paymentStatusConfig: Record<string, { label: string; class: string }> = {
  PENDING:    { label: 'En attente', class: styles.badgeWarning },
  PROCESSING: { label: 'En cours',   class: styles.badgeInfo },
  COMPLETED:  { label: 'Payé',       class: styles.badgeSuccess },
  FAILED:     { label: 'Échoué',     class: styles.badgeError },
  REFUNDED:   { label: 'Remboursé',  class: styles.badgeDefault },
};

const paymentMethodLabel: Record<string, string> = {
  MOBILE_MONEY:   'Mobile Money',
  CARD:           'Carte',
  FEEXPAY_WALLET: 'FeexPay',
};

export default function OrdersTab() {
  const { setActiveTab } = useAdminTab();
  const { showSuccess, showError } = useSnackbar();

  const [search, setSearch]               = useState('');
  const [debouncedSearch, setDebounced]   = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage]                   = useState(1);
  const [exporting, setExporting]         = useState(false);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => {
      setDebounced(v);
      setPage(1);
    }, 350);
  };

  const { data, isLoading } = useAdminOrders({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    paymentStatus: paymentFilter || undefined,
  });

  const orders = data?.data ?? [];
  const meta   = data?.meta;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportOrdersCsv({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentFilter || undefined,
      });
      showSuccess('Export CSV téléchargé.');
    } catch {
      showError('Erreur lors de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      {/* Stats */}
      <Box className={styles.statsRow}>
        {[
          { icon: ShoppingCart, label: 'Total',         value: meta?.total      ?? '—', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: Clock,        label: 'En attente',    value: meta?.pending    ?? '—', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: Truck,        label: 'En traitement', value: meta?.processing ?? '—', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
          { icon: CheckCircle,  label: 'Livrées',       value: meta?.delivered  ?? '—', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} sx={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={20} />
            </Box>
            <Box>
              <Typography className={styles.statValue}>{Number(stat.value).toLocaleString('fr-FR')}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className={styles.card}>
        {/* Toolbar */}
        <Box className={styles.toolbar}>
          <Box className={styles.searchBox}>
            <Search size={18} style={{ color: '#9CA3AF' }} />
            <InputBase
              placeholder="N° commande, client, email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>
          <Box className={styles.filters}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="PROCESSING">En cours</MenuItem>
                <MenuItem value="SHIPPED">Expédié</MenuItem>
                <MenuItem value="DELIVERED">Livré</MenuItem>
                <MenuItem value="CANCELLED">Annulé</MenuItem>
                <MenuItem value="REFUNDED">Remboursé</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Paiement</InputLabel>
              <Select value={paymentFilter} label="Paiement" onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="COMPLETED">Payé</MenuItem>
                <MenuItem value="FAILED">Échoué</MenuItem>
                <MenuItem value="REFUNDED">Remboursé</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={14} /> : <Download size={16} />}
              size="small"
              onClick={handleExport}
              disabled={exporting}
            >
              Exporter
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <Box className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Client</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Méthode</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}><Skeleton variant="text" width="80%" /></td>
                    ))}
                  </tr>
                ))
                : orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: '#7B1E3A', fontSize: 13 }}>
                      {order.orderNumber}
                    </td>
                    <td>
                      <Box className={styles.userCell}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#E5E7EB', color: '#374151' }}>
                          {getInitials(order.customerName)}
                        </Avatar>
                        <Box className={styles.userCellInfo}>
                          <Typography className={styles.userCellName}>{order.customerName}</Typography>
                          <Typography className={styles.userCellEmail}>{order.customerEmail}</Typography>
                        </Box>
                      </Box>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {order.itemCount} article{order.itemCount > 1 ? 's' : ''}
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatAmount(order.total)}</td>
                    <td style={{ fontSize: 12, color: '#6B7280' }}>
                      {order.paymentMethod ? (paymentMethodLabel[order.paymentMethod] ?? order.paymentMethod) : '—'}
                    </td>
                    <td>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box className={`${styles.badge} ${orderStatusConfig[order.status]?.class ?? ''}`}>
                          {orderStatusConfig[order.status]?.label ?? order.status}
                        </Box>
                        <Box className={`${styles.badge} ${paymentStatusConfig[order.paymentStatus]?.class ?? ''}`} sx={{ fontSize: '10px !important' }}>
                          {paymentStatusConfig[order.paymentStatus]?.label ?? order.paymentStatus}
                        </Box>
                      </Box>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(order.createdAt)}</td>
                    <td>
                      <Box className={styles.actionsCell}>
                        <Tooltip title="Voir les détails">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setActiveTab('order-detail', { orderId: order.id })}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Box>

        {/* Pagination */}
        {meta && (
          <Box className={styles.pagination}>
            <Typography className={styles.paginationInfo}>
              {meta.total.toLocaleString('fr-FR')} commande{meta.total !== 1 ? 's' : ''}
            </Typography>
            <Pagination
              count={meta.totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
