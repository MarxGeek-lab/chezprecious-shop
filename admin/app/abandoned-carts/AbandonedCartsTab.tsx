'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, InputBase,
  Select, MenuItem, FormControl, Tooltip, Pagination,
  Skeleton, Chip, CircularProgress,
} from '@mui/material';
import {
  Search, Send, SendHorizonal, ShoppingCart, CheckCircle,
  Clock, Mail, RefreshCw,
} from 'lucide-react';
import {
  useAdminAbandonedCarts,
  useAdminSendCartReminder,
  useAdminSendAllReminders,
  type AdminAbandonedCart,
} from '@/src/hooks/useAdminData';
import { useSnackbar } from '@/src/context/SnackbarContext';
import styles from '@/src/styles/pages.module.scss';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatAmount(val: string | number) {
  return Number(val).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' });
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <Box sx={{
      background: '#fff', borderRadius: '12px', padding: '20px 24px',
      border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <Box sx={{ width: 44, height: 44, borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</Typography>
        <Typography sx={{ fontSize: 13, color: '#6B7280', mt: 0.3 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function ReminderStatus({ cart }: { cart: AdminAbandonedCart }) {
  if (cart.isRecovered) {
    return <Chip label="Récupéré" size="small" sx={{ background: '#D1FAE5', color: '#065F46', fontWeight: 600, fontSize: 11 }} />;
  }
  if (cart.secondReminderSentAt) {
    return <Chip label="2 relances" size="small" sx={{ background: '#FEF3C7', color: '#92400E', fontWeight: 600, fontSize: 11 }} />;
  }
  if (cart.firstReminderSentAt) {
    return <Chip label="1 relance" size="small" sx={{ background: '#DBEAFE', color: '#1E40AF', fontWeight: 600, fontSize: 11 }} />;
  }
  return <Chip label="Aucune relance" size="small" sx={{ background: '#F3F4F6', color: '#6B7280', fontWeight: 600, fontSize: 11 }} />;
}

function CartRow({ cart, onSendReminder, sending }: {
  cart: AdminAbandonedCart;
  onSendReminder: (id: string, reminder: 1 | 2) => void;
  sending: boolean;
}) {
  const nextReminder: 1 | 2 = cart.firstReminderSentAt ? 2 : 1;
  const canSend = !cart.isRecovered && !cart.secondReminderSentAt;

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: '1fr 120px 90px 90px 140px 130px',
      alignItems: 'center',
      gap: 2,
      padding: '14px 20px',
      borderBottom: '1px solid #F3F4F6',
      '&:hover': { background: '#FAFAFA' },
    }}>
      {/* Email + nom */}
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{cart.email}</Typography>
        {cart.firstName && (
          <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{cart.firstName}</Typography>
        )}
      </Box>

      {/* Montant */}
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
        {formatAmount(cart.cartTotal)}
      </Typography>

      {/* Articles */}
      <Typography sx={{ fontSize: 13, color: '#6B7280', textAlign: 'center' }}>
        {cart.itemCount} article{cart.itemCount > 1 ? 's' : ''}
      </Typography>

      {/* Statut relances */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <ReminderStatus cart={cart} />
      </Box>

      {/* Date abandon */}
      <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>
        {formatDate(cart.abandonedAt)}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {canSend ? (
          <Tooltip title={`Envoyer relance ${nextReminder}`}>
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={sending ? <CircularProgress size={12} /> : <Send size={13} />}
                disabled={sending}
                onClick={() => onSendReminder(cart.id, nextReminder)}
                sx={{
                  fontSize: 11, fontWeight: 600, textTransform: 'none',
                  borderColor: '#FF2C2C', color: '#FF2C2C',
                  '&:hover': { background: '#FFF5F5', borderColor: '#FF2C2C' },
                }}
              >
                Relance {nextReminder}
              </Button>
            </span>
          </Tooltip>
        ) : (
          <Tooltip title={cart.isRecovered ? 'Commande passée' : 'Toutes les relances envoyées'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#9CA3AF', fontSize: 12 }}>
              <CheckCircle size={14} />
              <span>{cart.isRecovered ? 'Converti' : 'Terminé'}</span>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}

export default function AbandonedCartsTab() {
  const { showSuccess, showError } = useSnackbar();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAdminAbandonedCarts({ page, limit: 20, status, search });
  const sendReminder = useAdminSendCartReminder();
  const sendAll = useAdminSendAllReminders();

  const carts = data?.data ?? [];
  const meta  = data?.meta;
  const stats = data?.stats;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSendReminder = async (id: string, reminder: 1 | 2) => {
    setSendingId(id);
    try {
      await sendReminder.mutateAsync({ id, reminder });
      showSuccess(`Relance ${reminder} envoyée avec succès`);
    } catch {
      showError('Erreur lors de l\'envoi');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendAll = async () => {
    try {
      const res = await sendAll.mutateAsync();
      showSuccess(`${res.sent} relance(s) envoyée(s)`);
    } catch {
      showError('Erreur lors de l\'envoi groupé');
    }
  };

  return (
    <Box sx={{ padding: { xs: '16px', md: '32px' }, maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <Box className={styles.pageHeader}>
        <Box className={styles.pageHeaderLeft}>
          <Typography className={styles.pageTitle}>Paniers abandonnés</Typography>
          <Typography className={styles.pageSubtitle}>
            Suivez et relancez les clients n'ayant pas finalisé leur commande
          </Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Tooltip title="Actualiser">
            <IconButton onClick={() => refetch()} size="small">
              <RefreshCw size={16} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={sendAll.isPending ? <CircularProgress size={14} color="inherit" /> : <SendHorizonal size={16} />}
            disabled={sendAll.isPending}
            onClick={handleSendAll}
            sx={{
              background: '#FF2C2C', fontWeight: 600, textTransform: 'none',
              borderRadius: '8px', fontSize: 13,
              '&:hover': { background: '#D41E1E' },
            }}
          >
            Relancer tous les paniers en attente
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 4 }}>
        <StatCard label="Total paniers" value={stats?.total ?? '—'} icon={<ShoppingCart size={20} />} color="#6366F1" />
        <StatCard label="En attente" value={stats?.pending ?? '—'} icon={<Clock size={20} />} color="#FF2C2C" />
        <StatCard label="Récupérés" value={stats?.recovered ?? '—'} icon={<CheckCircle size={20} />} color="#10B981" />
        <StatCard label="Panier moyen" value={stats ? formatAmount(stats.avgCartTotal) : '—'} icon={<Mail size={20} />} color="#8B5CF6" />
      </Box>

      {/* Toolbar */}
      <Box className={styles.card}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche email */}
          <Box component="form" onSubmit={handleSearch} sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            background: '#F9FAFB', borderRadius: '8px', padding: '8px 14px',
            border: '1px solid #E5E7EB', flex: 1, minWidth: 240,
          }}>
            <Search size={16} color="#9CA3AF" />
            <InputBase
              placeholder="Rechercher par email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>

          {/* Filtre statut */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              sx={{ fontSize: 13, borderRadius: '8px' }}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="recovered">Récupérés</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table header */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 90px 90px 140px 130px',
          gap: 2, padding: '10px 20px',
          background: '#F9FAFB', borderRadius: '8px',
          marginBottom: '4px',
        }}>
          {['Email / Nom', 'Montant', 'Articles', 'Statut', 'Abandonné le', 'Actions'].map((h) => (
            <Typography key={h} sx={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={52} sx={{ mb: '2px', borderRadius: '4px' }} />
          ))
        ) : carts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: '#9CA3AF' }}>
            <ShoppingCart size={40} strokeWidth={1} />
            <Typography sx={{ mt: 2, fontSize: 14 }}>Aucun panier abandonné trouvé</Typography>
          </Box>
        ) : (
          carts.map((cart) => (
            <CartRow
              key={cart.id}
              cart={cart}
              onSendReminder={handleSendReminder}
              sending={sendingId === cart.id}
            />
          ))
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
            <Pagination
              count={meta.totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              sx={{ '& .MuiPaginationItem-root': { fontWeight: 600 } }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
