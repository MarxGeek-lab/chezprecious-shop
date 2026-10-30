import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api-backend';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur : ajouter le token JWT à chaque requête
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Intercepteur : gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==========================================
// Auth API
// ==========================================

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatar: string | null;
  phone: string | null;
  isEmailVerified?: boolean;
  isActive?: boolean;
}

export interface LoginResponse {
  message: string;
  requiresConfirmation?: boolean;
  token?: string;
  user?: AuthUser;
}

export interface ConfirmLoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
  user: { id: string; email: string; fullName: string | null };
}

export interface MessageResponse {
  message: string;
}

export interface VerifyEmailResponse {
  exists: boolean;
}

// ==========================================
// Products API
// ==========================================

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductVideo {
  id: string;
  url: string;
  source: 'upload' | 'url';
  thumbnail: string | null;
  title: string | null;
  position: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  combination: Record<string, string>;
  price: number;
  stock: number;
  sku: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  condition: 'NEW' | 'REFURBISHED' | 'USED';
  warranty: string | null;
  originCountry: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  comparePrice: number | null;
  cost: number | null;
  taxRate: number;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight: number | null;
  dimensionLength: number | null;
  dimensionWidth: number | null;
  dimensionHeight: number | null;
  tags: string[];
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  discountPrice: number | null;
  discountStartAt: string | null;
  discountEndAt: string | null;
  images: ProductImage[];
  videos: ProductVideo[];
  variants: ProductVariant[];
  _count?: { variants: number };
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  score?: number;
  discount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductListResponse {
  products: ApiProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  minPrice?: number;
  maxPrice?: number;
}

export const productsApi = {
  // --- Seller (protégé JWT) ---
  list: (params?: ProductListParams) =>
    api.get<ProductListResponse>('/products', { params }),

  get: (id: string) =>
    api.get<{ product: ApiProduct }>(`/products/${id}`),

  create: (formData: FormData) =>
    api.post<{ message: string; product: ApiProduct }>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, formData: FormData) =>
    api.put<{ message: string; product: ApiProduct }>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/products/${id}`),

  deleteImage: (productId: string, imageId: string) =>
    api.delete<MessageResponse>(`/products/${productId}/images/${imageId}`),

  deleteVideo: (productId: string, videoId: string) =>
    api.delete<MessageResponse>(`/products/${productId}/videos/${videoId}`),

  setMainImage: (productId: string, imageId: string) =>
    api.patch<MessageResponse>(`/products/${productId}/images/${imageId}/main`),

  // --- Public (storefront) ---
  publicList: (params?: ProductListParams) =>
    api.get<ProductListResponse>('/catalog', { params }),

  publicShow: (slug: string) =>
    api.get<{ product: ApiProduct }>(`/catalog/${slug}`),

  publicSimilar: (slug: string, limit?: number) =>
    api.get<{ products: ApiProduct[] }>(`/catalog/${slug}/similar`, { params: { limit } }),
};

// ==========================================
// Reviews API
// ==========================================

export interface ApiReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string | null;
    avatar: string | null;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
}

export interface PublicReviewListResponse {
  reviews: ApiReview[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewListResponse {
  reviews: ApiReview[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateReviewPayload {
  productId: string;
  rating: number;
  title?: string;
  content?: string;
}

export interface UpdateReviewPayload {
  rating?: number;
  title?: string;
  content?: string;
}

export interface SellerReviewsResponse {
  reviews: ApiReview[];
  stats: {
    averageRating: number;
    totalReviews: number;
    verifiedReviews: number;
    responseRate: number;
    ratingDistribution: Record<number, number>;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const reviewsApi = {
  list: (params: { productId: string; page?: number; limit?: number; sort?: string }) =>
    api.get<ReviewListResponse>('/reviews', { params }),

  sellerList: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get<SellerReviewsResponse>('/reviews/seller/all', { params }),

  create: (data: CreateReviewPayload) =>
    api.post<{ message: string; review: ApiReview }>('/reviews', data),

  update: (id: string, data: UpdateReviewPayload) =>
    api.put<{ message: string; review: ApiReview }>(`/reviews/${id}`, data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/reviews/${id}`),

  helpful: (id: string) =>
    api.post<{ helpful: number }>(`/reviews/${id}/helpful`),

  publicList: (params?: { page?: number; limit?: number; rating?: number }) =>
    api.get<PublicReviewListResponse>('/reviews/public', { params }),
};

