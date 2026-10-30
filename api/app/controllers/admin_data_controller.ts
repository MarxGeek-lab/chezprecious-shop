import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import mailService from '#services/mail_service'
import notificationService from '#services/notification_service'
import activityLogService from '#services/activity_log_service'

const PAGE_SIZE = 20

export default class AdminDataController {
  // ══════════════════════════════════════════════
  // UTILISATEURS
  // ══════════════════════════════════════════════

  async users({ request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', PAGE_SIZE))
    const search = request.input('search', '')
    const status = request.input('status', '')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') where.isActive = true
    else if (status === 'inactive') where.isActive = false

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          avatar: true,
          phone: true,
          createdAt: true,
        },
      }),
    ])

    return response.ok({
      data: users.map((u) => ({
        ...u,
        status: u.isActive ? 'active' : 'inactive',
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  async userStats({ response }: HttpContext) {
    const [total, active] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
    ])
    return response.ok({ total, active, inactive: total - active })
  }

  async getUser({ params, response }: HttpContext) {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        isEmailVerified: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            label: true,
            fullName: true,
            phone: true,
            street: true,
            city: true,
            country: true,
            isDefault: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            title: true,
            content: true,
            createdAt: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    })

    if (!user) return response.notFound({ message: 'Utilisateur introuvable' })

    const [orders, totalOrderAmount] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          items: { select: { id: true } },
        },
      }),
      prisma.order.aggregate({
        where: { userId: user.id, paymentStatus: 'COMPLETED' },
        _sum: { total: true },
        _count: true,
      }),
    ])

    return response.ok({
      user: {
        ...user,
        status: user.isActive ? 'active' : 'inactive',
        orders: orders.map((o) => ({
          ...o,
          total: Number(o.total),
          itemCount: o.items.length,
          items: undefined,
        })),
        stats: {
          orderCount: totalOrderAmount._count,
          totalSpent: Number(totalOrderAmount._sum.total ?? 0),
          reviewCount: user.reviews.length,
          addressCount: user.addresses.length,
        },
      },
    })
  }

  async updateUser({ params, request, response, authenticatedAdmin }: HttpContext) {
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return response.notFound({ message: 'Utilisateur introuvable' })

    const { fullName, phone, email } = request.only(['fullName', 'phone', 'email'])

    if (email && email !== user.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) return response.conflict({ message: 'Cet email est déjà utilisé' })
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
      },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, isActive: true, avatar: true, createdAt: true,
      },
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_USER',
      entity: 'user',
      entityId: params.id,
    }).catch(() => {})

    return response.ok({
      message: 'Utilisateur mis à jour',
      user: { ...updated, status: updated.isActive ? 'active' : 'inactive' },
    })
  }

  async deleteUser({ params, response, authenticatedAdmin }: HttpContext) {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, email: true },
    })
    if (!user) return response.notFound({ message: 'Utilisateur introuvable' })

    const orderCount = await prisma.order.count({ where: { userId: user.id } })
    if (orderCount > 0) {
      return response.badRequest({
        message: `Impossible de supprimer : cet utilisateur a ${orderCount} commande(s) liée(s).`,
        hasOrders: true,
        orderCount,
      })
    }

    await prisma.user.delete({ where: { id: user.id } })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'DELETE_USER',
      entity: 'user',
      entityId: params.id,
      metadata: { deletedEmail: user.email },
    }).catch(() => {})

    return response.ok({ message: 'Utilisateur supprimé' })
  }

  async toggleUserActive({ params, response, authenticatedAdmin }: HttpContext) {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, isActive: true },
    })
    if (!user) return response.notFound({ message: 'Utilisateur introuvable' })

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true },
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'TOGGLE_USER_ACTIVE',
      entity: 'user',
      entityId: params.id,
      metadata: { isActive: updated.isActive },
    }).catch(() => {})

    return response.ok({
      message: updated.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
      isActive: updated.isActive,
    })
  }

  async exportUsers({ request, response }: HttpContext) {
    const status = request.input('status', '')
    const search = request.input('search', '')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { fullName: true, email: true, role: true, isActive: true, phone: true, createdAt: true },
    })

    const rows = [
      ['Nom', 'Email', 'Téléphone', 'Rôle', 'Statut', 'Inscription'],
      ...users.map((u) => [
        u.fullName ?? '',
        u.email,
        u.phone ?? '',
        u.role,
        u.isActive ? 'Actif' : 'Inactif',
        new Date(u.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="utilisateurs.csv"')
    return response.ok('﻿' + csv)
  }

  // ══════════════════════════════════════════════
  // PRODUITS
  // ══════════════════════════════════════════════

  async getProduct({ params, response }: HttpContext) {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        category: true,
        subCategory: true,
        brand: true,
        condition: true,
        warranty: true,
        originCountry: true,
        sku: true,
        barcode: true,
        price: true,
        comparePrice: true,
        discountPrice: true,
        discountStartAt: true,
        discountEndAt: true,
        stock: true,
        lowStockThreshold: true,
        trackInventory: true,
        allowBackorder: true,
        weight: true,
        taxRate: true,
        tags: true,
        status: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
        images: { orderBy: { isPrimary: 'desc' }, select: { id: true, url: true, isPrimary: true } },
        variants: { select: { id: true, combination: true, price: true, stock: true, sku: true, isActive: true } },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, rating: true, title: true, content: true, createdAt: true,
            user: { select: { fullName: true, email: true, avatar: true } },
          },
        },
        _count: { select: { reviews: true, variants: true } },
      },
    })

    if (!product) return response.notFound({ message: 'Produit introuvable' })

    return response.ok({
      product: {
        ...product,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        taxRate: Number(product.taxRate),
        weight: product.weight ? Number(product.weight) : null,
        mainImage: product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url ?? null,
        reviewCount: product._count.reviews,
        variantCount: product._count.variants,
        variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
        _count: undefined,
      },
    })
  }

  async products({ request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', PAGE_SIZE))
    const search = request.input('search', '')
    const status = request.input('status', '')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status

    const [total, products, active, draft, outOfStock] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          status: true,
          isFeatured: true,
          category: true,
          createdAt: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      }),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'DRAFT' } }),
      prisma.product.count({ where: { stock: 0 } }),
    ])

    return response.ok({
      data: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        stock: p.stock,
        status: p.status,
        isFeatured: p.isFeatured,
        category: p.category,
        mainImage: p.images[0]?.url ?? null,
        createdAt: p.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), active, draft, outOfStock },
    })
  }

  async updateProductStatus({ params, request, response, authenticatedAdmin }: HttpContext) {
    const { status } = request.only(['status'])
    if (!['ACTIVE', 'DRAFT', 'ARCHIVED', 'INACTIVE'].includes(status)) {
      return response.badRequest({ message: 'Statut invalide' })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: { status },
      select: { id: true, name: true, status: true },
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_PRODUCT_STATUS',
      entity: 'product',
      entityId: params.id,
      metadata: { status },
    }).catch(() => {})

    return response.ok({ message: 'Statut mis à jour', product })
  }

  async deleteProduct({ params, response, authenticatedAdmin }: HttpContext) {
    await prisma.product.delete({ where: { id: params.id } })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'DELETE_PRODUCT',
      entity: 'product',
      entityId: params.id,
    }).catch(() => {})

    return response.ok({ message: 'Produit supprimé' })
  }

  async exportProducts({ request, response }: HttpContext) {
    const status = request.input('status', '')
    const search = request.input('search', '')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        slug: true,
        price: true,
        stock: true,
        status: true,
        category: true,
        isFeatured: true,
        createdAt: true,
      },
    })

    const rows = [
      ['Nom', 'Slug', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Vedette', 'Date création'],
      ...products.map((p) => [
        p.name,
        p.slug,
        p.category ?? '',
        Number(p.price).toFixed(2),
        String(p.stock),
        p.status,
        p.isFeatured ? 'Oui' : 'Non',
        new Date(p.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="produits.csv"')
    return response.ok('﻿' + csv)
  }

  async featureProduct({ params, request, response, authenticatedAdmin }: HttpContext) {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true, isFeatured: true },
    })
    if (!product) return response.notFound({ message: 'Produit introuvable' })

    const isFeatured = request.input('isFeatured') as boolean | undefined
    const newVal = isFeatured !== undefined ? Boolean(isFeatured) : !product.isFeatured

    await prisma.product.update({ where: { id: product.id }, data: { isFeatured: newVal } })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'FEATURE_PRODUCT',
      entity: 'product',
      entityId: params.id,
      metadata: { isFeatured: newVal },
    }).catch(() => {})

    return response.ok({ isFeatured: newVal, message: newVal ? 'Produit mis en avant' : 'Produit retiré de la une' })
  }

  async adminSetDiscount({ params, request, response, authenticatedAdmin }: HttpContext) {
    const admin = authenticatedAdmin!
    const { discountPrice, discountStartAt, discountEndAt } = request.only([
      'discountPrice', 'discountStartAt', 'discountEndAt',
    ])

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    if (!product) return response.notFound({ message: 'Produit introuvable' })

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: {
        discountPrice: discountPrice != null ? parseFloat(discountPrice) : null,
        discountStartAt: discountStartAt ? new Date(discountStartAt) : null,
        discountEndAt: discountEndAt ? new Date(discountEndAt) : null,
      },
    })

    activityLogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      metadata: { field: 'discount', discountPrice, discountStartAt, discountEndAt },
    }).catch(() => {})

    return response.ok({ message: 'Promotion mise à jour', product: updated })
  }

  // ══════════════════════════════════════════════
  // COMMANDES
  // ══════════════════════════════════════════════

  async orders({ request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', PAGE_SIZE))
    const search = request.input('search', '')
    const status = request.input('status', '')
    const paymentStatus = request.input('paymentStatus', '')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerFirstName: { contains: search, mode: 'insensitive' } },
        { customerLastName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus

    const [total, orders, pending, processing, delivered, cancelled] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerFirstName: true,
          customerLastName: true,
          customerEmail: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          items: { select: { id: true } },
        },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'CANCELLED' } }),
    ])

    return response.ok({
      data: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || o.customerEmail,
        customerEmail: o.customerEmail,
        total: Number(o.total),
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), pending, processing, delivered, cancelled },
    })
  }

  async getOrder({ params, response }: HttpContext) {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        orderNumber: true,
        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        customerPhone: true,
        shippingAddress: true,
        shippingCity: true,
        shippingCountry: true,
        shippingNotes: true,
        subtotal: true,
        shippingCost: true,
        tax: true,
        discount: true,
        total: true,
        currency: true,
        paymentMethod: true,
        paymentProvider: true,
        paymentStatus: true,
        paymentReference: true,
        paidAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            productName: true,
            productSlug: true,
            productImage: true,
            productId: true,
            variantData: true,
          },
        },
      },
    })

    if (!order) return response.notFound({ message: 'Commande introuvable' })

    return response.ok({
      order: {
        ...order,
        customerName: [order.customerFirstName, order.customerLastName].filter(Boolean).join(' '),
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        tax: Number(order.tax),
        discount: Number(order.discount),
        total: Number(order.total),
        items: order.items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
      },
    })
  }

  async exportOrders({ request, response }: HttpContext) {
    const status = request.input('status', '')
    const paymentStatus = request.input('paymentStatus', '')
    const search = request.input('search', '')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerFirstName: { contains: search, mode: 'insensitive' } },
        { customerLastName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        orderNumber: true,
        customerFirstName: true,
        customerLastName: true,
        customerEmail: true,
        customerPhone: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        createdAt: true,
        items: { select: { id: true } },
      },
    })

    const rows = [
      ['N° Commande', 'Client', 'Email', 'Téléphone', 'Total', 'Articles', 'Statut', 'Paiement', 'Méthode', 'Date'],
      ...orders.map((o) => [
        o.orderNumber,
        [o.customerFirstName, o.customerLastName].filter(Boolean).join(' '),
        o.customerEmail,
        o.customerPhone,
        Number(o.total).toFixed(2),
        String(o.items.length),
        o.status,
        o.paymentStatus,
        o.paymentMethod,
        new Date(o.createdAt).toLocaleDateString('fr-FR'),
      ]),
    ]

    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="commandes.csv"')
    return response.ok('﻿' + csv)
  }

  // ══════════════════════════════════════════════
  // CATÉGORIES
  // ══════════════════════════════════════════════

  async categories({ request, response }: HttpContext) {
    const search = request.input('search', '')

    const where: Record<string, unknown> = {}
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [categories, total, active, totalProducts] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          image: true,
          description: true,
          isActive: true,
          createdAt: true,
          subCategories: {
            orderBy: { position: 'asc' },
            select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
          },
        },
      }),
      prisma.category.count({ where }),
      prisma.category.count({ where: { ...where, isActive: true } }),
      prisma.product.count(),
    ])

    const productCounts = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      where: { category: { not: null } },
    })
    const productCountMap = new Map(productCounts.map((p) => [p.category, p._count.id]))

    return response.ok({
      data: categories.map((c) => ({
        ...c,
        subCategoryCount: c.subCategories.length,
        productCount: productCountMap.get(c.slug) ?? 0,
      })),
      meta: { total, active, totalProducts },
    })
  }

  async createCategory({ request, response, authenticatedAdmin }: HttpContext) {
    const { name, slug, description, icon } = request.only(['name', 'slug', 'description', 'icon'])
    if (!name?.trim()) return response.badRequest({ message: 'Le nom est requis.' })

    const finalSlug = slug?.trim() || name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const existing = await prisma.category.findUnique({ where: { slug: finalSlug } })
    if (existing) return response.badRequest({ message: 'Ce slug est déjà utilisé.' })

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: finalSlug, description: description?.trim() || null, icon: icon?.trim() || null },
      select: { id: true, name: true, slug: true, icon: true, image: true, isActive: true, createdAt: true },
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'CREATE_CATEGORY',
      entity: 'category',
      entityId: category.id,
      metadata: { name: category.name },
    }).catch(() => {})

    return response.created({ message: 'Catégorie créée', category: { ...category, subCategoryCount: 0, productCount: 0 } })
  }

  async updateCategory({ params, request, response, authenticatedAdmin }: HttpContext) {
    const { name, slug, description, icon } = request.only(['name', 'slug', 'description', 'icon'])

    const existing = await prisma.category.findUnique({ where: { id: params.id } })
    if (!existing) return response.notFound({ message: 'Catégorie introuvable' })

    const finalSlug = slug?.trim() || existing.slug
    if (finalSlug !== existing.slug) {
      const conflict = await prisma.category.findUnique({ where: { slug: finalSlug } })
      if (conflict) return response.badRequest({ message: 'Ce slug est déjà utilisé.' })
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || existing.name,
        slug: finalSlug,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        icon: icon !== undefined ? (icon?.trim() || null) : existing.icon,
      },
      select: { id: true, name: true, slug: true, icon: true, image: true, isActive: true, createdAt: true },
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_CATEGORY',
      entity: 'category',
      entityId: params.id,
    }).catch(() => {})

    return response.ok({ message: 'Catégorie mise à jour', category: updated })
  }

  async deleteCategory({ params, response, authenticatedAdmin }: HttpContext) {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true, name: true },
    })
    if (!category) return response.notFound({ message: 'Catégorie introuvable' })

    await prisma.category.delete({ where: { id: params.id } })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'DELETE_CATEGORY',
      entity: 'category',
      entityId: params.id,
      metadata: { name: category.name },
    }).catch(() => {})

    return response.ok({ message: 'Catégorie supprimée' })
  }

  async toggleCategoryActive({ params, response }: HttpContext) {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      select: { id: true, isActive: true },
    })
    if (!category) return response.notFound({ message: 'Catégorie introuvable' })

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { isActive: !category.isActive },
      select: { id: true, isActive: true },
    })

    return response.ok({
      message: updated.isActive ? 'Catégorie activée' : 'Catégorie désactivée',
      isActive: updated.isActive,
    })
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  async createSubCategory({ params, request, response }: HttpContext) {
    const { name, slug, description, icon } = request.only(['name', 'slug', 'description', 'icon'])
    if (!name?.trim()) return response.badRequest({ message: 'Le nom est requis.' })

    const category = await prisma.category.findUnique({ where: { id: params.categoryId }, select: { id: true } })
    if (!category) return response.notFound({ message: 'Catégorie introuvable' })

    const finalSlug = slug?.trim() || this.generateSlug(name.trim())

    const existing = await prisma.subCategory.findUnique({ where: { slug: finalSlug } })
    if (existing) return response.badRequest({ message: 'Ce slug est déjà utilisé.' })

    const subCategory = await prisma.subCategory.create({
      data: {
        categoryId: params.categoryId,
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        isActive: true,
      },
      select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
    })

    return response.created({ message: 'Sous-catégorie créée', subCategory })
  }

  async updateSubCategory({ params, request, response }: HttpContext) {
    const { name, slug, description, icon } = request.only(['name', 'slug', 'description', 'icon'])

    const existing = await prisma.subCategory.findUnique({ where: { id: params.id } })
    if (!existing) return response.notFound({ message: 'Sous-catégorie introuvable' })

    const finalSlug = slug?.trim() || (name?.trim() ? this.generateSlug(name.trim()) : existing.slug)

    if (finalSlug !== existing.slug) {
      const conflict = await prisma.subCategory.findUnique({ where: { slug: finalSlug } })
      if (conflict) return response.badRequest({ message: 'Ce slug est déjà utilisé.' })
    }

    const updated = await prisma.subCategory.update({
      where: { id: params.id },
      data: {
        name: name?.trim() || existing.name,
        slug: finalSlug,
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        icon: icon !== undefined ? (icon?.trim() || null) : existing.icon,
      },
      select: { id: true, name: true, slug: true, icon: true, description: true, isActive: true },
    })

    return response.ok({ message: 'Sous-catégorie mise à jour', subCategory: updated })
  }

  async deleteSubCategory({ params, response }: HttpContext) {
    const subCategory = await prisma.subCategory.findUnique({ where: { id: params.id }, select: { id: true } })
    if (!subCategory) return response.notFound({ message: 'Sous-catégorie introuvable' })

    await prisma.subCategory.delete({ where: { id: params.id } })
    return response.ok({ message: 'Sous-catégorie supprimée' })
  }

  // ══════════════════════════════════════════════
  // MESSAGES admin ↔ clients
  // ══════════════════════════════════════════════

  async adminMessages({ request, response, authenticatedAdmin }: HttpContext) {
    const admin = authenticatedAdmin
    if (!admin) return response.unauthorized({ message: 'Non authentifié' })

    const search = request.input('search', '').trim()
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 30))))

    const userWhere: Record<string, unknown> = {}
    if (search) {
      userWhere.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allUsers = await prisma.user.findMany({
      where: userWhere,
      select: { id: true, fullName: true, email: true, avatar: true, role: true },
    })

    const allUserIds = allUsers.map((u) => u.id)

    const lastMessages = await prisma.adminMessage.findMany({
      where: { adminId: admin.id, userId: { in: allUserIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['userId'],
      select: { userId: true, body: true, senderRole: true, createdAt: true },
    })
    const lastMsgMap = new Map(lastMessages.map((m) => [m.userId, m]))

    const unreadCounts = await prisma.adminMessage.groupBy({
      by: ['userId'],
      where: { adminId: admin.id, userId: { in: allUserIds }, senderRole: 'user', isReadByAdmin: false },
      _count: { id: true },
    })
    const unreadMap = new Map(unreadCounts.map((r) => [r.userId, r._count.id]))

    const all = allUsers.map((u) => {
      const last = lastMsgMap.get(u.id)
      return {
        userId: u.id,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt ?? null,
        senderRole: last?.senderRole ?? null,
        unreadByAdmin: unreadMap.get(u.id) ?? 0,
        user: { id: u.id, fullName: u.fullName, email: u.email, avatar: u.avatar, role: u.role },
      }
    })

    all.sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      if (a.lastMessageAt) return -1
      if (b.lastMessageAt) return 1
      return 0
    })

    const total = all.length
    const conversations = all.slice((page - 1) * limit, page * limit)

    return response.ok({ conversations, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  }

  async adminMessageStats({ response, authenticatedAdmin }: HttpContext) {
    const admin = authenticatedAdmin
    if (!admin) return response.unauthorized({ message: 'Non authentifié' })

    const [totalMessages, unreadByAdmin, totalContacts] = await Promise.all([
      prisma.adminMessage.count({ where: { adminId: admin.id } }),
      prisma.adminMessage.count({ where: { adminId: admin.id, senderRole: 'user', isReadByAdmin: false } }),
      prisma.user.count(),
    ])

    return response.ok({ totalMessages, totalConversations: totalContacts, unreadByAdmin })
  }

  async adminMessageThread({ params, response, authenticatedAdmin }: HttpContext) {
    const admin = authenticatedAdmin
    if (!admin) return response.unauthorized({ message: 'Non authentifié' })

    const userId = params.userId

    const [messages, user] = await Promise.all([
      prisma.adminMessage.findMany({
        where: { adminId: admin.id, userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, fullName: true, email: true, avatar: true, role: true },
      }),
    ])

    await prisma.adminMessage.updateMany({
      where: { adminId: admin.id, userId, senderRole: 'user', isReadByAdmin: false },
      data: { isReadByAdmin: true },
    })

    return response.ok({ messages, user })
  }

  async adminSendMessage({ request, response, authenticatedAdmin }: HttpContext) {
    const admin = authenticatedAdmin
    if (!admin) return response.unauthorized({ message: 'Non authentifié' })

    const { userId, body } = request.only(['userId', 'body'])
    if (!userId || !body?.trim()) return response.badRequest({ message: 'userId et body sont requis' })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    })
    if (!user) return response.notFound({ message: 'Utilisateur introuvable' })

    const message = await prisma.adminMessage.create({
      data: { adminId: admin.id, userId, senderRole: 'admin', body: body.trim(), isReadByAdmin: true, isReadByUser: false },
    })

    mailService.sendAdminMessageEmail(user.email, {
      userName: user.fullName || user.email,
      messageBody: body.trim(),
    }).catch(() => {})

    notificationService.create({
      userId: user.id,
      type: 'SYSTEM',
      title: 'Message de l\'administration',
      body: `"${body.trim().slice(0, 80)}${body.trim().length > 80 ? '…' : ''}"`,
      resourceId: message.id,
      resourceUrl: '/account',
    }).catch(() => {})

    activityLogService.log({
      adminId: admin.id,
      adminEmail: admin.email,
      adminRole: admin.role,
      action: 'SEND_MESSAGE',
      entity: 'user',
      entityId: userId,
      metadata: { preview: body.trim().slice(0, 80) },
    }).catch(() => {})

    return response.created({ message })
  }

  // ══════════════════════════════════════════════
  // JOURNAL D'ACTIVITÉ
  // ══════════════════════════════════════════════

  async activityLogs({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(100, Number(request.input('limit', 25)))
    const adminId = request.input('adminId', '')
    const action = request.input('action', '')
    const entity = request.input('entity', '')
    const from = request.input('from', '')
    const to = request.input('to', '')

    const where: Record<string, unknown> = {}
    if (adminId) where.adminId = adminId
    if (action) where.action = action
    if (entity) where.entity = entity
    if (from || to) {
      const df: Record<string, Date> = {}
      if (from) df.gte = new Date(from)
      if (to) df.lte = new Date(new Date(to).setHours(23, 59, 59, 999))
      where.createdAt = df
    }

    const [total, data] = await Promise.all([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return response.ok({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  }

  // ══════════════════════════════════════════════
  // NOTIFICATIONS
  // ══════════════════════════════════════════════

  async adminNotifications({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Number(request.input('limit', 20)))
    const type = request.input('type', '')
    const read = request.input('read', '')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (read === 'true') where.isRead = true
    if (read === 'false') where.isRead = false

    const [total, unread, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, type: true, title: true, body: true, isRead: true,
          resourceId: true, resourceUrl: true, createdAt: true,
          user: { select: { id: true, fullName: true, email: true, avatar: true } },
        },
      }),
    ])

    return response.ok({ notifications, meta: { total, unread, page, limit, totalPages: Math.ceil(total / limit) } })
  }

  async adminSendNotification({ request, response, authenticatedAdmin }: HttpContext) {
    const userId = request.input('userId', '')
    const type = request.input('type', 'SYSTEM')
    const title = request.input('title', '').trim()
    const body = request.input('body', '').trim()

    if (!title || !body) return response.badRequest({ message: 'title et body sont requis' })

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
      if (!user) return response.notFound({ message: 'Utilisateur introuvable' })
      await notificationService.create({ userId, type, title, body })
    } else {
      const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } })
      await notificationService.createMany(users.map((u) => ({ userId: u.id, type, title, body })))
    }

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'SEND_NOTIFICATION',
      entity: userId ? 'user' : 'broadcast',
      entityId: userId || undefined,
      metadata: { title, type },
    }).catch(() => {})

    return response.created({ message: 'Notification envoyée' })
  }

  // ══════════════════════════════════════════════
  // RECHERCHE GLOBALE
  // ══════════════════════════════════════════════

  async globalSearch({ request, response }: HttpContext) {
    const q = (request.input('q', '') as string).trim()
    const type = (request.input('type', 'all') as string)
    const limit = 6

    if (!q || q.length < 2) {
      return response.ok({ users: [], products: [], orders: [] })
    }

    const searchUsers = type === 'all' || type === 'users'
    const searchProducts = type === 'all' || type === 'products'
    const searchOrders = type === 'all' || type === 'orders'

    const [users, products, orders] = await Promise.all([
      searchUsers
        ? prisma.user.findMany({
            where: { OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ] },
            select: { id: true, fullName: true, email: true, avatar: true, isActive: true },
            take: limit,
          })
        : [],
      searchProducts
        ? prisma.product.findMany({
            where: { OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
            ] },
            select: {
              id: true, name: true, slug: true, status: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
            take: limit,
          })
        : [],
      searchOrders
        ? prisma.order.findMany({
            where: { OR: [
              { orderNumber: { contains: q, mode: 'insensitive' } },
              { customerEmail: { contains: q, mode: 'insensitive' } },
              { customerFirstName: { contains: q, mode: 'insensitive' } },
              { customerLastName: { contains: q, mode: 'insensitive' } },
            ] },
            select: {
              id: true, orderNumber: true, customerFirstName: true,
              customerLastName: true, customerEmail: true, status: true, total: true,
            },
            take: limit,
          })
        : [],
    ])

    return response.ok({
      users,
      products: (products as Array<{ id: string; name: string; slug: string; status: string; images: { url: string }[] }>).map((p) => ({
        id: p.id, name: p.name, slug: p.slug, status: p.status,
        mainImage: p.images[0]?.url ?? null,
      })),
      orders: (orders as Array<{ id: string; orderNumber: string; customerFirstName: string | null; customerLastName: string | null; customerEmail: string; status: string; total: unknown }>).map((o) => ({
        id: o.id, orderNumber: o.orderNumber,
        customerName: [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || o.customerEmail,
        customerEmail: o.customerEmail, status: o.status, total: Number(o.total),
      })),
    })
  }

  // ══════════════════════════════════════════════
  // STATISTIQUES SÉCURITÉ
  // ══════════════════════════════════════════════

  async securityStats({ response }: HttpContext) {
    const now = new Date()
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [totalLogins, failedLogins24h, blockedLogins24h, lockedAdmins, activeAdmins, recentFailedLogs] = await Promise.all([
      prisma.activityLog.count({ where: { action: 'LOGIN' } }),
      prisma.activityLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: since24h } } }),
      prisma.activityLog.count({ where: { action: 'LOGIN_BLOCKED', createdAt: { gte: since24h } } }),
      prisma.admin.count({ where: { lockedUntil: { gt: now } } }),
      prisma.admin.count({ where: { isActive: true } }),
      prisma.activityLog.findMany({
        where: { action: { in: ['LOGIN_FAILED', 'LOGIN_BLOCKED'] }, createdAt: { gte: since7d } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { adminEmail: true, action: true, metadata: true, createdAt: true },
      }),
    ])

    return response.ok({
      totalLogins,
      failedLogins24h,
      blockedLogins24h,
      lockedAdmins,
      activeAdmins,
      recentFailedLogs,
    })
  }
}
