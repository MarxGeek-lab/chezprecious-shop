import vine from '@vinejs/vine'

// Création / mise à jour d'un produit
export const createProductValidator = vine.compile(
  vine.object({
    // Informations générales
    name: vine.string().minLength(2).maxLength(255).trim(),
    slug: vine.string().minLength(2).maxLength(255).trim().optional(),
    shortDescription: vine.string().maxLength(500).trim().optional().nullable(),
    description: vine.string().maxLength(10000).trim().optional().nullable(),
    category: vine.string().maxLength(100).trim().optional().nullable(),
    subCategory: vine.string().maxLength(100).trim().optional().nullable(),
    brand: vine.string().maxLength(100).trim().optional().nullable(),
    condition: vine.enum(['NEW', 'REFURBISHED', 'USED']).optional(),
    warranty: vine.string().maxLength(255).trim().optional().nullable(),
    originCountry: vine.string().maxLength(100).trim().optional().nullable(),

    // Prix & Stock
    sku: vine.string().maxLength(100).trim().optional().nullable(),
    barcode: vine.string().maxLength(100).trim().optional().nullable(),
    price: vine.number().min(0),
    comparePrice: vine.number().min(0).optional().nullable(),
    cost: vine.number().min(0).optional().nullable(),
    taxRate: vine.number().min(0).max(100).optional(),
    stock: vine.number().min(0).optional(),
    lowStockThreshold: vine.number().min(0).optional(),
    trackInventory: vine.boolean().optional(),
    allowBackorder: vine.boolean().optional(),

    // Livraison
    weight: vine.number().min(0).optional().nullable(),
    dimensionLength: vine.number().min(0).optional().nullable(),
    dimensionWidth: vine.number().min(0).optional().nullable(),
    dimensionHeight: vine.number().min(0).optional().nullable(),

    // Métadonnées
    tags: vine.array(vine.string().maxLength(50).trim()).optional(),
    status: vine.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    isFeatured: vine.boolean().optional(),

    // Variantes (JSON)
    variants: vine
      .array(
        vine.object({
          combination: vine.any(),
          price: vine.number().min(0),
          stock: vine.number().min(0).optional(),
          sku: vine.string().maxLength(100).trim().optional().nullable(),
          isActive: vine.boolean().optional(),
        })
      )
      .optional(),

    // Vidéos externes (URLs)
    videoUrls: vine
      .array(
        vine.object({
          url: vine.string().url().maxLength(500),
          title: vine.string().maxLength(255).trim().optional().nullable(),
        })
      )
      .optional(),
  })
)

export const updateProductValidator = createProductValidator

// Filtrage / listing
export const listProductsValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    search: vine.string().maxLength(255).trim().optional(),
    category: vine.string().maxLength(100).trim().optional(),
    status: vine.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
    sort: vine.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc']).optional(),
    minPrice: vine.number().min(0).optional(),
    maxPrice: vine.number().min(0).optional(),
  })
)
