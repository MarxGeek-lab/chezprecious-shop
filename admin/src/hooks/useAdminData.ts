'use client';

// ==============================================
// HOOKS — Données admin (users, sellers, products, orders, categories, boosts)
// ==============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';

// ── Boost types ───────────────────────────────

export type BoostType   = 'HOMEPAGE' | 'CATEGORY' | 'SEARCH' | 'STORE';
export type BoostStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';

export interface AdminBoost {
  id: string;
  type: BoostType;
  status: BoostStatus;
  durationDays: number;
  price: number;
  currency: string;
  paymentRef: string | null;
  adminNote: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  seller: { id: string; fullName: string | null; email: string; avatar: string | null };
  product: {
    id: string; name: string; slug: string; status: string;
    images: { url: string }[];
    store: { id: string; name: string; slug: string };
  } | null;
}

export interface AdminBoostStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revenue: number;
}

export interface BoostPricing {
  HOMEPAGE: Record<string, number>;
  CATEGORY: Record<string, number>;
  SEARCH:   Record<string, number>;
  STORE:    Record<string, number>;
}

export interface AdminBoostsParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  search?: string;
}

// ── Types ──────────────────────────────────────

export interface AdminUser {
  id: string;
  fullName: string | null;
  email: string;
  role: 'USER' | 'SELLER';
  status: 'active' | 'inactive';
  avatar: string | null;
  phone: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  id: string;
  fullName: string | null;
  email: string;
  role: 'USER' | 'SELLER';
  status: 'active' | 'inactive';
  isEmailVerified: boolean;
  avatar: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    name: string;
    slug: string | null;
    logo: string | null;
    banner: string | null;
    description: string | null;
    category: string | null;
    city: string | null;
    country: string | null;
    address: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    productCount: number;
    createdAt: string;
  } | null;
  addresses: {
    id: string;
    label: string;
    fullName: string;
    phone: string | null;
    street: string;
    city: string;
    country: string;
    isDefault: boolean;
  }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
    product: { id: string; name: string; slug: string };
  }[];
  orders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    itemCount: number;
    createdAt: string;
  }[];
  stats: {
    orderCount: number;
    totalSpent: number;
    reviewCount: number;
    addressCount: number;
  };
}

export interface AdminUserStats {
  total: number;
  active: number;
  inactive: number;
  sellers: number;
}

export interface AdminSeller {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  category: string | null;
  city: string | null;
  country: string | null;
  owner: { id: string; fullName: string | null; email: string };
  productCount: number;
  createdAt: string;
}

export interface AdminSellerDetail {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  logo: string | null;
  banner: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  deliveryZones: string[];
  shippingMethods: string[];
  siretDocument: string | null;
  rccmDocument: string | null;
  idDocument: string | null;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    isActive: boolean;
    status: 'active' | 'inactive';
    createdAt: string;
  };
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    status: string;
    mainImage: string | null;
  }[];
  stats: {
    productCount: number;
    orderCount: number;
    totalRevenue: number;
  };
  recentOrders: {
    orderId: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    customerName: string;
    customerEmail: string;
    createdAt: string;
  }[];
}

export interface AdminSellerStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'INACTIVE';
  isFeatured: boolean;
  mainImage: string | null;
  category: string | null;
  store: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export interface AdminProductDetail {
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
  discountPrice: number | null;
  discountStartAt: string | null;
  discountEndAt: string | null;
  stock: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  weight: number | null;
  taxRate: number;
  tags: string[];
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' | 'INACTIVE';
  isFeatured: boolean;
  mainImage: string | null;
  createdAt: string;
  updatedAt: string;
  reviewCount: number;
  variantCount: number;
  store: { id: string; name: string; slug: string; logo: string | null; status: string } | null;
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: { id: string; combination: unknown; price: number; stock: number; sku: string | null; isActive: boolean }[];
  reviews: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
    user: { fullName: string | null; email: string; avatar: string | null };
  }[];
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  itemCount: number;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingNotes: string | null;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentProvider: string | null;
  paymentStatus: string;
  paymentReference: string | null;
  paidAt: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productName: string;
    productImage: string | null;
    storeId: string | null;
    store: { id: string; name: string; slug: string } | null;
    product: { id: string; name: string; slug: string } | null;
  }[];
}