// ==========================================
// Categories API
// ==========================================

export interface ApiSubCategory {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  position: number;
  isActive: boolean;
  subCategories: ApiSubCategory[];
  productCount: number; // Maintenant obligatoire (renvoyé par le backend)
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  position?: number;
  isActive?: boolean;
}

export interface CreateSubCategoryPayload {
  categoryId: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  image?: string;
  position?: number;
  isActive?: boolean;
}

export const categoriesApi = {
  // Public
  list: () =>
    api.get<{ categories: ApiCategory[] }>('/categories'),

  show: (slug: string) =>
    api.get<{ category: ApiCategory }>(`/categories/${slug}`),

  // Admin
  adminList: () =>
    api.get<{ categories: ApiCategory[] }>('/categories/admin/all'),

  create: (data: CreateCategoryPayload) =>
    api.post<{ message: string; category: ApiCategory }>('/categories', data),

  update: (id: string, data: CreateCategoryPayload) =>
    api.put<{ message: string; category: ApiCategory }>(`/categories/${id}`, data),

  delete: (id: string) =>
    api.delete<MessageResponse>(`/categories/${id}`),

  // Sub-categories
  createSub: (data: CreateSubCategoryPayload) =>
    api.post<{ message: string; subCategory: ApiSubCategory }>('/categories/sub', data),

  updateSub: (id: string, data: Partial<CreateSubCategoryPayload>) =>
    api.put<{ message: string; subCategory: ApiSubCategory }>(`/categories/sub/${id}`, data),

  deleteSub: (id: string) =>
    api.delete<MessageResponse>(`/categories/sub/${id}`),
};

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<RegisterResponse>('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', data),

  activateAccount: (token: string) =>
    api.get<MessageResponse>(`/auth/activate/${token}`),

  forgotPassword: (data: ForgotPasswordPayload) =>
    api.post<MessageResponse>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload) =>
    api.post<MessageResponse>('/auth/reset-password', data),

  verifyEmail: (email: string) =>
    api.get<VerifyEmailResponse>(`/auth/verify-email/${encodeURIComponent(email)}`),

  confirmLogin: (token: string) =>
    api.get<ConfirmLoginResponse>(`/auth/confirm-login/${token}`),

  me: () =>
    api.get<{ user: AuthUser }>('/auth/me'),

  logout: () =>
    api.post<MessageResponse>('/auth/logout'),
};

// ==========================================
// Addresses API
// ==========================================

export interface ApiAddress {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string | null;
  street: string;
  city: string;
  postalCode: string | null;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label: string;
  fullName: string;
  phone?: string;
  street: string;
  city: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export const addressesApi = {
  list: () =>
    api.get<{ addresses: ApiAddress[] }>('/addresses'),

  create: (data: CreateAddressPayload) =>
    api.post<{ message: string; address: ApiAddress }>('/addresses', data),

  update: (id: string, data: UpdateAddressPayload) =>
    api.put<{ message: string; address: ApiAddress }>(`/addresses/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/addresses/${id}`),

  setDefault: (id: string) =>
    api.patch<{ message: string; address: ApiAddress }>(`/addresses/${id}/default`),
};

// ==========================================
// Upload API
// ==========================================

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ message: string; url: string }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ==========================================
// Promo Codes API
// ==========================================

export interface PromoValidateResponse {
  valid: boolean;
  code?: string;
  type?: 'PERCENTAGE' | 'FIXED';
  value?: number;
  discountAmount?: number;
  finalAmount?: number;
  message?: string;
}

export const promoApi = {
  validate: (code: string, orderAmount: number) =>
    api.post<PromoValidateResponse>('/promo-codes/validate', { code, orderAmount }),
};

// ==========================================
// Orders API
// ==========================================

