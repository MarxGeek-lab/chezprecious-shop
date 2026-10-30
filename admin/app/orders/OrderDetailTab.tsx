'use client';

import { useState } from 'react';
import {
  Box, Typography, Avatar, Chip, Tab, Tabs, IconButton,
  Skeleton, Tooltip, Divider,
} from '@mui/material';
import {
  ArrowLeft, ShoppingCart, MapPin, CreditCard,
  Package, Store, Receipt,
} from 'lucide-react';
import { useAdminOrder } from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';

// ─── helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}

const orderStatusMap: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente',  color: '#F59E0B' },
  PAID:       { label: 'Payé',        color: '#3B82F6' },
  PROCESSING: { label: 'En cours',    color: '#8B5CF6' },
  SHIPPED:    { label: 'Expédié',     color: '#06B6D4' },
  DELIVERED:  { label: 'Livré',       color: '#10B981' },
  CANCELLED:  { label: 'Annulé',      color: '#EF4444' },
  REFUNDED:   { label: 'Remboursé',   color: '#6B7280' },
};

const paymentStatusMap: Record<string, { label: string; color: string }> = {
  PENDING:    { label: 'En attente',  color: '#F59E0B' },
  PROCESSING: { label: 'En cours',    color: '#8B5CF6' },
  COMPLETED:  { label: 'Complété',    color: '#10B981' },
  FAILED:     { label: 'Échoué',      color: '#EF4444' },
  REFUNDED:   { label: 'Remboursé',   color: '#6B7280' },
};

const paymentMethodMap: Record<string, string> = {
  MOBILE_MONEY:   'Mobile Money',
  CARD:           'Carte bancaire',
  FEEXPAY_WALLET: 'FeexPay Wallet',
};

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

// ─── main ────────────────────────────────────────────────────────

export default function OrderDetailTab() {
  const { params, setActiveTab } = useAdminTab();
  const orderId = params?.orderId as string | undefined;
  const { data: order, isLoading } = useAdminOrder(orderId ?? '');
  const [tab, setTab] = useState(0);

  if (!orderId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Aucune commande sélectionnée.</Typography>
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

  if (!order) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Commande introuvable.</Typography>
      </Box>
    );
  }

  const os = orderStatusMap[order.status] ?? { label: order.status, color: '#6B7280' };
  const ps = paymentStatusMap[order.paymentStatus] ?? { label: order.paymentStatus, color: '#6B7280' };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      {/* Retour */}
      <Box sx={{ mb: 2 }}>
        <Tooltip title="Retour à la liste">
          <IconButton onClick={() => setActiveTab('orders')} size="small" sx={{ border: '1px solid #E5E7EB' }}>
            <ArrowLeft size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6', p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#D45D00' }}>{order.orderNumber}</Typography>
              <Chip label={os.label} size="small" sx={{ bgcolor: `${os.color}18`, color: os.color, fontWeight: 600, fontSize: 11 }} />
              <Chip label={ps.label} size="small" sx={{ bgcolor: `${ps.color}18`, color: ps.color, fontWeight: 600, fontSize: 11 }} />
            </Box>
            <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
              Passée le {formatDateTime(order.createdAt)}
              {order.paidAt && ` · Payée le ${formatDateTime(order.paidAt)}`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#D45D00' }}>{formatAmount(order.total)}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Total</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#3B82F6' }}>{order.items.length}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Article{order.items.length > 1 ? 's' : ''}</Typography>
            </Box>
          </Box>
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
            '& .Mui-selected': { color: '#D45D00' },
            '& .MuiTabs-indicator': { bgcolor: '#D45D00' },
          }}
        >
          <Tab label={`Articles (${order.items.length})`} icon={<Package size={14} />} iconPosition="start" />
          <Tab label="Client & Livraison" icon={<MapPin size={14} />} iconPosition="start" />
          <Tab label="Paiement" icon={<CreditCard size={14} />} iconPosition="start" />
          <Tab label="Récapitulatif" icon={<Receipt size={14} />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* ── Articles ── */}
          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {order.items.map((item) => (
                <Box key={item.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
                }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: 1.5, flexShrink: 0, overflow: 'hidden',
                    bgcolor: '#F3F4F6',
                    backgroundImage: item.productImage ? `url(${item.productImage})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!item.productImage && <Package size={20} style={{ color: '#D1D5DB' }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{item.productName}</Typography>
                    {item.store && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <Store size={11} style={{ color: '#9CA3AF' }} />
                        <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>{item.store.name}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatAmount(item.totalPrice)}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
                      {item.quantity} × {formatAmount(item.unitPrice)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          {/* ── Client & Livraison ── */}
          {tab === 1 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>Client</Typography>
                <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#E5E7EB', color: '#374151', fontSize: 13 }}>
                      {order.customerName.slice(0, 2).toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{order.customerName}</Typography>
                  </Box>
                  <InfoRow icon={ShoppingCart} label="Email"     value={order.customerEmail} />
                  <InfoRow icon={ShoppingCart} label="Téléphone" value={order.customerPhone} />
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>Adresse de livraison</Typography>
                <Box sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                  <InfoRow icon={MapPin} label="Adresse" value={order.shippingAddress} />
                  <InfoRow icon={MapPin} label="Ville"   value={order.shippingCity} />
                  <InfoRow icon={MapPin} label="Pays"    value={order.shippingCountry} />
                  {order.shippingNotes && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography sx={{ fontSize: 11, color: '#9CA3AF', mb: 0.25 }}>Notes</Typography>
                      <Typography sx={{ fontSize: 13, color: '#374151' }}>{order.shippingNotes}</Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* ── Paiement ── */}
          {tab === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <InfoRow icon={CreditCard} label="Méthode"    value={paymentMethodMap[order.paymentMethod] ?? order.paymentMethod} />
              <InfoRow icon={CreditCard} label="Fournisseur" value={order.paymentProvider} />
              <InfoRow icon={CreditCard} label="Référence"   value={order.paymentReference} />
              <InfoRow icon={CreditCard} label="Statut"      value={ps.label} />
              {order.paidAt && (
                <InfoRow icon={CreditCard} label="Payé le" value={formatDateTime(order.paidAt)} />
              )}
            </Box>
          )}

          {/* ── Récapitulatif ── */}
          {tab === 3 && (
            <Box sx={{ maxWidth: 400 }}>
              {[
                { label: 'Sous-total',  value: formatAmount(order.subtotal) },
                { label: 'Livraison',   value: formatAmount(order.shippingCost) },
                { label: 'Taxes',       value: formatAmount(order.tax) },
                { label: 'Réduction',   value: order.discount > 0 ? `- ${formatAmount(order.discount)}` : null },
              ].map((row) => row.value && (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F3F4F6' }}>
                  <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: 13 }}>{row.value}</Typography>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#D45D00' }}>{formatAmount(order.total)}</Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.5 }}>{order.currency}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
