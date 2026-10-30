import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import { createReviewValidator, updateReviewValidator } from '#validators/review_validator'

export default class ReviewController {
  /**
   * @index
   * @summary Liste publique des avis d'un produit
   * @tag Reviews
   */
  async index({ request, response }: HttpContext) {
    const productId = request.input('productId')
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 10))))
    const sort = request.input('sort', 'newest') // newest, oldest, highest, lowest, helpful

    if (!productId) {
      return response.badRequest({ message: 'productId est requis' })
    }

    const orderBy = (() => {
      switch (sort) {
        case 'oldest': return { createdAt: 'asc' as const }
        case 'highest': return { rating: 'desc' as const }
        case 'lowest': return { rating: 'asc' as const }
        case 'helpful': return { helpful: 'desc' as const }
        default: return { createdAt: 'desc' as const }
      }
    })()

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true },
          },
        },
      }),
      prisma.review.count({ where: { productId } }),
      prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ])

    // Distribution des notes (1-5)
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { rating: true },
    })

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach((d) => {
      ratingDistribution[d.rating] = d._count.rating
    })

    return response.ok({
      reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
        ratingDistribution,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  /**
   * @store
   * @summary Créer un avis (authentifié)
   * @tag Reviews
   */
  async store({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const data = await request.validateUsing(createReviewValidator)

    // Vérifier que le produit existe et est actif
    const product = await prisma.product.findFirst({
      where: { id: data.productId, status: 'ACTIVE' },
    })

    if (!product) {
      return response.notFound({ message: 'Produit introuvable' })
    }

    // Vérifier que l'utilisateur n'a pas déjà laissé un avis
    const existing = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: data.productId,
          userId: authenticatedUser.id,
        },
      },
    })

    if (existing) {
      return response.conflict({ message: 'Vous avez déjà laissé un avis pour ce produit' })
    }

    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        userId: authenticatedUser.id,
        rating: data.rating,
        title: data.title || null,
        content: data.content || null,
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
    })

    return response.created({ message: 'Avis publié avec succès', review })
  }

  /**
   * @update
   * @summary Modifier son avis
   * @tag Reviews
   */
  async update({ params, request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return response.notFound({ message: 'Avis introuvable' })
    }

    if (review.userId !== authenticatedUser.id) {
      return response.forbidden({ message: 'Vous ne pouvez modifier que vos propres avis' })
    }

    const data = await request.validateUsing(updateReviewValidator)

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
    })

    return response.ok({ message: 'Avis mis à jour', review: updated })
  }

  /**
   * @destroy
   * @summary Supprimer son avis
   * @tag Reviews
   */
  async destroy({ params, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return response.notFound({ message: 'Avis introuvable' })
    }

    if (review.userId !== authenticatedUser.id) {
      return response.forbidden({ message: 'Vous ne pouvez supprimer que vos propres avis' })
    }

    await prisma.review.delete({ where: { id: params.id } })

    return response.ok({ message: 'Avis supprimé' })
  }

  /**
   * @publicList
   * @summary Liste publique de tous les avis vérifiés (toutes produits)
   * @tag Reviews
   */
  async publicList({ request, response }: HttpContext) {
    const page  = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 12))))
    const rating = request.input('rating') ? Number(request.input('rating')) : undefined

    const where = {
      content: { not: null },
      ...(rating ? { rating } : {}),
    }

    const [reviews, total, agg] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user:    { select: { id: true, fullName: true, avatar: true } },
          product: { select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.aggregate({ where: { content: { not: null } }, _avg: { rating: true }, _count: { rating: true } }),
    ])

    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { content: { not: null } },
      _count: { rating: true },
    })

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach((d) => { ratingDistribution[d.rating] = d._count.rating })

    return response.ok({
      reviews,
      stats: {
        averageRating: agg._avg.rating || 0,
        totalReviews: agg._count.rating,
        ratingDistribution,
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  }

  /**
   * @helpful
   * @summary Marquer un avis comme utile
   * @tag Reviews
   */
  async helpful({ params, response }: HttpContext) {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
    })

    if (!review) {
      return response.notFound({ message: 'Avis introuvable' })
    }

    const updated = await prisma.review.update({
      where: { id: params.id },
      data: { helpful: { increment: 1 } },
    })

    return response.ok({ helpful: updated.helpful })
  }
}
