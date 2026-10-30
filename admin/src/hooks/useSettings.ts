'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/src/lib/api';

const SETTINGS_KEY = ['admin', 'settings'];

// ==========================================
// Types pour le contenu dynamique homepage
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

export interface SiteSettings {
  id: string;
  siteName: string;
  siteSlogan: string | null;
  siteDescription: string | null;
  siteUrl: string | null;
  language: string;
  timezone: string;
  logo: string | null;
  favicon: string | null;
  banner: string | null;
  contactEmail: string | null;
  supportEmail: string | null;
  noReplyEmail: string | null;
  phoneMain: string | null;
  phoneWhatsapp: string | null;
  phoneSupport: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  postalCode: string | null;
  businessHours: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  linkedin: string | null;
  tiktok: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  commission: number;
  minOrder: number;
  freeShippingMin: number;
  taxRate: number;
  paymentMethods: unknown[];
  shippingMethods: unknown[];
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  googleAnalytics: string | null;
  facebookPixel: string | null;
  cguContent: string | null;
  privacyContent: string | null;
  mentionsContent: string | null;
  returnPolicy: string | null;
  notifOrders: boolean;
  notifStock: boolean;
  notifEmail: boolean;
  notifPush: boolean;
  maintenanceMode: boolean;
  productModeration: boolean;
  sellerRegistration: boolean;
  reviewModeration: boolean;
  require2fa: boolean;
  lockAfterAttempts: boolean;
  sessionTimeout: boolean;
  ipRestriction: boolean;
  advancedLogging: boolean;
  bruteForceProtect: boolean;
  // Contenu dynamique homepage
  homepageBanners: HomepageBannerConfig[] | null;
  flashSaleConfig: FlashSaleConfig | null;
  adSectionConfig: AdSectionConfig | null;
}

// Récupérer tous les settings
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ settings: SiteSettings }>('/admin/settings');
      return data.settings;
    },
  });
}

// Hook générique pour update une section
function useUpdateSection(section: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put(`/admin/settings/${section}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}

export function useUpdateGeneral() { return useUpdateSection('general'); }
export function useUpdateContact() { return useUpdateSection('contact'); }
export function useUpdateSocial() { return useUpdateSection('social'); }
export function useUpdateAppearance() { return useUpdateSection('appearance'); }
export function useUpdateCommerce() { return useUpdateSection('commerce'); }
export function useUpdateShipping() { return useUpdateSection('shipping'); }
export function useUpdateSeo() { return useUpdateSection('seo'); }
export function useUpdateLegal() { return useUpdateSection('legal'); }
export function useUpdateNotifications() { return useUpdateSection('notifications'); }
export function useUpdateAdvanced() { return useUpdateSection('advanced'); }
export function useUpdateSecurity() { return useUpdateSection('security'); }
export function useUpdateHomepageContent() { return useUpdateSection('homepage-content'); }

// Upload media (logo, favicon, banner)
export function useUpdateMedia(type: 'logo' | 'favicon' | 'banner') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.put(`/admin/settings/${type}`, { [type]: url });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}

export function useDeleteMedia(type: 'logo' | 'favicon' | 'banner') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete(`/admin/settings/${type}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}
