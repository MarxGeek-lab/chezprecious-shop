// ==============================================
// CONTROLLER NOTIFICATION — notification_controller.ts
// ==============================================

import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'

export default class NotificationController {
  /**
   * @index
   * @summary Lister les notifications de l'utilisateur connecté (paginées)
   * @tag Notifications
   * @paramQuery page - Numéro de page - @type(number)
   * @paramQuery limit - Nombre par page (max 50) - @type(number)
   * @paramQuery unread - Filtrer les non lues seulement (true/false) - @type(string)
   * @responseBody 200 - {"notifications": [{"id": "uuid", "title": "Titre", "body": "Corps", "isRead": false}], "meta": {"total": 10, "page": 1, "limit": 20, "totalPages": 1, "unreadCount": 3}}
   * @responseBody 401 - {"message": "Non authentifié"}
   */
  async index({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 20))))
    const unreadOnly = request.input('unread') === 'true'

    const where: any = { userId: authenticatedUser.id }
    if (unreadOnly) where.isRead = false

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: authenticatedUser.id, isRead: false } }),
    ])

    return response.ok({
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    })
  }

  /**
   * @unreadCount
   * @summary Nombre de notifications non lues
   * @tag Notifications
   * @responseBody 200 - {"count": 3}
   * @responseBody 401 - {"message": "Non authentifié"}
   */
  async unreadCount({ response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const count = await prisma.notification.count({
      where: { userId: authenticatedUser.id, isRead: false },
    })

    return response.ok({ count })
  }

  /**
   * @markRead
   * @summary Marquer une notification comme lue
   * @tag Notifications
   * @paramPath id - ID de la notification - @type(string)
   * @responseBody 200 - {"message": "Notification marquée comme lue"}
   * @responseBody 401 - {"message": "Non authentifié"}
   * @responseBody 404 - {"message": "Notification introuvable"}
   */
  async markRead({ params, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const notif = await prisma.notification.findFirst({
      where: { id: params.id, userId: authenticatedUser.id },
    })

    if (!notif) {
      return response.notFound({ message: 'Notification introuvable' })
    }

    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true },
    })

    return response.ok({ message: 'Notification marquée comme lue' })
  }

  /**
   * @markAllRead
   * @summary Marquer toutes les notifications comme lues
   * @tag Notifications
   * @responseBody 200 - {"message": "Toutes les notifications marquées comme lues"}
   * @responseBody 401 - {"message": "Non authentifié"}
   */
  async markAllRead({ response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    await prisma.notification.updateMany({
      where: { userId: authenticatedUser.id, isRead: false },
      data: { isRead: true },
    })

    return response.ok({ message: 'Toutes les notifications marquées comme lues' })
  }

  /**
   * @destroy
   * @summary Supprimer une notification
   * @tag Notifications
   * @paramPath id - ID de la notification - @type(string)
   * @responseBody 200 - {"message": "Notification supprimée"}
   * @responseBody 401 - {"message": "Non authentifié"}
   * @responseBody 404 - {"message": "Notification introuvable"}
   */
  async destroy({ params, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const notif = await prisma.notification.findFirst({
      where: { id: params.id, userId: authenticatedUser.id },
    })

    if (!notif) {
      return response.notFound({ message: 'Notification introuvable' })
    }

    await prisma.notification.delete({ where: { id: params.id } })

    return response.ok({ message: 'Notification supprimée' })
  }

  /**
   * @destroyRead
   * @summary Supprimer toutes les notifications lues
   * @tag Notifications
   * @responseBody 200 - {"message": "5 notification(s) supprimée(s)"}
   * @responseBody 401 - {"message": "Non authentifié"}
   */
  async destroyRead({ response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    const { count } = await prisma.notification.deleteMany({
      where: { userId: authenticatedUser.id, isRead: true },
    })

    return response.ok({ message: `${count} notification(s) supprimée(s)` })
  }
}
