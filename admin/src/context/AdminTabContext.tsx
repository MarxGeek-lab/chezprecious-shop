'use client';

// ==============================================
// ADMIN TAB CONTEXT - Navigation par onglets
// ==============================================

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type AdminTabType =
  | 'dashboard'
  | 'analytics'
  | 'users'
  | 'user-detail'
  | 'sellers'
  | 'seller-detail'
  | 'products'
  | 'product-detail'
  | 'orders'
  | 'order-detail'
  | 'categories'
  | 'promotions'
  | 'payments'
  | 'shipping'
  | 'notifications'
  | 'messages'
  | 'reports'
  | 'settings'
  | 'security'
  | 'team'
  | 'activity'
  | 'newsletter'
  | 'help'
  | 'product-new'
  | 'product-edit'
  | 'abandoned-carts';

export interface TabParams {
  [key: string]: string | number | undefined;
}

interface AdminTabContextType {
  activeTab: AdminTabType;
  setActiveTab: (tab: AdminTabType, params?: TabParams) => void;
  isLoading: boolean;
  params: TabParams | undefined;
}

const AdminTabContext = createContext<AdminTabContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_admin_tab';
const PARAMS_KEY = 'marketplace_admin_tab_params';

export function AdminTabProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTabState] = useState<AdminTabType>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [params, setParams] = useState<TabParams | undefined>(undefined);

  // Restaurer depuis sessionStorage au montage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) as AdminTabType;
      if (saved) setActiveTabState(saved);
      const savedParams = sessionStorage.getItem(PARAMS_KEY);
      if (savedParams) setParams(JSON.parse(savedParams));
    } catch {
      // Ignore
    }
  }, []);

  const setActiveTab = useCallback((tab: AdminTabType, newParams?: TabParams) => {
    if (tab === activeTab && !newParams) return;

    setIsLoading(true);
    setActiveTabState(tab);
    setParams(newParams);

    try {
      sessionStorage.setItem(STORAGE_KEY, tab);
      if (newParams) {
        sessionStorage.setItem(PARAMS_KEY, JSON.stringify(newParams));
      } else {
        sessionStorage.removeItem(PARAMS_KEY);
      }
    } catch {
      // Ignore
    }

    // Transition fluide
    setTimeout(() => setIsLoading(false), 150);
  }, [activeTab]);

  return (
    <AdminTabContext.Provider value={{ activeTab, setActiveTab, isLoading, params }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export function useAdminTab() {
  const context = useContext(AdminTabContext);
  if (!context) throw new Error('useAdminTab doit être utilisé dans AdminTabProvider');
  return context;
}