export interface AdminSubCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  isActive: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  description: string | null;
  isActive: boolean;
  subCategoryCount: number;
  productCount: number;
  subCategories: AdminSubCategory[];
  createdAt: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: number;
}

// ── Params communs ─────────────────────────────

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | undefined;
}

// ════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════

interface DashboardTopSeller {
  rank: number;
  id: string;
  name: string;
  logo: string | null;
  status: string;
  productCount: number;
  revenue: number;
  orderCount: number;
}

interface DashboardTopProduct {
  rank: number;
  id: string;
  name: string;
  slug: string;
  image: string | null;
  revenue: number;
  soldCount: number;
}

export interface AdminDashboard {
  kpis: {
    revenue:  { value: number; trend: number | null };
    orders:   { value: number; trend: number | null };
    users:    { value: number; newThisMonth: number; trend: number | null };
    products: { value: number };
    sellers:  { value: number };
    totalRevenue: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
  }[];
  topSellers: DashboardTopSeller[];
  topProducts: DashboardTopProduct[];
  revenueChart: { month: string; revenue: number; orders: number }[];
  categoryChart: { name: string; value: number }[];
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get<AdminDashboard>('/admin/dashboard');
      return data;
    },
    staleTime: 60_000,
  });
}

// ════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════

export interface AdminAnalytics {
  period: { from: string; to: string };
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalSellers: number;
    activeProducts: number;
    revenueThisMonth: { value: number; trend: number | null };
    ordersThisMonth: { value: number; trend: number | null };
    newUsersThisMonth: { value: number; trend: number | null };
  };
  revenueChart: { month: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number; revenue: number }[];
  topProducts: DashboardTopProduct[];
  topSellers: DashboardTopSeller[];
  categoryStats: { name: string; productCount: number }[];
}

export interface AnalyticsParams {
  from?: string; // ISO date string YYYY-MM-DD
  to?:   string;
}

export function useAdminAnalytics(params: AnalyticsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: async () => {
      const { data } = await api.get<AdminAnalytics>('/admin/analytics', { params });
      return data;
    },
    staleTime: 120_000,
  });
}

// ════════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════════

export function useAdminUsers(params: ListParams & { role?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminUser[]; meta: PaginatedMeta }>('/admin/users', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminUserStats() {
  return useQuery({
    queryKey: ['admin', 'users', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminUserStats>('/admin/users/stats');
      return data;
    },
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const { data } = await api.get<{ user: AdminUserDetail }>(`/admin/users/${id}`);
      return data.user;
    },
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; fullName?: string; phone?: string; email?: string }) =>
      api.patch<{ user: AdminUser }>(`/admin/users/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users', vars.id] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ════════════════════════════════════════════════
// SELLERS
// ════════════════════════════════════════════════

export function useAdminSellers(params: ListParams & { status?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'sellers', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminSeller[]; meta: PaginatedMeta }>('/admin/sellers', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminSellerStats() {
  return useQuery({
    queryKey: ['admin', 'sellers', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<AdminSellerStats>('/admin/sellers/stats');
      return data;
    },
  });
}

export function useAdminSeller(id: string) {
  return useQuery({
    queryKey: ['admin', 'sellers', id],
    queryFn: async () => {
      const { data } = await api.get<{ seller: AdminSellerDetail }>(`/admin/sellers/${id}`);
      return data.seller;
    },
    enabled: !!id,
  });
}

export function useUpdateSellerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/sellers/${id}/status`, { status, reason }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'sellers'] });
      qc.invalidateQueries({ queryKey: ['admin', 'sellers', vars.id] });
    },
  });
}

export function useToggleSellerActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/sellers/${id}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'sellers'] });
    },
  });
}

// ════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════

export function useAdminProducts(params: ListParams & { status?: string; storeId?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminProduct[]; meta: PaginatedMeta & { active: number; draft: number; outOfStock: number } }>('/admin/products', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminProduct(id: string) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: async () => {
      const { data } = await api.get<{ product: AdminProductDetail }>(`/admin/products/${id}`);
      return data.product;
    },
    enabled: !!id,
  });
}

