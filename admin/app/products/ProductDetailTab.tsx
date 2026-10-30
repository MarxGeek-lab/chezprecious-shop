'use client';

import { useState } from 'react';
import {
  Box, Typography, Avatar, Chip, Tab, Tabs, IconButton,
  Skeleton, Tooltip, Divider, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Switch, FormControlLabel,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  ArrowLeft, Package, Star, Archive, CheckCircle,
  FileText, BarChart2, Store, Tag, Layers, Pencil,
  Zap, TrendingUp, Globe, Search, ShoppingBag, X,
  Clock,
} from 'lucide-react';
import {
  useAdminProduct, useUpdateProductStatus, useFeatureProduct,
  useAdminSetDiscount, useAdminCreateBoost, useProductBoosts,
  type BoostType, type AdminBoost,
} from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';
import { getAssetUrl } from '@/src/lib/api';

// ─── helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

const conditionMap: Record<string, string> = {
  NEW: 'Neuf',
  REFURBISHED: 'Reconditionné',
  USED: 'Occasion',
};

const statusMap: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Actif',     color: '#10B981' },
  DRAFT:    { label: 'Brouillon', color: '#F59E0B' },
  ARCHIVED: { label: 'Archivé',  color: '#6B7280' },
  INACTIVE: { label: 'Inactif',  color: '#EF4444' },
};

const boostStatusMap: Record<string, { label: string; color: string }> = {
  PENDING:   { label: 'En attente', color: '#F59E0B' },
  APPROVED:  { label: 'Approuvé',   color: '#10B981' },
  REJECTED:  { label: 'Rejeté',     color: '#EF4444' },
  EXPIRED:   { label: 'Expiré',     color: '#6B7280' },
  CANCELLED: { label: 'Annulé',     color: '#9CA3AF' },
};

const BOOST_TYPES: { value: BoostType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'HOMEPAGE',  label: "Page d'accueil", icon: <Globe size={16} />,       desc: "Mise en avant sur la page d'accueil" },
  { value: 'CATEGORY',  label: 'Catégorie',       icon: <Tag size={16} />,          desc: 'Mise en avant dans la catégorie' },
  { value: 'SEARCH',    label: 'Recherche',        icon: <Search size={16} />,       desc: 'Mise en avant dans les résultats de recherche' },
  { value: 'STORE',     label: 'Boutique',         icon: <ShoppingBag size={16} />,  desc: 'Mise en avant sur la page boutique' },
];

const DURATIONS = [
  { value: 7,  label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
];

// ─── sub-components ─────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.75 }}>
      <Box sx={{ color: '#9CA3AF', mt: '2px', flexShrink: 0 }}><Icon size={15} /></Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{value}</Typography>
      </Box>
    </Box>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5, mt: 2 }}>
      {children}
    </Typography>
  );
}

