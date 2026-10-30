'use client';

// ==============================================
// UTILISATEURS - Données réelles API
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, Avatar, IconButton, InputBase,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Pagination,
  Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert,
} from '@mui/material';
import {
  Search, Download, Eye, Edit2,
  Users, UserCheck, UserX, Shield, Ban, CheckCircle2, Trash2,
} from 'lucide-react';
import {
  useAdminUsers, useAdminUserStats,
  useToggleUserActive, useUpdateUser, useDeleteUser,
  exportUsersCsv, type AdminUser,
} from '@/src/hooks/useAdminData';
import { useAdminTab } from '@/src/context/AdminTabContext';
import { useSnackbar } from '@/src/context/SnackbarContext';
import styles from '@/src/styles/pages.module.scss';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getInitials(name: string | null, email: string) {
  if (name) return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const roleBadges: Record<string, { label: string; class: string }> = {
  USER:   { label: 'Client',  class: styles.badgeInfo },
  SELLER: { label: 'Vendeur', class: styles.badgeSuccess },
};

const statusBadges: Record<string, { label: string; class: string }> = {
  active:   { label: 'Actif',   class: styles.badgeSuccess },
  inactive: { label: 'Inactif', class: styles.badgeDefault },
};

// ─── Modal Édition ────────────────────────────────────────────────

function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [phone, setPhone]       = useState(user.phone ?? '');
  const [email, setEmail]       = useState(user.email);
  const [error, setError]       = useState('');
  const updateUser = useUpdateUser();
  const { showSuccess, showError } = useSnackbar();

  const handleSave = async () => {
    setError('');
    if (!email.trim()) { setError("L'email est requis."); return; }
    try {
      await updateUser.mutateAsync({ id: user.id, fullName: fullName || undefined, phone: phone || undefined, email });
      showSuccess('Utilisateur mis à jour avec succès.');
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Erreur lors de la mise à jour.';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16 }}>Modifier l'utilisateur</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nom complet"  value={fullName} onChange={(e) => setFullName(e.target.value)} size="small" fullWidth />
        <TextField label="Email"        value={email}    onChange={(e) => setEmail(e.target.value)}    size="small" fullWidth type="email" />
        <TextField label="Téléphone"    value={phone}    onChange={(e) => setPhone(e.target.value)}    size="small" fullWidth />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" size="small" onClick={handleSave}
          disabled={updateUser.isPending}
          startIcon={updateUser.isPending ? <CircularProgress size={14} /> : undefined}
        >
          Enregistrer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Modal Suppression ────────────────────────────────────────────

function DeleteUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [error, setError] = useState('');
  const deleteUser = useDeleteUser();
  const { showSuccess, showError } = useSnackbar();

  const handleDelete = async () => {
    setError('');
    try {
      await deleteUser.mutateAsync(user.id);
      showSuccess(`Utilisateur ${user.fullName || user.email} supprimé.`);
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? 'Erreur lors de la suppression.';
      setError(msg);
      showError(msg);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 16, color: '#EF4444' }}>Supprimer l'utilisateur</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography sx={{ fontSize: 14 }}>
          Supprimer <strong>{user.fullName || user.email}</strong> ?<br />
          <Typography component="span" sx={{ fontSize: 12, color: '#9CA3AF' }}>
            Impossible si des commandes sont liées. Cette action est irréversible.
          </Typography>
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Annuler</Button>
        <Button
          variant="contained" color="error" size="small" onClick={handleDelete}
          disabled={deleteUser.isPending}
          startIcon={deleteUser.isPending ? <CircularProgress size={14} color="inherit" /> : <Trash2 size={14} />}
        >
          Supprimer
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ─────────────────────────────────────────────────────────

export default function UsersTab() {
  const { setActiveTab } = useAdminTab();
  const { showSuccess, showError } = useSnackbar();
  const [search, setSearch]                   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('');
  const [page, setPage]                       = useState(1);
  const [editUser, setEditUser]               = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget]       = useState<AdminUser | null>(null);
  const [exporting, setExporting]             = useState(false);

  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout((handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t);
    (handleSearch as unknown as { t?: ReturnType<typeof setTimeout> }).t = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 350);
  };

  const { data, isLoading } = useAdminUsers({
    page, limit: 20,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: stats } = useAdminUserStats();
  const toggleActive    = useToggleUserActive();

  const users = data?.data ?? [];
  const meta  = data?.meta;

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportUsersCsv({
        search: debouncedSearch || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      showSuccess('Export CSV téléchargé.');
    } catch {
      showError('Erreur lors de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleActive = (user: AdminUser) => {
    toggleActive.mutate(user.id, {
      onSuccess: () => showSuccess(
        user.status === 'active'
          ? `${user.fullName || user.email} désactivé.`
          : `${user.fullName || user.email} activé.`
      ),
      onError: (e: any) => showError(e?.response?.data?.message ?? 'Erreur lors du changement de statut.'),
    });
  };

  return (
    <Box>
      {/* Modals */}
      {editUser     && <EditUserModal   user={editUser}     onClose={() => setEditUser(null)} />}
      {deleteTarget && <DeleteUserModal user={deleteTarget} onClose={() => setDeleteTarget(null)} />}

      {/* Stats */}
      <Box className={styles.statsRow}>
        {[
          { icon: Users,     label: 'Total',    value: stats?.total    ?? '—', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
          { icon: UserCheck, label: 'Actifs',   value: stats?.active   ?? '—', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { icon: Shield,    label: 'Vendeurs', value: stats?.sellers  ?? '—', color: '#FF2C2C', bg: 'rgba(255, 44, 44,0.1)' },
          { icon: UserX,     label: 'Inactifs', value: stats?.inactive ?? '—', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} sx={{ background: stat.bg, color: stat.color }}>
              <stat.icon size={20} />
            </Box>
            <Box>
              <Typography className={styles.statValue}>{Number(stat.value).toLocaleString('fr-FR')}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box className={styles.card}>
        {/* Toolbar */}
        <Box className={styles.toolbar}>
          <Box className={styles.searchBox}>
            <Search size={18} style={{ color: '#9CA3AF' }} />
            <InputBase
              placeholder="Nom, email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />
          </Box>
          <Box className={styles.filters}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Rôle</InputLabel>
              <Select value={roleFilter} label="Rôle" onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="USER">Clients</MenuItem>
                <MenuItem value="SELLER">Vendeurs</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} label="Statut" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="active">Actifs</MenuItem>
                <MenuItem value="inactive">Inactifs</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={14} /> : <Download size={16} />}
              size="small"
              onClick={handleExport}
              disabled={exporting}
            >
              Exporter
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <Box className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Téléphone</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j}><Skeleton variant="text" width="80%" /></td>
                    ))}
                  </tr>
                ))
                : users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Box className={styles.userCell}>
                        <Avatar
                          src={user.avatar ?? undefined}
                          sx={{ width: 36, height: 36, fontSize: 13, bgcolor: '#E5E7EB', color: '#374151' }}
                        >
                          {getInitials(user.fullName, user.email)}
                        </Avatar>
                        <Box className={styles.userCellInfo}>
                          <Typography className={styles.userCellName}>{user.fullName || '—'}</Typography>
                          <Typography className={styles.userCellEmail}>{user.email}</Typography>
                        </Box>
                      </Box>
                    </td>
                    <td>
                      <Box className={`${styles.badge} ${roleBadges[user.role]?.class}`}>
                        {roleBadges[user.role]?.label ?? user.role}
                      </Box>
                    </td>
                    <td>
                      <Box className={`${styles.badge} ${statusBadges[user.status]?.class}`}>
                        {statusBadges[user.status]?.label}
                      </Box>
                    </td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{user.phone || '—'}</td>
                    <td style={{ color: '#6B7280', fontSize: 13 }}>{formatDate(user.createdAt)}</td>
                    <td>
                      <Box className={styles.actionsCell}>
                        <Tooltip title="Voir le détail">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setActiveTab('user-detail', { userId: user.id })}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Modifier">
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => setEditUser(user)}
                          >
                            <Edit2 size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.status === 'active' ? 'Désactiver' : 'Activer'}>
                          <IconButton
                            className={styles.actionBtn}
                            onClick={() => handleToggleActive(user)}
                            disabled={toggleActive.isPending}
                            sx={{ color: user.status === 'active' ? '#EF4444' : '#10B981' }}
                          >
                            {user.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer">
                          <IconButton
                            className={styles.actionBtn}
                            sx={{ color: '#EF4444' }}
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </Box>

        {/* Pagination */}
        {meta && (
          <Box className={styles.pagination}>
            <Typography className={styles.paginationInfo}>
              {meta.total.toLocaleString('fr-FR')} utilisateur{meta.total !== 1 ? 's' : ''}
            </Typography>
            <Pagination
              count={meta.totalPages}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
