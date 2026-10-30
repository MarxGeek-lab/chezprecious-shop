import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import notificationService from '#services/notification_service'

// Admin ID constant — admin messages always reference the single admin account
const ADMIN_PLACEHOLDER_ID = 'admin'

export default class MessageController {
  // ══════════════════════════════════════════════
  // ADMIN SIDE (seller routes repurposed)
  // ══════════════════════════════════════════════

  /**
   * @index
   * @summary Admin — liste des conversations groupées par client
   * @tag Messages
   */
  async index({ response, authenticatedUser }: HttpContext) {
    try {
      if (!authenticatedUser) return response.unauthorized({ message: 'Non authentifié' })

      const messages = await prisma.adminMessage.findMany({
        orderBy: { createdAt: 'desc' },
      })

      // Fetch user info for all userIds
      const userIds = [...new Set(messages.map((m) => m.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, email: true },
      })
      const userMap = new Map(users.map((u) => [u.id, u]))

      // Group by userId
      const convMap = new Map<string, {
        customerEmail: string
        customerName: string
        lastMessage: string
        lastMessageAt: Date
        unreadCount: number
      }>()

      for (const msg of messages) {
        const key = msg.userId
        const u = userMap.get(key)
        if (!convMap.has(key)) {
          convMap.set(key, {
            customerEmail: u?.email || key,
            customerName: u?.fullName || u?.email || key,
            lastMessage: msg.body,
            lastMessageAt: msg.createdAt,
            unreadCount: 0,
          })
        }
        const conv = convMap.get(key)!
        if (!msg.isReadByAdmin && msg.senderRole === 'user') conv.unreadCount++
      }

      const conversations = Array.from(convMap.values())
      return response.ok({ conversations })
    } catch (error) {
      console.error('[MessageController] index error:', error)
      return response.internalServerError({ message: 'Erreur serveur' })
    }
  }

  /**
   * @show
   * @summary Admin — messages d'une conversation avec un client
   * @tag Messages
   */
  async show({ params, response, authenticatedUser }: HttpContext) {
    try {
      if (!authenticatedUser) return response.unauthorized({ message: 'Non authentifié' })

      const customerEmail = decodeURIComponent(params.customerEmail)
      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true },
      })

      if (!user) return response.notFound({ message: 'Client introuvable' })

      const messages = await prisma.adminMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })

      await prisma.adminMessage.updateMany({
        where: { userId: user.id, isReadByAdmin: false },
        data: { isReadByAdmin: true },
      })

      return response.ok({ messages })
    } catch (error) {
      console.error('[MessageController] show error:', error)
      return response.internalServerError({ message: 'Erreur serveur' })
    }
  }

  /**
   * @store
   * @summary Admin — envoyer un message à un client
   * @tag Messages
   */
  async store({ request, response, authenticatedUser }: HttpContext) {
    try {
      if (!authenticatedUser) return response.unauthorized({ message: 'Non authentifié' })

      const { customerEmail, body } = request.only(['customerEmail', 'body'])

      if (!customerEmail || !body?.trim()) {
        return response.badRequest({ message: 'customerEmail et body sont requis' })
      }

      const user = await prisma.user.findUnique({
        where: { email: customerEmail },
        select: { id: true },
      })
      if (!user) return response.notFound({ message: 'Client introuvable' })

      const message = await prisma.adminMessage.create({
        data: {
          adminId: authenticatedUser.id,
          userId: user.id,
          senderRole: 'admin',
          body: body.trim(),
          isReadByAdmin: true,
          isReadByUser: false,
        },
      })

      notificationService.create({
        userId: user.id,
        type: 'MESSAGE_NEW',
        title: 'Message du service client',
        body: `"${body.trim().slice(0, 80)}${body.trim().length > 80 ? '…' : ''}"`,
        resourceId: message.id,
        resourceUrl: '/account',
      }).catch(() => {})

      return response.created({ message })
    } catch (error) {
      console.error('[MessageController] store error:', error)
      return response.internalServerError({ message: "Erreur lors de l'envoi du message" })
    }
  }

  /**
   * @unreadCount
   * @summary Admin — nombre de messages non lus
   * @tag Messages
   */
  async unreadCount({ response, authenticatedUser }: HttpContext) {
    try {
      if (!authenticatedUser) return response.unauthorized({ message: 'Non authentifié' })

      const count = await prisma.adminMessage.count({
        where: { isReadByAdmin: false, senderRole: 'user' },
      })
      return response.ok({ count })
    } catch (error) {
      return response.internalServerError({ message: 'Erreur serveur' })
    }
  }

  // ══════════════════════════════════════════════
  // CÔTÉ CLIENT
  // ══════════════════════════════════════════════

  /**
   * @customerConversations
   * @summary Client — conversation avec le service client
   * @tag Messages
   */
  async customerConversations({ response, authenticatedUser }: HttpContext) {
    try {
      const user = authenticatedUser
      if (!user) return response.unauthorized({ message: 'Non authentifié' })

      const messages = await prisma.adminMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })

      if (messages.length === 0) {
        return response.ok({ conversations: [] })
      }

      const lastMsg = messages[0]
      const unreadCount = messages.filter(
        (m) => !m.isReadByUser && m.senderRole === 'admin'
      ).length

      const conversations = [{
        sellerId: ADMIN_PLACEHOLDER_ID,
        sellerName: 'Service Client',
        lastMessage: lastMsg.body,
        lastMessageAt: lastMsg.createdAt,
        unreadCount,
      }]

      return response.ok({ conversations })
    } catch (error) {
      console.error('[MessageController] customerConversations error:', error)
      return response.internalServerError({ message: 'Erreur serveur' })
    }
  }

  /**
   * @customerThread
   * @summary Client — fil de messages avec le service client
   * @tag Messages
   */
  async customerThread({ response, authenticatedUser }: HttpContext) {
    try {
      const user = authenticatedUser
      if (!user) return response.unauthorized({ message: 'Non authentifié' })

      const messages = await prisma.adminMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      })

      await prisma.adminMessage.updateMany({
        where: { userId: user.id, senderRole: 'admin', isReadByUser: false },
        data: { isReadByUser: true },
      })

      return response.ok({
        messages,
        store: { name: 'Service Client', logo: null },
      })
    } catch (error) {
      console.error('[MessageController] customerThread error:', error)
      return response.internalServerError({ message: 'Erreur serveur' })
    }
  }

  /**
   * @customerSend
   * @summary Client — envoyer un message au service client
   * @tag Messages
   */
  async customerSend({ request, response, authenticatedUser }: HttpContext) {
    try {
      const user = authenticatedUser
      if (!user) return response.unauthorized({ message: 'Non authentifié' })

      const { body } = request.only(['body'])

      if (!body?.trim()) {
        return response.badRequest({ message: 'body est requis' })
      }

      const message = await prisma.adminMessage.create({
        data: {
          adminId: ADMIN_PLACEHOLDER_ID,
          userId: user.id,
          senderRole: 'user',
          body: body.trim(),
          isReadByAdmin: false,
          isReadByUser: true,
        },
      })

      return response.created({ message })
    } catch (error) {
      console.error('[MessageController] customerSend error:', error)
      return response.internalServerError({ message: "Erreur lors de l'envoi" })
    }
  }
}
