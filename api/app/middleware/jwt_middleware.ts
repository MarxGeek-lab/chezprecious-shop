import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import JwtService from '#services/jwt_service'
import prisma from '#services/prisma_service'

export default class JwtMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ctx.response.unauthorized({ message: "Token d'authentification manquant ou invalide" })
    }

    const token = authHeader.substring(7)

    try {
      const payload = JwtService.verifyToken(token)

      // ── Admin token ────────────────────────────────
      if (payload.isAdmin) {
        const admin = await prisma.admin.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true,
            phone: true,
            avatar: true,
            passwordChangedAt: true,
          },
        })

        if (!admin || !admin.isActive) {
          return ctx.response.unauthorized({ message: 'Administrateur introuvable ou inactif' })
        }

        if (admin.passwordChangedAt) {
          const tokenIssuedAt = (payload as any).iat as number
          if (tokenIssuedAt && tokenIssuedAt < Math.floor(admin.passwordChangedAt.getTime() / 1000)) {
            return ctx.response.unauthorized({ message: 'Session expirée, veuillez vous reconnecter' })
          }
        }

        const { passwordChangedAt: _ignored, ...adminWithoutSensitive } = admin
        ctx.authenticatedAdmin = adminWithoutSensitive
        return next()
      }

      // ── User token ─────────────────────────────────
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          phone: true,
          avatar: true,
          passwordChangedAt: true,
        },
      })

      if (!user || !user.isActive) {
        return ctx.response.unauthorized({ message: 'Utilisateur introuvable ou inactif' })
      }

      if (user.passwordChangedAt) {
        const tokenIssuedAt = (payload as any).iat as number
        if (tokenIssuedAt && tokenIssuedAt < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
          return ctx.response.unauthorized({ message: 'Session expirée, veuillez vous reconnecter' })
        }
      }

      const { passwordChangedAt: _ignored, ...userWithoutSensitive } = user
      ctx.authenticatedUser = userWithoutSensitive
      return next()
    } catch {
      return ctx.response.unauthorized({ message: 'Token invalide ou expiré' })
    }
  }
}

declare module '@adonisjs/core/http' {
  interface HttpContext {
    authenticatedUser?: {
      id: string
      email: string
      fullName: string | null
      role: string
      isEmailVerified: boolean
      isActive: boolean
      phone: string | null
      avatar: string | null
    }
    authenticatedAdmin?: {
      id: string
      email: string
      fullName: string | null
      role: string
      isActive: boolean
      phone: string | null
      avatar: string | null
    }
    authenticatedStoreMember?: never
  }
}
