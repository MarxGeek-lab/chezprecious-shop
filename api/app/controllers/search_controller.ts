import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import { join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import prisma from '#services/prisma_service'
import imageSearchService from '#services/image_search_service'

export default class SearchController {
  /**
   * @searchByImage
   * @summary Recherche de produits similaires par image avec MobileNet
   * @tag Search
   * @description Utilise TensorFlow.js et MobileNet pour trouver des produits visuellement similaires
   */
  async searchByImage({ request, response }: HttpContext) {
    try {
      const limit = Math.min(20, Math.max(1, Number(request.input('limit', 12))))
      const imageUrl = request.input('imageUrl') as string | undefined

      let tempPath: string

      if (imageUrl) {
        // Mode URL : HTTP/HTTPS ou data URI
        const isHttp = imageUrl.startsWith('http://') || imageUrl.startsWith('https://')
        const isDataUri = imageUrl.startsWith('data:image/')
        if (!isHttp && !isDataUri) {
          return response.badRequest({ message: 'URL invalide — doit commencer par http://, https:// ou être un data URI (data:image/...)' })
        }
        tempPath = imageUrl
      } else {
        // Mode fichier uploadé
        const image = request.file('image', {
          size: '10mb',
          extnames: ['jpg', 'jpeg', 'png', 'webp'],
        })

        if (!image) {
          return response.badRequest({ message: 'Image requise (fichier ou URL)' })
        }

        const uploadDir = join(app.tmpPath(), 'image-search')
        await mkdir(uploadDir, { recursive: true })
        const tempFileName = `${cuid()}.${image.extname}`
        tempPath = join(uploadDir, tempFileName)
        await image.move(uploadDir, { name: tempFileName })
      }

      // Récupérer tous les produits actifs avec leurs images et features
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          stock: { gt: 0 },
        },
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          _count: {
            select: { reviews: true },
          },
        },
      })

      // Préparer les données pour la recherche de similarité
      const productImagesData = products
        .filter((p) => p.images.length > 0)
        .map((p) => ({
          productId: p.id,
          imageUrl: p.images[0].url,
          features: undefined as number[] | undefined,
        }))

      // Rechercher les produits similaires
      const similarProducts = await imageSearchService.searchSimilarProducts(
        tempPath,
        productImagesData,
        limit
      )

      // Récupérer les détails des produits similaires avec ratings
      const productIds = similarProducts.map((sp) => sp.productId)
      const detailedProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          status: 'ACTIVE',
        },
        include: {
          images: {
            orderBy: { position: 'asc' },
          },
          _count: {
            select: { reviews: true },
          },
        },
      })

      // Ajouter les ratings et scores de similarité
      const productsWithRatings = await Promise.all(
        detailedProducts.map(async (product) => {
          const similarProduct = similarProducts.find((sp) => sp.productId === product.id)
          const avgRating = await prisma.review.aggregate({
            where: { productId: product.id },
            _avg: { rating: true },
          })

          return {
            ...product,
            rating: avgRating._avg?.rating || 0,
            reviewCount: product._count.reviews,
            similarity: similarProduct?.similarity || 0,
          }
        })
      )

      // Trier par score de similarité
      const sortedProducts = productsWithRatings.sort((a, b) => b.similarity - a.similarity)

      return response.ok({
        data: sortedProducts,
        meta: {
          total: sortedProducts.length,
          message: 'Recherche par image avec MobileNet-v2 (local)',
          minSimilarity: Math.min(...sortedProducts.map((p) => p.similarity)),
          maxSimilarity: Math.max(...sortedProducts.map((p) => p.similarity)),
        },
      })
    } catch (error) {
      console.error('Erreur recherche par image:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche par image',
        error: error.message,
      })
    }
  }

  /**
   * @suggestions
   * @summary Récupère des suggestions de recherche
   * @tag Search
   */
  async suggestions({ request, response }: HttpContext) {
    const query = request.input('query', '')

    if (!query || query.length < 2) {
      return response.ok({ suggestions: [] })
    }

    try {
      // Rechercher dans les noms de produits
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: 8,
        distinct: ['name'],
      })

      // Rechercher dans les catégories
      const categories = await prisma.category.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        take: 4,
      })

      const suggestions = [
        ...products.map((p) => p.name),
        ...categories.map((c) => c.name),
      ].slice(0, 10)

      return response.ok({ suggestions })
    } catch (error) {
      console.error('Erreur suggestions:', error)
      return response.ok({ suggestions: [] })
    }
  }

  /**
   * @advancedSearch
   * @summary Recherche avancée avec filtres multiples
   * @tag Search
   */
  async advancedSearch({ request, response }: HttpContext) {
    const params = request.qs()

    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.min(60, Math.max(1, Number(params.limit) || 20))
    const skip = (page - 1) * limit

    try {
      // Construction des filtres
      const where: any = {
        status: 'ACTIVE',
      }

      // Recherche textuelle
      if (params.query) {
        where.OR = [
          { name: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          { tags: { has: params.query.toLowerCase() } },
          { brand: { contains: params.query, mode: 'insensitive' } },
        ]
      }

      // Filtres
      if (params.category) {
        where.category = params.category
      }

      if (params.minPrice || params.maxPrice) {
        where.price = {}
        if (params.minPrice) where.price.gte = Number(params.minPrice)
        if (params.maxPrice) where.price.lte = Number(params.maxPrice)
      }

      if (params.inStock === 'true') {
        where.stock = { gt: 0 }
      }

      if (params.featured === 'true') {
        where.isFeatured = true
      }

      // Tri
      let orderBy: any = { createdAt: 'desc' }
      switch (params.sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' }
          break
        case 'price_desc':
          orderBy = { price: 'desc' }
          break
        case 'newest':
          orderBy = { createdAt: 'desc' }
          break
      }

      // Exécution de la requête
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            images: {
              orderBy: { position: 'asc' },
            },
            _count: {
              select: { reviews: true },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.product.count({ where }),
      ])

      // Ajouter les ratings
      const productsWithRatings = await Promise.all(
        products.map(async (product) => {
          const avgRating = await prisma.review.aggregate({
            where: { productId: product.id },
            _avg: { rating: true },
          })

          return {
            ...product,
            rating: avgRating._avg?.rating || 0,
            reviewCount: product._count.reviews,
          }
        })
      )

      return response.ok({
        products: productsWithRatings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Erreur recherche avancée:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche',
      })
    }
  }
}
