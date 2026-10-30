'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Box, Typography, Button, IconButton, InputBase,
  CircularProgress, Tooltip, TextField, Snackbar, Alert,
  FormControlLabel, Switch, Avatar,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Zap, Search, CheckCircle, XCircle, Clock, TrendingUp,
  Star, Package, BarChart2, Globe, Tag, RefreshCw,
  ChevronLeft, ChevronRight, X, Eye, DollarSign, Sparkles,
  ShoppingBag, CreditCard, Copy, Check, AlertCircle,
} from 'lucide-react';
import {
  useAdminBoosts,
  useAdminBoostStats,
  useApproveBoost,
  useRejectBoost,
  useUpdateBoostPricing,
  useAdminBoostPricing,
  useAdminProducts,
  useFeatureProduct,
  AdminBoost,
  BoostType,
  BoostStatus,
} from '@/src/hooks/useAdminData';
import styles from './promotions.module.scss';

// ── Constants ──────────────────────────────────

const BOOST_TYPE_CONFIG: Record<BoostType, { label: string; icon: React.ReactNode; cls: string }> = {
  HOMEPAGE:  { label: 'Page d\'accueil', icon: <Globe size={12} />,    cls: styles.typeHomepage },
  CATEGORY:  { label: 'Catégorie',       icon: <Tag size={12} />,      cls: styles.typeCategory },
  SEARCH:    { label: 'Recherche',       icon: <Search size={12} />,   cls: styles.typeSearch   },
  STORE:     { label: 'Boutique',        icon: <ShoppingBag size={12} />, cls: styles.typeStore },
};

const STATUS_CONFIG: Record<BoostStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  PENDING:   { label: 'En attente',  cls: styles.badgePending,   icon: <Clock size={11} />       },
  APPROVED:  { label: 'Approuvé',   cls: styles.badgeApproved,  icon: <CheckCircle size={11} /> },
  REJECTED:  { label: 'Rejeté',     cls: styles.badgeRejected,  icon: <XCircle size={11} />     },
  EXPIRED:   { label: 'Expiré',     cls: styles.badgeExpired,   icon: <Clock size={11} />       },
  CANCELLED: { label: 'Annulé',     cls: styles.badgeCancelled, icon: <XCircle size={11} />     },
};

const DURATION_LABELS: Record<string, string> = { '7': '7 jours', '14': '14 jours', '30': '30 jours' };