export interface CreateOrderPayload {
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingNotes?: string;
  paymentMethod: 'MOBILE_MONEY' | 'CARD' | 'FEEXPAY_WALLET';
  paymentProvider?: string;
  mobileNumber?: string;
  promoCode?: string;
  items: Array<{
    productId: string;
    quantity: number;
    variantData?: any;
  }>;
}

export interface ApiOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  variantData: any;
  createdAt: string;
}

export interface ApiOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingNotes: string | null;
  subtotal: string;
  shippingCost: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
  paymentMethod: string;
  paymentProvider: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  status: string;
  items: ApiOrderItem[];
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export const ordersApi = {
  create: (data: CreateOrderPayload) =>
    api.post<{
      message: string;
      order: { id: string; orderNumber: string; total: string; currency: string };
      accountCreated: boolean;
      token?: string;
      user?: AuthUser;
    }>('/orders', data),

  list: () =>
    api.get<{ orders: ApiOrder[] }>('/orders'),

  show: (id: string) =>
    api.get<{ order: ApiOrder }>(`/orders/${id}`),

  sellerOrders: (params?: { from?: string; to?: string }) =>
    api.get<{ orders: ApiOrder[] }>('/orders/seller/all', { params }),
};

// ==========================================
// User API (any authenticated user)
// ==========================================

export interface ApiUserReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  };
}

export interface UpdateUserProfilePayload {
  fullName?: string;
  phone?: string;
}

export interface UpdateUserPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const userApi = {
  myReviews: () =>
    api.get<{ reviews: ApiUserReview[] }>('/user/reviews'),

  updateProfile: (data: UpdateUserProfilePayload) =>
    api.put<{ message: string; user: AuthUser }>('/user/profile', data),

  updatePassword: (data: UpdateUserPasswordPayload) =>
    api.put<{ message: string; token: string }>('/user/password', data),

  updateAvatar: (avatarUrl: string) =>
    api.put<{ message: string; user: AuthUser }>('/user/avatar', { avatarUrl }),
};

// ==========================================
// Homepage API
// ==========================================

export interface HomepageStats {
  productCount: number;
  userCount: number;
  avgRating: number;
}

// ==========================================
// Homepage Config (contenu dynamique CMS)
// ==========================================

export interface HomepageBannerConfig {
  id: string;
  isActive: boolean;
  variant: 'primary' | 'secondary' | 'gradient';
  imageUrl: string;
  badgeText: string;
  title: string;
  titleHighlight: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  priceLabel: string;
  priceValue: string;
  discountBadge: string;
  feature1: string;
  feature2: string;
}

export interface FlashSaleConfig {
  isActive: boolean;
  endDate: string; // ISO 8601
  promoCode: string;
  promoCodeLabel: string;
  maxDiscountPercent: number;
  bannerBadge: string;
}

export interface AdSectionConfig {
  largeBanner: {
    isActive: boolean;
    imageUrl: string;
    badgeText: string;
    title: string;
    titleHighlight: string;
    description: string;
    ctaLabel: string;
    ctaLink: string;
    showTimer: boolean;
  };
  giftCardBanner: {
    isActive: boolean;
    title: string;
    description: string;
    ctaLink: string;
  };
  newArrivalsBanner: {
    isActive: boolean;
    imageUrl: string;
    title: string;
    description: string;
    ctaLink: string;
  };
}

export interface HomepageConfigResponse {
  config: {
    homepageBanners: HomepageBannerConfig[] | null;
    flashSaleConfig: FlashSaleConfig | null;
    adSectionConfig: AdSectionConfig | null;
  };
}

export interface HomepageProductsResponse {
  data: ApiProduct[];
  meta: {
    total: number;
  };
}

