// ==============================================
// RÈGLES DE LIVRAISON (en F CFA)
// Doivent rester alignées sur le calcul de l'API (order_controller).
// ==============================================

/** Montant du panier à partir duquel la livraison est offerte */
export const FREE_SHIPPING_THRESHOLD = 50000;

/** Frais de livraison standard sous le seuil */
export const SHIPPING_COST = 2500;

export const getShippingCost = (subtotal: number): number =>
  subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
