import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma_service'
import JwtService from '#services/jwt_service'
import { adminLoginValidator } from '#validators/admin_validator'
import activityLogService from '#services/activity_log_service'

const MAX_ATTEMPTS = 5          // tentatives avant verrouillage
const LOCK_DURATION_MIN = 30    // durée du verrouillage en minutes

export default class AdminAuthController {
  /**
   * @login
   * @summary Connexion admin (table admins séparée)
   * @tag Admin Auth
   * @requestBody {"email": "admin@marketplace.com", "password": "Admin@123456"}
   * @responseBody 200 - {"message": "Connexion admin reussie", "token": "jwt", "admin": {"id": "uuid", "email": "admin@marketplace.com", "role": "ADMIN"}}
   * @responseBody 401 - {"message": "Identifiants invalides"}
   * @responseBody 403 - {"message": "Accès refusé"}
   */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(adminLoginValidator)
    const ip = request.ip()

    const admin = await prisma.admin.findUnique({ where: { email: data.email } })

    if (!admin) {
      // Log tentative sur email inconnu
      activityLogService.log({
        action: 'LOGIN_FAILED',
        metadata: { ip, email: data.email, reason: 'unknown_email' },
      }).catch(() => {})
      return response.unauthorized({ message: 'Identifiants invalides' })
    }

    if (!admin.isActive) {
      return response.forbidden({ message: 'Ce compte administrateur est désactivé' })
    }

