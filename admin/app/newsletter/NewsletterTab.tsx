'use client';

// ==============================================
// NEWSLETTER TAB — Admin
// ==============================================

import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert, Pagination,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Mail, Users, Send, Trash2, Plus, RefreshCw, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Campaign {
  id: string;
  subject: string;
  body: string;
  status: 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED';
  sentAt: string | null;
  sentCount: number;
  failedCount: number;
  createdAt: string;
}

interface Meta { total: number; page: number; totalPages: number; }

// ─────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────
function useSubscribers(page: number, search: string, status?: string) {
  return useQuery({
    queryKey: ['admin', 'newsletter', 'subscribers', page, search, status],
    queryFn: async () => {
      const { data } = await api.get<{ data: Subscriber[]; meta: Meta }>('/admin/newsletter/subscribers', {
        params: { page, limit: 20, search: search || undefined, status: status || undefined },
      });
      return data;
    },
  });
}

function useSubscriberStats() {
  return useQuery({
    queryKey: ['admin', 'newsletter', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<{ data: { total: number; active: number; inactive: number } }>(
        '/admin/newsletter/subscribers/stats'
      );
      return data.data;
    },
  });
}

function useCampaigns(page: number) {
  return useQuery({
    queryKey: ['admin', 'newsletter', 'campaigns', page],
    queryFn: async () => {
      const { data } = await api.get<{ data: Campaign[]; meta: Meta }>('/admin/newsletter/campaigns', {
        params: { page, limit: 10 },
      });
      return data;
    },
  });
}

// ─────────────────────────────────────────────
// Composant stat card
// ─────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 3, p: 3, border: '1px solid #E5E7EB', flex: 1, minWidth: 140 }}>
      <Typography sx={{ color: '#6B7280', fontSize: 13, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 28, fontWeight: 800, color }}>
        {value ?? '—'}
      </Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Onglet Abonnés
