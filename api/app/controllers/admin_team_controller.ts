import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma_service'
import mailService from '#services/mail_service'
import env from '#start/env'
import { randomBytes } from 'node:crypto'
import activityLogService from '#services/activity_log_service'

export default class AdminTeamController {
  /**
   * @index
   * @summary Liste tous les admins
   * @tag Admin Team
   * @paramQuery page - Numéro de page - @type(number)
   * @paramQuery limit - Nombre par page - @type(number)
   * @paramQuery search - Rechercher par email ou nom - @type(string)
   * @responseBody 200 - {"admins": [{"id": "uuid", "email": "admin@email.com", "role": "ADMIN"}], "meta": {"total": 0, "page": 1, "limit": 20, "lastPage": 1}}
   */
  async index({ request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 20))
    const search = request.input('search', '')

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        where,
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.admin.count({ where }),
    ])

    return response.ok({
      admins,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    })
  }

  /**
   * @show
   * @summary Détails d'un admin
   * @tag Admin Team
   * @paramPath id - ID de l'admin - @type(string)
   * @responseBody 200 - {"admin": {"id": "uuid", "email": "admin@email.com", "role": "ADMIN", "isActive": true}}
   * @responseBody 404 - {"message": "Admin non trouvé"}
   */
  async show({ params, response }: HttpContext) {
    const admin = await prisma.admin.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    return response.ok({ admin })
  }

  /**
   * @invite
   * @summary Inviter un nouvel admin
   * @tag Admin Team
   * @requestBody {"email": "newadmin@email.com", "fullName": "Jean Dupont", "role": "ADMIN"}
   * @responseBody 201 - {"message": "Admin invité avec succès", "admin": {"id": "uuid", "email": "newadmin@email.com"}}
   * @responseBody 400 - {"message": "Email requis"}
   * @responseBody 409 - {"message": "Un admin avec cet email existe déjà"}
   */
  async invite({ request, response, authenticatedAdmin }: HttpContext) {
    const { email, fullName, role } = request.only(['email', 'fullName', 'role'])

    if (!email) {
      return response.badRequest({ message: 'Email requis' })
    }

    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) {
      return response.conflict({ message: 'Un admin avec cet email existe déjà' })
    }

    const setupToken = randomBytes(32).toString('hex')
    const setupExpires = new Date(Date.now() + 72 * 60 * 60 * 1000)
    const tempPassword = await hash.make(randomBytes(32).toString('hex'))

    const admin = await prisma.admin.create({
      data: {
        email,
        fullName: fullName || null,
        password: tempPassword,
        role: role || 'ADMIN',
        isActive: true,
        resetToken: setupToken,
        resetExpires: setupExpires,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    const frontendUrl = env.get('FRONTEND_URL_ADMIN', env.get('FRONTEND_URL_ADMIN', 'https://admin.chezprecious.com'))
    const setupUrl = `${frontendUrl}/set-password?token=${setupToken}`

    // Envoyer l'email d'invitation (sans bloquer la réponse)
    mailService.sendAdminInviteEmail(email, {
      fullName: fullName || null,
      role: role || 'ADMIN',
      setupUrl,
    }).catch((e) => console.error('[AdminTeam] invite email failed:', e.message))

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'INVITE_ADMIN',
      entity: 'admin',
      entityId: admin.id,
      metadata: { invitedEmail: email, role: role || 'ADMIN' },
    }).catch(() => {})

    return response.created({
      message: 'Admin invité avec succès',
      admin,
      setupUrl: `/set-password?token=${setupToken}`,
    })
  }

  /**
   * @update
   * @summary Mettre à jour un admin (nom, téléphone, rôle, statut)
   * @tag Admin Team
   * @paramPath id - ID de l'admin - @type(string)
   * @requestBody {"fullName": "Jean Dupont", "phone": "0700000000", "isActive": true, "role": "SUPER_ADMIN"}
   * @responseBody 200 - {"message": "Admin mis à jour", "admin": {"id": "uuid", "role": "SUPER_ADMIN"}}
   * @responseBody 404 - {"message": "Admin non trouvé"}
   */
  async update({ params, request, response }: HttpContext) {
    const admin = await prisma.admin.findUnique({ where: { id: params.id } })

    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    const { fullName, phone, isActive, role } = request.only(['fullName', 'phone', 'isActive', 'role'])

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
        ...(role !== undefined && { role }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return response.ok({ message: 'Admin mis à jour', admin: updated })
  }

  /**
   * @destroy
   * @summary Supprimer un admin (ne peut pas se supprimer soi-même)
   * @tag Admin Team
   * @paramPath id - ID de l'admin - @type(string)
   * @responseBody 200 - {"message": "Admin supprimé"}
   * @responseBody 400 - {"message": "Vous ne pouvez pas supprimer votre propre compte"}
   * @responseBody 401 - {"message": "Non authentifié"}
   * @responseBody 404 - {"message": "Admin non trouvé"}
   */
  async destroy({ params, response, authenticatedAdmin }: HttpContext) {
    if (!authenticatedAdmin) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    if (params.id === authenticatedAdmin.id) {
      return response.badRequest({ message: 'Vous ne pouvez pas supprimer votre propre compte' })
    }

    const admin = await prisma.admin.findUnique({ where: { id: params.id } })

    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    await prisma.admin.delete({ where: { id: admin.id } })

    activityLogService.log({
      adminId: authenticatedAdmin.id,
      adminEmail: authenticatedAdmin.email,
      adminRole: authenticatedAdmin.role,
      action: 'DELETE_ADMIN',
      entity: 'admin',
      entityId: params.id,
      metadata: { deletedEmail: admin.email },
    }).catch(() => {})

    return response.ok({ message: 'Admin supprimé' })
  }

  /**
   * @resendSetupLink
   * @summary Renvoyer le lien de configuration de mot de passe d'un admin
   * @tag Admin Team
   * @paramPath id - ID de l'admin - @type(string)
   * @responseBody 200 - {"message": "Lien de configuration renvoyé par email"}
   * @responseBody 404 - {"message": "Admin non trouvé"}
   */
  async resendSetupLink({ params, response, authenticatedAdmin }: HttpContext) {
    const admin = await prisma.admin.findUnique({ where: { id: params.id } })

    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    const setupToken = randomBytes(32).toString('hex')
    const setupExpires = new Date(Date.now() + 72 * 60 * 60 * 1000)

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: { resetToken: setupToken, resetExpires: setupExpires },
      select: { email: true, fullName: true, role: true },
    })

    const frontendUrl = env.get('FRONTEND_URL_ADMIN', env.get('FRONTEND_URL_ADMIN', 'http://localhost:3001'))
    const setupUrl = `${frontendUrl}/set-password?token=${setupToken}`

    // Envoyer l'email (sans bloquer)
    mailService.sendAdminInviteEmail(updated.email, {
      fullName: updated.fullName,
      role: updated.role,
      setupUrl,
      isResend: true,
    }).catch((e) => console.error('[AdminTeam] resend email failed:', e.message))

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'RESEND_ADMIN_SETUP',
      entity: 'admin',
      entityId: params.id,
      metadata: { targetEmail: updated.email },
    }).catch(() => {})

    return response.ok({
      message: 'Lien de configuration renvoyé par email',
      setupUrl: `/set-password?token=${setupToken}`,
    })
  }

  /**
   * @requestPasswordReset
   * @summary Demander la réinitialisation de mot de passe admin (publique)
   * @tag Admin Team
   * @requestBody {"email": "admin@email.com"}
   * @responseBody 200 - {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}
   * @responseBody 400 - {"message": "Email requis"}
   */
  async requestPasswordReset({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.badRequest({ message: 'Email requis' })
    }

    const admin = await prisma.admin.findUnique({ where: { email } })

    if (!admin) {
      return response.ok({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" })
    }

    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000)

    await prisma.admin.update({
      where: { id: admin.id },
      data: { resetToken, resetExpires },
    })

    await mailService.sendAdminPasswordResetEmail(admin.email, admin.fullName, resetToken)

    return response.ok({ message: "Si cet email existe, un lien de réinitialisation a été envoyé" })
  }

  /**
   * @verifyToken
   * @summary Vérifier un token de reset/setup admin (publique)
   * @tag Admin Team
   * @requestBody {"token": "abc123..."}
   * @responseBody 200 - {"valid": true, "email": "admin@email.com", "fullName": "Jean"}
   * @responseBody 400 - {"message": "Token invalide ou expiré"}
   */
  async verifyToken({ request, response }: HttpContext) {
    const { token } = request.only(['token'])

    if (!token) {
      return response.badRequest({ message: 'Token requis' })
    }

    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gte: new Date() },
      },
      select: { id: true, email: true, fullName: true },
    })

    if (!admin) {
      return response.badRequest({ message: 'Token invalide ou expiré' })
    }

    return response.ok({ valid: true, email: admin.email, fullName: admin.fullName })
  }

  /**
   * @setPassword
   * @summary Définir/réinitialiser le mot de passe admin via token (publique)
   * @tag Admin Team
   * @requestBody {"token": "abc123...", "password": "nouveaumotdepasse"}
   * @responseBody 200 - {"message": "Mot de passe défini avec succès"}
   * @responseBody 400 - {"message": "Token et mot de passe (min 6 caractères) requis"}
   */
  async setPassword({ request, response }: HttpContext) {
    const { token, password } = request.only(['token', 'password'])

    if (!token || !password || password.length < 6) {
      return response.badRequest({ message: 'Token et mot de passe (min 6 caractères) requis' })
    }

    const admin = await prisma.admin.findFirst({
      where: {
        resetToken: token,
        resetExpires: { gte: new Date() },
      },
    })

    if (!admin) {
      return response.badRequest({ message: 'Token invalide ou expiré' })
    }

    const hashedPassword = await hash.make(password)

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
        isActive: true,
      },
    })

    return response.ok({ message: 'Mot de passe défini avec succès' })
  }

  /**
   * @toggleActive
   * @summary Activer ou désactiver un admin
   * @tag Admin Team
   * @paramPath id - ID de l'admin - @type(string)
   * @responseBody 200 - {"message": "Admin activé", "admin": {"id": "uuid", "isActive": true}}
   * @responseBody 400 - {"message": "Vous ne pouvez pas vous désactiver vous-même"}
   * @responseBody 401 - {"message": "Non authentifié"}
   * @responseBody 404 - {"message": "Admin non trouvé"}
   */
  async toggleActive({ params, response, authenticatedAdmin }: HttpContext) {
    if (!authenticatedAdmin) {
      return response.unauthorized({ message: 'Non authentifié' })
    }

    if (params.id === authenticatedAdmin.id) {
      return response.badRequest({ message: 'Vous ne pouvez pas vous désactiver vous-même' })
    }

    const admin = await prisma.admin.findUnique({ where: { id: params.id } })

    if (!admin) {
      return response.notFound({ message: 'Admin non trouvé' })
    }

    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: { isActive: !admin.isActive },
      select: { id: true, email: true, fullName: true, isActive: true },
    })

    activityLogService.log({
      adminId: authenticatedAdmin.id,
      adminEmail: authenticatedAdmin.email,
      adminRole: authenticatedAdmin.role,
      action: 'TOGGLE_ADMIN_ACTIVE',
      entity: 'admin',
      entityId: params.id,
      metadata: { isActive: updated.isActive, targetEmail: updated.email },
    }).catch(() => {})

    return response.ok({
      message: updated.isActive ? 'Admin activé' : 'Admin désactivé',
      admin: updated,
    })
  }
}
