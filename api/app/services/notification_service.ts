// ==============================================
// SERVICE NOTIFICATION — notification_service.ts
// ==============================================
// Utilitaire centralisé pour créer des notifications in-app.
// Appelé depuis les controllers (order, review, message, boost…).

import prisma from '#services/prisma_service'
import type { NotificationType } from '../generated/prisma/enums.js'

export interface CreateNotificationPayload {
  userId: string
  type: NotificationType
  title: string
  body: string
  resourceId?: string
  resourceUrl?: string
}

class NotificationService {
  /**
   * Crée une notification pour un utilisateur donné.
   * Ne lève pas d'exception : les erreurs sont loggées silencieusement
   * pour ne pas bloquer le flux principal.
   */
  async create(payload: CreateNotificationPayload): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: payload.userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          resourceId: payload.resourceId ?? null,
          resourceUrl: payload.resourceUrl ?? null,
        },
      })
    } catch (err) {
      console.error('[NotificationService] create failed:', err)
    }
  }

  /**
   * Crée des notifications pour plusieurs utilisateurs à la fois.
   */
  async createMany(payloads: CreateNotificationPayload[]): Promise<void> {
    try {
      await prisma.notification.createMany({
        data: payloads.map((p) => ({
          userId: p.userId,
          type: p.type,
          title: p.title,
          body: p.body,
          resourceId: p.resourceId ?? null,
          resourceUrl: p.resourceUrl ?? null,
        })),
      })
    } catch (err) {
      console.error('[NotificationService] createMany failed:', err)
    }
  }
}

export default new NotificationService()
