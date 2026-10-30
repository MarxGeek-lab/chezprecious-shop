'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, InputBase,
  CircularProgress, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider,
  useMediaQuery, useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CreditCard, Search, Download, RefreshCw, Eye,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, ChevronLeft, ChevronRight, X,
  Smartphone, Wallet,
} from 'lucide-react';
import { useAdminOrders, useAdminOrder, exportOrdersCsv } from '@/src/hooks/useAdminData';
import styles from '@/src/styles/pages.module.scss';

// ── Helpers ────────────────────────────────────

function fmtPrice(v: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(v);
}
function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const PAYMENT_STATUS_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:    { label: 'En attente', cls: styles.badgeWarning, icon: Clock       },
  PROCESSING: { label: 'En cours',  cls: styles.badgeInfo,    icon: RefreshCw   },
  COMPLETED:  { label: 'Réussi',    cls: styles.badgeSuccess, icon: CheckCircle },
  FAILED:     { label: 'Échoué',    cls: styles.badgeError,   icon: XCircle     },
  REFUNDED:   { label: 'Remboursé', cls: styles.badgeDefault, icon: RefreshCw   },
};

const ORDER_STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:    { label: 'En attente', cls: styles.badgeWarning },
  PAID:       { label: 'Payée',      cls: styles.badgeSuccess },
  PROCESSING: { label: 'En cours',  cls: styles.badgeInfo    },
  SHIPPED:    { label: 'Expédiée',  cls: styles.badgeInfo    },
  DELIVERED:  { label: 'Livrée',    cls: styles.badgeSuccess },
  CANCELLED:  { label: 'Annulée',   cls: styles.badgeError   },
};

const METHOD_ICON: Record<string, React.ElementType> = {
  MOBILE_MONEY:   Smartphone,
  CARD:           CreditCard,
  FEEXPAY_WALLET: Wallet,
};

const METHOD_LABEL: Record<string, string> = {
  MOBILE_MONEY:   'Mobile Money',
  CARD:           'Carte bancaire',
  FEEXPAY_WALLET: 'FeexPay Wallet',
};

const PAYMENT_STATUS_TABS = [
  { value: '',           label: 'Tous'       },
  { value: 'COMPLETED',  label: 'Réussis'    },
  { value: 'PENDING',    label: 'En attente' },
  { value: 'FAILED',     label: 'Échoués'    },
  { value: 'REFUNDED',   label: 'Remboursés' },
];

// ── Order detail dialog ─────────────────────────

interface OrderItem { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }

function OrderDetailDialog({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { data: order, isLoading } = useAdminOrder(orderId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
          {isLoading ? 'Chargement…' : `Commande ${order?.orderNumber}`}
        </Typography>
        <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} sx={{ color: '#FF2C2C' }} />
          </Box>
        ) : !order ? (
          <Typography color="text.secondary">Commande introuvable.</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Client */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>Client</Typography>
              <Typography sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{order.customerEmail} · {order.customerPhone}</Typography>
            </Box>
            <Divider />
            {/* Paiement */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Paiement</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Statut paiement',  value: PAYMENT_STATUS_CFG[order.paymentStatus]?.label ?? order.paymentStatus },
                  { label: 'Méthode',          value: METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod },
                  { label: 'Provider',         value: order.paymentProvider ?? '—' },
                  { label: 'Référence',        value: order.paymentReference ?? '—' },
                  { label: 'Payé le',          value: order.paidAt ? fmtDate(order.paidAt) : '—' },
                  { label: 'Statut commande',  value: ORDER_STATUS_CFG[order.status]?.label ?? order.status },
                ].map(({ label, value }) => (
                  <Grid key={label} size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Divider />
            {/* Montants */}
            <Box>
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>Montants</Typography>
              <Grid container spacing={1}>
                {[
                  { label: 'Sous-total', value: fmtPrice(order.subtotal,     order.currency) },
                  { label: 'Livraison',  value: fmtPrice(order.shippingCost, order.currency) },
                  { label: 'Taxes',      value: fmtPrice(order.tax,          order.currency) },
                  { label: 'Remise',     value: fmtPrice(order.discount,     order.currency) },
                ].map(({ label, value }) => (
                  <Grid key={label} size={{ xs: 6 }}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 800, color: '#FF2C2C', fontSize: 16 }}>
                  {fmtPrice(order.total, order.currency)}
                </Typography>
              </Box>
            </Box>
            {/* Articles */}
            {order.items?.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
                    Articles ({order.items.length})
                  </Typography>
                  {order.items.map((item: OrderItem) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.productName}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          ×{item.quantity} · {fmtPrice(item.unitPrice)}/u
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{fmtPrice(item.totalPrice)}</Typography>
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

export default function PaymentsTab() {
  const [search,        setSearch]        = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page,          setPage]          = useState(1);
  const [detailId,      setDetailId]      = useState<string | null>(null);
  const [exporting,     setExporting]     = useState(false);

  const { data, isLoading, refetch } = useAdminOrders({
    page, limit: 20,
    search:        search        || undefined,
    paymentStatus: paymentStatus || undefined,
  });

  const orders     = data?.data   ?? [];
  const meta       = data?.meta   ?? { total: 0, page: 1, totalPages: 1, pending: 0, processing: 0, delivered: 0, cancelled: 0 };
  const totalPages = meta.totalPages ?? 1;

  const completedRevenue = orders
    .filter((o) => o.paymentStatus === 'COMPLETED')
    .reduce((s, o) => s + o.total, 0);

  const kpis = [
    { icon: DollarSign,    label: 'CA (page)',     value: fmtPrice(completedRevenue), color: '#059669', bg: 'rgba(5,150,105,0.1)'   },
    { icon: CreditCard,    label: 'Transactions',  value: String(meta.total ?? 0),    color: '#FF2C2C', bg: 'rgba(255, 44, 44,0.1)'    },
    { icon: TrendingUp,    label: 'En attente',    value: String(meta.pending ?? 0),  color: '#D97706', bg: 'rgba(245,158,11,0.1)'  },
    { icon: AlertTriangle, label: 'Annulées',      value: String(meta.cancelled ?? 0),color: '#DC2626', bg: 'rgba(239,68,68,0.1)'   },
  ];

  const handleExport = async () => {
    setExporting(true);
    try { await exportOrdersCsv({ search: search || undefined, paymentStatus: paymentStatus || undefined }); }
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
          <Box sx={{ display: 'flex', background: '#F3F4F6', borderRadius: '10px', p: '3px', gap: '2px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexShrink: { xs: 0, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
            {PAYMENT_STATUS_TABS.map((t) => (
              <button key={t.value}
                onClick={() => { setPaymentStatus(t.value); setPage(1); }}
                style={{
                  padding: '5px 12px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.15s', whiteSpace: 'nowrap',
                  background: paymentStatus === t.value ? '#fff' : 'transparent',
                  color: paymentStatus === t.value ? '#111827' : '#6B7280',
                  boxShadow: paymentStatus === t.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >{t.label}</button>
            ))}
          </Box>

          {/* Search */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 180, border: '1px solid', borderColor: 'divider', borderRadius: '10px', px: 1.5, py: 0.75, '&:focus-within': { borderColor: '#FF2C2C' } }}>
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
            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 13, borderColor: 'divider', color: 'text.secondary', flexShrink: 0, '&:hover': { borderColor: '#FF2C2C', color: '#FF2C2C' } }}
          >
            Exporter CSV
          </Button>
        </Box>

        {/* Table */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} sx={{ color: '#FF2C2C' }} />
          </Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
            <CreditCard size={40} style={{ opacity: 0.25, marginBottom: 8 }} />
            <Typography sx={{ fontWeight: 600 }}>Aucune transaction trouvée</Typography>
            <Typography sx={{ fontSize: 13, mt: 0.5 }}>Modifiez les filtres pour voir d'autres résultats.</Typography>
          </Box>
        ) : (
          <Box className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>N° Commande</th>
                  <th>Client</th>
                  <th>Méthode</th>
                  <th>Montant</th>
                  <th>Paiement</th>
                  <th>Commande</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const ps      = PAYMENT_STATUS_CFG[o.paymentStatus] ?? { label: o.paymentStatus, cls: styles.badgeDefault, icon: Clock };
                  const os      = ORDER_STATUS_CFG[o.status]          ?? { label: o.status, cls: styles.badgeDefault };
                  const PSIcon  = ps.icon;
                  const MIcon   = METHOD_ICON[o?.paymentMethod] ?? CreditCard;
                  return (
                    <tr key={o.id}>
                      <td>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#FF2C2C' }}>
                          {o.orderNumber}
                        </Typography>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{o.customerName}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{o.customerEmail}</Typography>
                      </td>
                      <td>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <MIcon size={14} color="#6B7280" />
                          <Typography sx={{ fontSize: 13 }}>{METHOD_LABEL[o?.paymentMethod] ?? o?.paymentMethod}</Typography>
                        </Box>
                      </td>
                      <td>
                        <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
                          {fmtPrice(o?.total)}
                        </Typography>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${ps.cls}`}>
                          <PSIcon size={11} /> {ps.label}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${os.cls}`}>{os.label}</span>
                      </td>
                      <td>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                          {fmtDate(o.createdAt)}
                        </Typography>
                      </td>
                      <td>
                        <Tooltip title="Détail de la commande">
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
              {meta.total} transaction(s) · page {page}/{totalPages}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" disabled={page <= 1}          onClick={() => setPage((p) => p - 1)}><ChevronLeft  size={16} /></IconButton>
              <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {detailId && <OrderDetailDialog orderId={detailId} onClose={() => setDetailId(null)} />}
    </Box>
  );
}