export function useUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/admin/products/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products', vars.id] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export async function exportProductsCsv(params: { status?: string; storeId?: string; search?: string } = {}) {
  const { data } = await api.get('/admin/products/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'produits.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════
// ORDERS
// ════════════════════════════════════════════════

export function useAdminOrders(params: ListParams & { status?: string; paymentStatus?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminOrder[]; meta: PaginatedMeta & { pending: number; processing: number; delivered: number; cancelled: number } }>('/admin/orders', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: async () => {
      const { data } = await api.get<{ order: AdminOrderDetail }>(`/admin/orders/${id}`);
      return data.order;
    },
    enabled: !!id,
  });
}

export async function exportOrdersCsv(params: { status?: string; paymentStatus?: string; search?: string } = {}) {
  const { data } = await api.get('/admin/orders/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'commandes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportUsersCsv(params: { role?: string; status?: string; search?: string } = {}) {
  const { data } = await api.get('/admin/users/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'utilisateurs.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSellersCsv(params: { status?: string; search?: string } = {}) {
  const { data } = await api.get('/admin/sellers/export', { params, responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vendeurs.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════

export function useAdminCategories(params: { search?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'categories', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: AdminCategory[]; meta: { total: number; active: number; totalProducts: number } }>('/admin/categories', { params });
      return data;
    },
    placeholderData: (prev) => prev,
    select: (data) => ({
      ...data,
      data: data.data.map((c) => ({
        ...c,
        subCategories: c.subCategories ?? [],
        description: c.description ?? null,
      })),
    }),
  });
}

export function useToggleCategoryActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/admin/categories/${id}/toggle-active`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; slug?: string; description?: string; icon?: string; image?: string }) =>
      api.post<{ category: AdminCategory }>('/admin/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; slug?: string; description?: string; icon?: string; image?: string }) =>
      api.put<{ category: AdminCategory }>(`/admin/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useCreateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ...body }: { categoryId: string; name: string; slug?: string; description?: string; icon?: string }) =>
      api.post<{ subCategory: AdminSubCategory }>(`/admin/categories/${categoryId}/sub-categories`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useUpdateSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; name?: string; slug?: string; description?: string; icon?: string }) =>
      api.put<{ subCategory: AdminSubCategory }>(`/admin/sub-categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

export function useDeleteSubCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sub-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });
}

// ── Boosts ────────────────────────────────────

export function useAdminBoosts(params: AdminBoostsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'boosts', params],
    queryFn: () => api.get<{ boosts: AdminBoost[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      '/admin/boosts',
      { params },
    ),
    staleTime: 30_000,
  });
}

export function useAdminBoostStats() {
  return useQuery({
    queryKey: ['admin', 'boosts', 'stats'],
    queryFn: () => api.get<AdminBoostStats>('/admin/boosts/stats'),
    staleTime: 30_000,
  });
}

export function useApproveBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      api.patch(`/admin/boosts/${id}/approve`, { adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'boosts'] });
    },
  });
}

export function useRejectBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      api.patch(`/admin/boosts/${id}/reject`, { adminNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'boosts'] });
    },
  });
}

export function useUpdateBoostPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pricing: BoostPricing) => api.put('/admin/boosts/pricing', { pricing }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'boosts'] });
    },
  });
}

export function useFeatureProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      api.patch(`/admin/products/${id}/feature`, { isFeatured }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'boosts'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useAdminBoostPricing() {
  return useQuery({
    queryKey: ['boost', 'pricing'],
    queryFn: () => api.get<{ pricing: BoostPricing }>('/boosts/pricing'),
    staleTime: 300_000,
  });
}

export function useAdminSetDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, discountPrice, discountStartAt, discountEndAt }: {
      id: string;
      discountPrice: number | null;
      discountStartAt: string | null;
      discountEndAt: string | null;
    }) => {
      const { data } = await api.patch(`/admin/products/${id}/discount`, { discountPrice, discountStartAt, discountEndAt });
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'product', vars.id] });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useAdminCreateBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, type, durationDays }: {
      productId: string;
      type: BoostType;
      durationDays: number;
    }) => {
      const { data } = await api.post(`/admin/products/${productId}/boosts`, { type, durationDays });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'boosts'] });
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useProductBoosts(productId: string) {
  return useQuery({
    queryKey: ['admin', 'boosts', 'product', productId],
    queryFn: async () => {
      const { data } = await api.get<{ boosts: AdminBoost[]; meta: any }>(
        `/admin/boosts?productId=${productId}&limit=10`
      );
      return data.boosts ?? [];
    },
    enabled: !!productId,
  });
}

// ════════════════════════════════════════════════
// MESSAGES (admin ↔ utilisateurs)
// ════════════════════════════════════════════════

export interface AdminConversationUser {
  id: string;
  fullName: string | null;
  email: string;
  avatar: string | null;
  role: string;
  store: { id: string; name: string; logo: string | null; slug: string | null } | null;
}

export interface AdminConversation {
  userId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  senderRole: 'admin' | 'user' | null;
  unreadByAdmin: number;
  unreadByUser: number;
  user: AdminConversationUser;
}

export interface AdminMessage {
  id: string;
  adminId: string;
  userId: string;
  senderRole: 'admin' | 'user';
  body: string;
  isReadByAdmin: boolean;
  isReadByUser: boolean;
  createdAt: string;
}

export interface AdminMessageStats {
  totalMessages: number;
  totalConversations: number;
  unreadByAdmin: number;
}

export function useAdminConversations(params: { search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['admin', 'messages', params],
    queryFn: () => api.get<{
      conversations: AdminConversation[];
      meta: PaginatedMeta;
    }>('/admin/messages', { params }),
    placeholderData: (prev) => prev,
    refetchInterval: 15_000,
  });
}

export function useAdminMessageStats() {
  return useQuery({
    queryKey: ['admin', 'messages', 'stats'],
    queryFn: () => api.get<AdminMessageStats>('/admin/messages/stats'),
    staleTime: 30_000,
  });
}

export function useAdminMessageThread(userId: string) {
  return useQuery({
    queryKey: ['admin', 'messages', 'thread', userId],
    queryFn: () => api.get<{
      messages: AdminMessage[];
      user: AdminConversationUser | null;
    }>(`/admin/messages/${userId}`),
    enabled: !!userId,
    refetchInterval: 5_000,
  });
}

export function useAdminSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; body: string }) =>
      api.post('/admin/messages/send', data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'messages'] });
      qc.invalidateQueries({ queryKey: ['admin', 'messages', 'thread', vars.userId] });
    },
  });
}

// ── Activity Log ───────────────────────────────

export interface ActivityLog {
  id: string;
  adminId: string | null;
  adminEmail: string | null;
  adminRole: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ActivityLogsParams {
  page?: number;
  limit?: number;
  adminId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
}

// ── Admin Notifications ─────────────────────────
export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  resourceId: string | null;
  resourceUrl: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; email: string; avatar: string | null };
}

export interface AdminNotificationsParams {
  page?: number;
  limit?: number;
  type?: string;
  read?: string;
}

export function useAdminNotifications(params: AdminNotificationsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'notifications', params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params.page)  p.set('page',  String(params.page));
      if (params.limit) p.set('limit', String(params.limit));
      if (params.type)  p.set('type',  params.type);
      if (params.read !== undefined && params.read !== '') p.set('read', params.read);
      const { data } = await api.get<{
        notifications: AdminNotification[];
        meta: { total: number; unread: number; page: number; limit: number; totalPages: number };
      }>(`/admin/notifications?${p}`);
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useAdminSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { userId?: string; type?: string; title: string; body: string }) =>
      api.post('/admin/notifications/send', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });
}

// ── Activity Log ────────────────────────────────
export function useActivityLogs(params: ActivityLogsParams = {}) {
  return useQuery({
    queryKey: ['admin', 'activity-logs', params],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params.page)    p.set('page',    String(params.page));
      if (params.limit)   p.set('limit',   String(params.limit));
      if (params.adminId) p.set('adminId', params.adminId);
      if (params.action)  p.set('action',  params.action);
      if (params.entity)  p.set('entity',  params.entity);
      if (params.from)    p.set('from',    params.from);
      if (params.to)      p.set('to',      params.to);
      const { data } = await api.get<{
        data: ActivityLog[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/admin/activity-logs?${p}`);
      return data;
    },
    refetchInterval: 30000,
  });
}

