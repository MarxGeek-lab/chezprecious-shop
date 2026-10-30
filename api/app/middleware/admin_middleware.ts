import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour vérifier que le token appartient bien à un Admin (table admins).
 * Doit être utilisé APRÈS le middleware jwt.
 */
export default class AdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!ctx.authenticatedAdmin) {
      return ctx.response.forbidden({
        message: 'Accès refusé. Droits administrateur requis.',
      })
    }

    return next()
  }
}
