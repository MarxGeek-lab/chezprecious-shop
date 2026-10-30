'use client';

// ==============================================
// CART CONTEXT - Gestion globale du panier
// Système professionnel avec persistance et notifications
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
export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: Date;
}

export interface CartNotification {
  id: string;
  type: 'add' | 'remove' | 'update' | 'clear';
  product?: Product;
  message: string;
  timestamp: Date;
}

interface CartContextType {
  // État du panier
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Statistiques
  itemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  savings: number;

  // Notification
  notification: CartNotification | null;
  clearNotification: () => void;

  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // État du drawer
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  // Utilitaires
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getItem: (productId: string) => CartItem | undefined;

  // Livraison gratuite
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  hasFreeShipping: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Clé de stockage localStorage
const CART_STORAGE_KEY = 'marketplace_cart';

// Hook personnalisé
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// Fonction pour générer un ID unique
const generateId = () => Math.random().toString(36).substring(2, 9);

// Provider
interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<CartNotification | null>(null);

  // Constantes
  const FREE_SHIPPING_THRESHOLD = 50000;
  const SHIPPING_COST = 2500;
  const TAX_RATE = 0.18; // TVA 18%

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Reconstituer les dates
        const cartWithDates = parsedCart.map((item: CartItem) => ({
          ...item,
          addedAt: new Date(item.addedAt),
        }));
        setItems(cartWithDates);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sauvegarder le panier dans localStorage à chaque modification
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du panier:', error);
      }
    }
  }, [items, isLoading]);

  // Auto-clear notification après 4 secondes
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Calculs
  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const uniqueItemCount = useMemo(() => items.length, [items]);

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items]
  );

  // Calcul des économies (si produits en promo)
  const savings = useMemo(
    () =>
      items.reduce((acc, item) => {
        if (item.product.originalPrice) {
          return acc + (item.product.originalPrice - item.product.price) * item.quantity;
        }
        return acc;
      }, 0),
    [items]
  );

  const hasFreeShipping = useMemo(
    () => subtotal >= FREE_SHIPPING_THRESHOLD,
    [subtotal]
  );

  const shipping = useMemo(
    () => (hasFreeShipping ? 0 : SHIPPING_COST),
    [hasFreeShipping]
  );

  const amountToFreeShipping = useMemo(
    () => Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    [subtotal]
  );

  const tax = useMemo(() => Math.round(subtotal * TAX_RATE), [subtotal]);

  const total = useMemo(() => subtotal + shipping, [subtotal, shipping]);

  // Notification helper
  const showNotification = useCallback(
    (type: CartNotification['type'], message: string, product?: Product) => {
      setNotification({
        id: generateId(),
        type,
        product,
        message,
        timestamp: new Date(),
      });
    },
    []
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // Actions
  const addItem = useCallback(
    (product: Product, quantity = 1) => {
      setItems((prev) => {
        const existingItem = prev.find((item) => item.product.id === product.id);
        if (existingItem) {
          // Mettre à jour la quantité
          const newQuantity = existingItem.quantity + quantity;
          showNotification(
            'update',
            `${product.name} - Quantité mise à jour (${newQuantity})`,
            product
          );
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          );
        }
        // Ajouter un nouvel article
        showNotification('add', `${product.name} ajouté au panier`, product);
        return [...prev, { product, quantity, addedAt: new Date() }];
      });
      // Ouvre le drawer lors de l'ajout
      setIsOpen(true);
    },
    [showNotification]
  );

  const removeItem = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const item = prev.find((i) => i.product.id === productId);
        if (item) {
          showNotification(
            'remove',
            `${item.product.name} retiré du panier`,
            item.product
          );
        }
        return prev.filter((item) => item.product.id !== productId);
      });
    },
    [showNotification]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setItems((prev) => {
        const item = prev.find((i) => i.product.id === productId);
        if (item) {
          showNotification(
            'update',
            `${item.product.name} - Quantité: ${quantity}`,
            item.product
          );
        }
        return prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
      });
    },
    [removeItem, showNotification]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    showNotification('clear', 'Panier vidé');
  }, [showNotification]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const isInCart = useCallback(
    (productId: string) => items.some((item) => item.product.id === productId),
    [items]
  );

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.product.id === productId);
      return item?.quantity || 0;
    },
    [items]
  );

  const getItem = useCallback(
    (productId: string) => {
      return items.find((i) => i.product.id === productId);
    },
    [items]
  );

  const value = useMemo(
    () => ({
      // État
      items,
      isOpen,
      isLoading,

      // Statistiques
      itemCount,
      uniqueItemCount,
      subtotal,
      shipping,
      tax,
      total,
      savings,

      // Notification
      notification,
      clearNotification,

      // Actions
      addItem,
      removeItem,
      updateQuantity,
      clearCart,

      // Drawer
      openCart,
      closeCart,
      toggleCart,

      // Utilitaires
      isInCart,
      getItemQuantity,
      getItem,

      // Livraison
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountToFreeShipping,
      hasFreeShipping,
    }),
    [
      items,
      isOpen,
      isLoading,
      itemCount,
      uniqueItemCount,
      subtotal,
      shipping,
      tax,
      total,
      savings,
      notification,
      clearNotification,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      isInCart,
      getItemQuantity,
      getItem,
      amountToFreeShipping,
      hasFreeShipping,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
