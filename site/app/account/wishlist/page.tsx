'use client';

// ==============================================
// PAGE MES FAVORIS - DASHBOARD UTILISATEUR
// ==============================================

import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Package,
  ExternalLink,
} from 'lucide-react';
import { useWishlist } from '@/app/context/WishlistContext';
import { useCart } from '@/app/context/CartContext';
import styles from '../account.module.scss';

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();

  const inStock = items.filter((i) => i.product.inStock);
  const onSale = items.filter((i) => i.product.originalPrice && i.product.originalPrice > i.product.price);

  return (
    <Box>
      <Box className={styles.pageHeader}>
        <Box className={styles.pageTitle}>
          <Typography variant="h1">Mes favoris</Typography>
          <Typography>{items.length} produit{items.length !== 1 ? 's' : ''} dans votre liste</Typography>
        </Box>
        {items.length > 0 && (
          <Box className={styles.pageActions}>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={clearWishlist}
              sx={{ textTransform: 'none' }}
            >
              Tout effacer
            </Button>
          </Box>
        )}
      </Box>

      {/* Stats */}
      <Box className={styles.statsGrid}>
        {[
          { label: 'Produits favoris', value: items.length, icon: <Heart size={20} />, color: 'error' },
          { label: 'Disponibles', value: inStock.length, icon: <Package size={20} />, color: 'success' },
          { label: 'En promotion', value: onSale.length, icon: <ShoppingCart size={20} />, color: 'warning' },
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

      {items.length === 0 ? (
        <Box className={styles.emptyState}>
          <Heart size={48} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Votre liste de favoris est vide
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Parcourez nos produits et ajoutez vos coups de cœur
          </Typography>
          <Button
            component={Link}
            href="/catalog"
            variant="contained"
            sx={{ mt: 2, bgcolor: '#D45D00', '&:hover': { bgcolor: '#A34800' } }}
          >
            Découvrir les produits
          </Button>
        </Box>
      ) : (
        <Box className={styles.wishlistGrid}>
          {items.map(({ product, addedAt }) => {
            const imageUrl = product.images?.[0]?.url || product.image || null;
            const hasDiscount = product.originalPrice && product.originalPrice > product.price;
            const discountPct = hasDiscount
              ? Math.round((1 - product.price / product.originalPrice!) * 100)
              : 0;

            return (
              <Box key={product.id} className={styles.wishlistCard}>
                <Box className={styles.wishlistImage}>
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="120px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Package size={48} />
                  )}
                  {hasDiscount && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        bgcolor: 'error.main',
                        color: '#fff',
                        borderRadius: 1,
                        px: 0.75,
                        py: 0.25,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                      }}
                    >
                      -{discountPct}%
                    </Box>
                  )}
                </Box>

                <Box className={styles.wishlistInfo}>
                  <Typography className={styles.wishlistName}>{product.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography className={styles.wishlistPrice}>
                      {formatPrice(product.price)}
                    </Typography>
                    {hasDiscount && (
                      <Typography
                        variant="body2"
                        sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                      >
                        {formatPrice(product.originalPrice!)}
                      </Typography>
                    )}
                  </Box>
                  {!product.inStock && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                      Rupture de stock
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Ajouté le {new Date(addedAt).toLocaleDateString('fr-FR')}
                  </Typography>
                </Box>

                <Box className={styles.wishlistActions}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ShoppingCart size={16} />}
                    disabled={!product.inStock}
                    onClick={() => addToCart(product, 1)}
                    sx={{ flex: 1, textTransform: 'none', bgcolor: '#D45D00', '&:hover': { bgcolor: '#A34800' } }}
                  >
                    Ajouter au panier
                  </Button>
                  <Tooltip title="Voir le produit">
                    <IconButton
                      size="small"
                      component={Link}
                      href={`/product/${product.slug}`}
                    >
                      <ExternalLink size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Retirer des favoris">
                    <IconButton
                      size="small"
                      sx={{ color: 'error.main' }}
                      onClick={() => removeItem(product.id)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
