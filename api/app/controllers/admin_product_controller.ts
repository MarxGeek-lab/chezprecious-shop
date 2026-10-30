import type { HttpContext } from '@adonisjs/core/http'
import { cuid } from '@adonisjs/core/helpers'
import { join } from 'node:path'
import { mkdir, copyFile, unlink } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import prisma from '#services/prisma_service'
import activityLogService from '#services/activity_log_service'
import imageSearchService from '#services/image_search_service'
import {
  createProductValidator,
  updateProductValidator,
} from '#validators/product_validator'

const UPLOAD_DIR = 'uploads/products'
const MAX_IMAGES = 8
const MAX_VIDEOS = 2

// ==========================================
// AdminProductController
// Création/édition de produits par un admin.
// Les produits sont rattachés à la boutique système "ChezPrecious Admin".
// Chaque opération est tracée dans l'ActivityLog.
// ==========================================

export default class AdminProductController {
  // ── Helpers ─────────────────────────────────────────────────────────────────

  private async saveFile(
    file: { tmpPath?: string; clientName: string; extname?: string },
    subfolder: string
  ): Promise<string> {
    const dir = join(app.publicPath(), UPLOAD_DIR, subfolder)
    await mkdir(dir, { recursive: true })
    const fileName = `${cuid()}.${file.extname || 'bin'}`
    const destPath = join(dir, fileName)
    if (file.tmpPath) {
      await copyFile(file.tmpPath, destPath)
    }
    return `/${UPLOAD_DIR}/${subfolder}/${fileName}`
  }

