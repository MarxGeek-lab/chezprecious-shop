import { useQuery } from "@tanstack/react-query";
import { settingsApi, type PublicSiteSettings } from "@/app/lib/api";

export function usePublicSettings() {
  return useQuery<PublicSiteSettings>({
    queryKey: ["public-settings"],
    queryFn: async () => {
      const res = await settingsApi.public();
      return res.data.settings;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