// ── Global Search ────────────────────────────────
export type SearchType = 'all' | 'users' | 'sellers' | 'products' | 'orders';

export interface SearchResults {
  users:    Array<{ id: string; fullName: string | null; email: string; avatar: string | null; isActive: boolean }>;
  sellers:  Array<{ id: string; name: string; logo: string | null; status: string; userEmail: string | null }>;
  products: Array<{ id: string; name: string; slug: string; status: string; storeName: string | null }>;
  orders:   Array<{ id: string; orderNumber: string; customerName: string; customerEmail: string; status: string; total: number }>;
}

export function useAdminSearch(q: string, type: SearchType) {
  return useQuery({
    queryKey: ['admin', 'search', q, type],
    queryFn: async () => {
      const { data } = await api.get<SearchResults>(
        `/admin/search?q=${encodeURIComponent(q)}&type=${type}`
      );
      return data;
    },
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
}

// ── Security Stats ───────────────────────────────
export interface SecurityStats {
  totalLogins: number;
  failedLogins24h: number;
  blockedLogins24h: number;
  lockedAdmins: number;
  activeAdmins: number;
  recentFailedLogs: Array<{
    adminEmail: string | null;
    action: string;
    metadata: unknown;
    createdAt: string;
  }>;
}

export function useSecurityStats() {
  return useQuery({
    queryKey: ['admin', 'security-stats'],
    queryFn: async () => {
      const { data } = await api.get<SecurityStats>('/admin/security-stats');
      return data;
    },
    refetchInterval: 60000,
  });
}

// ── Public Categories (for product forms) ───────
export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'public'],
    queryFn: async () => {
      const { data } = await api.get<{
        categories: Array<{ slug: string; name: string; subCategories: Array<{ slug: string; name: string }> }>;
      }>('/categories');
      return data.categories;
    },
    staleTime: 5 * 60_000,
  });
}

