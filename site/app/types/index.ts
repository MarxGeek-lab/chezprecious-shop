// ==============================================
// TYPES - Définitions TypeScript
// ==============================================

// Type pour les médias (images/vidéos) - support upload ou lien externe
export type MediaSource = 'upload' | 'url';

export interface ProductMedia {
  id: string;
  url: string;               // URL du fichier (uploadé ou externe)
  source: MediaSource;       // 'upload' = fichier uploadé, 'url' = lien externe
  alt?: string;              // Texte alternatif pour accessibilité
  isPrimary?: boolean;       // Image principale du produit
}

export interface ProductVideo {
  id: string;
  url: string;               // URL de la vidéo (uploadée ou externe)
  source: MediaSource;       // 'upload' = fichier uploadé, 'url' = lien externe (YouTube, Vimeo, etc.)
  thumbnail?: string;        // Miniature de la vidéo
  title?: string;            // Titre de la vidéo
}

// Produit
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;    // Prix avant réduction
  discount?: number;         // Pourcentage de réduction

  // Médias du produit (max 5 images, max 2 vidéos)
  image: string;             // Image principale (rétrocompatibilité)
  images: ProductMedia[];    // Jusqu'à 5 images (upload ou lien)
  videos?: ProductVideo[];   // Jusqu'à 2 vidéos (upload ou lien)

  category: string;
  categoryId: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  isPromo?: boolean;
  tags?: string[];
  createdAt: string;
}

// Catégorie
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  image?: string;
  productCount: number;
  parentId?: string;
}

// Slide Hero
export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  backgroundColor?: string;
}

// Bannière publicitaire
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
  position?: 'full' | 'left' | 'right' | 'inline';
}

// Publicité
export interface Advertisement {
  id: string;
  title: string;
  image: string;
  link: string;
  position: 'sidebar' | 'inline' | 'banner';
  size: 'small' | 'medium' | 'large';
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// Panier
export interface CartItem {
  product: Product;
  quantity: number;
}

// Utilisateur
export type UserRole = 'USER' | 'SELLER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Props communes
export interface SectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
  showRating?: boolean;
  showBadge?: boolean;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
}

export interface CategoryCardProps {
  category: Category;
  variant?: 'default' | 'compact' | 'icon-only';
}

export interface BannerProps {
  banner: Banner;
  className?: string;
}

// SEO
export interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
}