  private async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = join(app.publicPath(), filePath)
      await unlink(fullPath)
    } catch {
      // Fichier introuvable, on ignore
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // ── store — Créer un produit ────────────────────────────────────────────────

  /**
   * @store
   * @summary Admin — créer un produit (boutique admin)
   * @tag Admin Products
   * @requestBody <multipart> {"data": "{\"name\":\"Produit\",\"price\":10000,\"stock\":5,\"status\":\"ACTIVE\"}", "images": "<file>", "videos": "<file>"}
   * @responseBody 201 - {"message": "Produit créé avec succès", "product": {"id": "uuid", "name": "Produit", "slug": "produit"}}
   * @responseBody 422 - {"message": "Données invalides"}
   */
  async store({ request, response, authenticatedAdmin }: HttpContext) {
    // Données JSON (multipart avec champ "data")
    const rawData = request.input('data')
    let data: Awaited<ReturnType<typeof createProductValidator['validate']>>

    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
      data = await createProductValidator.validate(parsed)
    } catch (error) {
      return response.unprocessableEntity({ message: 'Données invalides', errors: error })
    }

    // Slug unique
    let slug = data.slug || this.generateSlug(data.name)
    const existingSlug = await prisma.product.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${cuid().slice(0, 8)}`
    }

    // Images
    const imageFiles = request.files('images', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    })
    const imageRecords: { url: string; alt: string; position: number; isPrimary: boolean }[] = []
    if (imageFiles && imageFiles.length > 0) {
      const filesToProcess = imageFiles.slice(0, MAX_IMAGES)
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        if (!file.isValid) continue
        const url = await this.saveFile(file, 'images')
        imageRecords.push({ url, alt: data.name, position: i, isPrimary: i === 0 })
      }
    }

    // Vidéos fichiers
    const videoFiles = request.files('videos', {
      size: '50mb',
      extnames: ['mp4', 'webm', 'mov'],
    })
    const videoRecords: { url: string; source: string; title: string; position: number }[] = []
    if (videoFiles && videoFiles.length > 0) {
      const filesToProcess = videoFiles.slice(0, MAX_VIDEOS)
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        if (!file.isValid) continue
        const url = await this.saveFile(file, 'videos')
        videoRecords.push({ url, source: 'upload', title: file.clientName, position: i })
      }
    }

    // Vidéos URL
    if (data.videoUrls && data.videoUrls.length > 0) {
      const remaining = MAX_VIDEOS - videoRecords.length
      const urlsToAdd = data.videoUrls.slice(0, remaining)
      for (let i = 0; i < urlsToAdd.length; i++) {
        const v = urlsToAdd[i]
        videoRecords.push({ url: v.url, source: 'url', title: v.title || '', position: videoRecords.length })
      }
    }

    // Créer le produit
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        category: data.category || null,
        subCategory: data.subCategory || null,
        brand: data.brand || null,
        condition: data.condition || 'NEW',
        warranty: data.warranty || null,
        originCountry: data.originCountry || null,
        sku: data.sku || null,
        barcode: data.barcode || null,
        price: data.price,
        comparePrice: data.comparePrice ?? null,
        cost: data.cost ?? null,
        taxRate: data.taxRate ?? 20,
        stock: data.stock ?? 0,
        lowStockThreshold: data.lowStockThreshold ?? 10,
        trackInventory: data.trackInventory ?? true,
        allowBackorder: data.allowBackorder ?? false,
        weight: data.weight ?? null,
        dimensionLength: data.dimensionLength ?? null,
        dimensionWidth: data.dimensionWidth ?? null,
        dimensionHeight: data.dimensionHeight ?? null,
        tags: data.tags || [],
        status: data.status || 'DRAFT',
        isFeatured: data.isFeatured ?? false,
        images: imageRecords.length > 0 ? { create: imageRecords } : undefined,
        videos: videoRecords.length > 0 ? { create: videoRecords } : undefined,
        variants:
          data.variants && data.variants.length > 0
            ? {
                create: data.variants.map((v) => ({
                  combination: v.combination,
                  price: v.price,
                  stock: v.stock ?? 0,
                  sku: v.sku || null,
                  isActive: v.isActive ?? true,
                })),
              }
            : undefined,
      },
      include: {
        images: { orderBy: { position: 'asc' } },
        videos: { orderBy: { position: 'asc' } },
        variants: true,
      },
    })

    // Traçabilité
    activityLogService.log({
      adminId:    authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole:  authenticatedAdmin?.role,
      action:     'CREATE_PRODUCT',
      entity:     'product',
      entityId:   product.id,
      metadata:   { name: product.name, slug: product.slug, status: product.status },
    }).catch(() => {})

    // Indexation des features image en arrière-plan (fire-and-forget)
    imageSearchService.indexProductImagesAsync(product.id)

    return response.created({ message: 'Produit créé avec succès', product })
  }

  // ── update — Mettre à jour un produit ──────────────────────────────────────

  /**
   * @update
   * @summary Admin — mettre à jour un produit
   * @tag Admin Products
   * @paramPath id - ID du produit - @type(string)
   * @requestBody <multipart> {"data": "{\"name\":\"Produit modifié\",\"price\":12000,\"status\":\"ACTIVE\"}", "images": "<file>"}
   * @responseBody 200 - {"message": "Produit mis à jour avec succès", "product": {"id": "uuid", "name": "Produit modifié"}}
   * @responseBody 404 - {"message": "Produit introuvable"}
   * @responseBody 422 - {"message": "Données invalides"}
   */
  async update({ params, request, response, authenticatedAdmin }: HttpContext) {
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true, videos: true, variants: true },
    })

    if (!existing) {
      return response.notFound({ message: 'Produit introuvable' })
    }

    // Données JSON
    const rawData = request.input('data')
    let data: Awaited<ReturnType<typeof updateProductValidator['validate']>>

    try {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
      data = await updateProductValidator.validate(parsed)
    } catch (error) {
      return response.unprocessableEntity({ message: 'Données invalides', errors: error })
    }

    // Slug unique si modifié
    let slug = existing.slug
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.product.findFirst({
        where: { slug: data.slug, id: { not: existing.id } },
      })
      slug = slugExists ? `${data.slug}-${cuid().slice(0, 8)}` : data.slug
    }

    // Nouvelles images
    const newImageFiles = request.files('images', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    })
    const newImageRecords: { url: string; alt: string; position: number; isPrimary: boolean }[] = []
    if (newImageFiles && newImageFiles.length > 0) {
      const currentCount = existing.images.length
      const remaining = MAX_IMAGES - currentCount
      const filesToProcess = newImageFiles.slice(0, remaining)
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        if (!file.isValid) continue
        const url = await this.saveFile(file, 'images')
        newImageRecords.push({
          url,
          alt: data.name || existing.name,
          position: currentCount + i,
          isPrimary: currentCount === 0 && i === 0,
        })
      }
    }

    // Nouvelles vidéos
    const newVideoFiles = request.files('videos', {
      size: '50mb',
      extnames: ['mp4', 'webm', 'mov'],
    })
    const newVideoRecords: { url: string; source: string; title: string; position: number }[] = []
    if (newVideoFiles && newVideoFiles.length > 0) {
      const currentCount = existing.videos.length
      const remaining = MAX_VIDEOS - currentCount
      const filesToProcess = newVideoFiles.slice(0, remaining)
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i]
        if (!file.isValid) continue
        const url = await this.saveFile(file, 'videos')
        newVideoRecords.push({ url, source: 'upload', title: file.clientName, position: currentCount + i })
      }
    }

    // Vidéos URL supplémentaires
    if (data.videoUrls && data.videoUrls.length > 0) {
      const currentVideoCount = existing.videos.length + newVideoRecords.length
      const remaining = MAX_VIDEOS - currentVideoCount
      const urlsToAdd = data.videoUrls.slice(0, remaining)
      for (let i = 0; i < urlsToAdd.length; i++) {
        const v = urlsToAdd[i]
        newVideoRecords.push({ url: v.url, source: 'url', title: v.title || '', position: currentVideoCount + i })
      }
    }

    // Transaction
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          slug,
          shortDescription: data.shortDescription ?? existing.shortDescription,
          description: data.description ?? existing.description,
          category: data.category ?? existing.category,
          subCategory: data.subCategory ?? existing.subCategory,
          brand: data.brand ?? existing.brand,
          condition: data.condition ?? existing.condition,
          warranty: data.warranty ?? existing.warranty,
          originCountry: data.originCountry ?? existing.originCountry,
          sku: data.sku ?? existing.sku,
          barcode: data.barcode ?? existing.barcode,
          price: data.price,
          comparePrice: data.comparePrice ?? existing.comparePrice,
          cost: data.cost ?? existing.cost,
          taxRate: data.taxRate ?? Number(existing.taxRate),
          stock: data.stock ?? existing.stock,
          lowStockThreshold: data.lowStockThreshold ?? existing.lowStockThreshold,
          trackInventory: data.trackInventory ?? existing.trackInventory,
          allowBackorder: data.allowBackorder ?? existing.allowBackorder,
          weight: data.weight ?? existing.weight,
          dimensionLength: data.dimensionLength ?? existing.dimensionLength,
          dimensionWidth: data.dimensionWidth ?? existing.dimensionWidth,
          dimensionHeight: data.dimensionHeight ?? existing.dimensionHeight,
          tags: data.tags ?? existing.tags,
          status: data.status ?? existing.status,
          isFeatured: data.isFeatured ?? existing.isFeatured,
        },
      })

      if (newImageRecords.length > 0) {
        await tx.productImage.createMany({
          data: newImageRecords.map((img) => ({ ...img, productId: existing.id })),
        })
      }

      if (newVideoRecords.length > 0) {
        await tx.productVideo.createMany({
          data: newVideoRecords.map((vid) => ({ ...vid, productId: existing.id })),
        })
      }

      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId: existing.id } })
        if (data.variants.length > 0) {
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId: existing.id,
              combination: v.combination,
              price: v.price,
              stock: v.stock ?? 0,
              sku: v.sku || null,
              isActive: v.isActive ?? true,
            })),
          })
        }
      }

      return updated
    })

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: { orderBy: { position: 'asc' } },
        videos: { orderBy: { position: 'asc' } },
        variants: { orderBy: { createdAt: 'asc' } },
      },
    })

    // Traçabilité
    activityLogService.log({
      adminId:    authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole:  authenticatedAdmin?.role,
      action:     'UPDATE_PRODUCT',
      entity:     'product',
      entityId:   existing.id,
      metadata:   { name: data.name || existing.name, status: data.status || existing.status },
    }).catch(() => {})

    // Indexation des nouvelles images en arrière-plan (fire-and-forget)
    if (fullProduct) imageSearchService.indexProductImagesAsync(fullProduct.id)

    return response.ok({ message: 'Produit mis à jour avec succès', product: fullProduct })
  }

  // ── deleteImage ──────────────────────────────────────────────────────────

  /**
   * @deleteImage
   * @summary Admin — supprimer une image d'un produit
   * @tag Admin Products
   * @paramPath id - ID du produit - @type(string)
   * @paramPath imageId - ID de l'image - @type(string)
   * @responseBody 200 - {"message": "Image supprimée"}
   * @responseBody 404 - {"message": "Image introuvable"}
   */
  async deleteImage({ params, response }: HttpContext) {
    const image = await prisma.productImage.findFirst({
      where: { id: params.imageId, productId: params.id },
    })
    if (!image) return response.notFound({ message: 'Image introuvable' })

    await this.deleteFile(image.url)
    await prisma.productImage.delete({ where: { id: image.id } })

    if (image.isPrimary) {
      const next = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { position: 'asc' },
      })
      if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } })
    }

    return response.ok({ message: 'Image supprimée' })
  }

  // ── deleteVideo ──────────────────────────────────────────────────────────

  /**
   * @deleteVideo
   * @summary Admin — supprimer une vidéo d'un produit
   * @tag Admin Products
   * @paramPath id - ID du produit - @type(string)
   * @paramPath videoId - ID de la vidéo - @type(string)
   * @responseBody 200 - {"message": "Vidéo supprimée"}
   * @responseBody 404 - {"message": "Vidéo introuvable"}
   */
  async deleteVideo({ params, response }: HttpContext) {
    const video = await prisma.productVideo.findFirst({
      where: { id: params.videoId, productId: params.id },
    })
    if (!video) return response.notFound({ message: 'Vidéo introuvable' })

    if (video.url && !video.url.startsWith('http')) {
      await this.deleteFile(video.url)
    }
    await prisma.productVideo.delete({ where: { id: video.id } })

    return response.ok({ message: 'Vidéo supprimée' })
  }

  // ── setMainImage ─────────────────────────────────────────────────────────

  /**
   * @setMainImage
   * @summary Admin — définir l'image principale d'un produit
   * @tag Admin Products
   * @paramPath id - ID du produit - @type(string)
   * @paramPath imageId - ID de l'image à définir comme principale - @type(string)
   * @responseBody 200 - {"message": "Image principale mise à jour"}
   * @responseBody 404 - {"message": "Image introuvable"}
   */
  async setMainImage({ params, response }: HttpContext) {
    const image = await prisma.productImage.findFirst({
      where: { id: params.imageId, productId: params.id },
    })
    if (!image) return response.notFound({ message: 'Image introuvable' })

    await prisma.productImage.updateMany({
      where: { productId: params.id },
      data: { isPrimary: false },
    })
    await prisma.productImage.update({
      where: { id: params.imageId },
      data: { isPrimary: true },
    })

    return response.ok({ message: 'Image principale mise à jour' })
  }
}
