'use client';

import { useState } from 'react';
import {
  Box, Typography, Avatar, Chip, Tab, Tabs, IconButton,
  Skeleton, Tooltip, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Package,
  ShoppingCart, CheckCircle, XCircle, Ban,
  FileText, Building2, CreditCard, Banknote, AlertTriangle,
} from 'lucide-react';
import {
  useAdminSeller, useUpdateSellerStatus, useToggleSellerActive,
} from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';

// ─── helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

// ─── badges ─────────────────────────────────────────────────────

const storeStatusMap: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Approuvée', color: '#10B981' },
  PENDING:  { label: 'En attente', color: '#F59E0B' },
  REJECTED: { label: 'Rejetée / Suspendue', color: '#EF4444' },
};

const orderStatusMap: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente',  color: '#F59E0B' },
  PAID:       { label: 'Payé',        color: '#3B82F6' },
  PROCESSING: { label: 'En cours',    color: '#8B5CF6' },
  SHIPPED:    { label: 'Expédié',     color: '#06B6D4' },
  DELIVERED:  { label: 'Livré',       color: '#10B981' },
  CANCELLED:  { label: 'Annulé',      color: '#EF4444' },
  REFUNDED:   { label: 'Remboursé',   color: '#6B7280' },
};

const productStatusMap: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Actif',    color: '#10B981' },
  DRAFT:    { label: 'Brouillon', color: '#F59E0B' },
  INACTIVE: { label: 'Inactif',  color: '#6B7280' },
  ARCHIVED: { label: 'Archivé',  color: '#9CA3AF' },
};

// ─── modal rejet avec raison ─────────────────────────────────────

function RejectModal({ sellerId, sellerName, onClose }: { sellerId: string; sellerName: string; onClose: () => void }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const updateStatus = useUpdateSellerStatus();
  const { showSuccess, showError } = useSnackbar();

  const handleReject = async () => {
    if (!reason.trim()) { setError('La raison est requise.'); return; }
    setError('');
    try {
      await updateStatus.mutateAsync({ id: sellerId, status: 'REJECTED', reason });
      showSuccess(`Boutique ${sellerName} rejetée. Email envoyé au vendeur.`);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Erreur lors du rejet.';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={isMobile}>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#EF4444' }}>Rejeter la boutique</DialogTitle>
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

// ─── sub-components ─────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
      <Box sx={{ color: '#9CA3AF', mt: '2px' }}><Icon size={16} /></Box>
      <Box>
        <Typography sx={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{value || '—'}</Typography>
      </Box>
    </Box>
  );
}

function StatBox({ label, value, color = '#7B1E3A' }: { label: string; value: string | number; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      p: 1.5, border: '1px solid #F3F4F6', borderRadius: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileText size={16} style={{ color: '#9CA3AF' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{label}</Typography>
      </Box>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Chip label="Voir" size="small" sx={{ bgcolor: 'rgba(123, 30, 58,0.1)', color: '#7B1E3A', fontWeight: 600, cursor: 'pointer' }} />
        </a>
      ) : (
        <Chip label="Non fourni" size="small" sx={{ bgcolor: '#F3F4F6', color: '#9CA3AF' }} />
      )}
    </Box>
  );
}

// ─── tabs ────────────────────────────────────────────────────────

function InfoTab({ seller }: { seller: any }) {
  return (
    <Box>
      {/* Infos boutique */}
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>Informations boutique</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
        <InfoRow icon={Package}   label="Catégorie"  value={seller.category} />
        <InfoRow icon={MapPin}    label="Localité"   value={[seller.city, seller.country].filter(Boolean).join(', ')} />
        {seller.address && <InfoRow icon={MapPin} label="Adresse" value={seller.address} />}
        <InfoRow icon={Calendar}  label="Créée le"   value={formatDate(seller.createdAt)} />
        <InfoRow icon={CreditCard} label="Devise"    value={seller.currency} />
        {seller.deliveryZones.length > 0 && (
          <InfoRow icon={MapPin} label="Zones livraison" value={seller.deliveryZones.join(', ')} />
        )}
      </Box>

      {seller.description && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 0.5 }}>Description</Typography>
          <Typography sx={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>{seller.description}</Typography>
        </>
      )}

      {/* Propriétaire */}
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>Propriétaire</Typography>
      <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar
            src={seller.owner.avatar ?? undefined}
            sx={{ width: 40, height: 40, bgcolor: '#7B1E3A', fontSize: 14, fontWeight: 700 }}
          >
            {(seller.owner.fullName ?? seller.owner.email).slice(0, 2).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{seller.owner.fullName || '—'}</Typography>
            <Chip
              label={seller.owner.status === 'active' ? 'Actif' : 'Inactif'}
              size="small"
              sx={{
                bgcolor: seller.owner.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                color: seller.owner.status === 'active' ? '#10B981' : '#6B7280',
                fontWeight: 600, fontSize: 10,
              }}
            />
          </Box>
        </Box>
        <InfoRow icon={Mail}  label="Email"     value={seller.owner.email} />
        <InfoRow icon={Phone} label="Téléphone" value={seller.owner.phone} />
        <InfoRow icon={Calendar} label="Inscrit le" value={formatDate(seller.owner.createdAt)} />
      </Box>

      {/* Motif de rejet (dans l'onglet info) */}
      {seller.rejectionReason && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#EF4444', mb: 1 }}>Motif du dernier rejet</Typography>
          <Box sx={{ p: 1.5, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid #FECACA' }}>
            <Typography sx={{ fontSize: 13, color: '#7F1D1D' }}>{seller.rejectionReason}</Typography>
          </Box>
        </>
      )}

      {/* Documents */}
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>Documents soumis</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <DocLink label="SIRET / Registre de commerce" url={seller.siretDocument} />
        <DocLink label="RCCM" url={seller.rccmDocument} />
        <DocLink label="Pièce d'identité" url={seller.idDocument} />
      </Box>
    </Box>
  );
}

