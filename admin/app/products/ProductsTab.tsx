'use client';

// ==============================================
// PRODUITS - Données réelles API
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, Avatar, IconButton, InputBase,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Pagination, Skeleton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
} from '@mui/material';
import {
  Search, Eye, Trash2, Download, Package,
  CheckCircle, Archive, RotateCcw,
} from 'lucide-react';
import {
  useAdminProducts, useUpdateProductStatus, useDeleteProduct,
  exportProductsCsv, type AdminProduct,
} from '@/src/hooks/useAdminData';
import { getAssetUrl } from '@/src/lib/api';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';
import styles from '@/src/styles/pages.module.scss';

function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR').format(price) + ' F';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const statusConfig: Record<string, { label: string; class: string }> = {
  ACTIVE:   { label: 'Actif',     class: styles.badgeSuccess },
  DRAFT:    { label: 'Brouillon', class: styles.badgeDefault },
  ARCHIVED: { label: 'Archivé',  class: styles.badgeDefault },
  INACTIVE: { label: 'Inactif',  class: styles.badgeError },
};

// ─── Modal suppression ────────────────────────────────────────────

function DeleteProductModal({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const deleteProduct = useDeleteProduct();
  const { showSuccess, showError } = useSnackbar();

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(product.id);
      showSuccess(`Produit "${product.name}" supprimé.`);
      onClose();
    } catch (e: any) {
      showError(e?.response?.data?.message ?? 'Erreur lors de la suppression.');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#EF4444' }}>Supprimer le produit</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 14 }}>
          Supprimer <strong>"{product.name}"</strong> ?<br />
          <Typography component="span" sx={{ fontSize: 12, color: '#9CA3AF' }}>
            Cette action est irréversible.
          </Typography>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" color="error" size="small" onClick={handleDelete}
          disabled={deleteProduct.isPending}
          startIcon={deleteProduct.isPending ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
        >
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────

export default function ProductsTab() {
  const { setActiveTab } = useAdminTab();
  const { showSuccess, showError } = useSnackbar();

  const [search, setSearch]             = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter]   = useState('');
  const [storeFilterName, setStoreFilterName] = useState('');
  const [page, setPage]                 = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [exporting, setExporting]       = useState(false);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => {
      setDebounced(v);
      setPage(1);
    }, 350);
  };

  const { data, isLoading } = useAdminProducts({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    storeId: storeFilter || undefined,
  });

  const updateStatus = useUpdateProductStatus();

  const products = data?.data ?? [];
  const meta     = data?.meta;

  const handleStatusChange = (product: AdminProduct, newStatus: string, label: string) => {
    updateStatus.mutate(
      { id: product.id, status: newStatus },
      {
        onSuccess: () => showSuccess(`"${product.name}" ${label}.`),
        onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors du changement de statut.'),
      }
    );
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProductsCsv({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        storeId: storeFilter || undefined,
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
      {/* Modal suppression */}
      {deleteTarget && (
        <DeleteProductModal product={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}

      {/* Stats */}
      <Box className={styles.statsRow}>
        {[
          { icon: Package,     label: 'Total',      value: meta?.total      ?? '—', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: CheckCircle, label: 'Actifs',     value: meta?.active     ?? '—', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: Archive,     label: 'Brouillons', value: meta?.draft      ?? '—', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
          { icon: Package,     label: 'Rupture',    value: meta?.outOfStock ?? '—', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
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
              placeholder="Nom du produit, boutique..."
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
                <MenuItem value="ACTIVE">Actifs</MenuItem>
                <MenuItem value="DRAFT">Brouillons</MenuItem>
                <MenuItem value="ARCHIVED">Archivés</MenuItem>
                <MenuItem value="INACTIVE">Inactifs</MenuItem>
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
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Boutique</th>
                <th>Prix</th>
                <th>Stock</th>
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
                : products.map((product) => (
                  <tr key={product.id}>
                    {/* Produit */}
                    <td>
                      <Box className={styles.userCell}>
                        <Avatar
                          src={getAssetUrl(product.mainImage)}
                          variant="rounded"
                          sx={{ width: 40, height: 40, bgcolor: '#F0F2F5', color: '#6B7280' }}
                        >
                          <Package size={18} />
                        </Avatar>
                        <Box className={styles.userCellInfo}>
                          <Typography className={styles.userCellName}>{product.name}</Typography>
                          {product.isFeatured && (
                            <Typography sx={{ fontSize: 10, color: '#D45D00', fontWeight: 700 }}>⭐ Vedette</Typography>
                          )}
                        </Box>
                      </Box>
                    </td>

                    {/* Catégorie */}
                    <td>
                      {product.category
                        ? (
                          <Chip
                            label={product.category}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: 11, borderColor: '#D45D0040', color: '#374151' }}
                          />
                        )
                        : <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>—</Typography>
                      }
                    </td>

                    {/* Boutique — clic pour filtrer */}
                    <td>
                      {product.store ? (
                        <Tooltip title={`Filtrer par "${product.store.name}"`}>
                          <Typography
                            sx={{
                              fontSize: 13, color: '#6B7280', cursor: 'pointer', display: 'inline',
                              '&:hover': { color: '#D45D00', textDecoration: 'underline' },
                            }}
                            onClick={() => {
                              setStoreFilter(product.store!.id);
                              setStoreFilterName(product.store!.name);
                              setPage(1);
                            }}
                          >
                            {product.store.name}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>—</Typography>
                      )}
                    </td>

                    {/* Prix */}
                    <td style={{ fontWeight: 600 }}>{formatPrice(product.price)}</td>

                    {/* Stock */}
                    <td>
                      <Typography sx={{
                        color: product.stock === 0 ? '#EF4444' : product.stock < 5 ? '#F59E0B' : '#10B981',
                        fontWeight: 600, fontSize: 14,
                      }}>
                        {product.stock}
                      </Typography>
                    </td>

                    {/* Statut */}
                    <td>
                      <Box className={`${styles.badge} ${statusConfig[product.status]?.class ?? ''}`}>
                        {statusConfig[product.status]?.label ?? product.status}
                      </Box>
                    </td>

                    {/* Date */}
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(product.createdAt)}</td>

                    {/* Actions */}
                    <td>
                      <Box className={styles.actionsCell}>
                        {/* Voir le détail */}
                        <Tooltip title="Voir le détail">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setActiveTab('product-detail', { productId: product.id })}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>

                        {/* Activer (si DRAFT, ARCHIVED ou INACTIVE) */}
                        {(product.status === 'DRAFT' || product.status === 'ARCHIVED' || product.status === 'INACTIVE') && (
                          <Tooltip title="Activer">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#10B981' }}
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusChange(product, 'ACTIVE', 'activé')}
                            >
                              <CheckCircle size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Archiver (si ACTIVE) */}
                        {product.status === 'ACTIVE' && (
                          <Tooltip title="Archiver">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#F59E0B' }}
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusChange(product, 'ARCHIVED', 'archivé')}
                            >
                              <Archive size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Désarchiver (si ARCHIVED) */}
                        {product.status === 'ARCHIVED' && (
                          <Tooltip title="Désarchiver">
                            <IconButton
                              className={styles.actionBtn}
                              sx={{ color: '#8B5CF6' }}
                              disabled={updateStatus.isPending}
                              onClick={() => handleStatusChange(product, 'ACTIVE', 'désarchivé et activé')}
                            >
                              <RotateCcw size={16} />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Supprimer */}
                        <Tooltip title="Supprimer">
                          <IconButton
                            className={styles.actionBtn}
                            sx={{ color: '#EF4444' }}
                            onClick={() => setDeleteTarget(product)}
                          >
                            <Trash2 size={16} />
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

        {/* Filtre boutique actif */}
        {storeFilter && (
          <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid #F3F4F6' }}>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>Filtre boutique :</Typography>
            <Chip
              label={storeFilterName}
              size="small"
              onDelete={() => { setStoreFilter(''); setStoreFilterName(''); setPage(1); }}
              sx={{ bgcolor: 'rgba(212,93,0,0.1)', color: '#D45D00', fontWeight: 600, fontSize: 11 }}
            />
          </Box>
        )}

        {/* Pagination */}
        {meta && (
          <Box className={styles.pagination}>
            <Typography className={styles.paginationInfo}>
              {meta.total.toLocaleString('fr-FR')} produit{meta.total !== 1 ? 's' : ''}
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
