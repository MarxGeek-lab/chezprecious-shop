'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type SellerTabType =
  | 'dashboard'
  | 'analytics'
  | 'products'
  | 'products-new'
  | 'products-edit'
  | 'categories'
  | 'inventory'
  | 'orders'
  | 'customers'
  | 'shipping'
  | 'payments'
  | 'promotions'
  | 'reviews'
  | 'messages'
  | 'notifications'
  | 'broadcast'
  | 'team'
  | 'settings'
  | 'reports'
  | 'activity'
  | 'help';

export interface TabParams {
  id?: string;
  [key: string]: unknown;
}

interface SellerTabContextType {
  activeTab: SellerTabType;
  setActiveTab: (tab: SellerTabType, params?: TabParams) => void;
  isLoading: boolean;
  params: TabParams | undefined;
}

const SellerTabContext = createContext<SellerTabContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_seller_tab';
const STORAGE_PARAMS_KEY = 'marketplace_seller_tab_params';

function getStoredTab(): SellerTabType {
  if (typeof window === 'undefined') return 'dashboard';
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return (stored as SellerTabType) || 'dashboard';
}

function getStoredParams(): TabParams | undefined {
  if (typeof window === 'undefined') return undefined;
  const stored = sessionStorage.getItem(STORAGE_PARAMS_KEY);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

export function SellerTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<SellerTabType>(() => getStoredTab());
  const [params, setParams] = useState<TabParams | undefined>(() => getStoredParams());
  const [isLoading, setIsLoading] = useState(false);

  const handleSetActiveTab = (tab: SellerTabType, newParams?: TabParams) => {
    if (tab !== activeTab || JSON.stringify(newParams) !== JSON.stringify(params)) {
      setIsLoading(true);
      setActiveTabState(tab);
      setParams(newParams);

      sessionStorage.setItem(STORAGE_KEY, tab);
      if (newParams) {
        sessionStorage.setItem(STORAGE_PARAMS_KEY, JSON.stringify(newParams));
      } else {
        sessionStorage.removeItem(STORAGE_PARAMS_KEY);
      }

      setTimeout(() => setIsLoading(false), 150);
    }
  };

  return (
    <SellerTabContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSetActiveTab,
        isLoading,
        params,
      }}
    >
      {children}
    </SellerTabContext.Provider>
  );
}

export function useSellerTab(): SellerTabContextType {
  const context = useContext(SellerTabContext);
  if (!context) {
    throw new Error('useSellerTab must be used within a SellerTabProvider');
  }
  return context;
}