// ── Admin Product Mutations ──────────────────────
export function useAdminCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/admin/products/admin-create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useAdminUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.put(`/admin/products/admin-update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['admin', 'product', id] });
    },
  });
}

export function useAdminProductForEdit(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const { data } = await api.get<{ product: any }>(`/admin/products/${id}`);
      return data.product;
    },
    enabled: !!id,
  });
}

export function useAdminDeleteProductImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await api.delete(`/admin/products/${productId}/images/${imageId}`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'product', vars.productId] });
    },
  });
}

export function useAdminDeleteProductVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, videoId }: { productId: string; videoId: string }) => {
      const { data } = await api.delete(`/admin/products/${productId}/videos/${videoId}`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'product', vars.productId] });
    },
  });
}

export function useAdminSetMainImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, imageId }: { productId: string; imageId: string }) => {
      const { data } = await api.patch(`/admin/products/${productId}/images/${imageId}/main`);
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'product', vars.productId] });
    },
  });
}

// ── Abandoned Carts ───────────────────────────────────────────────────────────

export interface AdminAbandonedCart {
  id: string;
  email: string;
  firstName: string | null;
  userId: string | null;
  cartData: any[];
  cartTotal: string;
  itemCount: number;
  recoveryToken: string;
  isRecovered: boolean;
  recoveredAt: string | null;
  firstReminderSentAt: string | null;
  secondReminderSentAt: string | null;
  abandonedAt: string;
  createdAt: string;
}

export interface AdminAbandonedCartsResponse {
  data: AdminAbandonedCart[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  stats: { total: number; recovered: number; pending: number; avgCartTotal: number };
}

export function useAdminAbandonedCarts(params: { page?: number; limit?: number; status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ['admin', 'abandoned-carts', params],
    queryFn: async () => {
      const { data } = await api.get<AdminAbandonedCartsResponse>('/admin/abandoned-carts', { params });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useAdminSendCartReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reminder }: { id: string; reminder: 1 | 2 }) => {
      const { data } = await api.post(`/admin/abandoned-carts/${id}/send-reminder`, { reminder });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'abandoned-carts'] }),
  });
}

export function useAdminSendAllReminders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/admin/abandoned-carts/send-all');
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'abandoned-carts'] }),
  });
}