    // ── Lire les settings de sécurité ──────────────────────────
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } })
    const lockEnabled = settings?.lockAfterAttempts ?? true

    // ── Vérifier si compte verrouillé ──────────────────────────
    if (lockEnabled && admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainMin = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000)
      activityLogService.log({
        adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
        action: 'LOGIN_BLOCKED',
        metadata: { ip, reason: 'account_locked', remainMin },
      }).catch(() => {})
      return response.forbidden({
        message: `Compte verrouillé. Réessayez dans ${remainMin} minute(s).`,
      })
    }

    // ── Vérifier le mot de passe ───────────────────────────────
    const isValid = await hash.verify(admin.password, data.password)

    if (!isValid) {
      const newAttempts = (admin.failedAttempts ?? 0) + 1
      const shouldLock  = lockEnabled && newAttempts >= MAX_ATTEMPTS

      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          failedAttempts: newAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_DURATION_MIN * 60 * 1000)
            : undefined,
        },
      })

      activityLogService.log({
        adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
        action: 'LOGIN_FAILED',
        metadata: { ip, attempts: newAttempts, locked: shouldLock },
      }).catch(() => {})

      if (shouldLock) {
        return response.forbidden({
          message: `Trop de tentatives. Compte verrouillé ${LOCK_DURATION_MIN} minutes.`,
        })
      }
      const remaining = MAX_ATTEMPTS - newAttempts
      return response.unauthorized({
        message: `Identifiants invalides. ${remaining} tentative(s) restante(s).`,
      })
    }

    // ── Connexion réussie : réinitialiser compteur ─────────────
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null },
    })

    // ── Session timeout : durée selon settings ─────────────────
    const sessionEnabled = settings?.sessionTimeout ?? true
    const expiresIn = sessionEnabled ? '30m' : '7d'

    const token = JwtService.generateAdminToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    }, expiresIn)

    activityLogService.log({
      adminId: admin.id, adminEmail: admin.email, adminRole: admin.role,
      action: 'LOGIN',
      metadata: { ip, sessionExpiry: expiresIn },
    }).catch(() => {})

    return response.ok({
      message: 'Connexion admin réussie',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        avatar: admin.avatar,
        phone: admin.phone,
      },
    })
  }

  /**
   * @me
   * @summary Obtenir le profil admin connecté
   * @tag Admin Auth
   * @responseBody 200 - {"admin": {"id": "uuid", "email": "admin@marketplace.com", "role": "ADMIN"}}
   */
  async me({ response, authenticatedAdmin }: HttpContext) {
    if (!authenticatedAdmin) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    return response.ok({ admin: authenticatedAdmin })
  }

  /**
   * @updateProfile
   * @summary Mettre à jour le profil admin
   * @tag Admin Auth
   */
  async updateProfile({ request, response, authenticatedAdmin }: HttpContext) {
    if (!authenticatedAdmin) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const { fullName, phone, avatar } = request.only(['fullName', 'phone', 'avatar'])

    const updated = await prisma.admin.update({
      where: { id: authenticatedAdmin.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatar: true,
        phone: true,
      },
    })

    return response.ok({
      message: 'Profil admin mis à jour',
      admin: updated,
    })
  }

  /**
   * @updatePassword
   * @summary Changer le mot de passe admin
   * @tag Admin Auth
   */
  async updatePassword({ request, response, authenticatedAdmin }: HttpContext) {
    if (!authenticatedAdmin) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return response.badRequest({
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères',
      })
    }

    const admin = await prisma.admin.findUnique({ where: { id: authenticatedAdmin.id } })
    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    const isValid = await hash.verify(admin.password, currentPassword)
    if (!isValid) {
      return response.badRequest({ message: 'Mot de passe actuel incorrect' })
    }

    const hashedPassword = await hash.make(newPassword)
    await prisma.admin.update({
      where: { id: admin.id },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    })

    return response.ok({ message: 'Mot de passe mis à jour avec succès' })
  }

  /**
   * @dashboard
   * @summary Statistiques dashboard admin
   * @tag Admin Dashboard
   */
  async dashboard({ response }: HttpContext) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const [
      totalUsers,
      activeProducts,
      ordersThisMonth,
      ordersLastMonth,
      usersThisMonth,
      usersLastMonth,
      recentOrders,
      categoryDistribution,
      topProductsRaw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { not: 'CANCELLED' } },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.order.findMany({
        take: 8,
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
          createdAt: true,
        },
      }),
      prisma.product.groupBy({
        by: ['category'],
        where: { status: 'ACTIVE', category: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
      }),
      // Top produits par chiffre d'affaires (via order items)
      prisma.orderItem.groupBy({
        by: ['productId', 'productName', 'productSlug', 'productImage'],
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 6,
      }),
    ])

    // Graphe CA sur 12 mois
    const revenueChart: { month: string; revenue: number; orders: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
      const agg = await prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: { id: true },
      })
      const label = start.toLocaleDateString('fr-FR', { month: 'short' })
      revenueChart.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        revenue: Number(agg._sum.total ?? 0),
        orders: agg._count.id,
      })
    }

    const pct = (a: number, b: number) => b === 0 ? null : Math.round(((a - b) / b) * 100)

    const revenueThisMonth = Number(ordersThisMonth._sum.total ?? 0)
    const revenueLastMonth = Number(ordersLastMonth._sum.total ?? 0)

    return response.ok({
      kpis: {
        revenue:  { value: revenueThisMonth, trend: pct(revenueThisMonth, revenueLastMonth) },
        orders:   { value: ordersThisMonth._count.id, trend: pct(ordersThisMonth._count.id, ordersLastMonth._count.id) },
        users:    { value: totalUsers, newThisMonth: usersThisMonth, trend: pct(usersThisMonth, usersLastMonth) },
        products: { value: activeProducts },
        totalRevenue: revenueChart.reduce((s, m) => s + m.revenue, 0),
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || o.customerEmail,
        customerEmail: o.customerEmail,
        total: Number(o.total),
        status: o.status,
        paymentStatus: o.paymentStatus,
        createdAt: o.createdAt,
      })),
      topProducts: topProductsRaw.map((p, i) => ({
        rank: i + 1,
        id: p.productId,
        name: p.productName,
        slug: p.productSlug,
        image: p.productImage,
        revenue: Number(p._sum.totalPrice ?? 0),
        soldCount: p._count.id,
      })),
      revenueChart,
      categoryChart: categoryDistribution.map((c) => ({
        name: c.category ?? 'Autre',
        value: c._count.id,
      })),
    })
  }

  /**
   * @analytics
   * @summary Statistiques analytiques complètes du marketplace
   * @tag Admin Dashboard
   */
  async analytics({ request, response }: HttpContext) {
    const now = new Date()

    // Filtre de période (query params from / to)
    const fromParam = request.input('from') as string | undefined
    const toParam   = request.input('to')   as string | undefined

    const rangeStart = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const rangeEnd   = toParam   ? new Date(new Date(toParam).setHours(23, 59, 59, 999)) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Période précédente (même durée, juste avant rangeStart) pour les tendances
    const rangeDuration = rangeEnd.getTime() - rangeStart.getTime()
    const prevStart = new Date(rangeStart.getTime() - rangeDuration)
    const prevEnd   = new Date(rangeStart.getTime() - 1)

    const periodFilter = { createdAt: { gte: rangeStart, lte: rangeEnd } }
    const prevFilter   = { createdAt: { gte: prevStart,  lte: prevEnd  } }

    const [
      totalRevenue,
      totalRevenueP,
      totalOrders,
      totalOrdersP,
      totalUsers,
      activeProducts,
      usersInPeriod,
      usersInPrev,
      ordersByStatus,
      topProductsRaw,
      categoryStats,
    ] = await Promise.all([
      // CA sur la période sélectionnée
      prisma.order.aggregate({
        where: { ...periodFilter, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      // CA période précédente
      prisma.order.aggregate({
        where: { ...prevFilter, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      // Commandes sur la période
      prisma.order.count({ where: { ...periodFilter, status: { not: 'CANCELLED' } } }),
      // Commandes période précédente
      prisma.order.count({ where: { ...prevFilter,   status: { not: 'CANCELLED' } } }),
      // Totaux fixes (indépendants de la période)
      prisma.user.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      // Nouveaux users sur la période
      prisma.user.count({ where: periodFilter }),
      prisma.user.count({ where: prevFilter }),
      // Commandes par statut sur la période
      prisma.order.groupBy({
        by: ['status'],
        where: periodFilter,
        _count: { id: true },
        _sum: { total: true },
      }),
      // Top 10 produits par CA sur la période
      prisma.orderItem.groupBy({
        by: ['productId', 'productName', 'productSlug', 'productImage'],
        where: { order: periodFilter },
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),
      // Catégories (produits actifs — statique)
      prisma.product.groupBy({
        by: ['category'],
        where: { status: 'ACTIVE', category: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ])


    // Graphe CA : découpé en mois sur la période sélectionnée
    const revenueChart: { month: string; revenue: number; orders: number }[] = []
    {
      const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
      const endCursor = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0, 23, 59, 59)
      while (cursor <= endCursor) {
        const start = new Date(cursor)
        const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59)
        const clampedEnd = end > rangeEnd ? rangeEnd : end
        const agg = await prisma.order.aggregate({
          where: { createdAt: { gte: start, lte: clampedEnd }, status: { not: 'CANCELLED' } },
          _sum: { total: true },
          _count: { id: true },
        })
        const label = start.toLocaleDateString('fr-FR', { month: 'short', year: start.getFullYear() !== now.getFullYear() ? '2-digit' : undefined })
        revenueChart.push({
          month: label.charAt(0).toUpperCase() + label.slice(1),
          revenue: Number(agg._sum.total ?? 0),
          orders: agg._count.id,
        })
        cursor.setMonth(cursor.getMonth() + 1)
      }
    }

    const pct = (a: number, b: number) => b === 0 ? null : Math.round(((a - b) / b) * 100)
    const rev  = Number(totalRevenue._sum.total  ?? 0)
    const revP = Number(totalRevenueP._sum.total ?? 0)

    return response.ok({
      period: { from: rangeStart.toISOString(), to: rangeEnd.toISOString() },
      kpis: {
        totalRevenue: rev,
        totalOrders,
        totalUsers,
        activeProducts,
        revenueThisMonth:  { value: rev,          trend: pct(rev, revP) },
        ordersThisMonth:   { value: totalOrders,   trend: pct(totalOrders, totalOrdersP) },
        newUsersThisMonth: { value: usersInPeriod, trend: pct(usersInPeriod, usersInPrev) },
      },
      revenueChart,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
        revenue: Number(s._sum.total ?? 0),
      })),
      topProducts: topProductsRaw.map((p, i) => ({
        rank: i + 1,
        id: p.productId,
        name: p.productName,
        slug: p.productSlug,
        image: p.productImage,
        revenue: Number(p._sum.totalPrice ?? 0),
        soldCount: p._count.id,
      })),
      categoryStats: categoryStats.map((c) => ({
        name: c.category ?? 'Autre',
        productCount: c._count.id,
      })),
    })
  }
}
