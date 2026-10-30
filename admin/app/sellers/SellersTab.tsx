'use client';

// ==============================================
// VENDEURS - Données réelles API
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, Avatar, IconButton, InputBase,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Pagination, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress,
} from '@mui/material';
import {
  Search, Eye, Download, Store,
  CheckCircle, Clock, XCircle, Ban,
} from 'lucide-react';
import {
  useAdminSellers, useAdminSellerStats,
  useUpdateSellerStatus, useToggleSellerActive,
  exportSellersCsv, type AdminSeller,
} from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';

import styles from '@/src/styles/pages.module.scss';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
}

const statusConfig: Record<string, { label: string; class: string }> = {
  APPROVED: { label: 'Approuvé',   class: styles.badgeSuccess },
  PENDING:  { label: 'En attente', class: styles.badgeWarning },
  REJECTED: { label: 'Rejeté',     class: styles.badgeError },
};

// ─── Modal rejet ─────────────────────────────────────────────────

function RejectModal({ seller, onClose }: { seller: AdminSeller; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const updateStatus = useUpdateSellerStatus();
  const { showSuccess, showError } = useSnackbar();

  const handleReject = async () => {
    if (!reason.trim()) { setError('La raison est requise.'); return; }
    setError('');
    try {
      await updateStatus.mutateAsync({ id: seller.id, status: 'REJECTED', reason });
      showSuccess(`Boutique ${seller.name} rejetée. Email envoyé au vendeur.`);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Erreur lors du rejet.';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#EF4444' }}>
        Rejeter la boutique — {seller.name}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Typography sx={{ fontSize: 14, color: '#6B7280' }}>
          Un email sera envoyé au vendeur avec la raison du rejet.
        </Typography>
        <TextField
          label="Raison du rejet"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={3}
          size="small"
          fullWidth
          placeholder="Ex: Documents manquants ou illisibles, informations incorrectes..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" color="error" size="small" onClick={handleReject}
          disabled={updateStatus.isPending}
          startIcon={updateStatus.isPending ? <CircularProgress size={14} color="inherit" /> : <XCircle size={14} />}
        >
          Rejeter & Notifier
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────

export default function SellersTab() {
  const { setActiveTab } = useAdminTab();
  const { showSuccess, showError } = useSnackbar();
  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [rejectTarget, setRejectTarget] = useState<AdminSeller | null>(null);
  const [exporting, setExporting]       = useState(false);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => {
      setDebounced(v);
      setPage(1);
    }, 350);
  };

  const { data, isLoading } = useAdminSellers({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
  });

  const { data: stats } = useAdminSellerStats();
  const updateStatus = useUpdateSellerStatus();
  const toggleActive = useToggleSellerActive();

  const sellers = data?.data ?? [];
  const meta    = data?.meta;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportSellersCsv({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
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
      {/* Modal rejet */}
      {rejectTarget && (
        <RejectModal seller={rejectTarget} onClose={() => setRejectTarget(null)} />
      )}

      {/* Stats */}
      <Box className={styles.statsRow}>
        {[
          { icon: Store,       label: 'Total boutiques', value: stats?.total    ?? '—', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: CheckCircle, label: 'Approuvées',      value: stats?.approved ?? '—', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: Clock,       label: 'En attente',      value: stats?.pending  ?? '—', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: XCircle,     label: 'Rejetées',        value: stats?.rejected ?? '—', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
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
              placeholder="Nom boutique, email propriétaire..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>
          <Box className={styles.filters}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="APPROVED">Approuvés</MenuItem>
                <MenuItem value="PENDING">En attente</MenuItem>
                <MenuItem value="REJECTED">Rejetés</MenuItem>
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
                <th>Boutique</th>
                <th>Propriétaire</th>
                <th>Catégorie</th>
                <th>Produits</th>
                <th>Localité</th>
                <th>Statut</th>
                <th>Depuis</th>
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
                : sellers.map((seller) => (
                  <tr key={seller.id}>
                    <td>
                      <Box className={styles.userCell}>
                        <Avatar
                          src={seller.logo ?? undefined}
                          variant="rounded"
                          sx={{ width: 38, height: 38, bgcolor: 'rgba(255, 44, 44,0.1)', color: '#FF2C2C', fontWeight: 700, fontSize: 13 }}
                        >
                          {seller.name.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Typography className={styles.userCellName}>{seller.name}</Typography>
                      </Box>
                    </td>
                    <td>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{seller.owner.fullName || '—'}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{seller.owner.email}</Typography>
                      </Box>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{seller.category || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{seller.productCount}</td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>
                      {[seller.city, seller.country].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td>
                      <Box className={`${styles.badge} ${statusConfig[seller.status]?.class}`}>
                        {statusConfig[seller.status]?.label}
                      </Box>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(seller.createdAt)}</td>
                    <td>
                      <Box className={styles.actionsCell}>
                        {/* Voir le détail */}
                        <Tooltip title="Voir le détail">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setActiveTab('seller-detail', { sellerId: seller.id })}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>

                        {/* Approuver (si PENDING ou REJECTED) */}
                        {(seller.status === 'PENDING' || seller.status === 'REJECTED') && (
                          <Tooltip title="Approuver">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#10B981' }}
                              onClick={() => updateStatus.mutate(
                                { id: seller.id, status: 'APPROVED' },
                                {
                                  onSuccess: () => showSuccess(`Boutique ${seller.name} approuvée. Email envoyé au vendeur.`),
                                  onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors de l\'approbation.'),
                                }
                              )}
                              disabled={updateStatus.isPending}
                            >
                              <CheckCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Rejeter avec raison (si PENDING ou APPROVED) */}
                        {(seller.status === 'PENDING' || seller.status === 'APPROVED') && (
                          <Tooltip title="Rejeter">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#EF4444' }}
                              onClick={() => setRejectTarget(seller)}
                            >
                              <XCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Toggle actif/inactif (si APPROVED) */}
                        {seller.status === 'APPROVED' && (
                          <Tooltip title="Désactiver">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#F59E0B' }}
                              onClick={() => toggleActive.mutate(seller.id, {
                                onSuccess: () => showSuccess(`Boutique ${seller.name} désactivée.`),
                                onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors de la désactivation.'),
                              })}
                              disabled={toggleActive.isPending}
                            >
                              <Ban size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
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
              {meta.total.toLocaleString('fr-FR')} boutique{meta.total !== 1 ? 's' : ''}
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