function BoostCard({ boost }: { boost: AdminBoost }) {
  const bst = boostStatusMap[boost.status] ?? { label: boost.status, color: '#6B7280' };
  const typeInfo = BOOST_TYPES.find((t) => t.value === boost.type);
  return (
    <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
      <Box sx={{ color: '#7B1E3A', mt: '2px', flexShrink: 0 }}>{typeInfo?.icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{typeInfo?.label ?? boost.type}</Typography>
          <Chip label={bst.label} size="small" sx={{ bgcolor: `${bst.color}18`, color: bst.color, fontWeight: 600, fontSize: 10 }} />
          <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{boost.durationDays}j</Typography>
        </Box>
        {boost.startsAt && boost.endsAt && (
          <Typography sx={{ fontSize: 11, color: '#6B7280' }}>
            {formatDate(boost.startsAt)} → {formatDate(boost.endsAt)}
          </Typography>
        )}
        {boost.adminNote && (
          <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.5, fontStyle: 'italic' }}>{boost.adminNote}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Promotions & Boost panel ───────────────────────────────────

function PromotionsPanel({ product }: { product: any }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSuccess, showError } = useSnackbar();

  // Featured toggle
  const featureMutation = useFeatureProduct();

  // Discount form
  const discountMutation = useAdminSetDiscount();
  const [discountPrice, setDiscountPrice] = useState(
    product.discountPrice != null ? String(product.discountPrice) : ''
  );
  const [discountStart, setDiscountStart] = useState(
    product.discountStartAt ? product.discountStartAt.slice(0, 10) : ''
  );
  const [discountEnd, setDiscountEnd] = useState(
    product.discountEndAt ? product.discountEndAt.slice(0, 10) : ''
  );

  // Boost dialog
  const [boostOpen, setBoostOpen] = useState(false);
  const [boostType, setBoostType] = useState<BoostType>('HOMEPAGE');
  const [boostDuration, setBoostDuration] = useState(7);
  const boostMutation = useAdminCreateBoost();

  // Boosts history
  const { data: boosts = [], isLoading: isLoadingBoosts } = useProductBoosts(product.id);

  const handleFeatureToggle = () => {
    featureMutation.mutate(
      { id: product.id, isFeatured: !product.isFeatured },
      {
        onSuccess: () => showSuccess(product.isFeatured ? 'Produit retiré des vedettes.' : 'Produit mis en vedette.'),
        onError: () => showError('Erreur lors de la mise à jour.'),
      }
    );
  };

  const handleDiscountSave = () => {
    discountMutation.mutate(
      {
        id: product.id,
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        discountStartAt: discountStart || null,
        discountEndAt: discountEnd || null,
      },
      {
        onSuccess: () => showSuccess('Promotion enregistrée.'),
        onError: () => showError('Erreur lors de l\'enregistrement de la promotion.'),
      }
    );
  };

  const handleDiscountClear = () => {
    discountMutation.mutate(
      { id: product.id, discountPrice: null, discountStartAt: null, discountEndAt: null },
      {
        onSuccess: () => {
          setDiscountPrice('');
          setDiscountStart('');
          setDiscountEnd('');
          showSuccess('Promotion supprimée.');
        },
        onError: () => showError('Erreur lors de la suppression.'),
      }
    );
  };

  const handleBoostCreate = () => {
    boostMutation.mutate(
      { productId: product.id, type: boostType, durationDays: boostDuration },
      {
        onSuccess: () => {
          setBoostOpen(false);
          showSuccess('Boost créé et activé immédiatement.');
        },
        onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors de la création du boost.'),
      }
    );
  };

  const hasActiveDiscount = product.discountPrice != null;
  const hasActiveBoost = boosts.some((b) => b.status === 'APPROVED');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Vedette ── */}
      <Box sx={{ p: 2.5, border: '1px solid #F3F4F6', borderRadius: 2, bgcolor: product.isFeatured ? 'rgba(123, 30, 58,0.04)' : '#FAFAFA' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Star size={16} style={{ color: '#F59E0B' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Produit vedette</Typography>
              {product.isFeatured && (
                <Chip label="Actif" size="small" sx={{ bgcolor: 'rgba(123, 30, 58,0.1)', color: '#7B1E3A', fontWeight: 700, fontSize: 10 }} />
              )}
            </Box>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
              Affiche ce produit dans les sections "En vedette" du site.
            </Typography>
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={product.isFeatured}
                onChange={handleFeatureToggle}
                disabled={featureMutation.isPending}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7B1E3A' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#7B1E3A' } }}
              />
            }
            label=""
          />
        </Box>
      </Box>

      {/* ── Promotion / Discount ── */}
      <Box sx={{ p: 2.5, border: '1px solid #F3F4F6', borderRadius: 2, bgcolor: hasActiveDiscount ? 'rgba(16,185,129,0.03)' : '#FAFAFA' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUp size={16} style={{ color: '#10B981' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Prix promotionnel</Typography>
          {hasActiveDiscount && (
            <Chip label="En promotion" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 700, fontSize: 10 }} />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label="Prix promo (€)"
            size="small"
            type="number"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            sx={{ width: 180 }}
            placeholder={`Prix normal: ${formatAmount(product.price)}`}
          />
          <TextField
            label="Début"
            size="small"
            type="date"
            value={discountStart}
            onChange={(e) => setDiscountStart(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <TextField
            label="Fin"
            size="small"
            type="date"
            value={discountEnd}
            onChange={(e) => setDiscountEnd(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button
            variant="contained"
            size="small"
            onClick={handleDiscountSave}
            disabled={discountMutation.isPending || !discountPrice}
            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
            startIcon={discountMutation.isPending ? <CircularProgress size={12} color="inherit" /> : <CheckCircle size={14} />}
          >
            Enregistrer
          </Button>
          {hasActiveDiscount && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleDiscountClear}
              disabled={discountMutation.isPending}
              startIcon={<X size={14} />}
              sx={{ borderColor: '#EF4444', color: '#EF4444', '&:hover': { borderColor: '#DC2626', bgcolor: 'transparent' } }}
            >
              Supprimer la promo
            </Button>
          )}
        </Box>

        {hasActiveDiscount && (
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: 'rgba(16,185,129,0.07)', borderRadius: 1.5, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 12, color: '#059669' }}>
              Prix normal : <strong>{formatAmount(product.price)}</strong>
            </Typography>
            <Typography sx={{ fontSize: 12, color: '#059669' }}>
              Prix promo : <strong>{formatAmount(product.discountPrice)}</strong>
            </Typography>
            {product.discountStartAt && (
              <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                <Clock size={11} style={{ marginRight: 3 }} />
                {formatDate(product.discountStartAt)} → {product.discountEndAt ? formatDate(product.discountEndAt) : '∞'}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* ── Boost ── */}
      <Box sx={{ p: 2.5, border: '1px solid #F3F4F6', borderRadius: 2, bgcolor: hasActiveBoost ? 'rgba(139,92,246,0.03)' : '#FAFAFA' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Zap size={16} style={{ color: '#8B5CF6' }} />
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Boost de visibilité</Typography>
            {hasActiveBoost && (
              <Chip label="Boost actif" size="small" sx={{ bgcolor: 'rgba(139,92,246,0.1)', color: '#8B5CF6', fontWeight: 700, fontSize: 10 }} />
            )}
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<Zap size={13} />}
            onClick={() => setBoostOpen(true)}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Créer un boost
          </Button>
        </Box>

        <Typography sx={{ fontSize: 12, color: '#6B7280', mb: 2 }}>
          Crée un boost approuvé immédiatement (sans paiement), visible sur la zone sélectionnée.
        </Typography>

        {/* Historique des boosts */}
        {isLoadingBoosts ? (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', color: '#9CA3AF' }}>
            <CircularProgress size={14} />
            <Typography sx={{ fontSize: 12 }}>Chargement des boosts…</Typography>
          </Box>
        ) : boosts.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', py: 2 }}>
            Aucun boost pour ce produit.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {boosts.map((b) => <BoostCard key={b.id} boost={b} />)}
          </Box>
        )}
      </Box>

      {/* ── Dialog Boost ── */}
      <Dialog open={boostOpen} onClose={() => setBoostOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>
          Créer un boost — {product.name}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Type de boost</InputLabel>
            <Select
              value={boostType}
              label="Type de boost"
              onChange={(e) => setBoostType(e.target.value as BoostType)}
            >
              {BOOST_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {t.icon}
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#6B7280' }}>{t.desc}</Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Durée</InputLabel>
            <Select
              value={boostDuration}
              label="Durée"
              onChange={(e) => setBoostDuration(Number(e.target.value))}
            >
              {DURATIONS.map((d) => (
                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ p: 1.5, bgcolor: 'rgba(139,92,246,0.06)', borderRadius: 1.5 }}>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
              Ce boost sera <strong>approuvé immédiatement</strong> et activé sans frais. Il sera visible jusqu&apos;au {
                (() => {
                  const d = new Date();
                  d.setDate(d.getDate() + boostDuration);
                  return formatDate(d.toISOString());
                })()
              }.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBoostOpen(false)} size="small" sx={{ color: '#6B7280' }}>Annuler</Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleBoostCreate}
            disabled={boostMutation.isPending}
            startIcon={boostMutation.isPending ? <CircularProgress size={12} color="inherit" /> : <Zap size={13} />}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Créer le boost
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── main ────────────────────────────────────────────────────────

export default function ProductDetailTab() {
  const { params, setActiveTab } = useAdminTab();
  const productId = params?.productId as string | undefined;
  const { data: product, isLoading } = useAdminProduct(productId ?? '');
  const [tab, setTab] = useState(0);

  const updateStatus = useUpdateProductStatus();
  const { showSuccess, showError } = useSnackbar();

  if (!productId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Aucun produit sélectionné.</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Produit introuvable.</Typography>
      </Box>
    );
  }

  const st = statusMap[product.status] ?? { label: product.status, color: '#6B7280' };
  const isActive = product.status === 'ACTIVE';
  const isArchived = product.status === 'ARCHIVED';

  const handleStatusChange = (newStatus: string, label: string) => {
    updateStatus.mutate(
      { id: product.id, status: newStatus },
      {
        onSuccess: () => showSuccess(`Produit ${label}.`),
        onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors du changement de statut.'),
      }
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
      {/* Retour */}
      <Box sx={{ mb: 2 }}>
        <Tooltip title="Retour à la liste">
          <IconButton onClick={() => setActiveTab('products')} size="small" sx={{ border: '1px solid #E5E7EB' }}>
            <ArrowLeft size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6', p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
          {/* Image principale */}
          <Box sx={{
            width: 100, height: 100, borderRadius: 2, overflow: 'hidden',
            bgcolor: '#F3F4F6', flexShrink: 0,
            backgroundImage: product.mainImage ? `url(${getAssetUrl(product.mainImage)})` : undefined,
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {!product.mainImage && <Package size={32} style={{ color: '#D1D5DB' }} />}
          </Box>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{product.name}</Typography>
              <Chip
                label={st.label}
                size="small"
                sx={{ bgcolor: `${st.color}18`, color: st.color, fontWeight: 600, fontSize: 11 }}
              />
              {product.isFeatured && (
                <Chip label="⭐ Vedette" size="small" sx={{ bgcolor: 'rgba(123, 30, 58,0.1)', color: '#7B1E3A', fontWeight: 600, fontSize: 11 }} />
              )}
              {product.discountPrice != null && (
                <Chip label="🏷️ En promo" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 600, fontSize: 11 }} />
              )}
            </Box>
            {product.slug && (
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', mb: 0.5 }}>/{product.slug}</Typography>
            )}
            {product.store && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Store size={13} style={{ color: '#9CA3AF' }} />
                <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{product.store.name}</Typography>
              </Box>
            )}
          </Box>

          {/* Métriques rapides */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#7B1E3A' }}>{formatAmount(product.price)}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Prix</Typography>
            </Box>
            {product.discountPrice != null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>{formatAmount(product.discountPrice)}</Typography>
                <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Promo</Typography>
              </Box>
            )}
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{
                fontSize: 20, fontWeight: 700,
                color: product.stock === 0 ? '#EF4444' : product.stock < product.lowStockThreshold ? '#F59E0B' : '#10B981',
              }}>
                {product.stock}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Stock</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#8B5CF6' }}>{product.reviewCount}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Avis</Typography>
            </Box>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Pencil size={14} />}
            sx={{ borderColor: '#7B1E3A', color: '#7B1E3A', '&:hover': { borderColor: '#B34A00', bgcolor: 'transparent' } }}
            onClick={() => setActiveTab('product-edit', { productId: product.id })}
          >
            Modifier
          </Button>
          {!isActive && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle size={14} />}
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange('ACTIVE', 'activé')}
            >
              Activer
            </Button>
          )}
          {isActive && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Archive size={14} />}
              sx={{ borderColor: '#F59E0B', color: '#F59E0B', '&:hover': { borderColor: '#D97706', bgcolor: 'transparent' } }}
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange('ARCHIVED', 'archivé')}
            >
              Archiver
            </Button>
          )}
          {isArchived && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCircle size={14} />}
              sx={{ borderColor: '#10B981', color: '#10B981', '&:hover': { borderColor: '#059669', bgcolor: 'transparent' } }}
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange('ACTIVE', 'désarchivé et activé')}
            >
              Désarchiver
            </Button>
          )}
        </Box>
      </Box>

      {/* Onglets */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid #F3F4F6', px: 2,
            '& .MuiTab-root': { fontSize: 13, fontWeight: 600, textTransform: 'none', minWidth: 'auto', px: 2 },
            '& .Mui-selected': { color: '#7B1E3A' },
            '& .MuiTabs-indicator': { bgcolor: '#7B1E3A' },
          }}
        >
          <Tab label="Informations" icon={<FileText size={14} />} iconPosition="start" />
          <Tab label={`Images (${product.images.length})`} icon={<Package size={14} />} iconPosition="start" />
          <Tab label={`Avis (${product.reviewCount})`} icon={<Star size={14} />} iconPosition="start" />
          <Tab label="Promotions & Boost" icon={<Zap size={14} />} iconPosition="start" />
          <Tab label="Statistiques" icon={<BarChart2 size={14} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Informations ── */}
          {tab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Colonne gauche */}
              <Box>
                <SectionTitle>Général</SectionTitle>
                <InfoRow icon={Tag}    label="Catégorie"     value={product.category} />
                <InfoRow icon={Layers} label="Sous-catégorie" value={product.subCategory} />
                <InfoRow icon={Package} label="Marque"       value={product.brand} />
                <InfoRow icon={Package} label="État"         value={conditionMap[product.condition]} />
                <InfoRow icon={Package} label="Garantie"     value={product.warranty} />
                <InfoRow icon={Package} label="Origine"      value={product.originCountry} />

                {product.shortDescription && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Description courte
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{product.shortDescription}</Typography>
                  </>
                )}

                {product.tags.length > 0 && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>Tags</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {product.tags.map((tag: string) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      ))}
                    </Box>
                  </>
                )}
              </Box>

              {/* Colonne droite */}
              <Box>
                <SectionTitle>Prix & Stock</SectionTitle>
                <InfoRow icon={Package} label="Prix"          value={formatAmount(product.price)} />
                {product.comparePrice && (
                  <InfoRow icon={Package} label="Prix barré"  value={formatAmount(product.comparePrice)} />
                )}
                {product.discountPrice && (
                  <InfoRow icon={Package} label="Prix promo"  value={formatAmount(product.discountPrice)} />
                )}
                <InfoRow icon={Package} label="SKU"           value={product.sku} />
                <InfoRow icon={Package} label="Code-barres"   value={product.barcode} />
                <InfoRow icon={Package} label="Stock"         value={product.stock} />
                <InfoRow icon={Package} label="Seuil alerte"  value={product.lowStockThreshold} />
                <InfoRow icon={Package} label="TVA"           value={`${product.taxRate}%`} />
                {product.weight && (
                  <InfoRow icon={Package} label="Poids (kg)"  value={product.weight} />
                )}

                <Divider sx={{ my: 1.5 }} />
                <SectionTitle>Boutique</SectionTitle>
                {product.store && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                    <Avatar
                      src={product.store.logo ?? undefined}
                      variant="rounded"
                      sx={{ width: 36, height: 36, bgcolor: 'rgba(123, 30, 58,0.1)', color: '#7B1E3A', fontWeight: 700, fontSize: 13 }}
                    >
                      {product.store.name.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{product.store.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>/{product.store.slug}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ── Images ── */}
          {tab === 1 && (
            <Box>
              {product.images.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                  <Package size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <Typography>Aucune image</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {product.images.map((img: any) => (
                    <Box key={img.id} sx={{ position: 'relative' }}>
                      <Box
                        component="a"
                        href={getAssetUrl(img.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'block',
                          width: 120, height: 120, borderRadius: 2, overflow: 'hidden',
                          border: img.isPrimary ? '2px solid #7B1E3A' : '1px solid #F3F4F6',
                          backgroundImage: `url(${getAssetUrl(img.url)})`,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }}
                      />
                      {img.isPrimary && (
                        <Chip label="Principale" size="small" sx={{
                          position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                          bgcolor: '#7B1E3A', color: '#fff', fontWeight: 700, fontSize: 9,
                        }} />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {/* ── Avis ── */}
          {tab === 2 && (
            <Box>
              {product.reviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
                  <Star size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <Typography>Aucun avis</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {product.reviews.map((review: any) => (
                    <Box key={review.id} sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <Avatar
                          src={review.user.avatar ?? undefined}
                          sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#E5E7EB', color: '#374151' }}
                        >
                          {(review.user.fullName ?? review.user.email).slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{review.user.fullName || review.user.email}</Typography>
                          <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{formatDate(review.createdAt)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              style={{ color: i < review.rating ? '#F59E0B' : '#E5E7EB', fill: i < review.rating ? '#F59E0B' : '#E5E7EB' }}
                            />
                          ))}
                        </Box>
                      </Box>
                      {review.title && (
                        <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.25 }}>{review.title}</Typography>
                      )}
                      {review.content && (
                        <Typography sx={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{review.content}</Typography>
                      )}
                    </Box>
                  ))}
                  {product.reviewCount > product.reviews.length && (
                    <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', mt: 1 }}>
                      {product.reviewCount - product.reviews.length} avis supplémentaire(s) non affichés
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}

          {/* ── Promotions & Boost ── */}
          {tab === 3 && <PromotionsPanel product={product} />}

          {/* ── Statistiques ── */}
          {tab === 4 && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 3 }}>
                {[
                  { label: 'Prix de vente',  value: formatAmount(product.price),          color: '#7B1E3A' },
                  { label: 'Stock actuel',   value: product.stock,                         color: product.stock === 0 ? '#EF4444' : '#10B981' },
                  { label: 'Avis clients',   value: product.reviewCount,                   color: '#8B5CF6' },
                  { label: 'Variantes',      value: product.variantCount,                  color: '#3B82F6' },
                ].map((s) => (
                  <Box key={s.label} sx={{ textAlign: 'center', p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ p: 3, border: '1px solid #F3F4F6', borderRadius: 2, textAlign: 'center', color: '#9CA3AF' }}>
                <BarChart2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography sx={{ fontSize: 13 }}>Le détail des ventes par produit sera disponible prochainement.</Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
