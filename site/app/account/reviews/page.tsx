'use client';

// ==============================================
// PAGE MES AVIS - DASHBOARD UTILISATEUR
// ==============================================

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Rating,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Edit,
  Trash2,
} from 'lucide-react';
import { useMyReviews } from '@/app/hooks/useUser';
import { useUpdateReview, useDeleteReview } from '@/app/hooks/useReviews';
import type { ApiUserReview } from '@/app/lib/api';
import styles from '../account.module.scss';

export default function ReviewsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, isLoading, error } = useMyReviews();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const [editTarget, setEditTarget] = useState<ApiUserReview | null>(null);
  const [editRating, setEditRating] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ApiUserReview | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const reviews = data?.reviews ?? [];

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const totalHelpful = reviews.reduce((sum, r) => sum + r.helpful, 0);

  const openEdit = (review: ApiUserReview) => {
    setEditTarget(review);
    setEditRating(review.rating);
    setEditContent(review.content || '');
  };

  const handleEditSubmit = async () => {
    if (!editTarget || !editRating) return;
    try {
      await updateReview.mutateAsync({
        id: editTarget.id,
        data: { rating: editRating, content: editContent },
      });
      setAlert({ type: 'success', message: 'Avis mis à jour avec succès !' });
      setEditTarget(null);
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la mise à jour de l\'avis.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReview.mutateAsync(deleteTarget.id);
      setAlert({ type: 'success', message: 'Avis supprimé.' });
      setDeleteTarget(null);
    } catch {
      setAlert({ type: 'error', message: 'Erreur lors de la suppression.' });
    }
    setTimeout(() => setAlert(null), 4000);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: '#D45D00' }} />
        <Typography color="text.secondary">Chargement des avis...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Impossible de charger vos avis.
      </Alert>
    );
  }

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Mes avis</Typography>
          <Typography>Vos avis aident les autres acheteurs</Typography>
        </Box>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      {/* Stats */}
      <Box className={styles.statsGrid}>
        {[
          { label: 'Avis déposés', value: reviews.length, icon: <MessageSquare size={20} />, color: 'primary' },
          { label: 'Note moyenne', value: reviews.length > 0 ? averageRating.toFixed(1) : '—', icon: <Star size={20} />, color: 'warning' },
          { label: 'Avis utiles', value: totalHelpful, icon: <ThumbsUp size={20} />, color: 'success' },
          { label: 'Vérifiés', value: reviews.filter((r) => r.isVerified).length, icon: <Star size={20} />, color: 'info' },
        ].map((stat) => (
          <Box key={stat.label} className={styles.statCard}>
            <Box className={styles.statIcon} data-color={stat.color}>
              {stat.icon}
            </Box>
            <Box>
              <Typography className={styles.statValue}>{stat.value}</Typography>
              <Typography className={styles.statLabel}>{stat.label}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {reviews.length === 0 ? (
        <Box className={styles.emptyState}>
          <Star size={48} />
          <Typography variant="h6" sx={{ mt: 2 }}>Aucun avis déposé</Typography>
          <Typography variant="body2" color="text.secondary">
            Achetez des produits et partagez votre expérience
          </Typography>
        </Box>
      ) : (
        <Box>
          {reviews.map((review) => (
            <Box key={review.id} className={styles.reviewCard}>
              <Box className={styles.reviewHeader} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography className={styles.reviewProduct} noWrap>
                    {review.product.name}
                  </Typography>
                  <Rating value={review.rating} size="small" readOnly sx={{ mt: 0.5 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                  {review.isVerified && (
                    <Chip label="Achat vérifié" size="small" color="success" variant="outlined" />
                  )}
                  <Typography className={styles.cellSecondary}>
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </Typography>
                  <Tooltip title="Modifier">
                    <IconButton size="small" onClick={() => openEdit(review)}>
                      <Edit size={16} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton
                      size="small"
                      sx={{ color: 'error.main' }}
                      onClick={() => setDeleteTarget(review)}
                    >
                      <Trash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {review.content && (
                <Typography className={styles.reviewComment}>{review.content}</Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <ThumbsUp size={14} color="#6B7280" />
                <Typography variant="caption" color="text.secondary">
                  {review.helpful} personne{review.helpful !== 1 ? 's ont' : ' a'} trouvé cet avis utile
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>Modifier votre avis</DialogTitle>
        <DialogContent>
          {editTarget && (
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {editTarget.product.name}
            </Typography>
          )}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>Votre note</Typography>
            <Rating
              value={editRating}
              onChange={(_, v) => setEditRating(v)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Votre commentaire"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Partagez votre expérience avec ce produit..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditTarget(null)}>Annuler</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={!editRating || updateReview.isPending}
            startIcon={updateReview.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer cet avis ?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Cette action est irréversible. Votre avis sur{' '}
            <strong>{deleteTarget?.product.name}</strong> sera définitivement supprimé.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleteReview.isPending}
            startIcon={deleteReview.isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
