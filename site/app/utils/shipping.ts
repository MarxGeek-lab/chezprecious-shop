// ==============================================
// RÈGLES DE LIVRAISON (en F CFA)
// Doivent rester alignées sur le calcul de l'API (order_controller).
// ==============================================

/** Nombre de produits à partir duquel la livraison est offerte */
export const FREE_SHIPPING_MIN_ITEMS = 4;

/** Frais de livraison standard sous le seuil */
export const SHIPPING_COST = 2500;

export const getShippingCost = (itemCount: number): number =>
  itemCount >= FREE_SHIPPING_MIN_ITEMS ? 0 : SHIPPING_COST;
