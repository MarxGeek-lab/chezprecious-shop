'use client';

// ==============================================
// PAGE MES COMMANDES - DASHBOARD UTILISATEUR
// ==============================================

import { useState } from 'react';
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
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useOrders } from '@/app/hooks/useOrders';
import { ApiOrder } from '@/app/lib/api';
import { formatPrice } from '@/app/utils';
import styles from '../account.module.scss';

const statusConfig: Record<string, {
  label: string;
  color: 'success' | 'info' | 'warning' | 'default' | 'error';
  icon: React.ReactElement;
}> = {
  PENDING:    { label: 'En attente',    color: 'default', icon: <Clock size={14} /> },
  PAID:       { label: 'Payé',          color: 'info',    icon: <Package size={14} /> },
  PROCESSING: { label: 'En traitement', color: 'warning', icon: <Package size={14} /> },
  SHIPPED:    { label: 'Expédié',       color: 'info',    icon: <Truck size={14} /> },
  DELIVERED:  { label: 'Livré',         color: 'success', icon: <CheckCircle size={14} /> },
  CANCELLED:  { label: 'Annulé',        color: 'error',   icon: <XCircle size={14} /> },
  REFUNDED:   { label: 'Remboursé',     color: 'default', icon: <XCircle size={14} /> },
};

const trackingSteps = ['Commande confirmée', 'En préparation', 'Expédié', 'Livré'];

function getTrackingStep(status: string) {
  switch (status) {
    case 'PENDING':    return 0;
    case 'PAID':       return 0;
    case 'PROCESSING': return 1;
    case 'SHIPPED':    return 2;
    case 'DELIVERED':  return 3;
    default:           return 0;
  }
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api-backend').replace(/\/api$/, '');

function resolveImageUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
}

export default function OrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: orders, isLoading, error } = useOrders();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const all = orders ?? [];

  const inProgress = all.filter((o) => ['PENDING', 'PAID', 'PROCESSING'].includes(o.status));
  const shipped    = all.filter((o) => o.status === 'SHIPPED');
  const delivered  = all.filter((o) => o.status === 'DELIVERED');
  const cancelled  = all.filter((o) => ['CANCELLED', 'REFUNDED'].includes(o.status));

  const tabLists = [all, inProgress, shipped, delivered, cancelled];
  let filtered = tabLists[currentTab] ?? all;

  if (searchQuery) {
    filtered = filtered.filter((o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerFirstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerLastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: '#D45D00' }} />
        <Typography color="text.secondary">Chargement des commandes...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Impossible de charger les commandes. Vérifiez votre connexion.
      </Alert>
    );
  }

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Mes commandes</Typography>
          <Typography>Suivez et gérez vos commandes</Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box className={styles.statsGrid}>
        {[
          { label: 'Total commandes', value: all.length,       icon: <Package size={20} />,     color: 'primary' },
          { label: 'En cours',        value: inProgress.length, icon: <Truck size={20} />,       color: 'info' },
          { label: 'Livrées',         value: delivered.length,  icon: <CheckCircle size={20} />, color: 'success' },
          { label: 'Annulées',        value: cancelled.length,  icon: <XCircle size={20} />,     color: 'error' },
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

      <Paper className={styles.card}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par numéro de commande ou nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          sx={{ px: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Toutes (${all.length})`} />
          <Tab label={`En cours (${inProgress.length})`} />
          <Tab label={`Expédiées (${shipped.length})`} />
          <Tab label={`Livrées (${delivered.length})`} />
          <Tab label={`Annulées (${cancelled.length})`} />
        </Tabs>

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
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((order) => {
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
                        icon={cfg.icon}
                        label={cfg.label}
                        size="small"
                        color={cfg.color}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Eye size={16} />}
                        onClick={() => setSelectedOrder(order)}
                        sx={{ textTransform: 'none' }}
                      >
                        Détails
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        {/* Cards — mobile uniquement */}
        <Box className={styles.mobileCardList}>
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] ?? statusConfig['PENDING'];
            return (
              <Box key={order.id} className={styles.mobileCard} onClick={() => setSelectedOrder(order)}>
                <Box
                  className={styles.mobileCardIcon}
                  sx={{ bgcolor: 'rgba(212,93,0,0.1)', color: '#D45D00' }}
                >
                  <Package size={18} />
                </Box>
                <Box className={styles.mobileCardInfo}>
                  <Typography className={styles.mobileCardTitle}>{order.orderNumber}</Typography>
                  <Typography className={styles.mobileCardSub}>
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')} · {order.items.length} article{order.items.length > 1 ? 's' : ''}
                  </Typography>
                  <Chip
                    icon={cfg.icon}
                    label={cfg.label}
                    size="small"
                    color={cfg.color}
                    variant="outlined"
                    sx={{ mt: 0.5, height: 20, fontSize: 11 }}
                  />
                </Box>
                <Box className={styles.mobileCardRight}>
                  <Typography className={styles.mobileCardAmount}>
                    {formatPrice(Number(order.total))}
                  </Typography>
                  <Typography className={styles.mobileCardSub}>{order.currency}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {filtered.length === 0 && (
          <Box className={styles.emptyState}>
            <Package size={48} />
            <Typography variant="h6">Aucune commande trouvée</Typography>
          </Box>
        )}
      </Paper>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        {selectedOrder && (() => {
          const cfg = statusConfig[selectedOrder.status] ?? statusConfig['PENDING'];
          return (
            <>
              <DialogTitle>Commande {selectedOrder.orderNumber}</DialogTitle>
              <DialogContent>
                {/* Tracking */}
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'REFUNDED' && (
                  <Box sx={{ mb: 3 }}>
                    <Stepper activeStep={getTrackingStep(selectedOrder.status)} alternativeLabel>
                      {trackingSteps.map((step) => (
                        <Step key={step}>
                          <StepLabel>{step}</StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip icon={cfg.icon} label={cfg.label} size="small" color={cfg.color} variant="outlined" />
                  {selectedOrder.paymentReference && (
                    <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      Réf. paiement : <strong>{selectedOrder.paymentReference}</strong>
                    </Typography>
                  )}
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Livraison */}
                <Typography variant="subtitle2" gutterBottom>Adresse de livraison</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedOrder.customerFirstName} {selectedOrder.customerLastName}<br />
                  {selectedOrder.shippingAddress}<br />
                  {selectedOrder.shippingCity}, {selectedOrder.shippingCountry}<br />
                  {selectedOrder.customerPhone}
                </Typography>

                <Divider sx={{ mb: 2 }} />

                {/* Articles */}
                <Typography variant="subtitle2" gutterBottom>Articles</Typography>
                {selectedOrder.items.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.productImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={resolveImageUrl(item.productImage) ?? ''}
                          alt={item.productName}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                        />
                      )}
                      <Box>
                        <Typography variant="body2">{item.productName} × {item.quantity}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatPrice(Number(item.unitPrice))} / unité
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatPrice(Number(item.totalPrice))} {selectedOrder.currency}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Totaux */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Sous-total</Typography>
                    <Typography variant="body2">{formatPrice(Number(selectedOrder.subtotal))} {selectedOrder.currency}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Livraison</Typography>
                    <Typography variant="body2">
                      {Number(selectedOrder.shippingCost) === 0 ? 'Gratuite' : `${formatPrice(Number(selectedOrder.shippingCost))} ${selectedOrder.currency}`}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Total</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }} color="primary">
                      {formatPrice(Number(selectedOrder.total))} {selectedOrder.currency}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedOrder(null)}>Fermer</Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
