import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'

export default class PromoCodeController {
  /**
   * @validate
   * @summary Valide un code promo et retourne la réduction
   * @tag PromoCode
   * @requestBody {"code": "PROMO10", "orderAmount": 25000}
   * @responseBody 200 - {"valid": true, "type": "PERCENTAGE", "value": 10, "discountAmount": 2500}
   * @responseBody 400 - {"valid": false, "message": "Code invalide ou expiré"}
   */
  async validate({ request, response }: HttpContext) {
    const { code, orderAmount } = request.only(['code', 'orderAmount'])

    if (!code || !orderAmount) {
      return response.badRequest({ valid: false, message: 'Code et montant de commande requis' })
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: String(code).toUpperCase().trim() },
    })

    if (!promo) {
      return response.badRequest({ valid: false, message: 'Code promo invalide' })
    }

    if (!promo.isActive) {
      return response.badRequest({ valid: false, message: 'Ce code promo est désactivé' })
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return response.badRequest({ valid: false, message: 'Ce code promo a expiré' })
    }

    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return response.badRequest({ valid: false, message: 'Ce code promo a atteint sa limite d\'utilisation' })
    }

    const amount = parseFloat(orderAmount)

    if (promo.minOrderAmount !== null && amount < promo.minOrderAmount.toNumber()) {
      return response.badRequest({
        valid: false,
        message: `Ce code promo nécessite un minimum de commande de ${promo.minOrderAmount} XOF`,
      })
    }

    // Calcul de la réduction
    let discountAmount: number
    if (promo.type === 'PERCENTAGE') {
      discountAmount = (amount * promo.value.toNumber()) / 100
    } else {
      discountAmount = Math.min(promo.value.toNumber(), amount)
    }

    discountAmount = Math.round(discountAmount)

    return response.ok({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value.toNumber(),
      discountAmount,
      finalAmount: amount - discountAmount,
    })
  }
}
