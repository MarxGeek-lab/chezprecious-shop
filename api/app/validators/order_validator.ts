import vine from '@vinejs/vine'

/**
 * Validator pour la création d'une commande
 */
export const createOrderValidator = vine.compile(
  vine.object({
    // Informations client
    customerEmail: vine.string().email(),
    customerFirstName: vine.string().minLength(1).maxLength(100),
    customerLastName: vine.string().minLength(1).maxLength(100),
    customerPhone: vine.string().minLength(8).maxLength(20),

    // Adresse de livraison
    shippingAddress: vine.string().minLength(5).maxLength(500),
    shippingCity: vine.string().minLength(2).maxLength(100),
    shippingCountry: vine.string().minLength(2).maxLength(100),
    shippingNotes: vine.string().maxLength(1000).optional().nullable(),

    // Méthode de paiement
    paymentMethod: vine.enum(['MOBILE_MONEY', 'CARD', 'FEEXPAY_WALLET']),
    paymentProvider: vine.string().maxLength(50).optional().nullable(),
    mobileNumber: vine.string().maxLength(20).optional().nullable(),

    // Code promo (optionnel)
    promoCode: vine.string().maxLength(50).optional().nullable(),

    // Items de la commande
    items: vine.array(
      vine.object({
        productId: vine.string().uuid(),
        quantity: vine.number().min(1).max(1000),
        variantData: vine.any().optional().nullable(),
      })
    ).minLength(1),
  })
)