function ProductsTab({ products, stats }: { products: any[]; stats: any }) {
  if (products.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
        <Package size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
        <Typography>Aucun produit</Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
        <StatBox label="Total produits" value={stats.productCount} color="#3B82F6" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {products.map((product) => {
          const ps = productStatusMap[product.status] ?? { label: product.status, color: '#6B7280' };
          return (
            <Box key={product.id} sx={{
              display: 'flex', alignItems: 'center', gap: 2,
              p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
              '&:hover': { bgcolor: '#F9FAFB' },
            }}>
              <Box
                sx={{
                  width: 44, height: 44, borderRadius: 1.5, overflow: 'hidden',
                  bgcolor: '#F3F4F6', flexShrink: 0,
                  backgroundImage: product.mainImage ? `url(${product.mainImage})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {product.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                  Stock: {product.stock}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{formatAmount(product.price)}</Typography>
                <Chip label={ps.label} size="small" sx={{ bgcolor: `${ps.color}18`, color: ps.color, fontWeight: 600, fontSize: 10 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
      {stats.productCount > products.length && (
        <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', mt: 2 }}>
          {stats.productCount - products.length} produit(s) supplémentaire(s) non affichés
        </Typography>
      )}
    </Box>
  );
}

function OrdersTab({ orders, stats }: { orders: any[]; stats: any }) {
  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
        <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
        <Typography>Aucune commande reçue</Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
        <StatBox label="Commandes" value={stats.orderCount} color="#3B82F6" />
        <StatBox label="Chiffre d'affaires" value={formatAmount(stats.totalRevenue)} color="#10B981" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {orders.map((order) => {
          const s = orderStatusMap[order.status] ?? { label: order.status, color: '#6B7280' };
          return (
            <Box key={order.orderId} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
              '&:hover': { bgcolor: '#F9FAFB' },
            }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#7B1E3A' }}>{order.orderNumber}</Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                  {order.customerName || order.customerEmail} · {formatDate(order.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatAmount(order.total)}</Typography>
                <Chip label={s.label} size="small" sx={{ bgcolor: `${s.color}18`, color: s.color, fontWeight: 600, fontSize: 11 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
      {stats.orderCount > orders.length && (
        <Typography sx={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', mt: 2 }}>
          {stats.orderCount - orders.length} commande(s) supplémentaire(s) non affichées
        </Typography>
      )}
    </Box>
  );
}

// ─── main component ──────────────────────────────────────────────

export default function SellerDetailTab() {
  const { params, setActiveTab } = useAdminTab();
  const sellerId = params?.sellerId as string | undefined;
  const { data: seller, isLoading } = useAdminSeller(sellerId ?? '');
  const [tab, setTab] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const updateStatus = useUpdateSellerStatus();
  const toggleActive = useToggleSellerActive();
  const { showSuccess, showError } = useSnackbar();

  if (!sellerId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Aucune boutique sélectionnée.</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rounded" height={140} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (!seller) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Boutique introuvable.</Typography>
      </Box>
    );
  }

  const st = storeStatusMap[seller.status] ?? { label: seller.status, color: '#6B7280' };
  const isApproved = seller.status === 'APPROVED';
  const isPending = seller.status === 'PENDING';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      {showRejectModal && (
        <RejectModal sellerId={seller.id} sellerName={seller.name} onClose={() => setShowRejectModal(false)} />
      )}

      {/* Retour */}
      <Box sx={{ mb: 2 }}>
        <Tooltip title="Retour à la liste">
          <IconButton onClick={() => setActiveTab('sellers')} size="small" sx={{ border: '1px solid #E5E7EB' }}>
            <ArrowLeft size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header card */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6',
        p: 3, mb: 3,
      }}>
        {/* Banner */}
        {seller.banner && (
          <Box sx={{
            height: 120, borderRadius: 2, mb: 2, overflow: 'hidden',
            backgroundImage: `url(${seller.banner})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}

        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, flexWrap: 'wrap' }}>
          <Avatar
            src={seller.logo ?? undefined}
            variant="rounded"
            sx={{ width: 72, height: 72, bgcolor: 'rgba(123, 30, 58,0.1)', color: '#7B1E3A', fontWeight: 700, fontSize: 22 }}
          >
            {seller.name.slice(0, 2).toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{seller.name}</Typography>
              <Chip
                label={st.label}
                size="small"
                sx={{ bgcolor: `${st.color}18`, color: st.color, fontWeight: 600, fontSize: 11 }}
              />
            </Box>
            {seller.slug && (
              <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', mb: 0.5 }}>/{seller.slug}</Typography>
            )}
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
              {seller.owner.fullName || seller.owner.email} · {seller.owner.email}
            </Typography>
          </Box>

          {/* Stats rapides */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>{seller.stats.productCount}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Produits</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#8B5CF6' }}>{seller.stats.orderCount}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Commandes</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{formatAmount(seller.stats.totalRevenue)}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>CA total</Typography>
            </Box>
          </Box>
        </Box>

        {/* Motif de rejet */}
        {seller.status === 'REJECTED' && seller.rejectionReason && (
          <Box sx={{
            display: 'flex', alignItems: 'flex-start', gap: 1,
            mt: 2, p: 1.5, bgcolor: '#FEF2F2', borderRadius: 2,
            border: '1px solid #FECACA',
          }}>
            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#EF4444', mb: 0.25 }}>Motif du rejet</Typography>
              <Typography sx={{ fontSize: 13, color: '#7F1D1D' }}>{seller.rejectionReason}</Typography>
            </Box>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2.5, flexWrap: 'wrap' }}>
          {isPending && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle size={14} />}
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate(
                { id: seller.id, status: 'APPROVED' },
                {
                  onSuccess: () => showSuccess(`Boutique ${seller.name} approuvée. Email envoyé au vendeur.`),
                  onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors de l\'approbation.'),
                }
              )}
            >
              Approuver
            </Button>
          )}
          {(isPending || isApproved) && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<XCircle size={14} />}
              onClick={() => setShowRejectModal(true)}
            >
              Rejeter
            </Button>
          )}
          {!isPending && (
            <Button
              variant="outlined"
              size="small"
              startIcon={isApproved ? <Ban size={14} /> : <CheckCircle size={14} />}
              sx={{
                borderColor: isApproved ? '#EF4444' : '#10B981',
                color: isApproved ? '#EF4444' : '#10B981',
                '&:hover': { borderColor: isApproved ? '#DC2626' : '#059669', bgcolor: 'transparent' },
              }}
              disabled={toggleActive.isPending}
              onClick={() => toggleActive.mutate(seller.id, {
                onSuccess: () => showSuccess(isApproved ? `Boutique ${seller.name} désactivée.` : `Boutique ${seller.name} réactivée.`),
                onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors du changement de statut.'),
              })}
            >
              {isApproved ? 'Désactiver' : 'Réactiver'}
            </Button>
          )}
          {seller.status === 'REJECTED' && (
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle size={14} />}
              sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate(
                { id: seller.id, status: 'APPROVED' },
                {
                  onSuccess: () => showSuccess(`Boutique ${seller.name} réapprouvée. Email envoyé au vendeur.`),
                  onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors de la réapprobation.'),
                }
              )}
            >
              Réapprouver
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
          <Tab label="Informations" icon={<Building2 size={14} />} iconPosition="start" />
          <Tab label={`Produits (${seller.stats.productCount})`} icon={<Package size={14} />} iconPosition="start" />
          <Tab label={`Commandes (${seller.stats.orderCount})`} icon={<ShoppingCart size={14} />} iconPosition="start" />
          <Tab label="Revenus" icon={<Banknote size={14} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && <InfoTab seller={seller} />}
          {tab === 1 && <ProductsTab products={seller.products} stats={seller.stats} />}
          {tab === 2 && <OrdersTab orders={seller.recentOrders} stats={seller.stats} />}
          {tab === 3 && (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 2, mb: 3 }}>
                <StatBox label="Chiffre d'affaires" value={formatAmount(seller.stats.totalRevenue)} color="#10B981" />
                <StatBox label="Commandes reçues" value={seller.stats.orderCount} color="#3B82F6" />
              </Box>
              <Box sx={{ p: 3, border: '1px solid #F3F4F6', borderRadius: 2, textAlign: 'center', color: '#9CA3AF' }}>
                <Banknote size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <Typography sx={{ fontSize: 13 }}>
                  Le détail des versements sera disponible prochainement.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
