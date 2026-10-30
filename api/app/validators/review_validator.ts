import vine from '@vinejs/vine'

export const createReviewValidator = vine.compile(
  vine.object({
    productId: vine.string().uuid(),
    rating: vine.number().min(1).max(5),
    title: vine.string().maxLength(200).optional(),
    content: vine.string().maxLength(2000).optional(),
  })
)

export const updateReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().min(1).max(5).optional(),
    title: vine.string().maxLength(200).optional(),
    content: vine.string().maxLength(2000).optional(),
  })
)
