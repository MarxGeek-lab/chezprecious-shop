'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, InputBase,
  CircularProgress, Tooltip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  useMediaQuery, useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Truck, Search, Download, RefreshCw, Eye,
  CheckCircle, AlertTriangle, Clock, Package,
  MapPin, ArrowRight, ChevronLeft, ChevronRight, X, RotateCcw,
} from 'lucide-react';
import { useAdminOrders, useAdminOrder, exportOrdersCsv } from '@/src/hooks/useAdminData';
import styles from '@/src/styles/pages.module.scss';

// ── Helpers ────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtPrice(v: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(v);
}

// Mapping statut commande → config livraison
const SHIPPING_STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType; progress: number }> = {
  PENDING:    { label: 'En attente',   cls: styles.badgeDefault, icon: Clock,         progress: 5  },
  PAID:       { label: 'Payée',        cls: styles.badgeInfo,    icon: Package,       progress: 20 },
  PROCESSING: { label: 'Préparation', cls: styles.badgeInfo,    icon: Package,       progress: 40 },
  SHIPPED:    { label: 'Expédiée',    cls: styles.badgeWarning,  icon: Truck,         progress: 70 },
  DELIVERED:  { label: 'Livrée',      cls: styles.badgeSuccess,  icon: CheckCircle,   progress: 100},
  CANCELLED:  { label: 'Annulée',     cls: styles.badgeError,    icon: RotateCcw,     progress: 0  },
};

const ORDER_STATUS_TABS = [
  { value: '',           label: 'Toutes'      },
  { value: 'PROCESSING', label: 'Préparation' },
  { value: 'SHIPPED',    label: 'Expédiées'   },
  { value: 'DELIVERED',  label: 'Livrées'     },
  { value: 'CANCELLED',  label: 'Annulées'    },
];

// ── Order detail dialog ─────────────────────────

function ShippingDetailDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading } = useAdminOrder(orderId);
  const cfg = order ? SHIPPING_STATUS_CFG[order.status] ?? SHIPPING_STATUS_CFG.PENDING : null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {isLoading ? 'Chargement…' : `Livraison — ${order?.orderNumber}`}
        </Typography>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#7B1E3A' }} />
          </Box>
        ) : !order ? (
          <Typography color="text.secondary">Commande introuvable.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Progression */}
            {cfg && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <span className={`${styles.badge} ${cfg.cls}`}>
                    <cfg.icon size={11} /> {cfg.label}
                  </span>
                  <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{cfg.progress}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate" value={cfg.progress}
                  sx={{
                    height: 8, borderRadius: 4, bgcolor: '#F3F4F6',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: cfg.progress === 100 ? '#059669' : '#7B1E3A',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            )}

            <Divider />

            {/* Client */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>Client</Typography>
              <Typography sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{order.customerEmail}</Typography>
              {order.customerPhone && (
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{order.customerPhone}</Typography>
              )}
            </Box>

            <Divider />

            {/* Adresse */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Adresse de livraison</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <MapPin size={16} color="#7B1E3A" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{order.shippingAddress}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    {order.shippingCity}{order.shippingCountry ? `, ${order.shippingCountry}` : ''}
                  </Typography>
                  {order.shippingNotes && (
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', mt: 0.5 }}>
                      Note : {order.shippingNotes}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Frais + articles */}
            <Grid container spacing={1.5}>
              {[
                { label: 'Frais de livraison', value: fmtPrice(order.shippingCost, order.currency) },
                { label: 'Total commande',     value: fmtPrice(order.total, order.currency) },
                { label: 'Articles',           value: String(order.items?.length ?? '—') },
                { label: 'Créée le',           value: fmtDate(order.createdAt) },
              ].map(({ label, value }) => (
                <Grid key={label} size={{ xs: 6 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{value}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Articles */}
            {order.items?.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                    Produits ({order.items.length})
                  </Typography>
                  {order.items.map((item: { id: string; productName: string; quantity: number; totalPrice: number }) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.productName}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>×{item.quantity} · {fmtPrice(item.totalPrice)}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: '8px' }}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main ───────────────────────────────────────

export default function ShippingTab() {
  const [search,     setSearch]     = useState('');
  const [statusTab,  setStatusTab]  = useState('');
  const [page,       setPage]       = useState(1);
  const [detailId,   setDetailId]   = useState<string | null>(null);
  const [exporting,  setExporting]  = useState(false);

  const { data, isLoading, refetch } = useAdminOrders({
    page, limit: 20,
    search: search   || undefined,
    status: statusTab || undefined,
  });

  const orders     = data?.data ?? [];
  const meta       = data?.meta ?? { total: 0, page: 1, totalPages: 1, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
  const totalPages = meta.totalPages ?? 1;

  const kpis = [
    { icon: Truck,         label: 'Expédiées',   value: String(orders.filter((o) => o.status === 'SHIPPED').length),    color: '#7B1E3A', bg: 'rgba(123, 30, 58,0.1)'    },
    { icon: CheckCircle,   label: 'Livrées',     value: String(meta.delivered ?? 0),                                     color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
    { icon: Package,       label: 'Préparation', value: String(meta.processing ?? 0),                                    color: '#3B82F6', bg: 'rgba(59,130,246,0.1)'  },
    { icon: AlertTriangle, label: 'Annulées',    value: String(meta.cancelled ?? 0),                                     color: '#DC2626', bg: 'rgba(239,68,68,0.1)'   },
  ];

  const handleExport = async () => {
    setExporting(true);
    try { await exportOrdersCsv({ search: search || undefined, status: statusTab || undefined }); }
    finally { setExporting(false); }
  };

  return (
    <Box>
      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="stretch">
        {kpis.map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
            <Box className={styles.statCard} sx={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <Box className={styles.statIcon} sx={{ bgcolor: k.bg }}>
                <k.icon size={20} color={k.color} />
              </Box>
              <Box>
                <Typography className={styles.statValue}>{k.value}</Typography>
                <Typography className={styles.statLabel}>{k.label}</Typography>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box className={styles.card} sx={{ p: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          {/* Status tabs */}
          <Box sx={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', p: '3px', gap: '2px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: { xs: '100%', sm: 'auto' } }}>
            {ORDER_STATUS_TABS.map((t) => (
              <button key={t.value}
                onClick={() => { setStatusTab(t.value); setPage(1); }}
                style={{
                  padding: '5px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap',
                  background: statusTab === t.value ? '#fff' : 'transparent',
                  color: statusTab === t.value ? '#111827' : '#6B7280',
                  boxShadow: statusTab === t.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </Box>

          {/* Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 180, border: '1px solid', borderColor: 'divider', borderRadius: '10px', px: 1.5, py: 0.75, '&:focus-within': { borderColor: '#7B1E3A' } }}>
            <Search size={15} color="#9CA3AF" />
            <InputBase
              placeholder="N° commande, client, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              sx={{ flex: 1, fontSize: 13 }}
            />
          </Box>

          <Tooltip title="Rafraîchir">
            <IconButton size="small" onClick={() => refetch()}><RefreshCw size={16} /></IconButton>
          </Tooltip>

          <Button
            variant="outlined" size="small"
            startIcon={exporting ? <CircularProgress size={14} /> : <Download size={15} />}
            disabled={exporting}
            onClick={handleExport}
            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 13, borderColor: 'divider', color: 'text.secondary', flexShrink: 0, '&:hover': { borderColor: '#7B1E3A', color: '#7B1E3A' } }}
          >
            Exporter CSV
          </Button>
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#7B1E3A' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <Truck size={40} style={{ opacity: 0.25, marginBottom: 8 }} />
            <Typography sx={{ fontWeight: 600 }}>Aucune expédition trouvée</Typography>
            <Typography sx={{ fontSize: 13, mt: 0.5 }}>Modifiez les filtres pour voir d'autres résultats.</Typography>
          </Box>
        ) : (
          <Box className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Destination</th>
                  <th>Progression</th>
                  <th>Frais</th>
                  <th>Articles</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const cfg = SHIPPING_STATUS_CFG[o.status] ?? SHIPPING_STATUS_CFG.PENDING;
                  const CfgIcon = cfg.icon;
                  return (
                    <tr key={o.id}>
                      <td>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#7B1E3A' }}>
                          {o.orderNumber}
                        </Typography>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.customerName}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{o.customerEmail}</Typography>
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <MapPin size={12} color="#9CA3AF" />
                          <Typography sx={{ fontSize: 13 }}>
                            {(o as { shippingCity?: string }).shippingCity ?? '—'}
                          </Typography>
                          {(o as { shippingCountry?: string }).shippingCountry && (
                            <>
                              <ArrowRight size={11} color="#7B1E3A" />
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                                {(o as { shippingCountry?: string }).shippingCountry}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </td>
                      <td>
                        <Box sx={{ minWidth: 100 }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 700, mb: 0.4 }}>{cfg.progress}%</Typography>
                          <LinearProgress
                            variant="determinate" value={cfg.progress}
                            sx={{
                              height: 5, borderRadius: 3, bgcolor: '#F3F4F6',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: cfg.progress === 100 ? '#059669' : cfg.progress === 0 ? '#EF4444' : '#7B1E3A',
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                          {fmtPrice((o as { shippingCost?: number }).shippingCost ?? 0)}
                        </Typography>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 13 }}>{o.itemCount} article{o.itemCount > 1 ? 's' : ''}</Typography>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{fmtDate(o.createdAt)}</Typography>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${cfg.cls}`}>
                          <CfgIcon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td>
                        <Tooltip title="Détail de la livraison">
                          <IconButton size="small" onClick={() => setDetailId(o.id)}>
                            <Eye size={15} />
                          </IconButton>
                        </Tooltip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}

        {/* Pagination */}
        {!isLoading && meta.total > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              {meta.total} commande(s) · page {page}/{totalPages}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" disabled={page <= 1}          onClick={() => setPage((p) => p - 1)}><ChevronLeft  size={16} /></IconButton>
              <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {detailId && <ShippingDetailDialog orderId={detailId} onClose={() => setDetailId(null)} />}
    </Box>
  );
}
