import type { ApiProduct, ApiCategory } from '@/app/lib/api';
import type { Product, Category } from '@/app/types';

/**
 * Mappe une catégorie de l'API vers le format Category utilisé par les composants
 */
export function mapApiCategoryToCategory(apiCategory: ApiCategory): Category {
  return {
    id: apiCategory.id,
    name: apiCategory.name,
    slug: apiCategory.slug,
    description: apiCategory.description || undefined,
    icon: apiCategory.icon || '',
    image: apiCategory.image || undefined,
    productCount: apiCategory.productCount,
  };
}

/**
 * Mappe un tableau de catégories API vers le format Category
 */
export function mapApiCategoriesToCategories(apiCategories: ApiCategory[]): Category[] {
  return apiCategories.map(mapApiCategoryToCategory);
}

/**
 * Mappe un produit de l'API vers le format Product utilisé par les composants
 */
export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  const primaryImage = apiProduct.images?.find((img) => img.isPrimary) || apiProduct.images?.[0];
  const imageUrl = primaryImage?.url || '/placeholder-product.png';

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description || '',
    price: Number(apiProduct.price),
    originalPrice: apiProduct.comparePrice ? Number(apiProduct.comparePrice) : undefined,
    image: imageUrl,
    images: apiProduct.images?.map((img) => ({
      id: img.id,
      url: img.url,
      source: 'upload' as const,
      alt: img.alt || apiProduct.name,
      isPrimary: img.isPrimary,
    })) || [],
    category: apiProduct.category || '',
    categoryId: apiProduct.category || '',
    rating: (apiProduct as any).rating || 0,
    reviewCount: (apiProduct as any).reviewCount || 0,
    inStock: apiProduct.stock > 0,
    tags: apiProduct.tags || [],
    discount: apiProduct.comparePrice
      ? Math.round(((Number(apiProduct.comparePrice) - Number(apiProduct.price)) / Number(apiProduct.comparePrice)) * 100)
      : undefined,
    isFeatured: apiProduct.isFeatured,
    isNew: false,
    createdAt: apiProduct.createdAt,
  };
}

/**
 * Mappe un tableau de produits API vers le format Product
 */
export function mapApiProductsToProducts(apiProducts: ApiProduct[]): Product[] {
  return apiProducts.map(mapApiProductToProduct);
}
