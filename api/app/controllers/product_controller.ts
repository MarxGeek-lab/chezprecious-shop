import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import env from '#start/env'

const APP_URL = env.get('APP_URL', 'http://localhost:3333')

function resolveImageUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${APP_URL}${url}`
}

function resolveImages<T extends { url: string }>(images: T[]): T[] {
  return images.map((img) => ({ ...img, url: resolveImageUrl(img.url) }))
}

export default class ProductController {
  /**
   * @publicList
   * @summary Liste publique des produits actifs
   * @tag Products Public
   */
  async publicList({ request, response }: HttpContext) {
    const params = request.qs()

    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(60, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { status: 'ACTIVE' }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
        { tags: { has: params.search } },
      ]
    }
    if (params.category) {
      where.category = { equals: params.category, mode: 'insensitive' }
    }
    if (params.minPrice || params.maxPrice) {
      where.price = {}
      if (params.minPrice) (where.price as Record<string, unknown>).gte = Number(params.minPrice)
      if (params.maxPrice) (where.price as Record<string, unknown>).lte = Number(params.maxPrice)
    }

    let orderBy: Record<string, string> = { createdAt: 'desc' }
    switch (params.sort) {
      case 'price_asc':
        orderBy = { price: 'asc' }
        break
      case 'price_desc':
        orderBy = { price: 'desc' }
        break
      case 'popular':
        orderBy = { createdAt: 'desc' }
        break
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          category: true,
          brand: true,
          tags: true,
          isFeatured: true,
          createdAt: true,
          images: {
            orderBy: { position: 'asc' },
            select: { id: true, url: true, alt: true, isPrimary: true },
          },
          _count: { select: { variants: true } },
        },
      }),
      prisma.product.count({ where }),
    ])

    return response.ok({
      products: products.map((p) => ({ ...p, images: resolveImages(p.images) })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  }

  /**
   * @publicShow
   * @summary Détail public d'un produit par slug
   * @tag Products Public
   */
  async publicShow({ params, response }: HttpContext) {
    const product = await prisma.product.findFirst({
      where: { slug: params.slug, status: 'ACTIVE' },
      include: {
        images: { orderBy: { position: 'asc' } },
        videos: { orderBy: { position: 'asc' } },
        variants: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!product) {
      return response.notFound({ message: 'Produit introuvable' })
    }

    const reviewStats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return response.ok({
      product: {
        ...product,
        images: resolveImages(product.images),
        rating: reviewStats._avg.rating || 0,
        reviewCount: reviewStats._count.rating,
      },
    })
  }

  /**
   * @publicSimilar
   * @summary Produits similaires (même catégorie/tags)
   * @tag Products Public
   */
  async publicSimilar({ params, request, response }: HttpContext) {
    const limit = Math.min(12, Math.max(1, Number(request.input('limit', 8))))

    const source = await prisma.product.findFirst({
      where: { slug: params.slug, status: 'ACTIVE' },
      select: { id: true, category: true, tags: true },
    })

    if (!source) {
      return response.notFound({ message: 'Produit introuvable' })
    }

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: source.id },
        OR: [
          ...(source.category ? [{ category: source.category }] : []),
          ...(source.tags.length > 0 ? [{ tags: { hasSome: source.tags } }] : []),
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        category: true,
        isFeatured: true,
        createdAt: true,
        images: {
          orderBy: { position: 'asc' },
          select: { id: true, url: true, alt: true, isPrimary: true },
        },
        _count: { select: { variants: true } },
      },
    })

    return response.ok({ products: products.map((p) => ({ ...p, images: resolveImages(p.images) })) })
  }

}
