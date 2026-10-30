import { useQuery } from '@tanstack/react-query';
import { homepageApi } from '@/app/lib/api';
export type { HomepageBannerConfig, FlashSaleConfig, AdSectionConfig } from '@/app/lib/api';

export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: ['homepage', 'featured', limit],
    queryFn: async () => {
      const response = await homepageApi.featured(limit);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNewProducts(limit = 8) {
  return useQuery({
    queryKey: ['homepage', 'new', limit],
    queryFn: async () => {
      const response = await homepageApi.newProducts(limit);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function usePromotions(limit = 8) {
  return useQuery({
    queryKey: ['homepage', 'promotions', limit],
    queryFn: async () => {
      const response = await homepageApi.promotions(limit);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBestSellers(limit = 8) {
  return useQuery({
    queryKey: ['homepage', 'best-sellers', limit],
    queryFn: async () => {
      const response = await homepageApi.bestSellers(limit);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecommendedProducts(limit = 6) {
  return useQuery({
    queryKey: ['homepage', 'recommended', limit],
    queryFn: async () => {
      const response = await homepageApi.recommended(limit);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomepageStats() {
  return useQuery({
    queryKey: ['homepage', 'stats'],
    queryFn: async () => {
      const response = await homepageApi.stats();
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useHomepageConfig() {
  return useQuery({
    queryKey: ['homepage', 'config'],
    queryFn: async () => {
      const response = await homepageApi.config();
      return response.data.config;
    },
    staleTime: 10 * 60 * 1000,
  });
}
