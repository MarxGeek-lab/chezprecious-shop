import vine from '@vinejs/vine'

/**
 * Validator pour la connexion admin
 */
export const adminLoginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6),
  })
)

/**
 * Validator pour la mise à jour des paramètres généraux
 */
export const settingsGeneralValidator = vine.compile(
  vine.object({
    siteName: vine.string().minLength(1).maxLength(100).optional(),
    siteSlogan: vine.string().maxLength(255).optional().nullable(),
    siteDescription: vine.string().maxLength(2000).optional().nullable(),
    siteUrl: vine.string().maxLength(500).optional().nullable(),
    language: vine.string().maxLength(10).optional(),
    timezone: vine.string().maxLength(100).optional(),
  })
)

/**
 * Validator pour les infos de contact
 */
export const settingsContactValidator = vine.compile(
  vine.object({
    contactEmail: vine.string().email().optional().nullable(),
    supportEmail: vine.string().email().optional().nullable(),
    noReplyEmail: vine.string().email().optional().nullable(),
    phoneMain: vine.string().maxLength(30).optional().nullable(),
    phoneWhatsapp: vine.string().maxLength(30).optional().nullable(),
    phoneSupport: vine.string().maxLength(30).optional().nullable(),
    address: vine.string().maxLength(500).optional().nullable(),
    city: vine.string().maxLength(100).optional().nullable(),
    country: vine.string().maxLength(100).optional().nullable(),
    postalCode: vine.string().maxLength(20).optional().nullable(),
    businessHours: vine.string().maxLength(255).optional().nullable(),
  })
)

/**
 * Validator pour les réseaux sociaux
 */
export const settingsSocialValidator = vine.compile(
  vine.object({
    facebook: vine.string().maxLength(500).optional().nullable(),
    instagram: vine.string().maxLength(500).optional().nullable(),
    twitter: vine.string().maxLength(500).optional().nullable(),
    youtube: vine.string().maxLength(500).optional().nullable(),
    linkedin: vine.string().maxLength(500).optional().nullable(),
    tiktok: vine.string().maxLength(500).optional().nullable(),
  })
)

/**
 * Validator pour l'apparence
 */
export const settingsAppearanceValidator = vine.compile(
  vine.object({
    primaryColor: vine.string().maxLength(20).optional(),
    secondaryColor: vine.string().maxLength(20).optional(),
    accentColor: vine.string().maxLength(20).optional(),
  })
)

/**
 * Validator pour le commerce
 */
export const settingsCommerceValidator = vine.compile(
  vine.object({
    currency: vine.string().maxLength(10).optional(),
    commission: vine.number().min(0).max(100).optional(),
    minOrder: vine.number().min(0).optional(),
    freeShippingMin: vine.number().min(0).optional(),
    taxRate: vine.number().min(0).max(100).optional(),
    paymentMethods: vine.any().optional(),
  })
)

/**
 * Validator pour la livraison
 */
export const settingsShippingValidator = vine.compile(
  vine.object({
    shippingMethods: vine.any().optional(),
  })
)

/**
 * Validator pour le SEO
 */
export const settingsSeoValidator = vine.compile(
  vine.object({
    metaTitle: vine.string().maxLength(200).optional().nullable(),
    metaDescription: vine.string().maxLength(500).optional().nullable(),
    metaKeywords: vine.string().maxLength(500).optional().nullable(),
    googleAnalytics: vine.string().maxLength(50).optional().nullable(),
    facebookPixel: vine.string().maxLength(50).optional().nullable(),
  })
)

/**
 * Validator pour les pages légales
 */
export const settingsLegalValidator = vine.compile(
  vine.object({
    cguContent: vine.string().optional().nullable(),
    privacyContent: vine.string().optional().nullable(),
    mentionsContent: vine.string().optional().nullable(),
    returnPolicy: vine.string().optional().nullable(),
  })
)

/**
 * Validator pour les notifications
 */
export const settingsNotificationsValidator = vine.compile(
  vine.object({
    notifOrders: vine.boolean().optional(),
    notifStock: vine.boolean().optional(),
    notifEmail: vine.boolean().optional(),
    notifPush: vine.boolean().optional(),
  })
)

/**
 * Validator pour les paramètres avancés
 */
export const settingsAdvancedValidator = vine.compile(
  vine.object({
    maintenanceMode: vine.boolean().optional(),
    productModeration: vine.boolean().optional(),
    sellerRegistration: vine.boolean().optional(),
    reviewModeration: vine.boolean().optional(),
  })
)

/**
 * Validator pour les paramètres de sécurité
 */
export const settingsSecurityValidator = vine.compile(
  vine.object({
    require2fa:        vine.boolean().optional(),
    lockAfterAttempts: vine.boolean().optional(),
    sessionTimeout:    vine.boolean().optional(),
    ipRestriction:     vine.boolean().optional(),
    advancedLogging:   vine.boolean().optional(),
    bruteForceProtect: vine.boolean().optional(),
  })
)

/**
 * Validator pour le contenu dynamique de la homepage (bannières, vente flash, section pub)
 * On utilise vine.any() pour les JSON complexes — cohérent avec paymentMethods/shippingMethods
 */
export const settingsHomepageContentValidator = vine.compile(
  vine.object({
    homepageBanners: vine.any().optional().nullable(),
    flashSaleConfig: vine.any().optional().nullable(),
    adSectionConfig: vine.any().optional().nullable(),
  })
)