export const homepageApi = {
  featured: (limit?: number) =>
    api.get<HomepageProductsResponse>('/homepage/featured', { params: { limit } }),

  newProducts: (limit?: number) =>
    api.get<HomepageProductsResponse>('/homepage/new', { params: { limit } }),

  promotions: (limit?: number) =>
    api.get<HomepageProductsResponse>('/homepage/promotions', { params: { limit } }),

  bestSellers: (limit?: number) =>
    api.get<HomepageProductsResponse>('/homepage/best-sellers', { params: { limit } }),

  recommended: (limit?: number) =>
    api.get<HomepageProductsResponse>('/homepage/recommended', { params: { limit } }),

  stats: () =>
    api.get<{ data: HomepageStats }>('/homepage/stats'),

  config: () =>
    api.get<HomepageConfigResponse>('/homepage/config'),
};

// ==========================================
// Search API (Advanced)
// ==========================================

export interface SearchParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'popular';
  page?: number;
  limit?: number;
}

export interface ImageSearchPayload {
  image?: File;
  imageUrl?: string;
  limit?: number;
}

export const searchApi = {
  // Recherche textuelle avancée
  search: (params: SearchParams) =>
    api.get<ProductListResponse>('/catalog', { params }),

  // Recherche par image — fichier uploadé ou URL distante
  searchByImage: (payload: ImageSearchPayload) => {
    const formData = new FormData();
    if (payload.image) {
      formData.append('image', payload.image);
    }
    if (payload.imageUrl) {
      formData.append('imageUrl', payload.imageUrl);
    }
    if (payload.limit) {
      formData.append('limit', payload.limit.toString());
    }
    return api.post<HomepageProductsResponse>('/search/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Suggestions de recherche
  suggestions: (query: string) =>
    api.get<{ suggestions: string[] }>('/search/suggestions', { params: { query } }),
};

// ==========================================
// Site Settings API (public)
// ==========================================

export interface PublicSiteSettings {
  siteName: string;
  siteSlogan: string | null;
  siteDescription: string | null;
  logo: string | null;
  contactEmail: string | null;
  phoneMain: string | null;
  phoneWhatsapp: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  businessHours: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export const settingsApi = {
  public: () =>
    api.get<{ settings: PublicSiteSettings }>('/settings/public'),
};

// ==========================================
// Stores publics API
// ==========================================

export interface ApiStorePublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  banner: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  deliveryZones: string[];
  shippingMethods: string[];
  createdAt: string;
  productCount: number;
  totalOrders: number;
  rating: number;
  reviewCount: number;
}

export interface ApiStoreListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo: string | null;
  banner: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  productCount: number;
}

export interface StoreProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  search?: string;
}

export interface StoreProductsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const storesApi = {
  list: (params?: { page?: number; limit?: number; category?: string }) =>
    api.get<{ stores: ApiStoreListItem[]; meta: StoreProductsMeta }>('/stores', { params }),

  show: (slug: string) =>
    api.get<{ store: ApiStorePublic }>(`/stores/${slug}`),

  products: (slug: string, params?: StoreProductsParams) =>
    api.get<{ products: ApiProduct[]; meta: StoreProductsMeta }>(`/stores/${slug}/products`, { params }),

  contact: (slug: string, payload: { name: string; email: string; phone?: string; message: string }) =>
    api.post<{ message: string }>(`/stores/${slug}/contact`, payload),
};

// ==========================================
// Contact API
// ==========================================

export const contactApi = {
  send: (payload: { name: string; email: string; phone?: string; subject: string; message: string }) =>
    api.post<{ message: string }>('/homepage/contact', payload),
};

// ==========================================
// Newsletter API (public)
// ==========================================

export const newsletterApi = {
  subscribe: (payload: { email: string; name?: string }) =>
    api.post<{ message: string }>('/newsletter/subscribe', payload),
  unsubscribe: (token: string) =>
    api.get<{ message: string }>('/newsletter/unsubscribe', { params: { token } }),
};

// ==========================================
// Messages API (Seller ↔ Client)
// ==========================================

export interface ApiMessage {
  id: string;
  sellerId: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  senderRole: 'seller' | 'customer';
  body: string;
  isReadBySeller: boolean;
  isReadByCustomer: boolean;
  createdAt: string;
}

