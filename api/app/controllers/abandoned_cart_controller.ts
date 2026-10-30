import type { HttpContext } from '@adonisjs/core/http'
import { randomBytes } from 'node:crypto'
import prisma from '#services/prisma_service'

export default class AbandonedCartController {
  /**
   * Sauvegarde ou met à jour un panier abandonné.
   * Appelé depuis le frontend dès que l'email est connu.
   */
  async save({ request, response, authenticatedUser }: HttpContext) {
    const { email, firstName, cartItems } = request.only(['email', 'firstName', 'cartItems'])

    if (!email || !Array.isArray(cartItems) || cartItems.length === 0) {
      return response.badRequest({ message: 'email et cartItems requis' })
    }

    const cartTotal = cartItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const itemCount = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0)

    // Un seul enregistrement actif par email (non récupéré)
    const existing = await prisma.abandonedCart.findFirst({
      where: { email, isRecovered: false },
      orderBy: { createdAt: 'desc' },
    })

    if (existing) {
      await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          cartData: cartItems,
          cartTotal,
          itemCount,
          firstName: firstName ?? existing.firstName,
          abandonedAt: new Date(),
          userId: authenticatedUser?.id ?? existing.userId,
        },
      })
      return response.ok({ message: 'Panier mis à jour' })
    }

    const recoveryToken = randomBytes(32).toString('hex')

    await prisma.abandonedCart.create({
      data: {
        email,
        firstName: firstName ?? null,
        userId: authenticatedUser?.id ?? null,
        cartData: cartItems,
        cartTotal,
        itemCount,
        recoveryToken,
      },
    })

    return response.created({ message: 'Panier sauvegardé' })
  }

  /**
   * Récupère un panier via son token de relance (clic sur le lien email).
   * Marque le panier comme récupéré.
   */
  async recover({ params, response }: HttpContext) {
    const cart = await prisma.abandonedCart.findUnique({
      where: { recoveryToken: params.token },
    })

    if (!cart) {
      return response.notFound({ message: 'Lien invalide ou expiré' })
    }

    if (cart.isRecovered) {
      return response.ok({ message: 'Déjà récupéré', cartData: cart.cartData })
    }

    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: { isRecovered: true, recoveredAt: new Date() },
    })

    return response.ok({ cartData: cart.cartData })
  }

  /**
   * Marque le panier comme récupéré après une commande réussie.
   * Appelé depuis le frontend après confirmation de commande.
   */
  async markConverted({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    if (!email) return response.badRequest({ message: 'email requis' })

    await prisma.abandonedCart.updateMany({
      where: { email, isRecovered: false },
      data: { isRecovered: true, recoveredAt: new Date() },
    })

    return response.ok({ message: 'Panier converti' })
  }

  /**
   * Endpoint interne déclenché par le cron pour envoyer les relances.
   * Protégé par un secret partagé (CRON_SECRET).
   */
  async sendReminders({ request, response }: HttpContext) {
    const secret = request.header('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return response.unauthorized({ message: 'Non autorisé' })
    }

    const mailService = (await import('#services/mail_service')).default
    const env = (await import('#start/env')).default

    const frontendUrl = env.get('FRONTEND_URL', 'http://localhost:3000')
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // — Premier rappel : abandonné il y a > 1h, pas encore envoyé
    const firstBatch = await prisma.abandonedCart.findMany({
      where: {
        isRecovered: false,
        firstReminderSentAt: null,
        abandonedAt: { lte: oneHourAgo },
      },
      take: 50,
    })

    let first = 0
    for (const cart of firstBatch) {
      const cartItems = cart.cartData as any[]
      const recoveryLink = `${frontendUrl}/cart/recover?token=${cart.recoveryToken}`
      const result = await mailService.sendAbandonedCartEmail(
        cart.email,
        cart.firstName ?? 'là',
        cartItems,
        Number(cart.cartTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
        recoveryLink,
        1
      )
      if (result.success) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { firstReminderSentAt: new Date() },
        })
        first++
      }
    }

    // — Second rappel : abandonné il y a > 24h, premier envoyé, second pas encore
    const secondBatch = await prisma.abandonedCart.findMany({
      where: {
        isRecovered: false,
        firstReminderSentAt: { not: null },
        secondReminderSentAt: null,
        abandonedAt: { lte: twentyFourHoursAgo },
      },
      take: 50,
    })

    let second = 0
    for (const cart of secondBatch) {
      const cartItems = cart.cartData as any[]
      const recoveryLink = `${frontendUrl}/cart/recover?token=${cart.recoveryToken}`
      const result = await mailService.sendAbandonedCartEmail(
        cart.email,
        cart.firstName ?? 'là',
        cartItems,
        Number(cart.cartTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
        recoveryLink,
        2
      )
      if (result.success) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { secondReminderSentAt: new Date() },
        })
        second++
      }
    }

    return response.ok({
      message: 'Relances envoyées',
      firstReminders: first,
      secondReminders: second,
    })
  }

  /**
   * Admin — liste paginée des paniers abandonnés.
   */
  async adminList({ request, response }: HttpContext) {
    const page   = Math.max(1, Number(request.input('page', 1)))
    const limit  = Math.min(50, Math.max(1, Number(request.input('limit', 20))))
    const status = request.input('status') // 'all' | 'pending' | 'recovered'
    const search = request.input('search', '')

    const where: any = {}
    if (status === 'recovered') where.isRecovered = true
    if (status === 'pending')   where.isRecovered = false
    if (search) where.email = { contains: search, mode: 'insensitive' }

    const [carts, total, stats] = await Promise.all([
      prisma.abandonedCart.findMany({
        where,
        orderBy: { abandonedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.abandonedCart.count({ where }),
      prisma.abandonedCart.aggregate({
        _count: { id: true },
        _sum: { itemCount: true },
        _avg: { cartTotal: true },
      }),
    ])

    const recovered = await prisma.abandonedCart.count({ where: { isRecovered: true } })
    const pending   = await prisma.abandonedCart.count({ where: { isRecovered: false } })

    return response.ok({
      data: carts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: {
        total: stats._count.id,
        recovered,
        pending,
        avgCartTotal: Number(stats._avg.cartTotal ?? 0),
      },
    })
  }

  /**
   * Admin — envoyer une relance manuelle pour un panier spécifique.
   */
  async adminSendReminder({ params, request, response }: HttpContext) {
    const cart = await prisma.abandonedCart.findUnique({ where: { id: params.id } })
    if (!cart) return response.notFound({ message: 'Panier introuvable' })
    if (cart.isRecovered) return response.badRequest({ message: 'Panier déjà récupéré' })

    const reminderNumber = Number(request.input('reminder', 1)) as 1 | 2

    const mailService = (await import('#services/mail_service')).default
    const env = (await import('#start/env')).default
    const frontendUrl = env.get('FRONTEND_URL', 'http://localhost:3000')

    const cartItems = cart.cartData as any[]
    const recoveryLink = `${frontendUrl}/cart/recover?token=${cart.recoveryToken}`

    const result = await mailService.sendAbandonedCartEmail(
      cart.email,
      cart.firstName ?? 'là',
      cartItems,
      Number(cart.cartTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
      recoveryLink,
      reminderNumber
    )

    if (!result.success) {
      return response.internalServerError({ message: 'Erreur lors de l\'envoi' })
    }

    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: reminderNumber === 1
        ? { firstReminderSentAt: new Date() }
        : { secondReminderSentAt: new Date() },
    })

    return response.ok({ message: 'Relance envoyée avec succès' })
  }

  /**
   * Admin — envoyer les relances pour tous les paniers en attente.
   */
  async adminSendAllReminders({ response }: HttpContext) {
    const mailService = (await import('#services/mail_service')).default
    const env = (await import('#start/env')).default
    const frontendUrl = env.get('FRONTEND_URL', 'http://localhost:3000')

    const pending = await prisma.abandonedCart.findMany({
      where: { isRecovered: false, firstReminderSentAt: null },
      take: 100,
    })

    let sent = 0
    for (const cart of pending) {
      const cartItems = cart.cartData as any[]
      const recoveryLink = `${frontendUrl}/cart/recover?token=${cart.recoveryToken}`
      const result = await mailService.sendAbandonedCartEmail(
        cart.email, cart.firstName ?? 'là', cartItems,
        Number(cart.cartTotal).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
        recoveryLink, 1
      )
      if (result.success) {
        await prisma.abandonedCart.update({
          where: { id: cart.id },
          data: { firstReminderSentAt: new Date() },
        })
        sent++
      }
    }

    return response.ok({ message: `${sent} relance(s) envoyée(s)`, sent })
  }
}