// ─────────────────────────────────────────────
function SubscribersTab() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useSubscribers(page, search, statusFilter);
  const { data: stats } = useSubscriberStats();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/newsletter/subscribers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'subscribers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'stats'] });
    },
  });

  const handleSearch = () => { setSearch(searchInput); setPage(1); };

  const STATUS_CHIP: Record<string, { label: string; color: 'success' | 'error' }> = {
    true: { label: 'Actif', color: 'success' },
    false: { label: 'Désabonné', color: 'error' },
  };

  return (
    <Box>
      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total abonnés" value={stats?.total} color="#1A1A2E" />
        <StatCard label="Actifs" value={stats?.active} color="#059669" />
        <StatCard label="Désabonnés" value={stats?.inactive} color="#DC2626" />
      </Box>

      {/* Filtres */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Rechercher email ou nom..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <Button variant="outlined" size="small" onClick={handleSearch}
          sx={{ borderRadius: 2, borderColor: '#FF2C2C', color: '#FF2C2C' }}>
          Rechercher
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['', 'active', 'inactive'].map((s) => (
            <Chip
              key={s}
              label={s === '' ? 'Tous' : s === 'active' ? 'Actifs' : 'Désabonnés'}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              color={statusFilter === s ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer', ...(statusFilter === s ? { bgcolor: '#FF2C2C', color: '#fff' } : {}) }}
            />
          ))}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#374151', bgcolor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' } }}>
              <TableCell>Email</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Date d'inscription</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: '#FF2C2C' }} /></TableCell></TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9CA3AF' }}>Aucun abonné trouvé</TableCell></TableRow>
            ) : data?.data.map((sub) => {
              const chip = STATUS_CHIP[String(sub.isActive)];
              return (
                <TableRow key={sub.id} hover>
                  <TableCell sx={{ fontSize: 13 }}>{sub.email}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: '#6B7280' }}>{sub.name || '—'}</TableCell>
                  <TableCell>
                    <Chip label={chip.label} color={chip.color} size="small" />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: '#6B7280' }}>
                    {new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(sub.id)}>
                      <Trash2 size={15} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {(data?.meta.totalPages ?? 0) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data?.meta.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#FF2C2C', color: '#fff' } }}
          />
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────
// Onglet Campagnes
// ─────────────────────────────────────────────
function CampaignsTab() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<Campaign | null>(null);
  const [sendStatus, setSendStatus] = useState<string>('');

  const { data, isLoading } = useCampaigns(page);

  const createMutation = useMutation({
    mutationFn: (payload: { subject: string; body: string }) =>
      api.post('/admin/newsletter/campaigns', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'campaigns'] });
      setCreateOpen(false); setSubject(''); setBody(''); setEditId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { subject: string; body: string } }) =>
      api.put(`/admin/newsletter/campaigns/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'campaigns'] });
      setCreateOpen(false); setSubject(''); setBody(''); setEditId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/newsletter/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'campaigns'] }),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/newsletter/campaigns/${id}/send`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['admin', 'newsletter', 'campaigns'] });
      setSendStatus(res.data?.message || 'Envoi démarré !');
      setSendConfirm(null);
    },
  });

  const handleOpenCreate = (campaign?: Campaign) => {
    if (campaign) {
      setEditId(campaign.id);
      setSubject(campaign.subject);
      setBody(campaign.body);
    } else {
      setEditId(null);
      setSubject('');
      setBody('');
    }
    setCreateOpen(true);
  };

  const handleSave = () => {
    if (!subject.trim() || !body.trim()) return;
    if (editId) {
      updateMutation.mutate({ id: editId, payload: { subject, body } });
    } else {
      createMutation.mutate({ subject, body });
    }
  };

  const STATUS_STYLE: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' }> = {
    DRAFT:   { label: 'Brouillon', color: 'default' },
    SENDING: { label: 'En envoi…', color: 'warning' },
    SENT:    { label: 'Envoyée',   color: 'success' },
    FAILED:  { label: 'Échec',     color: 'error' },
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#374151' }}>
          {data?.meta.total ?? 0} campagne(s)
        </Typography>
        <Button
          startIcon={<Plus size={16} />}
          variant="contained"
          size="small"
          onClick={() => handleOpenCreate()}
          sx={{ bgcolor: '#FF2C2C', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#D41E1E' } }}
        >
          Nouvelle campagne
        </Button>
      </Box>

      {sendStatus && (
        <Alert severity="success" onClose={() => setSendStatus('')} sx={{ mb: 2, borderRadius: 2 }}>
          {sendStatus}
        </Alert>
      )}

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { fontWeight: 700, color: '#374151', bgcolor: '#F9FAFB', borderBottom: '2px solid #E5E7EB' } }}>
              <TableCell>Sujet</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Envoyés</TableCell>
              <TableCell>Date envoi</TableCell>
              <TableCell>Créée le</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={28} sx={{ color: '#FF2C2C' }} /></TableCell></TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9CA3AF' }}>Aucune campagne</TableCell></TableRow>
            ) : data?.data.map((c) => {
              const s = STATUS_STYLE[c.status];
              return (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.subject}
                  </TableCell>
                  <TableCell>
                    <Chip label={s.label} color={s.color} size="small" />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {c.status === 'SENT' ? `${c.sentCount} / ${c.sentCount + c.failedCount}` : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: '#6B7280' }}>
                    {c.sentAt ? new Date(c.sentAt).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13, color: '#6B7280' }}>
                    {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => setPreviewCampaign(c)} title="Aperçu">
                        <Eye size={15} />
                      </IconButton>
                      {c.status === 'DRAFT' && (
                        <>
                          <IconButton size="small" onClick={() => handleOpenCreate(c)} title="Modifier">
                            <RefreshCw size={15} />
                          </IconButton>
                          <IconButton size="small" sx={{ color: '#059669' }} onClick={() => setSendConfirm(c)} title="Envoyer">
                            <Send size={15} />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(c.id)} title="Supprimer">
                            <Trash2 size={15} />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {(data?.meta.totalPages ?? 0) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={data?.meta.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#FF2C2C', color: '#fff' } }}
          />
        </Box>
      )}

      {/* Dialog — Créer / Modifier */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editId ? 'Modifier la campagne' : 'Nouvelle campagne'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <TextField
            label="Sujet de l'email"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            label="Corps du message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            multiline
            minRows={8}
            placeholder="Rédigez votre message ici...&#10;&#10;Vous pouvez utiliser des retours à la ligne."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: '#6B7280' }}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!subject.trim() || !body.trim() || createMutation.isPending || updateMutation.isPending}
            sx={{ bgcolor: '#FF2C2C', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#D41E1E' } }}
          >
            Sauvegarder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog — Aperçu */}
      <Dialog open={!!previewCampaign} onClose={() => setPreviewCampaign(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>{previewCampaign?.subject}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {previewCampaign?.body}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewCampaign(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog — Confirmation envoi */}
      <Dialog open={!!sendConfirm} onClose={() => setSendConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Envoyer la campagne ?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: '#374151' }}>
            Cette action enverra l'email <strong>"{sendConfirm?.subject}"</strong> à tous les abonnés actifs. Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setSendConfirm(null)} sx={{ color: '#6B7280' }}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<Send size={15} />}
            onClick={() => sendConfirm && sendMutation.mutate(sendConfirm.id)}
            disabled={sendMutation.isPending}
            sx={{ bgcolor: '#059669', borderRadius: 2, fontWeight: 700, '&:hover': { bgcolor: '#047857' } }}
          >
            {sendMutation.isPending ? 'Envoi…' : 'Confirmer l\'envoi'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─────────────────────────────────────────────
// Page principale Newsletter
// ─────────────────────────────────────────────
export default function NewsletterTab() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ width: 44, height: 44, bgcolor: '#FFECEC', borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Mail size={22} color="#FF2C2C" />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1A1A2E', lineHeight: 1.2 }}>
            Newsletter
          </Typography>
          <Typography sx={{ color: '#6B7280', fontSize: 14 }}>
            Gérez les abonnés et envoyez des campagnes email
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 3,
          borderBottom: '2px solid #E5E7EB',
          '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', minWidth: 120 },
          '& .Mui-selected': { color: '#FF2C2C !important' },
          '& .MuiTabs-indicator': { bgcolor: '#FF2C2C' },
        }}
      >
        <Tab icon={<Users size={16} />} iconPosition="start" label="Abonnés" />
        <Tab icon={<Send size={16} />} iconPosition="start" label="Campagnes" />
      </Tabs>

      {tab === 0 && <SubscribersTab />}
      {tab === 1 && <CampaignsTab />}
    </Box>
  );
}
