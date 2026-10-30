'use client';

// ==============================================
// PAGE NOTIFICATIONS — Compte Utilisateur
// ==============================================

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Bell,
  ShoppingCart,
  MessageSquare,
  Info,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteReadNotifications,
} from '@/app/hooks/useNotifications';
import type { ApiNotification, NotificationType } from '@/app/lib/api';

// ── Helpers ─────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function groupByDay(notifications: ApiNotification[]) {
  const map = new Map<string, ApiNotification[]>();
  for (const n of notifications) {
    const d = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Aujourd'hui";
    else if (d.toDateString() === yesterday.toDateString()) label = 'Hier';
    else label = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(n);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

interface TypeConfig { icon: React.ReactNode; color: string; bg: string; label: string }

function getTypeConfig(type: NotificationType): TypeConfig {
  switch (type) {
    case 'ORDER_NEW':
    case 'ORDER_PAID':
    case 'ORDER_STATUS':
      return { icon: <ShoppingCart size={16} />, color: '#2563EB', bg: '#EFF6FF', label: 'Commande' };
    case 'MESSAGE_NEW':
      return { icon: <MessageSquare size={16} />, color: '#7C3AED', bg: '#F5F3FF', label: 'Message' };
    case 'SYSTEM':
    default:
      return { icon: <Info size={16} />, color: '#0EA5E9', bg: '#F0F9FF', label: 'Info' };
  }
}

// ── Carte notification ───────────────────────

function NotifCard({
  notif,
  onRead,
  onDelete,
}: {
  notif: ApiNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg = getTypeConfig(notif.type);

  return (
    <Box
      onClick={() => { if (!notif.isRead) onRead(notif.id); }}
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: '14px 16px',
        borderRadius: '12px',
        background: notif.isRead ? '#fff' : '#F0F9FF',
        border: `1px solid ${notif.isRead ? '#F3F4F6' : '#BAE6FD'}`,
        cursor: notif.isRead ? 'default' : 'pointer',
        position: 'relative',
        transition: 'all 0.15s',
        '&:hover': { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
      }}
    >
      {/* Pastille non-lu */}
      {!notif.isRead && (
        <Box sx={{
          position: 'absolute', top: 14, right: 14,
          width: 8, height: 8, borderRadius: '50%',
          background: '#2563EB',
          boxShadow: '0 0 0 2px #EFF6FF',
        }} />
      )}

      {/* Icône */}
      <Box sx={{
        width: 40, height: 40, borderRadius: '10px',
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: cfg.color,
      }}>
        {cfg.icon}
      </Box>

      {/* Contenu */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Chip
            label={cfg.label}
            size="small"
            sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: cfg.bg, color: cfg.color }}
          />
          <Typography sx={{ fontSize: 11, color: '#9CA3AF', ml: 'auto', flexShrink: 0 }}>
            {relativeTime(notif.createdAt)}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: notif.isRead ? 400 : 600, color: '#111827', mb: 0.25 }}>
          {notif.title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
          {notif.body}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
        {!notif.isRead && (
          <Tooltip title="Marquer comme lu">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
              sx={{ color: '#9CA3AF', '&:hover': { color: '#16A34A' } }}
            >
              <CheckCheck size={14} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Supprimer">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
            sx={{ color: '#9CA3AF', '&:hover': { color: '#DC2626' } }}
          >
            <Trash2 size={14} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ── Page ────────────────────────────────────

export default function AccountNotificationsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useNotifications({ page, limit: 20 });
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: markingAll } = useMarkAllNotificationsRead();
  const { mutate: deleteOne } = useDeleteNotification();
  const { mutate: deleteRead, isPending: deletingRead } = useDeleteReadNotifications();

  const notifications = data?.notifications ?? [];
  const meta = data?.meta;
  const unreadCount = meta?.unreadCount ?? 0;

  const groups = useMemo(() => groupByDay(notifications), [notifications]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} nouvelle${unreadCount > 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 11 }}
              />
            )}
          </Box>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            Vos alertes commandes et messages.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {unreadCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={markingAll ? <CircularProgress size={12} /> : <CheckCheck size={14} />}
              onClick={() => markAllRead()}
              disabled={markingAll}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: 12, borderColor: '#E5E7EB', color: '#374151' }}
            >
              Tout marquer lu
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={deletingRead ? <CircularProgress size={12} /> : <Trash2 size={14} />}
            onClick={() => deleteRead()}
            disabled={deletingRead}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, fontSize: 12, borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            Effacer les lues
          </Button>
        </Box>
      </Box>

      {/* Contenu */}
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={78} sx={{ borderRadius: '12px' }} />
          ))}
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2, color: '#9CA3AF' }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '14px', bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={26} strokeWidth={1.2} />
          </Box>
          <Typography sx={{ fontWeight: 600, color: '#374151' }}>Aucune notification</Typography>
          <Typography sx={{ fontSize: 13, textAlign: 'center', maxWidth: 300 }}>
            Les mises à jour de vos commandes et messages apparaîtront ici.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {groups.map((group) => (
            <Box key={group.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {group.label}
                </Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {group.items.map((notif) => (
                  <NotifCard
                    key={notif.id}
                    notif={notif}
                    onRead={(id) => markRead(id)}
                    onDelete={(id) => deleteOne(id)}
                  />
                ))}
              </Box>
            </Box>
          ))}

          {meta && meta.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, pt: 1 }}>
              <Button size="small" variant="outlined" disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#E5E7EB', color: '#374151' }}>
                Précédent
              </Button>
              <Typography sx={{ fontSize: 13, color: '#6B7280', alignSelf: 'center' }}>
                {page} / {meta.totalPages}
              </Typography>
              <Button size="small" variant="outlined" disabled={page >= meta.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#E5E7EB', color: '#374151' }}>
                Suivant
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
