import { HttpContext } from '@adonisjs/core/http'
import { NextFn } from '@adonisjs/core/types/http'

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://192.168.1.79:3000',
  'https://chezprecious.com',
  'https://www.chezprecious.com',
  'https://admin.chezprecious.com',
]

export default class CorsMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    const { request, response } = ctx
    const origin = request.header('origin') ?? ''

    if (ALLOWED_ORIGINS.includes(origin)) {
      response.header('Access-Control-Allow-Origin', origin)
    }

    response.header('Access-Control-Allow-Credentials', 'true')
    response.header('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS')
    response.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Accept, X-Requested-With, X-CSRF-TOKEN'
    )

    if (request.method() === 'OPTIONS') {
      response.header('Access-Control-Max-Age', '86400')
      return response.status(204).send('')
    }

    return next()
  }
}
