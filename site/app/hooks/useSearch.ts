import { useQuery, useMutation } from '@tanstack/react-query';
import { searchApi, SearchParams } from '@/app/lib/api';

/**
 * Hook pour la recherche avancée
 */
export function useAdvancedSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: ['search', 'advanced', params],
    queryFn: async () => {
      const response = await searchApi.search(params);
      return response.data;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook pour les suggestions de recherche
 */
export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['search', 'suggestions', query],
    queryFn: async () => {
      const response = await searchApi.suggestions(query);
      return response.data.suggestions;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour la recherche par image (mutation)
 */
export function useImageSearch() {
  return useMutation({
    mutationFn: async (image: File) => {
      const response = await searchApi.searchByImage({ image, limit: 12 });
      return response.data.data;
    },
  });
}
