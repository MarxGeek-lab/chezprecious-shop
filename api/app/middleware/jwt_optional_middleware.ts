import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import JwtService from '#services/jwt_service'
import prisma from '#services/prisma_service'

/**
 * Middleware JWT optionnel — ne rejette pas si absent/invalide.
 * Peuple ctx.authenticatedUser si un token valide est présent.
 */
export default class JwtOptionalMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authHeader = ctx.request.header('Authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = JwtService.verifyToken(token)
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
          },
        })
        if (user && user.isActive) {
          ctx.authenticatedUser = user
        }
      } catch {
        // Token invalide ou expiré — on continue sans utilisateur
      }
    }

    return next()
  }
}