function fmtPrice(v: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Sub-components ─────────────────────────────

function BoostBadge({ status }: { status: BoostStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`${styles.badge} ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function TypeChip({ type }: { type: BoostType }) {
  const cfg = BOOST_TYPE_CONFIG[type];
  return (
    <span className={`${styles.boostType} ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Drawer: boost detail + approve/reject ──────

interface DrawerProps {
  boost: AdminBoost;
  onClose: () => void;
}

function BoostDrawer({ boost, onClose }: DrawerProps) {
  const [note, setNote] = useState(boost.adminNote ?? '');
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const approve = useApproveBoost();
  const reject  = useRejectBoost();

  const handleApprove = useCallback(async () => {
    try {
      await approve.mutateAsync({ id: boost.id, adminNote: note || undefined });
      setToast({ msg: 'Boost approuvé avec succès', severity: 'success' });
      setTimeout(onClose, 800);
    } catch {
      setToast({ msg: 'Erreur lors de l\'approbation', severity: 'error' });
    }
  }, [approve, boost.id, note, onClose]);

  const handleReject = useCallback(async () => {
    try {
      await reject.mutateAsync({ id: boost.id, adminNote: note || undefined });
      setToast({ msg: 'Boost rejeté', severity: 'success' });
      setTimeout(onClose, 800);
    } catch {
      setToast({ msg: 'Erreur lors du rejet', severity: 'error' });
    }
  }, [reject, boost.id, note, onClose]);

  const typeCfg   = BOOST_TYPE_CONFIG[boost.type];
  const imgSrc    = boost.product?.images?.[0]?.url;
  const isPending = boost.status === 'PENDING';
  const isLoading = approve.isPending || reject.isPending;
  const [copied, setCopied] = useState(false);
  const copyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopyRef = useCallback(() => {
    if (!boost.paymentRef) return;
    navigator.clipboard.writeText(boost.paymentRef).then(() => {
      setCopied(true);
      if (copyRef.current) clearTimeout(copyRef.current);
      copyRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [boost.paymentRef]);

  return (
    <div className={styles.drawerBackdrop} onClick={onClose}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <Typography className={styles.drawerTitle}>Détail du boost</Typography>
          <IconButton size="small" onClick={onClose}><X size={18} /></IconButton>
        </div>

        <div className={styles.drawerBody}>
          {/* Status + Type */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <BoostBadge status={boost.status} />
            <TypeChip   type={boost.type} />
          </Box>

          {/* Product preview */}
          {boost.product && (
            <div className={styles.detailSection}>
              <Typography className={styles.detailLabel}>Produit boosté</Typography>
              <div className={styles.productPreview}>
                {imgSrc ? (
                  <Image
                    src={imgSrc} alt={boost.product.name}
                    width={64} height={64}
                    className={styles.productPreviewImg}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box sx={{ width: 64, height: 64, bgcolor: 'grey.100', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={24} color="#9CA3AF" />
                  </Box>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {boost.product.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                    {boost.product.store.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: boost.product.status === 'ACTIVE' ? '#059669' : '#D97706', fontWeight: 600, mt: 0.5 }}>
                    {boost.product.status}
                  </Typography>
                </Box>
              </div>
            </div>
          )}

          {/* Seller */}
          <div className={styles.detailSection}>
            <Typography className={styles.detailLabel}>Vendeur</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar src={boost.seller.avatar ?? undefined} sx={{ width: 36, height: 36, fontSize: 14 }}>
                {(boost.seller.fullName ?? boost.seller.email)[0].toUpperCase()}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{boost.seller.fullName ?? '—'}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{boost.seller.email}</Typography>
              </Box>
            </Box>
          </div>

          {/* Details grid */}
          <Grid container spacing={2}>
            {[
              { label: 'Type',       value: typeCfg.label },
              { label: 'Durée',      value: `${boost.durationDays} jours` },
              { label: 'Prix payé',  value: fmtPrice(boost.price) },
              { label: 'Devise',     value: boost.currency },
              { label: 'Créé le',   value: fmtDate(boost.createdAt) },
              { label: 'Expire le',  value: fmtDate(boost.endsAt) },
            ].map(({ label, value }) => (
              <Grid key={label} size={{ xs: 6 }}>
                <Typography className={styles.detailLabel}>{label}</Typography>
                <Typography className={styles.detailValue}>{value}</Typography>
              </Grid>
            ))}
          </Grid>

          {/* Paiement */}
          <div className={styles.detailSection}>
            <Typography className={styles.detailLabel}>Paiement</Typography>
            <div className={styles.paymentCard}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: boost.paymentRef ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={16} color={boost.paymentRef ? '#059669' : '#D97706'} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: boost.paymentRef ? '#059669' : '#D97706' }}>
                      {boost.paymentRef ? 'Paiement reçu' : 'Paiement non confirmé'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {boost.currency} · FeexPay
                    </Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                  {fmtPrice(boost.price)}
                </Typography>
              </Box>

              {boost.paymentRef ? (
                <Box className={styles.paymentRefRow}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>
                      Référence transaction
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#374151', wordBreak: 'break-all' }}>
                      {boost.paymentRef}
                    </Typography>
                  </Box>
                  <Tooltip title={copied ? 'Copié !' : 'Copier la référence'}>
                    <IconButton size="small" onClick={handleCopyRef}
                      sx={{ color: copied ? '#059669' : 'text.secondary', flexShrink: 0 }}>
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px dashed rgba(245,158,11,0.3)' }}>
                  <AlertCircle size={14} color="#D97706" />
                  <Typography sx={{ fontSize: 12, color: '#92400E' }}>
                    Aucune référence de paiement fournie par le vendeur.
                  </Typography>
                </Box>
              )}
            </div>
          </div>

          {/* Note admin */}
          {isPending && (
            <div className={styles.detailSection}>
              <Typography className={styles.detailLabel}>Note admin (optionnelle)</Typography>
              <textarea
                className={styles.noteArea}
                placeholder="Motif de rejet ou commentaire…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {!isPending && boost.adminNote && (
            <div className={styles.detailSection}>
              <Typography className={styles.detailLabel}>Note admin</Typography>
              <Typography className={styles.detailValue}>{boost.adminNote}</Typography>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {isPending && (
          <div className={styles.drawerFooter}>
            <Button
              variant="contained" fullWidth
              disabled={isLoading}
              onClick={handleApprove}
              startIcon={isLoading && approve.isPending ? <CircularProgress size={16} color="inherit" /> : <CheckCircle size={16} />}
              sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, textTransform: 'none', borderRadius: '10px', fontWeight: 600 }}
            >
              Approuver
            </Button>
            <Button
              variant="outlined" fullWidth
              disabled={isLoading}
              onClick={handleReject}
              startIcon={isLoading && reject.isPending ? <CircularProgress size={16} color="inherit" /> : <XCircle size={16} />}
              sx={{ borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: 'rgba(220,38,38,0.06)', borderColor: '#DC2626' }, textTransform: 'none', borderRadius: '10px', fontWeight: 600 }}
            >
              Rejeter
            </Button>
          </div>
        )}
      </div>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: '12px' }}>{toast?.msg}</Alert>
      </Snackbar>
    </div>
  );
}

// ── Tab: Boosts ────────────────────────────────

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '',          label: 'Tous'       },
  { value: 'PENDING',   label: 'En attente' },
  { value: 'APPROVED',  label: 'Approuvés'  },
  { value: 'REJECTED',  label: 'Rejetés'    },
  { value: 'EXPIRED',   label: 'Expirés'    },
];

function BoostsPanel({ pendingCount }: { pendingCount: number }) {
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [drawer,       setDrawer]       = useState<AdminBoost | null>(null);

  const { data, isLoading, refetch } = useAdminBoosts({
    page, limit: 15,
    status: statusFilter || undefined,
    type: typeFilter   || undefined,
    search: search     || undefined,
  });

  const boosts    = data?.data?.boosts ?? [];
  const meta      = data?.data?.meta ?? { total: 0, page: 1, totalPages: 1 };
  const totalPages = meta.totalPages;

  return (
    <Box>
      {/* Toolbar */}
      <Box className={styles.toolbar}>
        {/* Tab strip */}
        <div className={styles.tabStrip}>
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              className={`${styles.tabBtn} ${statusFilter === t.value ? styles.active : ''}`}
              onClick={() => { setStatusFilter(t.value); setPage(1); }}
            >
              {t.label}
              {t.value === 'PENDING' && pendingCount > 0 && (
                <span className={styles.tabBadge}>{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={15} color="#9CA3AF" />
          <InputBase
            placeholder="Vendeur, produit…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ flex: 1, fontSize: 13 }}
          />
        </div>

        {/* Type filter */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {(['', 'HOMEPAGE', 'CATEGORY', 'SEARCH', 'STORE'] as const).map((t) => (
            <Button
              key={t}
              size="small"
              onClick={() => { setTypeFilter(t); setPage(1); }}
              sx={{
                textTransform: 'none', fontSize: 12, borderRadius: '8px', px: 1.5,
                bgcolor: typeFilter === t ? 'rgba(123, 30, 58,0.1)' : 'transparent',
                color:   typeFilter === t ? '#7B1E3A' : 'text.secondary',
                fontWeight: typeFilter === t ? 700 : 400,
                '&:hover': { bgcolor: 'rgba(123, 30, 58,0.08)' },
              }}
            >
              {t === '' ? 'Tous types' : BOOST_TYPE_CONFIG[t as BoostType].label}
            </Button>
          ))}
        </Box>

        <Tooltip title="Rafraîchir">
          <IconButton size="small" onClick={() => refetch()}>
            <RefreshCw size={16} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* List */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: '#7B1E3A' }} />
        </Box>
      ) : boosts.length === 0 ? (
        <div className={styles.empty}>
          <Zap size={48} className={styles.emptyIcon} />
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>Aucun boost trouvé</Typography>
          <Typography sx={{ fontSize: 13 }}>Modifiez les filtres pour voir d'autres demandes.</Typography>
        </div>
      ) : (
        <div className={styles.boostList}>
          {boosts.map((boost) => {
            const imgSrc = boost.product?.images?.[0]?.url;
            return (
              <div key={boost.id} className={styles.boostItem}>
                {/* Thumbnail */}
                {imgSrc ? (
                  <Image
                    src={imgSrc} alt={boost.product?.name ?? ''}
                    width={52} height={52}
                    className={styles.boostThumb}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box className={styles.boostThumb} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={22} color="#9CA3AF" />
                  </Box>
                )}

                {/* Info */}
                <Box className={styles.boostInfo}>
                  <Typography className={styles.boostProductName}>
                    {boost.product?.name ?? <em style={{ color: '#9CA3AF' }}>Boost boutique entière</em>}
                  </Typography>
                  <Box className={styles.boostMeta}>
                    <TypeChip type={boost.type} />
                    <span>·</span>
                    <span>{boost.durationDays}j</span>
                    <span>·</span>
                    <span>{fmtDate(boost.createdAt)}</span>
                  </Box>
                </Box>

                {/* Seller */}
                <div className={styles.sellerChip}>
                  <Avatar src={boost.seller.avatar ?? undefined} sx={{ width: 28, height: 28, fontSize: 12 }}>
                    {(boost.seller.fullName ?? boost.seller.email)[0].toUpperCase()}
                  </Avatar>
                  <Typography className={styles.sellerName}>
                    {boost.seller.fullName ?? boost.seller.email}
                  </Typography>
                </div>

                {/* Price + payment */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography className={styles.boostPrice}>{fmtPrice(boost.price)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.3 }}>
                    <BoostBadge status={boost.status} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                    <CreditCard size={11} color={boost.paymentRef ? '#059669' : '#D97706'} />
                    <Typography sx={{ fontSize: 10, fontWeight: 600, color: boost.paymentRef ? '#059669' : '#D97706' }}>
                      {boost.paymentRef ? 'Payé' : 'Non confirmé'}
                    </Typography>
                  </Box>
                </Box>

                {/* Actions */}
                <div className={styles.boostActions}>
                  <Tooltip title="Voir le détail">
                    <IconButton size="small" onClick={() => setDrawer(boost)}>
                      <Eye size={16} />
                    </IconButton>
                  </Tooltip>
                  {boost.status === 'PENDING' && (
                    <>
                      <Tooltip title="Approuver">
                        <IconButton size="small" onClick={() => setDrawer(boost)}
                          sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(5,150,105,0.08)' } }}>
                          <CheckCircle size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeter">
                        <IconButton size="small" onClick={() => setDrawer(boost)}
                          sx={{ color: '#DC2626', '&:hover': { bgcolor: 'rgba(220,38,38,0.08)' } }}>
                          <XCircle size={16} />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && meta.total > 0 && (
        <div className={styles.pagination}>
          <Typography className={styles.paginationInfo}>
            {meta.total} boost(s) · page {meta.page}/{totalPages}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </IconButton>
            <IconButton size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </IconButton>
          </Box>
        </div>
      )}

      {drawer && <BoostDrawer boost={drawer} onClose={() => setDrawer(null)} />}
    </Box>
  );
}

// ── Tab: Featured products ─────────────────────

function FeaturedPanel() {
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const featureMut = useFeatureProduct();

  const { data, isLoading, refetch } = useAdminProducts({ search: search || undefined, limit: 24 });
  const products = data?.data ?? [];

  const handleToggle = useCallback(async (id: string, current: boolean) => {
    try {
      await featureMut.mutateAsync({ id, isFeatured: !current });
      setToast({ msg: current ? 'Produit retiré de la une' : 'Produit mis en avant !', severity: 'success' });
      refetch();
    } catch {
      setToast({ msg: 'Erreur lors de la mise à jour', severity: 'error' });
    }
  }, [featureMut, refetch]);

  return (
    <Box>
      {/* Toolbar */}
      <Box className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} color="#9CA3AF" />
          <InputBase
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, fontSize: 13 }}
          />
        </div>
        <Tooltip title="Rafraîchir">
          <IconButton size="small" onClick={() => refetch()}><RefreshCw size={16} /></IconButton>
        </Tooltip>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress size={32} sx={{ color: '#7B1E3A' }} />
        </Box>
      ) : (
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {products.map((p) => {
              const img = p.mainImage;
              const isFeatured = p.isFeatured;
              return (
                <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <div className={styles.featuredCard}>
                    {img ? (
                      <Image
                        src={img} alt={p.name}
                        width={300} height={140}
                        className={styles.featuredImg}
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.featuredImgPlaceholder}>
                        <Package size={32} />
                      </div>
                    )}
                    <div className={styles.featuredCardBody}>
                      <Typography className={styles.featuredProductName}>{p.name}</Typography>
                      <Typography className={styles.featuredStoreName}>{p.store?.name ?? '—'}</Typography>
                      {isFeatured && (
                        <span className={styles.featuredBadge}>
                          <Star size={10} /> En avant
                        </span>
                      )}
                      <Box sx={{ mt: 1.5 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isFeatured}
                              size="small"
                              onChange={() => handleToggle(p.id, isFeatured)}
                              disabled={featureMut.isPending}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B1E3A' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B1E3A' },
                              }}
                            />
                          }
                          label={<Typography sx={{ fontSize: 12 }}>{isFeatured ? 'En vedette' : 'Mettre en avant'}</Typography>}
                        />
                      </Box>
                    </div>
                  </div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: '12px' }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ── Tab: Tarifs ────────────────────────────────

const DEFAULT_PRICING = {
  HOMEPAGE: { '7': 5000, '14': 9000,  '30': 18000 },
  CATEGORY: { '7': 2500, '14': 4500,  '30': 9000  },
  SEARCH:   { '7': 3000, '14': 5500,  '30': 11000 },
  STORE:    { '7': 3500, '14': 6000,  '30': 12000 },
};

function PricingPanel() {
  const { data: pricingData, isLoading } = useAdminBoostPricing();
  const updatePricing = useUpdateBoostPricing();
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [pricing, setPricing] = useState<Record<string, Record<string, number>>>(DEFAULT_PRICING);

  // Hydrate depuis l'API dès que les données arrivent
  useEffect(() => {
    if (pricingData?.data?.pricing) {
      setPricing((pricingData.data as any)?.pricing);
    }
  }, [pricingData]);

  const handleChange = (type: string, dur: string, val: string) => {
    const n = Number(val.replace(/\D/g, ''));
    setPricing((prev) => ({ ...prev, [type]: { ...prev[type], [dur]: n } }));
  };

  const handleSave = async () => {
    try {
      await updatePricing.mutateAsync(pricing as never);
      setToast({ msg: 'Grille tarifaire enregistrée', severity: 'success' });
    } catch {
      setToast({ msg: 'Erreur lors de la sauvegarde', severity: 'error' });
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} sx={{ color: '#7B1E3A' }} />
      </Box>
    );
  }

  const types: { key: BoostType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'HOMEPAGE', label: 'Page d\'accueil', icon: <Globe size={16} />,        color: '#6366F1' },
    { key: 'CATEGORY', label: 'Catégorie',       icon: <Tag size={16} />,          color: '#EC4899' },
    { key: 'SEARCH',   label: 'Recherche',       icon: <Search size={16} />,       color: '#3B82F6' },
    { key: 'STORE',    label: 'Boutique',         icon: <ShoppingBag size={16} />,  color: '#F59E0B' },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>
          Définissez le prix en euros pour chaque type de boost et durée.
        </Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updatePricing.isPending}
          startIcon={updatePricing.isPending ? <CircularProgress size={14} color="inherit" /> : <DollarSign size={16} />}
          sx={{ bgcolor: '#7B1E3A', '&:hover': { bgcolor: '#5A1229' }, textTransform: 'none', borderRadius: '10px', fontWeight: 600 }}
        >
          Enregistrer la grille
        </Button>
      </Box>

      <Grid container spacing={2}>
        {types.map(({ key, label, icon, color }) => (
          <Grid key={key} size={{ xs: 12, sm: 6 }}>
            <div className={styles.pricingCard}>
              <Typography className={styles.pricingCardTitle} sx={{ color }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color }}>
                  {icon} {label}
                </span>
              </Typography>
              {['7', '14', '30'].map((dur) => (
                <div key={dur} className={styles.pricingRow}>
                  <Typography className={styles.pricingDurationLabel}>{DURATION_LABELS[dur]}</Typography>
                  <TextField
                    size="small"
                    value={pricing[key]?.[dur] ?? 0}
                    onChange={(e) => handleChange(key, dur, e.target.value)}
                    InputProps={{
                      endAdornment: <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 0.5 }}>€</Typography>,
                    }}
                    sx={{
                      width: 130,
                      '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7B1E3A' },
                    }}
                  />
                </div>
              ))}
            </div>
          </Grid>
        ))}
      </Grid>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ borderRadius: '12px' }}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

// ── Main component ─────────────────────────────

const MAIN_TABS = [
  { value: 'boosts',   label: 'Demandes de boost', icon: <Zap size={14} />        },
  { value: 'featured', label: 'Produits en avant',  icon: <Sparkles size={14} />   },
  { value: 'pricing',  label: 'Grille tarifaire',   icon: <BarChart2 size={14} />  },
];

export default function PromotionsTab() {
  const [activeTab, setActiveTab] = useState('boosts');

  const { data: statsData } = useAdminBoostStats();
  const stats = statsData?.data;

  const kpis = [
    { icon: Zap,          label: 'Total boosts',     value: stats?.total     ?? '—', color: '#7B1E3A', bg: 'rgba(123, 30, 58,0.1)'    },
    { icon: Clock,        label: 'En attente',        value: stats?.pending   ?? '—', color: '#D97706', bg: 'rgba(245,158,11,0.1)'  },
    { icon: CheckCircle,  label: 'Actifs',            value: stats?.approved  ?? '—', color: '#059669', bg: 'rgba(16,185,129,0.1)'  },
    { icon: XCircle,      label: 'Rejetés',           value: stats?.rejected  ?? '—', color: '#DC2626', bg: 'rgba(239,68,68,0.1)'   },
    { icon: TrendingUp,   label: 'Revenus boosts',
      value: stats?.revenue !== undefined ? fmtPrice(stats.revenue) : '—',
      color: '#6366F1', bg: 'rgba(99,102,241,0.1)',
    },
  ];

  return (
    <Box>
      {/* KPI strip */}
      <Grid container spacing={2} sx={{ mb: 3 }} alignItems="stretch">
        {kpis.map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 4, lg: 'auto' }} sx={{ flex: { lg: 1 }, display: 'flex' }}>
            <div className={styles.kpiCard} style={{ width: '100%' }}>
              <div className={styles.kpiIcon} style={{ background: k.bg }}>
                <k.icon size={22} color={k.color} />
              </div>
              <Box>
                <Typography className={styles.kpiLabel}>{k.label}</Typography>
                <Typography className={styles.kpiValue}>{k.value}</Typography>
              </Box>
            </div>
          </Grid>
        ))}
      </Grid>

      {/* Main card */}
      <div className={styles.card}>
        {/* Tab nav */}
        <div className={styles.cardHeader}>
          <Typography className={styles.cardTitle}>Gestion des promotions</Typography>
          <div className={styles.tabStrip}>
            {MAIN_TABS.map((t) => (
              <button
                key={t.value}
                className={`${styles.tabBtn} ${activeTab === t.value ? styles.active : ''}`}
                onClick={() => setActiveTab(t.value)}
              >
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  {t.icon} {t.label}
                </Box>
                {t.value === 'boosts' && (stats?.pending ?? 0) > 0 && (
                  <span className={styles.tabBadge}>{stats!.pending}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {activeTab === 'boosts'   && <BoostsPanel   pendingCount={stats?.pending ?? 0} />}
        {activeTab === 'featured' && <FeaturedPanel />}
        {activeTab === 'pricing'  && <PricingPanel  />}
      </div>
    </Box>
  );
}
