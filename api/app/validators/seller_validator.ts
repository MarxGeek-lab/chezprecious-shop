import vine from '@vinejs/vine'

export const becomeSellerValidator = vine.compile(
  vine.object({
    // Personal info
    firstName: vine.string().minLength(2).maxLength(100).trim(),
    lastName: vine.string().minLength(2).maxLength(100).trim(),
    phone: vine.string().minLength(6).maxLength(30).trim(),

    // Store info
    storeName: vine.string().minLength(2).maxLength(255).trim(),
    storeDescription: vine.string().optional().nullable(),
    storeCategory: vine.string().optional().nullable(),

    // Address
    address: vine.string().optional().nullable(),
    city: vine.string().optional().nullable(),
    postalCode: vine.string().optional().nullable(),
    country: vine.string().optional().nullable(),
    currency: vine.string().maxLength(10).optional().nullable(),

    // Delivery
    deliveryZones: vine.array(vine.string()).optional().nullable(),
    shippingMethods: vine.array(vine.string()).optional().nullable(),

    // Acceptation
    acceptCGV: vine.boolean(),
    acceptCharte: vine.boolean(),
  })
)

export const updateStoreSettingsValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255).trim().optional(),
    description: vine.string().optional().nullable(),
    currency: vine.string().maxLength(10).optional(),
    address: vine.string().optional().nullable(),
    city: vine.string().optional().nullable(),
    postalCode: vine.string().optional().nullable(),
    country: vine.string().optional().nullable(),
  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(6).maxLength(100),
  })
)
