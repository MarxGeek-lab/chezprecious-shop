// ==============================================
// UTILITAIRES DE FORMATAGE
// ==============================================

/**
 * Formate un prix en euros
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Calcule le prix après réduction
 */
export const calculateDiscountedPrice = (originalPrice: number, discount: number): number => {
  return Math.round(originalPrice * (1 - discount / 100));
};

/**
 * Formate une note (ex: 4.5 -> "4,5")
 */
export const formatRating = (rating: number): string => {
  return rating.toFixed(1).replace('.', ',');
};

/**
 * Tronque un texte à une longueur donnée
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Génère un slug à partir d'une chaîne
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
