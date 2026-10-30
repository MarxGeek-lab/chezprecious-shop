'use client';

import { useState } from 'react';
import {
  Box, Typography, Select, MenuItem, Pagination,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Avatar, InputLabel, FormControl,
} from '@mui/material';
import { ClipboardList } from 'lucide-react';
import { useActivityLogs } from '@/src/hooks/useAdminData';
import styles from '@/src/styles/pages.module.scss';

// ── Action → couleur ──────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOGIN:                { label: 'Connexion',       color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  UPDATE_USER:          { label: 'Modifier user',   color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  DELETE_USER:          { label: 'Supp. user',      color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  TOGGLE_USER_ACTIVE:   { label: 'Toggle user',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  APPROVE_SELLER:       { label: 'Approuver vend.', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  REJECT_SELLER:        { label: 'Rejeter vend.',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  UPDATE_SELLER_STATUS: { label: 'Statut vend.',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  TOGGLE_SELLER_ACTIVE: { label: 'Toggle vend.',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  UPDATE_PRODUCT_STATUS:{ label: 'Statut produit',  color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  DELETE_PRODUCT:       { label: 'Supp. produit',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  FEATURE_PRODUCT:      { label: 'Vedette produit', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  CREATE_CATEGORY:      { label: 'Créer catégorie', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  UPDATE_CATEGORY:      { label: 'Modif. catégorie',color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  DELETE_CATEGORY:      { label: 'Supp. catégorie', color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  APPROVE_BOOST:        { label: 'Approuver boost', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  REJECT_BOOST:         { label: 'Rejeter boost',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  SEND_MESSAGE:         { label: 'Message envoyé',  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  INVITE_ADMIN:         { label: 'Inviter admin',   color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  DELETE_ADMIN:         { label: 'Supp. admin',     color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  },
  TOGGLE_ADMIN_ACTIVE:  { label: 'Toggle admin',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  RESEND_ADMIN_SETUP:   { label: 'Renvoyer setup',  color: '#6B7280', bg: 'rgba(107,114,128,0.12)'},
  UPDATE_SETTINGS:      { label: 'Paramètres',      color: '#6B7280', bg: 'rgba(107,114,128,0.12)'},
};

function getActionChip(action: string) {
  const cfg = ACTION_CONFIG[action];
  if (cfg) {
    return (
      <Chip
        label={cfg.label}
        size="small"
        sx={{ backgroundColor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 11, border: `1px solid ${cfg.color}33` }}
      />
    );
  }
  return <Chip label={action} size="small" sx={{ fontSize: 11 }} />;
}

function getRoleLabel(role: string | null) {
  if (!role) return '';
  if (role === 'SUPER_ADMIN') return 'Super Admin';
  if (role === 'ADMIN') return 'Admin';
  if (role === 'MODERATOR') return 'Modérateur';
  return role;
}

function getInitials(email: string | null) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

const ACTIONS = Object.keys(ACTION_CONFIG);
const ENTITIES = ['user', 'seller', 'product', 'category', 'boost', 'admin'];

export default function ActivityTab() {
  const [page, setPage]       = useState(1);
  const [action, setAction]   = useState('');
  const [entity, setEntity]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const { data, isLoading } = useActivityLogs({
    page,
    limit: 25,
    action: action || undefined,
    entity: entity || undefined,
    from:   from   || undefined,
    to:     to     || undefined,
  });

  const logs  = data?.data ?? [];
  const meta  = data?.meta;

  const handleFilter = () => setPage(1);

  return (
    <Box className={styles.pageContainer}>
      {/* Header */}
      <Box className={styles.pageHeader}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <ClipboardList size={22} color="#FF2C2C" />
            <Typography className={styles.pageTitle}>Journal d&apos;activité</Typography>
          </Box>
          <Typography className={styles.pageSubtitle}>
            {meta ? `${meta.total.toLocaleString('fr-FR')} événement(s) enregistré(s)` : 'Historique des actions administrateurs'}
          </Typography>
        </Box>
      </Box>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' } }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action</InputLabel>
          <Select
            value={action}
            label="Action"
            onChange={(e) => { setAction(e.target.value); handleFilter(); }}
          >
            <MenuItem value="">Toutes les actions</MenuItem>
            {ACTIONS.map((a) => (
              <MenuItem key={a} value={a}>{ACTION_CONFIG[a]?.label ?? a}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Entité</InputLabel>
          <Select
            value={entity}
            label="Entité"
            onChange={(e) => { setEntity(e.target.value); handleFilter(); }}
          >
            <MenuItem value="">Toutes</MenuItem>
            {ENTITIES.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">Du</Typography>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); handleFilter(); }}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
          />
          <Typography variant="body2" color="text.secondary">au</Typography>
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); handleFilter(); }}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
          />
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#6B7280' }}>DATE / HEURE</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#6B7280' }}>ADMIN</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#6B7280' }}>ACTION</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#6B7280' }}>ENTITÉ</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#6B7280' }}>DÉTAILS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                  Chargement…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#9CA3AF' }}>
                  Aucune activité trouvée
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#FF2C2C' }}>
                        {getInitials(log.adminEmail)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                          {log.adminEmail ?? '—'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#9CA3AF' }}>
                          {getRoleLabel(log.adminRole)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{getActionChip(log.action)}</TableCell>
                  <TableCell>
                    {log.entity ? (
                      <Typography sx={{ fontSize: 12, color: '#374151' }}>
                        {log.entity}
                        {log.entityId && (
                          <Typography component="span" sx={{ fontSize: 11, color: '#9CA3AF', ml: 0.5 }}>
                            #{log.entityId.slice(0, 8)}
                          </Typography>
                        )}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    {log.metadata && Object.keys(log.metadata).length > 0 ? (
                      <Typography sx={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(log.metadata)}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF' }}>—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={meta.totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}
