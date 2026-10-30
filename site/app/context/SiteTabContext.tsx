'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type SiteTabType =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'favoris'
  | 'categories'
  | 'promotions'
  | 'nouveautes'
  | 'best-sellers'
  | 'collection'
  | 'store'
  | 'gift-cards'
  | 'contact'
  | 'about'
  | 'faq'
  | 'help'
  | 'returns'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'become-seller'
  | 'auth';

export interface SiteTabParams {
  slug?: string;
  id?: string;
  category?: string;
  query?: string;
  [key: string]: unknown;
}

interface SiteTabContextType {
  activeTab: SiteTabType;
  setActiveTab: (tab: SiteTabType, params?: SiteTabParams) => void;
  isLoading: boolean;
  params: SiteTabParams | undefined;
}

export const SiteTabContext = createContext<SiteTabContextType | undefined>(undefined);

const PATH_TO_TAB: { pattern: RegExp; tab: SiteTabType; getParams?: (m: RegExpMatchArray) => SiteTabParams }[] = [
  { pattern: /^\/product\/([^/]+)/, tab: 'product-detail', getParams: (m) => ({ slug: m[1] }) },
  { pattern: /^\/collection\/([^/]+)/, tab: 'collection', getParams: (m) => ({ slug: m[1] }) },
  { pattern: /^\/store\/([^/]+)/, tab: 'store', getParams: (m) => ({ slug: m[1] }) },
  { pattern: /^\/products/, tab: 'products' },
  { pattern: /^\/cart/, tab: 'cart' },
  { pattern: /^\/checkout/, tab: 'checkout' },
  { pattern: /^\/favoris/, tab: 'favoris' },
  { pattern: /^\/categories/, tab: 'categories' },
  { pattern: /^\/promotions/, tab: 'promotions' },
  { pattern: /^\/nouveautes/, tab: 'nouveautes' },
  { pattern: /^\/best-sellers/, tab: 'best-sellers' },
  { pattern: /^\/gift-cards/, tab: 'gift-cards' },
  { pattern: /^\/contact/, tab: 'contact' },
  { pattern: /^\/about/, tab: 'about' },
  { pattern: /^\/faq/, tab: 'faq' },
  { pattern: /^\/help/, tab: 'help' },
  { pattern: /^\/returns/, tab: 'returns' },
  { pattern: /^\/privacy/, tab: 'privacy' },
  { pattern: /^\/terms/, tab: 'terms' },
  { pattern: /^\/cookies/, tab: 'cookies' },
  { pattern: /^\/become-seller/, tab: 'become-seller' },
  { pattern: /^\/auth/, tab: 'auth' },
];

function resolvePathToTab(pathname: string): { tab: SiteTabType; params?: SiteTabParams } {
  for (const entry of PATH_TO_TAB) {
    const m = pathname.match(entry.pattern);
    if (m) return { tab: entry.tab, params: entry.getParams?.(m) };
  }
  return { tab: 'home' };
}

function getInitialTab(): SiteTabType {
  if (typeof window === 'undefined') return 'home';
  // Lire depuis l'état de l'historique en priorité (navigation retour/avant)
  const state = window.history.state as { spaTab?: SiteTabType; spaParams?: SiteTabParams } | null;
  if (state?.spaTab) return state.spaTab;
  // Déduire depuis l'URL directe (ex: /product/basket)
  return resolvePathToTab(window.location.pathname).tab;
}

function getInitialParams(): SiteTabParams | undefined {
  if (typeof window === 'undefined') return undefined;
  const state = window.history.state as { spaTab?: SiteTabType; spaParams?: SiteTabParams } | null;
  if (state?.spaParams) return state.spaParams;
  // Déduire depuis l'URL directe
  return resolvePathToTab(window.location.pathname).params;
}

export function SiteTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<SiteTabType>(getInitialTab);
  const [params, setParams] = useState<SiteTabParams | undefined>(getInitialParams);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetActiveTab = useCallback((tab: SiteTabType, newParams?: SiteTabParams) => {
    setIsLoading(true);
    setActiveTabState(tab);
    setParams(newParams);

    // Pousser une entrée dans l'historique du navigateur
    const state = { spaTab: tab, spaParams: newParams ?? null };
    window.history.pushState(state, '', window.location.pathname);

    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => setIsLoading(false), 150);
  }, []);

  // Écouter le bouton retour/avant du navigateur
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const state = e.state as { spaTab?: SiteTabType; spaParams?: SiteTabParams } | null;
      const tab: SiteTabType = state?.spaTab ?? 'home';
      const restoredParams = state?.spaParams ?? undefined;

      setIsLoading(true);
      setActiveTabState(tab);
      setParams(restoredParams);
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => setIsLoading(false), 150);
    };

    window.addEventListener('popstate', handlePopState);

    // Remplacer l'entrée courante de l'historique avec l'état initial
    // (pour que le premier "retour" fonctionne aussi)
    if (!window.history.state?.spaTab) {
      window.history.replaceState(
        { spaTab: activeTab, spaParams: params ?? null },
        '',
        window.location.pathname,
      );
    }

    return () => window.removeEventListener('popstate', handlePopState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SiteTabContext.Provider value={{ activeTab, setActiveTab: handleSetActiveTab, isLoading, params }}>
      {children}
    </SiteTabContext.Provider>
  );
}

export function useSiteTab(): SiteTabContextType {
  const context = useContext(SiteTabContext);
  if (!context) {
    throw new Error('useSiteTab must be used within a SiteTabProvider');
  }
  return context;
}
