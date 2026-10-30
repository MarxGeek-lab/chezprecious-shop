import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import MailService from '#services/mail_service'

const productInclude = {
  images: { orderBy: { position: 'asc' as const } },
  _count: { select: { reviews: true } },
}

async function withRatings<T extends { id: string; _count: { reviews: number } }>(products: T[]) {
  return Promise.all(
    products.map(async (product) => {
      const avgRating = await prisma.review.aggregate({
        where: { productId: product.id },
        _avg: { rating: true },
      })
      return {
        ...product,
        rating: avgRating._avg.rating || 0,
        reviewCount: product._count.reviews,
      }
    })
  )
}

export default class HomepageController {
  /**
   * @featured
   * @summary Récupère les produits vedettes (isFeatured=true)
   * @tag Homepage
   */
  async featured({ request, response }: HttpContext) {
    const limit = Math.min(12, Math.max(1, Number(request.input('limit', 8))))

    try {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE', isFeatured: true, stock: { gt: 0 } },
        include: productInclude,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      const data = await withRatings(products)
      return response.ok({ data, meta: { total: data.length } })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des produits vedettes',
      })
    }
  }

  /**
   * @newProducts
   * @summary Récupère les nouveaux produits (créés dans les 30 derniers jours)
   * @tag Homepage
   */
  async newProducts({ request, response }: HttpContext) {
    const limit = Math.min(12, Math.max(1, Number(request.input('limit', 8))))

    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE', stock: { gt: 0 }, createdAt: { gte: thirtyDaysAgo } },
        include: productInclude,
        take: limit,
        orderBy: { createdAt: 'desc' },
      })

      const data = await withRatings(products)
      return response.ok({ data, meta: { total: data.length } })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des nouveaux produits',
      })
    }
  }

  /**
   * @promotions
   * @summary Récupère les produits en promotion (avec comparePrice)
   * @tag Homepage
   */
  async promotions({ request, response }: HttpContext) {
    const limit = Math.min(12, Math.max(1, Number(request.input('limit', 8))))

    try {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE', stock: { gt: 0 }, comparePrice: { not: null } },
        include: productInclude,
        take: limit,
        orderBy: [{ comparePrice: 'desc' }, { createdAt: 'desc' }],
      })

      const data = (await withRatings(products)).map((product) => ({
        ...product,
        discount: product.comparePrice
          ? Math.round(
              ((Number(product.comparePrice) - Number(product.price)) /
                Number(product.comparePrice)) *
                100
            )
          : 0,
      }))

      return response.ok({ data, meta: { total: data.length } })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des promotions',
      })
    }
  }

  /**
   * @bestSellers
   * @summary Récupère les meilleures ventes (basé sur les ventes réelles + avis)
   * @tag Homepage
   */
  async bestSellers({ request, response }: HttpContext) {
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 8))))

    try {
      const salesByProduct = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit * 3,
      })

      const topProductIds = salesByProduct.map((s) => s.productId)

      let topProducts = await prisma.product.findMany({
        where: { id: { in: topProductIds }, status: 'ACTIVE', stock: { gt: 0 } },
        include: {
          images: { orderBy: { position: 'asc' } },
          reviews: { select: { rating: true } },
        },
      })

      if (topProducts.length < limit) {
        const existingIds = new Set(topProducts.map((p) => p.id))
        const fallback = await prisma.product.findMany({
          where: { id: { notIn: Array.from(existingIds) }, status: 'ACTIVE', stock: { gt: 0 } },
          include: {
            images: { orderBy: { position: 'asc' } },
            reviews: { select: { rating: true } },
          },
          take: limit - topProducts.length,
        })
        topProducts.push(...fallback)
      }

      const salesMap = new Map(salesByProduct.map((s) => [s.productId, s._sum.quantity ?? 0]))

      const data = topProducts
        .map((product) => {
          const reviewCount = product.reviews.length
          const avgRating =
            reviewCount > 0
              ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : 0
          const soldCount = salesMap.get(product.id) ?? 0
          const score = soldCount * 0.7 + reviewCount * avgRating * 0.3
          return { ...product, rating: avgRating, reviewCount, soldCount, score }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

      return response.ok({ data, meta: { total: data.length } })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des meilleures ventes',
      })
    }
  }

  /**
   * @recommended
   * @summary Récupère les produits recommandés (mix featured + best rated)
   * @tag Homepage
   */
  async recommended({ request, response }: HttpContext) {
    const limit = Math.min(12, Math.max(1, Number(request.input('limit', 6))))

    const baseWhere = { status: 'ACTIVE' as const, stock: { gt: 0 } }
    const includeSpec = {
      images: { orderBy: { position: 'asc' as const } },
      reviews: { select: { rating: true } },
    }

    try {
      let products = await prisma.product.findMany({
        where: {
          ...baseWhere,
          OR: [{ isFeatured: true }, { reviews: { some: { rating: { gte: 4 } } } }],
        },
        include: includeSpec,
        take: limit * 2,
        orderBy: { createdAt: 'desc' },
      })

      if (products.length < limit) {
        const existingIds = products.map((p) => p.id)
        const extra = await prisma.product.findMany({
          where: { ...baseWhere, id: { notIn: existingIds } },
          include: includeSpec,
          take: limit - products.length,
          orderBy: { createdAt: 'desc' },
        })
        products = [...products, ...extra]
      }

      const data = products
        .map((product) => {
          const reviewCount = product.reviews.length
          const avgRating =
            reviewCount > 0
              ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
              : 0
          return { ...product, rating: avgRating, reviewCount }
        })
        .slice(0, limit)

      return response.ok({ data, meta: { total: data.length } })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des produits recommandés',
      })
    }
  }

  /**
   * @stats
   * @summary Récupère les statistiques globales pour la homepage
   * @tag Homepage
   */
  async stats({ response }: HttpContext) {
    try {
      const [productCount, userCount, avgRating] = await Promise.all([
        prisma.product.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.review.aggregate({ _avg: { rating: true } }),
      ])

      return response.ok({
        data: {
          productCount,
          userCount,
          avgRating: avgRating._avg?.rating ?? 4.9,
        },
      })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des statistiques',
      })
    }
  }

  /**
   * @contact
   * @summary Envoie un message via le formulaire de contact
   * @tag Homepage
   */
  async contact({ request, response }: HttpContext) {
    const { name, email, phone, subject, message } = request.only([
      'name',
      'email',
      'phone',
      'subject',
      'message',
    ])

    if (!name || !email || !subject || !message) {
      return response.badRequest({ message: 'Tous les champs obligatoires doivent être remplis.' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.badRequest({ message: 'Adresse email invalide.' })
    }

    try {
      const settings = await prisma.siteSettings.findFirst()
      const adminEmail = settings?.contactEmail || process.env.MAIL_FROM || 'contact@chezprecious.com'

      await MailService.sendContactFormEmail({
        name,
        email,
        phone: phone || undefined,
        subject,
        message,
        adminEmail,
      })

      return response.ok({ message: 'Message envoyé avec succès. Nous vous répondrons sous 24h.' })
    } catch {
      return response.internalServerError({
        message: "Une erreur s'est produite lors de l'envoi du message.",
      })
    }
  }

  /**
   * @config
   * @summary Configuration dynamique de la homepage
   * @tag Homepage
   */
  async config({ response }: HttpContext) {
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'default' },
        select: { homepageBanners: true, flashSaleConfig: true, adSectionConfig: true },
      })

      return response.ok({
        config: {
          homepageBanners: settings?.homepageBanners ?? null,
          flashSaleConfig: settings?.flashSaleConfig ?? null,
          adSectionConfig: settings?.adSectionConfig ?? null,
        },
      })
    } catch {
      return response.internalServerError({
        message: 'Erreur lors de la récupération de la configuration homepage',
      })
    }
  }
}
