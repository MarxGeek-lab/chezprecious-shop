import vine from '@vinejs/vine'

export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim(),
    slug: vine.string().minLength(2).maxLength(100).trim().optional(),
    description: vine.string().maxLength(500).trim().optional().nullable(),
    icon: vine.string().maxLength(50).trim().optional().nullable(),
    image: vine.string().maxLength(500).trim().optional().nullable(),
    position: vine.number().min(0).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const updateCategoryValidator = createCategoryValidator

export const createSubCategoryValidator = vine.compile(
  vine.object({
    categoryId: vine.string().uuid(),
    name: vine.string().minLength(2).maxLength(100).trim(),
    slug: vine.string().minLength(2).maxLength(100).trim().optional(),
    description: vine.string().maxLength(500).trim().optional().nullable(),
    icon: vine.string().maxLength(50).trim().optional().nullable(),
    image: vine.string().maxLength(500).trim().optional().nullable(),
    position: vine.number().min(0).optional(),
    isActive: vine.boolean().optional(),
  })
)

export const updateSubCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim().optional(),
    slug: vine.string().minLength(2).maxLength(100).trim().optional(),
    description: vine.string().maxLength(500).trim().optional().nullable(),
    icon: vine.string().maxLength(50).trim().optional().nullable(),
    image: vine.string().maxLength(500).trim().optional().nullable(),
    position: vine.number().min(0).optional(),
    isActive: vine.boolean().optional(),
  })
)
