'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, IconButton, Switch, Tabs, Tab,
  Avatar, Pagination, CircularProgress, TextField, Select, MenuItem,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, useMediaQuery, useTheme,
} from '@mui/material';
import {
  Bell, CheckCheck, Trash2, ShoppingCart, UserPlus, AlertTriangle,
  Star, Package, MessageSquare, CreditCard, Shield, Info, Send,
} from 'lucide-react';
import {
  useAdminNotifications,
  useAdminSendNotification,
  type AdminNotification,
} from '@/src/hooks/useAdminData';
import styles from '@/src/styles/pages.module.scss';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ORDER_NEW:     { label: 'Nouvelle commande', icon: ShoppingCart, color: '#0F5C4A', bg: 'rgba(15, 92, 74, 0.1)' },
  ORDER_PAID:    { label: 'Commande payée',    icon: CreditCard,   color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  ORDER_STATUS:  { label: 'Statut commande',   icon: Package,      color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  REVIEW_NEW:    { label: 'Nouvel avis',        icon: Star,         color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  MESSAGE_NEW:   { label: 'Nouveau message',    icon: MessageSquare,color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  STOCK_LOW:     { label: 'Stock faible',       icon: AlertTriangle,color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  BOOST_APPROVED:{ label: 'Boost approuvé',     icon: Star,         color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  BOOST_EXPIRED: { label: 'Boost expiré',       icon: AlertTriangle,color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  SYSTEM:        { label: 'Système',            icon: Info,         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
};

const notifSettings = [
  { label: 'Nouvelles commandes',   description: 'Notification à chaque nouvelle commande',           enabled: true },
  { label: 'Inscriptions vendeurs', description: "Quand un nouveau vendeur s'inscrit",                enabled: true },
  { label: 'Stock faible',          description: 'Alerte quand le stock est inférieur au seuil',       enabled: true },
  { label: 'Avis négatifs',         description: 'Avis ≤ 2 étoiles nécessitant modération',           enabled: true },
  { label: 'Paiements échoués',     description: 'Quand un paiement est refusé',                      enabled: false },
  { label: 'Alertes sécurité',      description: 'Connexions suspectes et menaces',                   enabled: true },
];

function NotifRow({ notif }: { notif: AdminNotification }) {
  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'flex-start', gap: 2, p: 2,
        borderRadius: '12px',
        bgcolor: notif.isRead ? 'transparent' : 'rgba(15, 92, 74, 0.03)',
        borderLeft: notif.isRead ? '3px solid transparent' : '3px solid #0F5C4A',
        transition: 'all 0.2s',
        '&:hover': { bgcolor: '#F9FAFB' },
      }}
    >
      <Box sx={{
        width: 40, height: 40, minWidth: 40, borderRadius: '10px',
        bgcolor: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={cfg.color} />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: notif.isRead ? 500 : 700, fontSize: 14, color: '#1A1A2E' }}>
            {notif.title}
          </Typography>
          {!notif.isRead && (
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0F5C4A', flexShrink: 0 }} />
          )}
        </Box>
        <Typography sx={{ fontSize: 13, color: '#6B7280', mb: 0.5 }}>{notif.body}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
            {new Date(notif.createdAt).toLocaleString('fr-FR')}
          </Typography>
          {notif.user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Avatar src={notif.user.avatar ?? undefined} sx={{ width: 16, height: 16, fontSize: 9, bgcolor: '#0F5C4A' }}>
                {(notif.user.fullName ?? notif.user.email).charAt(0).toUpperCase()}
              </Avatar>
              <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
                {notif.user.fullName ?? notif.user.email}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function NotificationsTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState(notifSettings);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [filterRead, setFilterRead] = useState('');

  // Send dialog
  const [sendOpen, setSendOpen] = useState(false);
  const [sendUserId, setSendUserId] = useState('');
  const [sendType, setSendType] = useState('SYSTEM');
  const [sendTitle, setSendTitle] = useState('');
  const [sendBody, setSendBody] = useState('');

  const { data, isLoading } = useAdminNotifications({
    page,
    limit: 20,
    type: filterType || undefined,
    read: filterRead || undefined,
  });

  const { mutate: sendNotification, isPending: isSending } = useAdminSendNotification();

  const toggleSetting = (index: number) => {
    setSettings((prev) => prev.map((s, i) => i === index ? { ...s, enabled: !s.enabled } : s));
  };

  function handleSend() {
    if (!sendTitle || !sendBody) return;
    sendNotification(
      { userId: sendUserId || undefined, type: sendType, title: sendTitle, body: sendBody },
      {
        onSuccess: () => {
          setSendOpen(false);
          setSendTitle('');
          setSendBody('');
          setSendUserId('');
          setSendType('SYSTEM');
        },
      }
    );
  }

  const unread = data?.meta.unread ?? 0;
  const total  = data?.meta.total  ?? 0;

  return (
    <Box>
      <Box className={styles.statsRow} sx={{ gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' } }}>
        {[
          { icon: Bell,      label: 'Non lues',          value: isLoading ? '…' : unread.toString(), color: '#0F5C4A', bg: 'rgba(15, 92, 74, 0.1)' },
          { icon: CheckCheck,label: 'Total notifications',value: isLoading ? '…' : total.toString(),  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: AlertTriangle, label: 'Alertes critiques', value: isLoading ? '…' : (data?.notifications.filter((n) => n.type === 'STOCK_LOW').length ?? 0).toString(), color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} sx={{ bgcolor: stat.bg }}>
              <stat.icon size={20} color={stat.color} />
            </Box>
            <Box>
              <Typography className={styles.statValue}>{stat.value}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className={styles.card}>
        <Tabs
          value={tab} onChange={(_, v) => setTab(v)}
          sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }, '& .Mui-selected': { color: '#0F5C4A' }, '& .MuiTabs-indicator': { bgcolor: '#0F5C4A' } }}
        >
          <Tab label={`Notifications (${unread} non lues)`} />
          <Tab label="Paramètres" />
        </Tabs>

        {tab === 0 && (
          <>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type" value={filterType}
                  onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Statut</InputLabel>
                <Select
                  label="Statut" value={filterRead}
                  onChange={(e) => { setFilterRead(e.target.value); setPage(1); }}
                  sx={{ borderRadius: '10px' }}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="false">Non lues</MenuItem>
                  <MenuItem value="true">Lues</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
                <Button
                  variant="contained" size="small" startIcon={<Send size={16} />}
                  onClick={() => setSendOpen(true)}
                  fullWidth={isMobile}
                  sx={{
                    bgcolor: '#0F5C4A', '&:hover': { bgcolor: '#0A4638' },
                    textTransform: 'none', borderRadius: '10px',
                  }}
                >
                  Envoyer une notification
                </Button>
              </Box>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#0F5C4A' }} />
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {data?.notifications.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4, color: '#9CA3AF' }}>
                      <Bell size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                      <Typography>Aucune notification</Typography>
                    </Box>
                  )}
                  {data?.notifications.map((notif) => (
                    <NotifRow key={notif.id} notif={notif} />
                  ))}
                </Box>

                {data && data.meta.totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={data.meta.totalPages} page={page}
                      onChange={(_, v) => setPage(v)}
                      shape="rounded"
                      sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#0F5C4A', color: '#fff' } }}
                    />
                  </Box>
                )}
              </>
            )}
          </>
        )}

        {tab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {settings.map((setting, i) => (
              <Box
                key={setting.label}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  p: 2, borderRadius: '12px', '&:hover': { bgcolor: '#F9FAFB' },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#1A1A2E' }}>
                    {setting.label}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
                    {setting.description}
                  </Typography>
                </Box>
                <Switch
                  checked={setting.enabled}
                  onChange={() => toggleSetting(i)}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0F5C4A' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#0F5C4A' } }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialog: envoyer notification */}
      <Dialog open={sendOpen} onClose={() => setSendOpen(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>Envoyer une notification</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="ID utilisateur (laisser vide pour broadcast)"
            size="small" fullWidth
            value={sendUserId}
            onChange={(e) => setSendUserId(e.target.value)}
            placeholder="uuid de l'utilisateur ou vide"
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={sendType} onChange={(e) => setSendType(e.target.value)}>
              {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Titre" size="small" fullWidth required
            value={sendTitle} onChange={(e) => setSendTitle(e.target.value)}
          />
          <TextField
            label="Message" size="small" fullWidth required multiline rows={3}
            value={sendBody} onChange={(e) => setSendBody(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSendOpen(false)} sx={{ textTransform: 'none' }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isSending || !sendTitle || !sendBody}
            sx={{ bgcolor: '#0F5C4A', '&:hover': { bgcolor: '#0A4638' }, textTransform: 'none' }}
          >
            {isSending ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Envoyer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
