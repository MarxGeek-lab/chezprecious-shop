'use client';

// ==============================================
// WISHLIST CONTEXT - Gestion globale des favoris
// ==============================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
import type { Product } from '@/app/types';

// Types
export interface WishlistItem {
  product: Product;
  addedAt: Date;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  itemCount: number;

  // Actions
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  clearWishlist: () => void;

  // Utilitaires
  isInWishlist: (productId: string) => boolean;
  getItem: (productId: string) => WishlistItem | undefined;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Clé de stockage localStorage
const WISHLIST_STORAGE_KEY = 'marketplace_wishlist';

// Hook personnalisé
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

// Provider
interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger depuis localStorage au montage
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        const wishlistWithDates = parsedWishlist.map((item: WishlistItem) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        setItems(wishlistWithDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris:', error);
      }
    }
  }, [items, isLoading]);

  // Calculs
  const itemCount = useMemo(() => items.length, [items]);

  // Actions
  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) return prev;
      return [...prev, { product, addedAt: new Date() }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const toggleItem = useCallback((product: Product) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.filter((item) => item.product.id !== product.id);
      }
      return [...prev, { product, addedAt: new Date() }];
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  const getItem = useCallback(
    (productId: string) => items.find((i) => i.product.id === productId),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isLoading,
      itemCount,
      addItem,
      removeItem,
      toggleItem,
      clearWishlist,
      isInWishlist,
      getItem,
    }),
    [
      items,
      isLoading,
      itemCount,
      addItem,
      removeItem,
      toggleItem,
      clearWishlist,
      isInWishlist,
      getItem,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}
