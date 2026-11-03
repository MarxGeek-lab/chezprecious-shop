'use client';

// ==============================================
// PAGE TABLEAU DE BORD UTILISATEUR
// ==============================================

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  Skeleton,
} from '@mui/material';
import {
  ShoppingBag,
  DollarSign,
  Heart,
  Star,
  Package,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { useAccountTab } from '@/app/context/AccountTabContext';
import { useOrders } from '@/app/hooks/useOrders';
import { useMyReviews } from '@/app/hooks/useUser';
import { useWishlist } from '@/app/context/WishlistContext';
import { formatPrice } from '@/app/utils';
import styles from './account.module.scss';

const statusConfig: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'default' | 'error' }> = {
  PENDING:    { label: 'En attente',    color: 'default' },
  PAID:       { label: 'Payé',          color: 'info' },
  PROCESSING: { label: 'En traitement', color: 'warning' },
  SHIPPED:    { label: 'Expédié',       color: 'info' },
  DELIVERED:  { label: 'Livré',         color: 'success' },
  CANCELLED:  { label: 'Annulé',        color: 'error' },
  REFUNDED:   { label: 'Remboursé',     color: 'default' },
};

export default function AccountDashboard() {
  const { user } = useAuth();
  const { setActiveTab } = useAccountTab();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: reviewsData, isLoading: reviewsLoading } = useMyReviews();
  const { items: wishlistItems } = useWishlist();

  const allOrders = orders ?? [];
  const allReviews = reviewsData?.reviews ?? [];
  const recentOrders = allOrders.slice(0, 5);

  const totalSpent = allOrders
    .filter((o) => !['CANCELLED', 'REFUNDED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const firstName = user?.fullName?.split(' ')[0] || 'vous';

  const stats = [
    { label: 'Total dépensé', value: ordersLoading ? '...' : formatPrice(totalSpent), icon: <DollarSign size={20} />, color: 'primary' },
    { label: 'Commandes', value: ordersLoading ? '...' : allOrders.length, icon: <ShoppingBag size={20} />, color: 'success' },
    { label: 'Favoris', value: wishlistItems.length, icon: <Heart size={20} />, color: 'error' },
    { label: 'Avis déposés', value: reviewsLoading ? '...' : allReviews.length, icon: <Star size={20} />, color: 'warning' },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Bonjour, {firstName} !</Typography>
          <Typography>Voici un résumé de votre activité</Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box className={styles.statsGrid}>
        {stats.map((stat) => (
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

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Recent Orders */}
        <Paper className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Dernières commandes</Typography>
            <Button
              endIcon={<ArrowRight size={16} />}
              size="small"
              sx={{ color: '#0F5C4A', textTransform: 'none' }}
              onClick={() => setActiveTab('orders')}
            >
              Tout voir
            </Button>
          </Box>

          {ordersLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : recentOrders.length === 0 ? (
            <Box className={styles.emptyState} sx={{ py: 4 }}>
              <Package size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Aucune commande pour le moment
              </Typography>
            </Box>
          ) : (
            <>
              {/* Table — masquée sur mobile */}
              <Box className={styles.tableWrapper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>N° Commande</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Articles</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => {
                      const cfg = statusConfig[order.status] ?? statusConfig['PENDING'];
                      return (
                        <TableRow key={order.id} hover>
                          <TableCell>
                            <Typography className={styles.orderNumber}>{order.orderNumber}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography className={styles.orderDate}>
                              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography className={styles.cellPrimary}>{order.items.length}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography className={styles.cellBold}>
                              {formatPrice(Number(order.total))} {order.currency}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={cfg.label}
                              size="small"
                              color={cfg.color}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>

              {/* Cards — mobile uniquement */}
              <Box className={styles.mobileCardList}>
                {recentOrders.map((order) => {
                  const cfg = statusConfig[order.status] ?? statusConfig['PENDING'];
                  return (
                    <Box key={order.id} className={styles.mobileCard} onClick={() => setActiveTab('orders')}>
                      <Box
                        className={styles.mobileCardIcon}
                        sx={{ bgcolor: 'rgba(15,92,74,0.1)', color: '#0F5C4A' }}
                      >
                        <ShoppingBag size={18} />
                      </Box>
                      <Box className={styles.mobileCardInfo}>
                        <Typography className={styles.mobileCardTitle}>{order.orderNumber}</Typography>
                        <Typography className={styles.mobileCardSub}>
                          {new Date(order.createdAt).toLocaleDateString('fr-FR')} · {order.items.length} article{order.items.length > 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box className={styles.mobileCardRight}>
                        <Typography className={styles.mobileCardAmount}>
                          {formatPrice(Number(order.total))}
                        </Typography>
                        <Chip label={cfg.label} size="small" color={cfg.color} variant="outlined" />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Paper>

        {/* Recent Reviews */}
        <Paper className={styles.card}>
          <Box className={styles.cardHeader}>
            <Typography className={styles.cardTitle}>Mes derniers avis</Typography>
            <Button
              endIcon={<ArrowRight size={16} />}
              size="small"
              sx={{ color: '#0F5C4A', textTransform: 'none' }}
              onClick={() => setActiveTab('reviews')}
            >
              Tout voir
            </Button>
          </Box>

          {reviewsLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rectangular" height={64} sx={{ mb: 1, borderRadius: 1 }} />
              ))}
            </Box>
          ) : allReviews.length === 0 ? (
            <Box className={styles.emptyState} sx={{ py: 4 }}>
              <Star size={36} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Aucun avis déposé
              </Typography>
            </Box>
          ) : (
            <Box className={styles.activityList}>
              {allReviews.slice(0, 5).map((review) => (
                <Box key={review.id} className={styles.activityItem}>
                  <Box className={styles.activityIcon} data-type="review">
                    <Star size={18} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className={styles.activityText} noWrap>
                      {review.product.name}
                    </Typography>
                    <Typography className={styles.activityTime}>
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} — {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
