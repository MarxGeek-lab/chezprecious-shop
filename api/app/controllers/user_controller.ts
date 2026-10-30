import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma_service'
import JwtService from '#services/jwt_service'

export default class UserController {
  /**
   * @getMyReviews
   * @summary Obtenir les avis de l'utilisateur connecté
   * @tag User
   */
  async myReviews({ response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const reviews = await prisma.review.findMany({
      where: { userId: authenticatedUser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: { take: 1, select: { url: true } },
          },
        },
      },
    })

    return response.ok({ reviews })
  }

  /**
   * @updateProfile
   * @summary Mettre à jour le profil utilisateur
   * @tag User
   */
  async updateProfile({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const { fullName, phone } = request.only(['fullName', 'phone'])

    const updatedUser = await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: {
        ...(fullName !== undefined && { fullName: fullName || null }),
        ...(phone !== undefined && { phone: phone || null }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
      },
    })

    return response.ok({
      message: 'Profil mis à jour avec succès',
      user: updatedUser,
    })
  }

  /**
   * @updatePassword
   * @summary Changer le mot de passe utilisateur
   * @tag User
   */
  async updatePassword({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const { currentPassword, newPassword } = request.only(['currentPassword', 'newPassword'])

    if (!currentPassword || !newPassword) {
      return response.badRequest({ message: 'Mot de passe actuel et nouveau mot de passe requis' })
    }

    if (newPassword.length < 8) {
      return response.badRequest({ message: 'Le nouveau mot de passe doit faire au moins 8 caractères' })
    }

    // Vérifier la complexité : au moins une majuscule, une minuscule, un chiffre
    const complexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
    if (!complexityRegex.test(newPassword)) {
      return response.badRequest({
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: authenticatedUser.id },
    })

    if (!user) {
      return response.notFound({ message: 'Utilisateur introuvable' })
    }

    if (!user.password) {
      return response.badRequest({ message: 'Ce compte utilise une connexion sociale (Google/Facebook). Vous ne pouvez pas définir un mot de passe ici.' })
    }

    const isValid = await hash.verify(user.password, currentPassword)

    if (!isValid) {
      return response.badRequest({ message: 'Mot de passe actuel incorrect' })
    }

    // Vérifier que le nouveau mot de passe est différent de l'ancien
    const isSamePassword = await hash.verify(user.password!, newPassword)
    if (isSamePassword) {
      return response.badRequest({ message: 'Le nouveau mot de passe doit être différent de l\'actuel' })
    }

    const hashedPassword = await hash.make(newPassword)
    const now = new Date()

    await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: { password: hashedPassword, passwordChangedAt: now },
    })

    // Générer un nouveau token pour la session courante (les anciens sont maintenant invalides)
    const newToken = JwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return response.ok({ message: 'Mot de passe mis à jour avec succès', token: newToken })
  }

  /**
   * @updateAvatar
   * @summary Mettre à jour l'avatar utilisateur
   * @tag User
   */
  async updateAvatar({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const { avatarUrl } = request.only(['avatarUrl'])

    if (!avatarUrl) {
      return response.badRequest({ message: 'URL de l\'avatar requise' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: authenticatedUser.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
      },
    })

    return response.ok({
      message: 'Avatar mis à jour avec succès',
      user: updatedUser,
    })
  }
}
