'use client';

import { useState } from 'react';
import {
  Box, Typography, Avatar, Chip, Tab, Tabs, IconButton,
  Skeleton, Tooltip, Divider,
} from '@mui/material';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Shield,
  ShoppingCart, Star, Store, CheckCircle, XCircle,
  Package, Home, Banknote,
} from 'lucide-react';
import { useAdminUser } from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';

// ─── helpers ────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatAmount(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' F';
}
function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

// ─── badges ─────────────────────────────────────────────────────

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
  MOBILE_MONEY:    'Mobile Money',
  CARD:            'Carte bancaire',
  FEEXPAY_WALLET:  'FeexPay Wallet',
};

const storeStatusMap: Record<string, { label: string; color: string }> = {
  APPROVED: { label: 'Approuvée', color: '#10B981' },
  PENDING:  { label: 'En attente', color: '#F59E0B' },
  REJECTED: { label: 'Rejetée',   color: '#EF4444' },
};

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

function StatBox({ label, value, color = '#D45D00' }: { label: string; value: string | number; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color }}>{value}</Typography>
      <Typography sx={{ fontSize: 12, color: '#6B7280', mt: 0.5 }}>{label}</Typography>
    </Box>
  );
}

// ─── tab: profil ────────────────────────────────────────────────

function ProfileTab({ user }: { user: any }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 3 }}>
        <InfoRow icon={Mail}     label="Email"         value={user.email} />
        <InfoRow icon={Phone}    label="Téléphone"     value={user.phone} />
        <InfoRow icon={Calendar} label="Inscrit le"    value={formatDate(user.createdAt)} />
        <InfoRow icon={Calendar} label="Mis à jour"    value={formatDate(user.updatedAt)} />
        <InfoRow icon={Shield}   label="Email vérifié" value={user.isEmailVerified ? 'Oui' : 'Non'} />
      </Box>

      {user.addresses.length > 0 && (
        <>
          <Divider sx={{ mb: 2 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>
            Adresses de livraison ({user.addresses.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {user.addresses.map((addr: any) => (
              <Box key={addr.id} sx={{
                p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
                borderLeft: addr.isDefault ? '3px solid #D45D00' : '1px solid #F3F4F6',
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{addr.label}</Typography>
                  {addr.isDefault && (
                    <Chip label="Défaut" size="small" sx={{ bgcolor: 'rgba(212,93,0,0.1)', color: '#D45D00', fontSize: 10 }} />
                  )}
                </Box>
                <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{addr.street}</Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>{addr.city}, {addr.country}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}

      {user.reviews.length > 0 && (
        <>
          <Divider sx={{ mb: 2, mt: 2 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151', mb: 1.5 }}>
            Derniers avis ({user.stats.reviewCount})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {user.reviews.map((rev: any) => (
              <Box key={rev.id} sx={{ p: 2, border: '1px solid #F3F4F6', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#D45D00' }}>{rev.product.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Star size={13} fill="#F59E0B" color="#F59E0B" />
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{rev.rating}</Typography>
                  </Box>
                </Box>
                {rev.content && <Typography sx={{ fontSize: 13, color: '#4B5563' }}>{rev.content}</Typography>}
                <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.5 }}>{formatDate(rev.createdAt)}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

// ─── tab: commandes ─────────────────────────────────────────────

function OrdersTab({ orders, stats }: { orders: any[]; stats: any }) {
  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
        <ShoppingCart size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
        <Typography>Aucune commande</Typography>
      </Box>
    );
  }
  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
        <StatBox label="Commandes" value={stats.orderCount} color="#3B82F6" />
        <StatBox label="Total dépensé" value={formatAmount(stats.totalSpent)} color="#10B981" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {orders.map((order) => {
          const s = orderStatusMap[order.status] ?? { label: order.status, color: '#6B7280' };
          return (
            <Box key={order.id} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
              '&:hover': { bgcolor: '#F9FAFB' },
            }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#D45D00' }}>{order.orderNumber}</Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                  {order.itemCount} article{order.itemCount > 1 ? 's' : ''} · {formatDate(order.createdAt)}
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
    </Box>
  );
}

// ─── tab: paiements ─────────────────────────────────────────────

function PaymentsTab({ orders, stats }: { orders: any[]; stats: any }) {
  const paid = orders.filter((o) => o.paymentStatus === 'COMPLETED');
  const pending = orders.filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'PROCESSING');
  const failed = orders.filter((o) => o.paymentStatus === 'FAILED' || o.paymentStatus === 'REFUNDED');

  if (orders.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
        <Banknote size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
        <Typography>Aucun paiement</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Résumé */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
        <StatBox label="Payé" value={formatAmount(stats.totalSpent)} color="#10B981" />
        <StatBox label="Confirmés" value={paid.length} color="#10B981" />
        <StatBox label="En attente" value={pending.length} color="#F59E0B" />
        <StatBox label="Échoués" value={failed.length} color="#EF4444" />
      </Box>

      {/* Liste */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {orders.map((order) => {
          const ps = paymentStatusMap[order.paymentStatus] ?? { label: order.paymentStatus, color: '#6B7280' };
          const method = paymentMethodMap[order.paymentMethod] ?? order.paymentMethod;
          return (
            <Box key={order.id} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              p: 2, border: '1px solid #F3F4F6', borderRadius: 2,
              '&:hover': { bgcolor: '#F9FAFB' },
            }}>
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#D45D00' }}>{order.orderNumber}</Typography>
                <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
                  {method} · {formatDate(order.createdAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatAmount(order.total)}</Typography>
                <Chip label={ps.label} size="small" sx={{ bgcolor: `${ps.color}18`, color: ps.color, fontWeight: 600, fontSize: 11 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── tab: boutique ───────────────────────────────────────────────

function StoreTab({ store }: { store: any }) {
  if (!store) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#9CA3AF' }}>
        <Store size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
        <Typography>Aucune boutique associée</Typography>
      </Box>
    );
  }
  const s = storeStatusMap[store.status] ?? { label: store.status, color: '#6B7280' };
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar
          src={store.logo ?? undefined}
          variant="rounded"
          sx={{ width: 64, height: 64, bgcolor: 'rgba(212,93,0,0.1)', color: '#D45D00', fontWeight: 700, fontSize: 20 }}
        >
          {store.name.slice(0, 2).toUpperCase()}
        </Avatar>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>{store.name}</Typography>
            <Chip label={s.label} size="small" sx={{ bgcolor: `${s.color}18`, color: s.color, fontWeight: 600, fontSize: 11 }} />
          </Box>
          {store.slug && (
            <Typography sx={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace' }}>/{store.slug}</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 3 }}>
        <StatBox label="Produits" value={store.productCount} color="#3B82F6" />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {store.description && (
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 12, color: '#9CA3AF', mb: 0.5 }}>Description</Typography>
            <Typography sx={{ fontSize: 14 }}>{store.description}</Typography>
          </Box>
        )}
        <InfoRow icon={Package} label="Catégorie" value={store.category} />
        <InfoRow icon={MapPin} label="Localité" value={[store.city, store.country].filter(Boolean).join(', ')} />
        {store.address && <InfoRow icon={Home} label="Adresse" value={store.address} />}
        <InfoRow icon={Calendar} label="Créée le" value={formatDate(store.createdAt)} />
      </Box>
    </Box>
  );
}

// ─── main tab component ──────────────────────────────────────────

export default function UserDetailTab() {
  const { params, setActiveTab } = useAdminTab();
  const userId = params?.userId as string | undefined;
  const { data: user, isLoading } = useAdminUser(userId ?? '');
  const [tab, setTab] = useState(0);

  const isSeller = user?.role === 'SELLER';

  if (!userId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Aucun utilisateur sélectionné.</Typography>
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

  if (!user) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Utilisateur introuvable.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      {/* Retour */}
      <Box sx={{ mb: 2 }}>
        <Tooltip title="Retour à la liste">
          <IconButton
            onClick={() => setActiveTab('users')}
            size="small"
            sx={{ border: '1px solid #E5E7EB' }}
          >
            <ArrowLeft size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Header */}
      <Box sx={{
        bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6',
        p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
      }}>
        <Avatar
          src={user.avatar ?? undefined}
          sx={{ width: 72, height: 72, bgcolor: '#D45D00', fontSize: 26, fontWeight: 700 }}
        >
          {getInitials(user.fullName, user.email)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
              {user.fullName || '(Sans nom)'}
            </Typography>
            <Chip
              label={isSeller ? 'Vendeur' : 'Client'}
              size="small"
              sx={{
                bgcolor: isSeller ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                color: isSeller ? '#10B981' : '#3B82F6',
                fontWeight: 600, fontSize: 11,
              }}
            />
            <Chip
              icon={user.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
              label={user.status === 'active' ? 'Actif' : 'Inactif'}
              size="small"
              sx={{
                bgcolor: user.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(107,114,128,0.1)',
                color: user.status === 'active' ? '#10B981' : '#6B7280',
                fontWeight: 600, fontSize: 11,
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 14, color: '#6B7280' }}>{user.email}</Typography>
        </Box>

        {/* Stat rapides */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#3B82F6' }}>{user.stats.orderCount}</Typography>
            <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Commandes</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{formatAmount(user.stats.totalSpent)}</Typography>
            <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Dépensé</Typography>
          </Box>
          {isSeller && user.store && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#D45D00' }}>{user.store.productCount}</Typography>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>Produits</Typography>
            </Box>
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
            '& .Mui-selected': { color: '#D45D00' },
            '& .MuiTabs-indicator': { bgcolor: '#D45D00' },
          }}
        >
          <Tab label="Profil" icon={<Shield size={14} />} iconPosition="start" />
          <Tab label={`Commandes (${user.stats.orderCount})`} icon={<ShoppingCart size={14} />} iconPosition="start" />
          <Tab label="Paiements" icon={<Banknote size={14} />} iconPosition="start" />
          {isSeller && (
            <Tab
              label={`Boutique${user.store ? ` — ${user.store.name}` : ''}`}
              icon={<Store size={14} />}
              iconPosition="start"
            />
          )}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 && <ProfileTab user={user} />}
          {tab === 1 && <OrdersTab orders={user.orders} stats={user.stats} />}
          {tab === 2 && <PaymentsTab orders={user.orders} stats={user.stats} />}
          {tab === 3 && isSeller && <StoreTab store={user.store} />}
        </Box>
      </Box>
    </Box>
  );
}
