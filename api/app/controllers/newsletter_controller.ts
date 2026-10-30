import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import MailService from '#services/mail_service'
import { randomBytes } from 'node:crypto'

export default class NewsletterController {
  /**
   * @subscribe
   * @summary S'abonner à la newsletter
   * @tag Newsletter
   * @requestBody {"email": "user@email.com", "name": "Jean Dupont"}
   * @responseBody 201 - {"message": "Inscription réussie ! Consultez votre email."}
   * @responseBody 200 - {"message": "Vous êtes déjà abonné(e) à notre newsletter."}
   * @responseBody 400 - {"message": "Adresse email invalide."}
   */
  async subscribe({ request, response }: HttpContext) {
    const { email, name } = request.only(['email', 'name'])

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.badRequest({ message: 'Adresse email invalide.' })
    }

    try {
      const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } })

      if (existing) {
        if (existing.isActive) {
          return response.ok({ message: 'Vous êtes déjà abonné(e) à notre newsletter.' })
        }
        // Réactivation si désabonné
        const token = randomBytes(32).toString('hex')
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true, token, unsubscribedAt: null, name: name || existing.name },
        })
        await MailService.sendNewsletterConfirmationEmail(email, name || existing.name, token)
        return response.ok({ message: 'Vous êtes à nouveau abonné(e) à notre newsletter !' })
      }

      const token = randomBytes(32).toString('hex')
      await prisma.newsletterSubscriber.create({
        data: { email, name: name || null, token, isActive: true },
      })

      await MailService.sendNewsletterConfirmationEmail(email, name || null, token)

      return response.created({ message: 'Inscription réussie ! Consultez votre email.' })
    } catch (error) {
      console.error('[Newsletter] subscribe error:', error)
      return response.internalServerError({ message: "Erreur lors de l'inscription." })
    }
  }

  /**
   * @unsubscribe
   * @summary Se désabonner de la newsletter via token
   * @tag Newsletter
   * @paramQuery token - Token de désabonnement (reçu par email) - @type(string)
   * @responseBody 200 - {"message": "Vous avez bien été désabonné(e)."}
   * @responseBody 400 - {"message": "Token manquant."}
   */
  async unsubscribe({ request, response }: HttpContext) {
    const token = request.input('token') as string | undefined

    if (!token) {
      return response.badRequest({ message: 'Token manquant.' })
    }

    try {
      const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { token } })

      if (!subscriber || !subscriber.isActive) {
        return response.ok({ message: 'Vous êtes déjà désabonné(e).' })
      }

      await prisma.newsletterSubscriber.update({
        where: { token },
        data: { isActive: false, unsubscribedAt: new Date() },
      })

      return response.ok({ message: 'Vous avez bien été désabonné(e).' })
    } catch (error) {
      return response.internalServerError({ message: 'Erreur lors du désabonnement.' })
    }
  }

  /**
   * @subscribers
   * @summary Admin — liste des abonnés à la newsletter
   * @tag Newsletter
   * @paramQuery page - Numéro de page - @type(number)
   * @paramQuery limit - Nombre par page (max 100) - @type(number)
   * @paramQuery search - Rechercher par email ou nom - @type(string)
   * @paramQuery status - Filtrer par statut : active | inactive - @type(string)
   * @responseBody 200 - {"data": [{"id": "uuid", "email": "user@email.com", "isActive": true}], "meta": {"total": 0, "page": 1, "limit": 50, "totalPages": 0}}
   */
  async subscribers({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(100, Math.max(1, Number(request.input('limit', 50))))
    const search = (request.input('search') as string | undefined) || ''
    const status = request.input('status') as string | undefined // 'active' | 'inactive'

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [total, data] = await Promise.all([
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          subscribedAt: true,
          unsubscribedAt: true,
        },
      }),
    ])

    return response.ok({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  /**
   * @subscriberStats
   * @summary Admin — statistiques des abonnés
   * @tag Newsletter
   * @responseBody 200 - {"data": {"total": 100, "active": 80, "inactive": 20}}
   */
  async subscriberStats({ response }: HttpContext) {
    const [total, active, inactive] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    ])

    return response.ok({ data: { total, active, inactive } })
  }

  /**
   * @deleteSubscriber
   * @summary Admin — supprimer un abonné
   * @tag Newsletter
   * @paramPath id - ID de l'abonné - @type(string)
   * @responseBody 200 - {"message": "Abonné supprimé."}
   */
  async deleteSubscriber({ params, response }: HttpContext) {
    await prisma.newsletterSubscriber.delete({ where: { id: params.id } }).catch(() => {})
    return response.ok({ message: 'Abonné supprimé.' })
  }

  /**
   * @campaigns
   * @summary Admin — liste des campagnes newsletter
   * @tag Newsletter
   * @paramQuery page - Numéro de page - @type(number)
   * @paramQuery limit - Nombre par page (max 50) - @type(number)
   * @responseBody 200 - {"data": [{"id": "uuid", "subject": "Promo ete", "status": "DRAFT", "createdAt": "2025-01-01"}], "meta": {"total": 0, "page": 1, "limit": 20, "totalPages": 0}}
   */
  async campaigns({ request, response }: HttpContext) {
    const page = Math.max(1, Number(request.input('page', 1)))
    const limit = Math.min(50, Math.max(1, Number(request.input('limit', 20))))

    const [total, data] = await Promise.all([
      prisma.newsletterCampaign.count(),
      prisma.newsletterCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return response.ok({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  }

  /**
   * @createCampaign
   * @summary Admin — créer une campagne newsletter (brouillon)
   * @tag Newsletter
   * @requestBody {"subject": "Promo ete", "body": "Decouvrez nos offres..."}
   * @responseBody 201 - {"data": {"id": "uuid", "subject": "Promo d'été", "status": "DRAFT"}}
   * @responseBody 400 - {"message": "Sujet et corps requis."}
   */
  async createCampaign({ request, response, authenticatedAdmin }: HttpContext) {
    const { subject, body } = request.only(['subject', 'body'])
    const adminId = authenticatedAdmin?.id ?? null

    if (!subject?.trim() || !body?.trim()) {
      return response.badRequest({ message: 'Sujet et corps requis.' })
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: { subject: subject.trim(), body: body.trim(), adminId, status: 'DRAFT' },
    })

    return response.created({ data: campaign })
  }

  /**
   * @updateCampaign
   * @summary Admin — mettre à jour un brouillon de campagne
   * @tag Newsletter
   * @paramPath id - ID de la campagne - @type(string)
   * @requestBody {"subject": "Promo ete modifiee", "body": "Nouvelles offres..."}
   * @responseBody 200 - {"data": {"id": "uuid", "subject": "Promo d'été (modifiée)", "status": "DRAFT"}}
   * @responseBody 400 - {"message": "Seuls les brouillons peuvent être modifiés."}
   * @responseBody 404 - {"message": "Campagne introuvable."}
   */
  async updateCampaign({ params, request, response }: HttpContext) {
    const { subject, body } = request.only(['subject', 'body'])

    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: params.id } })
    if (!campaign) return response.notFound({ message: 'Campagne introuvable.' })
    if (campaign.status !== 'DRAFT') {
      return response.badRequest({ message: 'Seuls les brouillons peuvent être modifiés.' })
    }

    const updated = await prisma.newsletterCampaign.update({
      where: { id: params.id },
      data: { subject: subject?.trim(), body: body?.trim() },
    })

    return response.ok({ data: updated })
  }

  /**
   * @deleteCampaign
   * @summary Admin — supprimer une campagne (sauf si en cours d'envoi)
   * @tag Newsletter
   * @paramPath id - ID de la campagne - @type(string)
   * @responseBody 200 - {"message": "Campagne supprimée."}
   * @responseBody 400 - {"message": "Impossible de supprimer une campagne en cours."}
   * @responseBody 404 - {"message": "Campagne introuvable."}
   */
  async deleteCampaign({ params, response }: HttpContext) {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: params.id } })
    if (!campaign) return response.notFound({ message: 'Campagne introuvable.' })
    if (campaign.status === 'SENDING') {
      return response.badRequest({ message: 'Impossible de supprimer une campagne en cours.' })
    }

    await prisma.newsletterCampaign.delete({ where: { id: params.id } })
    return response.ok({ message: 'Campagne supprimée.' })
  }

  /**
   * @sendCampaign
   * @summary Admin — envoyer une campagne à tous les abonnés actifs
   * @tag Newsletter
   * @paramPath id - ID de la campagne - @type(string)
   * @responseBody 200 - {"message": "Envoi démarré vers 80 abonné(s).", "data": {"campaignId": "uuid", "recipientCount": 80}}
   * @responseBody 400 - {"message": "Cette campagne a déjà été envoyée ou est en cours."}
   * @responseBody 404 - {"message": "Campagne introuvable."}
   */
  async sendCampaign({ params, response }: HttpContext) {
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id: params.id } })
    if (!campaign) return response.notFound({ message: 'Campagne introuvable.' })
    if (campaign.status !== 'DRAFT') {
      return response.badRequest({ message: 'Cette campagne a déjà été envoyée ou est en cours.' })
    }

    // Marquer comme en envoi
    await prisma.newsletterCampaign.update({
      where: { id: params.id },
      data: { status: 'SENDING' },
    })

    // Récupérer tous les abonnés actifs
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true, name: true, token: true },
    })

    // Répondre immédiatement — envoi en arrière-plan
    response.ok({
      message: `Envoi démarré vers ${subscribers.length} abonné(s).`,
      data: { campaignId: campaign.id, recipientCount: subscribers.length },
    })

    // Envoi asynchrone
    ;(async () => {
      let sentCount = 0
      let failedCount = 0

      for (const sub of subscribers) {
        try {
          await MailService.sendNewsletterCampaign(
            sub.email,
            sub.name,
            campaign.subject,
            campaign.body,
            sub.token ?? ''
          )
          sentCount++
        } catch {
          failedCount++
        }
      }

      await prisma.newsletterCampaign.update({
        where: { id: params.id },
        data: {
          status: subscribers.length > 0 ? 'SENT' : 'FAILED',
          sentAt: new Date(),
          sentCount,
          failedCount,
        },
      })
    })()
  }
}
