'use client';

import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Avatar, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Snackbar, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  UserPlus, Search, Mail, User, MoreVertical, Shield,
  Power, PowerOff, Trash2, Send,
} from 'lucide-react';
import {
  useTeam, useInviteAdmin, useDeleteAdmin, useToggleAdminActive,
  useResendSetupLink, type AdminMember,
} from '@/src/hooks/useTeam';
import { useAdminAuth } from '@/src/context/AdminAuthContext';
import styles from '@/src/styles/pages.module.scss';

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super admin',  color: '#0F5C4A', bg: 'rgba(15, 92, 74, 0.1)'   },
  ADMIN:       { label: 'Admin',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  MODERATOR:   { label: 'Modérateur',   color: '#0891B2', bg: 'rgba(8,145,178,0.1)'  },
};

export default function TeamTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { admin: currentAdmin } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [page] = useState(1);
  const { data, isLoading, error: loadError } = useTeam(page, search);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName]   = useState('');
  const [inviteRole, setInviteRole]   = useState('ADMIN');
  const inviteMutation = useInviteAdmin();

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminMember | null>(null);
  const deleteMutation = useDeleteAdmin();

  // Actions
  const toggleMutation = useToggleAdminActive();
  const resendMutation = useResendSetupLink();

  // Menu
  const [menuTarget, setMenuTarget] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false, message: '', severity: 'success',
  });

  const showMsg = (message: string, severity: 'success' | 'error' | 'info' = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    try {
      await inviteMutation.mutateAsync({
        email: inviteEmail,
        fullName: inviteName || undefined,
        role: inviteRole,
      });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole('ADMIN');
      showMsg('Admin invité ! Un email avec le lien de configuration a été envoyé.', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showMsg(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      showMsg('Admin supprimé');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showMsg(msg, 'error');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const result = await toggleMutation.mutateAsync(id);
      showMsg(result.message);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Erreur';
      showMsg(msg, 'error');
    }
    setMenuTarget(null);
  };

  const handleResend = async (id: string) => {
    try {
      await resendMutation.mutateAsync(id);
      showMsg('Email de configuration renvoyé avec succès', 'success');
    } catch {
      showMsg('Erreur lors de l\'envoi', 'error');
    }
    setMenuTarget(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getInitials = (name: string | null, email: string) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : email[0].toUpperCase();

  return (
    <Box>
      {/* Header */}
      <Box className={styles.pageHeader}>
        <Box className={styles.pageHeaderLeft}>
          <Typography className={styles.pageTitle}>Équipe admin</Typography>
          <Typography className={styles.pageSubtitle}>
            Gérez les administrateurs de la plateforme
            {data && ` (${data.meta.total} membre${data.meta.total > 1 ? 's' : ''})`}
          </Typography>
        </Box>
        <Box className={styles.pageActions}>
          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => setInviteOpen(true)}
            sx={{ bgcolor: '#0F5C4A', textTransform: 'none', borderRadius: '10px', fontWeight: 600, '&:hover': { bgcolor: '#0A4638' } }}
          >
            Inviter un admin
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 360, maxWidth: '100%' }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search size={18} color="#9CA3AF" /></InputAdornment>,
          }}
        />
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#0F5C4A' }} />
        </Box>
      )}

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }}>Impossible de charger la liste des admins</Alert>
      )}

      {/* Team list */}
      {data && (
        <Box className={styles.card}>
          {data.admins.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Shield size={48} color="#D1D5DB" />
              <Typography sx={{ color: '#6B7280', mt: 2 }}>Aucun administrateur trouvé</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Table header — desktop only */}
              {!isMobile && (
                <Box sx={{
                  display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px 48px',
                  px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', gap: 2,
                }}>
                  {['Membre', 'Ajouté le', 'Rôle', 'Statut'].map((h) => (
                    <Typography key={h} sx={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</Typography>
                  ))}
                  <Box />
                </Box>
              )}

              {data.admins.map((member) => {
                const isSelf = member.id === currentAdmin?.id;
                const roleInfo = ROLE_LABELS[member.role] ?? ROLE_LABELS.ADMIN;
                return isMobile ? (
                  // Mobile card layout
                  <Box key={member.id} sx={{
                    px: 2, py: 2, borderBottom: '1px solid #F3F4F6',
                    '&:last-child': { borderBottom: 'none' },
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <Avatar sx={{
                          width: 40, height: 40,
                          bgcolor: isSelf ? '#0F5C4A' : '#E5E7EB',
                          color: isSelf ? '#fff' : '#6B7280',
                          fontSize: 14, fontWeight: 700,
                        }}>
                          {member.avatar
                            ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : getInitials(member.fullName, member.email)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.fullName || 'Sans nom'}
                            </Typography>
                            {isSelf && (
                              <Chip label="Vous" size="small" sx={{ height: 18, fontSize: 10, fontWeight: 700, bgcolor: 'rgba(15, 92, 74, 0.1)', color: '#0F5C4A' }} />
                            )}
                          </Box>
                          <Typography sx={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.email}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ position: 'relative', flexShrink: 0 }}>
                        {!isSelf && (
                          <IconButton size="small" onClick={() => setMenuTarget(menuTarget === member.id ? null : member.id)}>
                            <MoreVertical size={18} />
                          </IconButton>
                        )}
                        {menuTarget === member.id && (
                          <Box sx={{
                            position: 'absolute', right: 0, top: 36, zIndex: 10,
                            bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 210, py: 0.5,
                          }}>
                            <Box onClick={() => handleToggle(member.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}>
                              {member.isActive ? <PowerOff size={16} color="#EF4444" /> : <Power size={16} color="#10B981" />}
                              <Typography sx={{ fontSize: 13 }}>{member.isActive ? 'Désactiver' : 'Activer'}</Typography>
                            </Box>
                            <Box onClick={() => handleResend(member.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}>
                              {resendMutation.isPending ? <CircularProgress size={16} /> : <Send size={16} color="#3B82F6" />}
                              <Typography sx={{ fontSize: 13 }}>Renvoyer lien par email</Typography>
                            </Box>
                            <Box sx={{ borderTop: '1px solid #F3F4F6', my: 0.5 }} />
                            <Box onClick={() => { setDeleteTarget(member); setMenuTarget(null); }} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#FEF2F2' } }}>
                              <Trash2 size={16} color="#EF4444" />
                              <Typography sx={{ fontSize: 13, color: '#EF4444' }}>Supprimer</Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip label={roleInfo.label} size="small" sx={{ fontWeight: 600, fontSize: 11, bgcolor: roleInfo.bg, color: roleInfo.color }} />
                      <Chip
                        label={member.isActive ? 'Actif' : 'Inactif'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: 12, bgcolor: member.isActive ? '#ECFDF5' : '#FEF2F2', color: member.isActive ? '#10B981' : '#EF4444' }}
                      />
                      <Typography sx={{ fontSize: 12, color: '#9CA3AF', ml: 'auto' }}>{formatDate(member.createdAt)}</Typography>
                    </Box>
                  </Box>
                ) : (
                  // Desktop row
                  <Box key={member.id} sx={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 120px 120px 48px',
                    px: 2, py: 1.5, borderRadius: '10px', alignItems: 'center', gap: 2,
                    '&:hover': { bgcolor: '#FAFAFA' }, transition: 'background 0.15s',
                  }}>
                    {/* Avatar + info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Avatar sx={{
                        width: 40, height: 40,
                        bgcolor: isSelf ? '#0F5C4A' : '#E5E7EB',
                        color: isSelf ? '#fff' : '#6B7280',
                        fontSize: 14, fontWeight: 700,
                      }}>
                        {member.avatar
                          ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : getInitials(member.fullName, member.email)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.fullName || 'Sans nom'}
                          </Typography>
                          {isSelf && (
                            <Chip label="Vous" size="small" sx={{
                              height: 18, fontSize: 10, fontWeight: 700,
                              bgcolor: 'rgba(15, 92, 74, 0.1)', color: '#0F5C4A',
                            }} />
                          )}
                        </Box>
                        <Typography sx={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Date */}
                    <Typography sx={{ fontSize: 13, color: '#6B7280' }}>{formatDate(member.createdAt)}</Typography>

                    {/* Role */}
                    <Chip
                      label={roleInfo.label}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: 11, bgcolor: roleInfo.bg, color: roleInfo.color }}
                    />

                    {/* Active */}
                    <Chip
                      label={member.isActive ? 'Actif' : 'Inactif'}
                      size="small"
                      sx={{
                        fontWeight: 600, fontSize: 12,
                        bgcolor: member.isActive ? '#ECFDF5' : '#FEF2F2',
                        color: member.isActive ? '#10B981' : '#EF4444',
                      }}
                    />

                    {/* Actions */}
                    <Box sx={{ position: 'relative' }}>
                      {!isSelf && (
                        <IconButton size="small" onClick={() => setMenuTarget(menuTarget === member.id ? null : member.id)}>
                          <MoreVertical size={18} />
                        </IconButton>
                      )}
                      {menuTarget === member.id && (
                        <Box sx={{
                          position: 'absolute', right: 0, top: 36, zIndex: 10,
                          bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 210, py: 0.5,
                        }}>
                          <Box onClick={() => handleToggle(member.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}>
                            {member.isActive ? <PowerOff size={16} color="#EF4444" /> : <Power size={16} color="#10B981" />}
                            <Typography sx={{ fontSize: 13 }}>{member.isActive ? 'Désactiver' : 'Activer'}</Typography>
                          </Box>
                          <Box onClick={() => handleResend(member.id)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}>
                            {resendMutation.isPending
                              ? <CircularProgress size={16} />
                              : <Send size={16} color="#3B82F6" />}
                            <Typography sx={{ fontSize: 13 }}>Renvoyer lien par email</Typography>
                          </Box>
                          <Box sx={{ borderTop: '1px solid #F3F4F6', my: 0.5 }} />
                          <Box onClick={() => { setDeleteTarget(member); setMenuTarget(null); }} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer', '&:hover': { bgcolor: '#FEF2F2' } }}>
                            <Trash2 size={16} color="#EF4444" />
                            <Typography sx={{ fontSize: 13, color: '#EF4444' }}>Supprimer</Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {menuTarget && (
        <Box sx={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setMenuTarget(null)} />
      )}

      {/* ========== INVITE DIALOG ========== */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>Inviter un administrateur</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#6B7280' }}>
            Un email sera envoyé à l&apos;intéressé avec un lien pour définir son mot de passe (valable 72h).
          </Typography>
          <TextField
            fullWidth label="Email" type="email" required
            value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Mail size={16} color="#9CA3AF" /></InputAdornment>,
            }}
          />
          <TextField
            fullWidth label="Nom complet (optionnel)"
            value={inviteName} onChange={(e) => setInviteName(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><User size={16} color="#9CA3AF" /></InputAdornment>,
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Rôle</InputLabel>
            <Select value={inviteRole} label="Rôle" onChange={(e) => setInviteRole(e.target.value)}>
              <MenuItem value="ADMIN">Administrateur</MenuItem>
              <MenuItem value="MODERATOR">Modérateur</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super administrateur</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInviteOpen(false)} sx={{ textTransform: 'none', color: '#6B7280' }}>Annuler</Button>
          <Button
            variant="contained" onClick={handleInvite}
            disabled={!inviteEmail || inviteMutation.isPending}
            sx={{ bgcolor: '#0F5C4A', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#0A4638' } }}
          >
            {inviteMutation.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Envoyer l\'invitation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== DELETE DIALOG ========== */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18, color: '#EF4444' }}>
          Supprimer l&apos;administrateur
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#6B7280' }}>
            Voulez-vous vraiment supprimer <strong>{deleteTarget?.fullName || deleteTarget?.email}</strong> ?
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: 'none', color: '#6B7280' }}>Annuler</Button>
          <Button
            variant="contained" onClick={handleDelete}
            disabled={deleteMutation.isPending}
            sx={{ bgcolor: '#EF4444', textTransform: 'none', borderRadius: '10px', '&:hover': { bgcolor: '#DC2626' } }}
          >
            {deleteMutation.isPending ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========== SNACKBAR ========== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
