import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import {
  createCategoryValidator,
  updateCategoryValidator,
  createSubCategoryValidator,
  updateSubCategoryValidator,
} from '#validators/category_validator'

export default class CategoryController {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // ==========================================
  // Catégories
  // ==========================================

  /**
   * @index
   * @summary Liste publique de toutes les catégories avec sous-catégories
   * @tag Categories
   */
  async index({ response }: HttpContext) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    // Compter les produits par catégorie
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await prisma.product.count({
          where: { category: cat.slug, status: 'ACTIVE' },
        })
        return { ...cat, productCount }
      })
    )

    return response.ok({ categories: categoriesWithCounts })
  }

  /**
   * @adminIndex
   * @summary Liste admin (toutes les catégories, actives ou non)
   * @tag Categories
   */
  async adminIndex({ response }: HttpContext) {
    const categories = await prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: {
        subCategories: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return response.ok({ categories })
  }

  /**
   * @show
   * @summary Détail d'une catégorie par slug
   * @tag Categories
   */
  async show({ params, response }: HttpContext) {
    const category = await prisma.category.findUnique({
      where: { slug: params.slug },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!category) {
      return response.notFound({ message: 'Catégorie introuvable' })
    }

    const productCount = await prisma.product.count({
      where: { category: category.slug, status: 'ACTIVE' },
    })

    return response.ok({ category: { ...category, productCount } })
  }

  /**
   * @store
   * @summary Créer une catégorie (admin)
   * @tag Categories
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createCategoryValidator)

    const slug = data.slug || this.generateSlug(data.name)

    // Vérifier unicité du slug
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      return response.conflict({ message: 'Une catégorie avec ce slug existe déjà' })
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
        icon: data.icon || null,
        image: data.image || null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    return response.created({ message: 'Catégorie créée', category })
  }

  /**
   * @update
   * @summary Mettre à jour une catégorie (admin)
   * @tag Categories
   */
  async update({ params, request, response }: HttpContext) {
    const category = await prisma.category.findUnique({ where: { id: params.id } })
    if (!category) {
      return response.notFound({ message: 'Catégorie introuvable' })
    }

    const data = await request.validateUsing(updateCategoryValidator)
    const slug = data.slug || this.generateSlug(data.name)

    // Vérifier unicité du slug si modifié
    if (slug !== category.slug) {
      const existing = await prisma.category.findFirst({
        where: { slug, id: { not: category.id } },
      })
      if (existing) {
        return response.conflict({ message: 'Une catégorie avec ce slug existe déjà' })
      }
    }

    const updated = await prisma.category.update({
      where: { id: category.id },
      data: {
        name: data.name,
        slug,
        description: data.description ?? category.description,
        icon: data.icon ?? category.icon,
        image: data.image ?? category.image,
        position: data.position ?? category.position,
        isActive: data.isActive ?? category.isActive,
      },
    })

    return response.ok({ message: 'Catégorie mise à jour', category: updated })
  }

  /**
   * @destroy
   * @summary Supprimer une catégorie (admin)
   * @tag Categories
   */
  async destroy({ params, response }: HttpContext) {
    const category = await prisma.category.findUnique({ where: { id: params.id } })
    if (!category) {
      return response.notFound({ message: 'Catégorie introuvable' })
    }

    await prisma.category.delete({ where: { id: category.id } })

    return response.ok({ message: 'Catégorie supprimée' })
  }

  // ==========================================
  // Sous-catégories
  // ==========================================

  /**
   * @storeSubCategory
   * @summary Créer une sous-catégorie (admin)
   * @tag Categories
   */
  async storeSubCategory({ request, response }: HttpContext) {
    const data = await request.validateUsing(createSubCategoryValidator)

    const parentCategory = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!parentCategory) {
      return response.notFound({ message: 'Catégorie parente introuvable' })
    }

    const slug = data.slug || this.generateSlug(data.name)

    const existing = await prisma.subCategory.findUnique({ where: { slug } })
    if (existing) {
      return response.conflict({ message: 'Une sous-catégorie avec ce slug existe déjà' })
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description || null,
        icon: data.icon || null,
        image: data.image || null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    })

    return response.created({ message: 'Sous-catégorie créée', subCategory })
  }

  /**
   * @updateSubCategory
   * @summary Mettre à jour une sous-catégorie (admin)
   * @tag Categories
   */
  async updateSubCategory({ params, request, response }: HttpContext) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: params.id } })
    if (!subCategory) {
      return response.notFound({ message: 'Sous-catégorie introuvable' })
    }

    const data = await request.validateUsing(updateSubCategoryValidator)

    const updates: Record<string, unknown> = {}
    if (data.name !== undefined) {
      updates.name = data.name
      updates.slug = data.slug || this.generateSlug(data.name)
    }
    if (data.description !== undefined) updates.description = data.description
    if (data.icon !== undefined) updates.icon = data.icon
    if (data.image !== undefined) updates.image = data.image
    if (data.position !== undefined) updates.position = data.position
    if (data.isActive !== undefined) updates.isActive = data.isActive

    const updated = await prisma.subCategory.update({
      where: { id: subCategory.id },
      data: updates,
    })

    return response.ok({ message: 'Sous-catégorie mise à jour', subCategory: updated })
  }

  /**
   * @destroySubCategory
   * @summary Supprimer une sous-catégorie (admin)
   * @tag Categories
   */
  async destroySubCategory({ params, response }: HttpContext) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: params.id } })
    if (!subCategory) {
      return response.notFound({ message: 'Sous-catégorie introuvable' })
    }

    await prisma.subCategory.delete({ where: { id: subCategory.id } })

    return response.ok({ message: 'Sous-catégorie supprimée' })
  }
}
