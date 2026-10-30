'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type AccountTabType =
  | 'dashboard'
  | 'orders'
  | 'profile'
  | 'addresses'
  | 'wishlist'
  | 'reviews'
  | 'security'
  | 'messages'
  | 'notifications';

export interface TabParams {
  id?: string;
  [key: string]: unknown;
}

interface AccountTabContextType {
  activeTab: AccountTabType;
  setActiveTab: (tab: AccountTabType, params?: TabParams) => void;
  isLoading: boolean;
  params: TabParams | undefined;
}

const AccountTabContext = createContext<AccountTabContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_account_tab';
const STORAGE_PARAMS_KEY = 'marketplace_account_tab_params';

function getStoredTab(): AccountTabType {
  if (typeof window === 'undefined') return 'dashboard';
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return (stored as AccountTabType) || 'dashboard';
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

export function AccountTabProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTabState] = useState<AccountTabType>(() => getStoredTab());
  const [params, setParams] = useState<TabParams | undefined>(() => getStoredParams());
  const [isLoading, setIsLoading] = useState(false);

  const handleSetActiveTab = (tab: AccountTabType, newParams?: TabParams) => {
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
    <AccountTabContext.Provider
      value={{
        activeTab,
        setActiveTab: handleSetActiveTab,
        isLoading,
        params,
      }}
    >
      {children}
    </AccountTabContext.Provider>
  );
}

export function useAccountTab(): AccountTabContextType {
  const context = useContext(AccountTabContext);
  if (!context) {
    throw new Error('useAccountTab must be used within an AccountTabProvider');
  }
  return context;
}