export interface ApiConversation {
  customerEmail: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ApiCustomerConversation {
  sellerId: string;
  sellerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export const messagesApi = {
  // ── Seller ──────────────────────────────────
  conversations: () =>
    api.get<{ conversations: ApiConversation[] }>('/messages'),

  thread: (customerEmail: string) =>
    api.get<{ messages: ApiMessage[] }>(`/messages/${encodeURIComponent(customerEmail)}`),

  send: (payload: { customerEmail: string; customerName: string; body: string }) =>
    api.post<{ message: ApiMessage }>('/messages', payload),

  unreadCount: () =>
    api.get<{ count: number }>('/messages/unread-count'),

  // ── Client ──────────────────────────────────
  customerConversations: () =>
    api.get<{ conversations: ApiCustomerConversation[] }>('/customer/messages'),

  customerThread: () =>
    api.get<{ messages: ApiMessage[]; store: { name: string; logo: string | null } | null }>(
      `/customer/messages/thread`
    ),

  customerSend: (payload: { body: string }) =>
    api.post<{ message: ApiMessage }>('/customer/messages', payload),
};

// ==========================================
// Boosts / Mise en avant
// ==========================================

export type BoostType = 'HOMEPAGE' | 'CATEGORY' | 'SEARCH' | 'STORE';
export type BoostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface ApiBoost {
  id: string;
  sellerId: string;
  productId: string | null;
  type: BoostType;
  status: BoostStatus;
  durationDays: number;
  price: string;
  currency: string;
  paymentRef: string | null;
  startsAt: string | null;
  endsAt: string | null;
  adminNote: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    images: { url: string }[];
  } | null;
}

export type BoostPricing = Record<BoostType, Record<string, number>>;

export const boostsApi = {
  // Tarifs publics
  pricing: () =>
    api.get<{ pricing: BoostPricing }>('/boosts/pricing'),

  // Seller — lister ses boosts
  list: () =>
    api.get<{ boosts: ApiBoost[] }>('/boosts'),

  // Seller — créer un boost
  create: (payload: { type: BoostType; durationDays: number; productId?: string; paymentRef?: string }) =>
    api.post<{ boost: ApiBoost; message: string }>('/boosts', payload),

  // Seller — annuler un boost PENDING
  cancel: (id: string) =>
    api.delete<{ message: string }>(`/boosts/${id}/cancel`),

  // Seller — définir/supprimer prix promo sur un produit
  setDiscount: (productId: string, payload: { discountPrice?: number | null; discountStartAt?: string | null; discountEndAt?: string | null }) =>
    api.patch<{ product: ApiProduct }>(`/boosts/products/${productId}/discount`, payload),

  // Seller — toggle vedette d'un produit
  toggleFeatured: (productId: string) =>
    api.patch<{ isFeatured: boolean }>(`/boosts/products/${productId}/featured`, {}),

  // Public — produits boostés par type (homepage spotlight)
  spotlight: (type: BoostType = 'HOMEPAGE', limit = 8) =>
    api.get<{ data: ApiProduct[] }>(`/homepage/spotlight?type=${type}&limit=${limit}`),
};

// ==========================================
// Notifications API
// ==========================================

export type NotificationType =
  | 'ORDER_NEW'
  | 'ORDER_PAID'
  | 'ORDER_STATUS'
  | 'REVIEW_NEW'
  | 'MESSAGE_NEW'
  | 'STOCK_LOW'
  | 'BOOST_APPROVED'
  | 'BOOST_EXPIRED'
  | 'SYSTEM';

export interface ApiNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  resourceId: string | null;
  resourceUrl: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: ApiNotification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
}

export const notificationsApi = {
  list: (params?: { page?: number; limit?: number; unread?: boolean }) =>
    api.get<NotificationListResponse>('/notifications', { params }),

  unreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),

  markRead: (id: string) =>
    api.patch<{ message: string }>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.patch<{ message: string }>('/notifications/read-all', {}),

  deleteOne: (id: string) =>
    api.delete<{ message: string }>(`/notifications/${id}`),

  deleteRead: () =>
    api.delete<{ message: string }>('/notifications/read'),
};

// ── Broadcast (Seller) ───────────────────────────────────────────────────────

