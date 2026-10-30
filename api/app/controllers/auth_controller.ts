import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'
import prisma from '#services/prisma_service'
import JwtService from '#services/jwt_service'
import MailService from '#services/mail_service'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '#validators/auth_validator'
import { google } from 'googleapis'
import axios from 'axios'

export default class AuthController {
  /**
   * @register
   * @summary Inscription d'un nouvel utilisateur
   * @tag Auth
   * @requestBody {"email": "user@example.com", "password": "password123", "fullName": "John Doe", "phone": "+229 XX XX XX XX"}
   * @responseBody 201 - {"message": "Inscription réussie", "user": {"id": "uuid", "email": "user@example.com", "fullName": "John Doe"}}
   * @responseBody 409 - {"message": "Cet email est déjà utilisé"}
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return response.conflict({ message: 'Cet email est déjà utilisé' })
    }

    const hashedPassword = await hash.make(data.password)
    const activationToken = randomBytes(32).toString('hex')
    const activationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        phone: data.phone || null,
        activationToken,
        activationExpires,
        isActive: false,
        isEmailVerified: false,
      },
    })

    try {
      await MailService.sendActivationEmail(user.email, user.fullName || '', activationToken)
    } catch {
      // L'email échoue silencieusement, l'utilisateur peut demander un renvoi
    }

    return response.created({
      message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    })
  }

  /**
   * @login
   * @summary Connexion d'un utilisateur
   * @tag Auth
   * @requestBody {"email": "user@example.com", "password": "password123"}
   * @responseBody 200 - {"message": "Connexion reussie", "token": "jwt-token", "user": {"id": "uuid", "email": "user@example.com", "fullName": "John Doe"}}
   * @responseBody 401 - {"message": "Identifiants invalides"}
   */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      return response.unauthorized({ message: 'Identifiants invalides' })
    }

    // Compte créé via OAuth (pas de mot de passe)
    if (!user.password) {
      const provider = user.oauthProvider || 'social'
      return response.unauthorized({
        message: `Ce compte est lié à ${provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'un réseau social'}. Connectez-vous via ce service.`,
      })
    }

    const isValid = await hash.verify(user.password, data.password)
    if (!isValid) {
      return response.unauthorized({ message: 'Identifiants invalides' })
    }

    if (!user.isEmailVerified) {
      return response.forbidden({
        message: 'Veuillez vérifier votre email avant de vous connecter',
      })
    }

    if (!user.isActive) {
      return response.forbidden({ message: 'Votre compte n\'est pas actif' })
    }

    // Générer le JWT directement
    const jwtToken = JwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Envoyer une notification email en arrière-plan (non bloquant)
    const ipAddress = request.ip() || 'Inconnue'
    const userAgent = request.header('user-agent') || 'Inconnu'
    MailService.sendLoginNotificationEmail(
      user.email,
      user.fullName || '',
      ipAddress,
      userAgent
    ).catch(() => {})

    return response.ok({
      message: 'Connexion réussie',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    })
  }

  /**
   * @confirmLogin
   * @summary Confirmer la connexion via le token reçu par email
   * @tag Auth
   * @paramPath token - Token de confirmation reçu par email
   * @responseBody 200 - {"message": "Connexion reussie", "token": "jwt-token", "user": {"id": "uuid", "email": "user@example.com", "fullName": "John Doe"}}
   * @responseBody 400 - {"message": "Token invalide ou expiré"}
   */
  async confirmLogin({ params, response }: HttpContext) {
    const { token } = params

    const user = await prisma.user.findUnique({
      where: { loginToken: token },
    })

    if (!user) {
      return response.badRequest({ message: 'Lien de confirmation invalide ou déjà utilisé' })
    }

    if (user.loginTokenExpires && user.loginTokenExpires < new Date()) {
      // Nettoyer le token expiré
      await prisma.user.update({
        where: { id: user.id },
        data: { loginToken: null, loginTokenExpires: null },
      })
      return response.badRequest({ message: 'Ce lien de confirmation a expiré. Veuillez vous reconnecter.' })
    }

    // Invalider le token et générer le JWT
    await prisma.user.update({
      where: { id: user.id },
      data: { loginToken: null, loginTokenExpires: null },
    })

    const jwtToken = JwtService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return response.ok({
      message: 'Connexion réussie',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
      },
    })
  }

  /**
   * @activateAccount
   * @summary Activation du compte via token email
   * @tag Auth
   * @paramPath token - Token d'activation reçu par email
   * @responseBody 200 - {"message": "Compte activé avec succès"}
   * @responseBody 400 - {"message": "Token d'activation invalide"}
   */
  async activateAccount({ params, response }: HttpContext) {
    const { token } = params

    // Chercher d'abord par token actif
    let user = await prisma.user.findUnique({
      where: { activationToken: token },
    })

    if (user) {
      // Token trouvé : vérifier expiration puis activer
      if (user.activationExpires && user.activationExpires < new Date()) {
        return response.badRequest({ message: 'Le token d\'activation a expiré' })
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          isActive: true,
          activationToken: null,
          activationExpires: null,
        },
      })

      try {
        await MailService.sendWelcomeEmail(user.email, user.fullName || '')
      } catch {
        // Non bloquant
      }

      return response.ok({ message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.' })
    }

    // Token non trouvé : invalide ou déjà utilisé
    return response.badRequest({ message: 'Token d\'activation invalide ou déjà utilisé' })
  }

  /**
   * @forgotPassword
   * @summary Demande de réinitialisation de mot de passe
   * @tag Auth
   * @requestBody {"email": "user@example.com"}
   * @responseBody 200 - {"message": "Si l'email existe, un lien de réinitialisation a été envoyé."}
   */
  async forgotPassword({ request, response }: HttpContext) {
    const data = await request.validateUsing(forgotPasswordValidator)

    const user = await prisma.user.findUnique({ where: { email: data.email } })

    if (!user) {
      return response.ok({
        message: 'Si l\'email existe, un lien de réinitialisation a été envoyé.',
      })
    }

    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    })

    try {
      await MailService.sendResetPasswordEmail(user.email, user.fullName || '', resetToken)
    } catch {
      // Silencieux pour éviter l'énumération
    }

    return response.ok({
      message: 'Si l\'email existe, un lien de réinitialisation a été envoyé.',
    })
  }

  /**
   * @resetPassword
   * @summary Réinitialisation du mot de passe
   * @tag Auth
   * @requestBody {"token": "reset-token", "password": "newpassword123"}
   * @responseBody 200 - {"message": "Mot de passe réinitialisé avec succès"}
   * @responseBody 400 - {"message": "Token de réinitialisation invalide"}
   */
  async resetPassword({ request, response }: HttpContext) {
    const data = await request.validateUsing(resetPasswordValidator)

    const user = await prisma.user.findUnique({
      where: { resetToken: data.token },
    })

    if (!user) {
      return response.badRequest({ message: 'Token de réinitialisation invalide' })
    }

    if (user.resetExpires && user.resetExpires < new Date()) {
      return response.badRequest({ message: 'Le token de réinitialisation a expiré' })
    }

    const hashedPassword = await hash.make(data.password)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null,
      },
    })

    return response.ok({ message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.' })
  }

  /**
   * @verifyEmail
   * @summary Vérifier si un email existe déjà
   * @tag Auth
   * @paramPath email - L'adresse email à vérifier
   * @responseBody 200 - {"exists": true}
   */
  async verifyEmail({ params, response }: HttpContext) {
    const { email } = params

    const user = await prisma.user.findUnique({
      where: { email: decodeURIComponent(email) },
      select: { id: true },
    })

    return response.ok({ exists: !!user })
  }

  /**
   * @me
   * @summary Obtenir le profil de l'utilisateur connecté
   * @tag Auth
   * @responseBody 200 - {"user": {"id": "uuid", "email": "user@example.com", "fullName": "John Doe"}}
   */
  async me(ctx: HttpContext) {
    return ctx.response.ok({ user: ctx.authenticatedUser })
  }

  /**
   * @logout
   * @summary Déconnexion de l'utilisateur
   * @tag Auth
   * @responseBody 200 - {"message": "Déconnexion réussie"}
   */
  async logout({ response }: HttpContext) {
    return response.ok({ message: 'Déconnexion réussie' })
  }

  // ==========================================
  // OAuth helpers
  // ==========================================

  private getGoogleClient() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    )
  }

  private async findOrCreateOAuthUser(params: {
    email: string
    fullName: string | null
    avatar: string | null
    googleId?: string
    facebookId?: string
    provider: string
  }) {
    let user = await prisma.user.findUnique({ where: { email: params.email } })

    if (user) {
      // Lier le compte OAuth si pas encore lié
      const updateData: Record<string, string | null> = {}
      if (params.googleId && !user.googleId) updateData.googleId = params.googleId
      if (params.facebookId && !user.facebookId) updateData.facebookId = params.facebookId
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({ where: { id: user.id }, data: updateData })
      }
    } else {
      // Créer le compte OAuth
      user = await prisma.user.create({
        data: {
          email: params.email,
          fullName: params.fullName,
          password: null,
          avatar: params.avatar,
          googleId: params.googleId || null,
          facebookId: params.facebookId || null,
          oauthProvider: params.provider,
          isEmailVerified: true,
          isActive: true,
        },
      })
    }

    return user
  }

  /**
   * @oauthGoogle
   * @summary Redirection vers Google OAuth
   * @tag Auth
   */
  async oauthGoogle({ response }: HttpContext) {
    const oauth2Client = this.getGoogleClient()
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['email', 'profile'],
      prompt: 'select_account',
    })
    return response.redirect(url)
  }

  /**
   * @oauthGoogleCallback
   * @summary Callback Google OAuth — crée/connecte l'utilisateur
   * @tag Auth
   */
  async oauthGoogleCallback({ request, response }: HttpContext) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const errorUrl = `${frontendUrl}/auth?error=oauth_failed`

    try {
      const { code } = request.qs()
      if (!code) return response.redirect(errorUrl)

      const oauth2Client = this.getGoogleClient()
      const { tokens } = await oauth2Client.getToken(code)
      oauth2Client.setCredentials(tokens)

      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
      const { data: profile } = await oauth2.userinfo.get()

      if (!profile.email) return response.redirect(errorUrl)

      const user = await this.findOrCreateOAuthUser({
        email: profile.email,
        fullName: profile.name || null,
        avatar: profile.picture || null,
        googleId: profile.id || undefined,
        provider: 'google',
      })

      const jwtToken = JwtService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      const userJson = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        })
      )

      return response.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${userJson}`)
    } catch {
      return response.redirect(errorUrl)
    }
  }

  /**
   * @oauthFacebook
   * @summary Redirection vers Facebook OAuth
   * @tag Auth
   */
  async oauthFacebook({ response }: HttpContext) {
    const appId = process.env.FACEBOOK_APP_ID
    const callbackUrl = encodeURIComponent(process.env.FACEBOOK_CALLBACK_URL || '')
    const scopes = 'email,public_profile'
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${callbackUrl}&scope=${scopes}&response_type=code`
    return response.redirect(url)
  }

  /**
   * @oauthFacebookCallback
   * @summary Callback Facebook OAuth — crée/connecte l'utilisateur
   * @tag Auth
   */
  async oauthFacebookCallback({ request, response }: HttpContext) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const errorUrl = `${frontendUrl}/auth?error=oauth_failed`

    try {
      const { code } = request.qs()
      if (!code) return response.redirect(errorUrl)

      const callbackUrl = process.env.FACEBOOK_CALLBACK_URL || ''

      // Échanger le code contre un access token
      const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
        params: {
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: callbackUrl,
          code,
        },
      })
      const accessToken = tokenRes.data.access_token

      // Récupérer le profil Facebook
      const profileRes = await axios.get('https://graph.facebook.com/me', {
        params: {
          fields: 'id,name,email,picture',
          access_token: accessToken,
        },
      })
      const profile = profileRes.data

      if (!profile.email) {
        return response.redirect(`${frontendUrl}/auth?error=facebook_no_email`)
      }

      const user = await this.findOrCreateOAuthUser({
        email: profile.email,
        fullName: profile.name || null,
        avatar: profile.picture?.data?.url || null,
        facebookId: profile.id || undefined,
        provider: 'facebook',
      })

      const jwtToken = JwtService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      const userJson = encodeURIComponent(
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          avatar: user.avatar,
          phone: user.phone,
        })
      )

      return response.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}&user=${userJson}`)
    } catch {
      return response.redirect(errorUrl)
    }
  }
}
