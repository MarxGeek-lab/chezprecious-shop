import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Ce middleware doit être chainé APRÈS middleware.jwt().
 * Il bloque les STORE_MEMBER qui auraient un token JWT valide
 * mais dont l'id pointe sur la table StoreMember (pas users).
 * Ces routes sont réservées aux clients (User) uniquement.
 */
export default class UserOnlyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (ctx.authenticatedUser?.role === 'STORE_MEMBER') {
      return ctx.response.forbidden({
        message: 'Cette action est réservée aux clients. Les membres d\'équipe ne peuvent pas effectuer cette opération.',
      })
    }
    return next()
  }
}