export interface BroadcastCustomer {
  email: string;
  name: string;
  userId: string | null;
}

export interface BroadcastSendPayload {
  subject: string;
  htmlBody: string;
  recipientType: 'all' | 'selected';
  recipientIds?: string[];
}

export interface BroadcastSendResponse {
  message: string;
  sent: number;
  failed: number;
  total: number;
}

export const broadcastApi = {
  customers: () =>
    api.get<{ customers: BroadcastCustomer[]; total: number }>('/seller/broadcast/customers'),

  send: (payload: BroadcastSendPayload) =>
    api.post<BroadcastSendResponse>('/seller/broadcast', payload),
};

// ==========================================
// Seller Team API
// ==========================================

export type StoreMemberRole = 'MANAGER' | 'STAFF';

export interface ApiStoreMember {
  id: string;
  email: string;
  fullName: string | null;
  role: StoreMemberRole;
  isActive: boolean;
  isPending: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InviteTeamMemberPayload {
  email: string;
  fullName?: string;
  role?: StoreMemberRole;
}

export interface UpdateTeamMemberPayload {
  role?: StoreMemberRole;
  isActive?: boolean;
  fullName?: string;
}

export interface VerifyTeamTokenResponse {
  valid: boolean;
  email: string;
  fullName: string | null;
  role: StoreMemberRole;
  storeName: string;
  storeLogo: string | null;
}

export const sellerTeamApi = {
  list: () =>
    api.get<{ members: ApiStoreMember[] }>('/seller/team'),

  invite: (payload: InviteTeamMemberPayload) =>
    api.post<{ message: string; member: ApiStoreMember }>('/seller/team/invite', payload),

  update: (id: string, payload: UpdateTeamMemberPayload) =>
    api.patch<{ message: string; member: ApiStoreMember }>(`/seller/team/${id}`, payload),

  remove: (id: string) =>
    api.delete<{ message: string }>(`/seller/team/${id}`),

  resendInvite: (id: string) =>
    api.post<{ message: string }>(`/seller/team/${id}/resend`),

  // Routes publiques (sans auth)
  verifyToken: (token: string) =>
    api.post<VerifyTeamTokenResponse>('/team/verify-token', { token }),

  setPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/team/set-password', { token, password }),

  login: (email: string, password: string) =>
    api.post<TeamLoginResponse>('/team/login', { email, password }),
};

export interface TeamLoginResponse {
  token: string;
  member: {
    id: string;
    email: string;
    fullName: string | null;
    role: 'MANAGER' | 'STAFF';
    storeId: string;
    storeName: string;
    storeSlug: string | null;
    storeLogo: string | null;
  };
}

// ==========================================
// Store Activity Log API
// ==========================================

export type StoreActivityAction =
  | 'STORE_UPDATED'
  | 'STORE_RESUBMITTED'
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'PRODUCT_DELETED'
  | 'PRODUCT_STATUS_CHANGED'
  | 'ORDER_RECEIVED'
  | 'ORDER_STATUS_CHANGED'
  | 'TEAM_MEMBER_INVITED'
  | 'TEAM_MEMBER_UPDATED'
  | 'TEAM_MEMBER_REMOVED'
  | 'TEAM_INVITE_RESENT'
  | 'TEAM_MEMBER_JOINED'
  | 'BOOST_CREATED'
  | 'BOOST_CANCELLED'
  | 'DISCOUNT_SET'
  | 'DISCOUNT_REMOVED'
  | 'PRODUCT_FEATURED_TOGGLED'
  | 'BROADCAST_SENT';

export interface ApiStoreActivityLog {
  id: string;
  storeId: string;
  actorType: 'owner' | 'member';
  actorId: string;
  actorName: string | null;
  actorEmail: string | null;
  action: StoreActivityAction;
  entity: string | null;
  entityId: string | null;
  entityLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface StoreActivityResponse {
  logs: ApiStoreActivityLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sellerActivityApi = {
  list: (params?: { page?: number; limit?: number; action?: StoreActivityAction }) =>
    api.get<StoreActivityResponse>('/seller/activity', { params }),
};
