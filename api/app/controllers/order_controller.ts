import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { randomBytes } from 'node:crypto'
import prisma from '#services/prisma_service'
import { createOrderValidator } from '#validators/order_validator'
import mailService from '#services/mail_service'
import notificationService from '#services/notification_service'
import JwtService from '#services/jwt_service'

export default class OrderController {
  /**
   * @store
   * @summary Créer une nouvelle commande
   * @tag Orders
   * @requestBody {"customerEmail": "client@email.com", "customerFirstName": "Jean", "customerLastName": "Dupont", "customerPhone": "0700000000", "shippingAddress": "123 Rue de la Paix", "shippingCity": "Cotonou", "shippingCountry": "Bénin", "paymentMethod": "MOBILE_MONEY", "paymentProvider": "MTN", "promoCode": "PROMO10", "items": [{"productId": "uuid", "quantity": 2}]}
   * @responseBody 201 - {"message": "Commande créée avec succès", "order": {"id": "uuid", "orderNumber": "MP-123-ABC", "total": 15000, "currency": "XOF"}, "accountCreated": false}
   * @responseBody 400 - {"message": "Un ou plusieurs produits sont introuvables ou indisponibles"}
   * @responseBody 422 - {"message": "Données invalides"}
   */
  async store({ request, response, authenticatedUser }: HttpContext) {
    const data = await request.validateUsing(createOrderValidator)

    try {
      // ── 1. Résoudre l'utilisateur ──────────────────────────────────────
      // Priorité : utilisateur déjà connecté (jwtOptional) → sinon chercher par email → sinon créer
      // Les STORE_MEMBER ont un token valide mais leur id pointe sur StoreMember, pas User.
      // On les traite comme guest : leur email permettra de lier/créer un compte User normal.
      const isStoreMember = authenticatedUser?.role === 'STORE_MEMBER'
      let resolvedUserId: string | null = isStoreMember ? null : (authenticatedUser?.id ?? null)
      let guestAccountCreated = false
      let guestTempPassword: string | null = null
      let guestResetToken: string | null = null

      if (!resolvedUserId) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.customerEmail },
          select: { id: true, isActive: true },
        })

        if (existingUser) {
          // Compte existant non connecté → on lie la commande sans créer de doublon
          resolvedUserId = existingUser.isActive ? existingUser.id : null
        } else {
          // Nouveau guest → créer un compte automatique
          const tempPassword = randomBytes(6).toString('hex') // ex: "a3f9c2b1d5e7"
          const hashedPassword = await hash.make(tempPassword)
          const resetToken = randomBytes(32).toString('hex')
          const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

          const newUser = await prisma.user.create({
            data: {
              email: data.customerEmail,
              fullName: `${data.customerFirstName} ${data.customerLastName}`,
              phone: data.customerPhone,
              password: hashedPassword,
              role: 'USER',
              isEmailVerified: true, // commande = preuve d'email valide
              isActive: true,
              resetToken,
              resetExpires,
            },
          })

          resolvedUserId = newUser.id
          guestAccountCreated = true
          guestTempPassword = tempPassword
          guestResetToken = resetToken
        }
      }

      // ── 2. Récupérer les produits ──────────────────────────────────────
      const productIds = data.items.map((item) => item.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds }, status: 'ACTIVE' },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
        },
      })

      if (products.length !== data.items.length) {
        return response.badRequest({
          message: 'Un ou plusieurs produits sont introuvables ou indisponibles',
        })
      }

      // ── 3. Calculer les montants ───────────────────────────────────────
      let subtotal = 0
      const orderItems = data.items.map((item) => {
        const product = products.find((p: any) => p.id === item.productId)
        if (!product) throw new Error('Produit introuvable')

        const unitPrice = Number(product.price)
        const totalPrice = unitPrice * item.quantity
        subtotal += totalPrice

        return {
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          productImage: product.images[0]?.url || null,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice,
          variantData: item.variantData || null,
        }
      })

      const shippingCost = subtotal >= 50000 ? 0 : 2500
      const tax = 0

      // ── 3b. Appliquer le code promo ────────────────────────────────────
      let discount = 0
      if (data.promoCode) {
        const code = String(data.promoCode).toUpperCase().trim()
        const promo = await prisma.promoCode.findUnique({ where: { code } })
        if (
          promo &&
          promo.isActive &&
          (!promo.expiresAt || promo.expiresAt >= new Date()) &&
          (promo.maxUses === null || promo.usedCount < promo.maxUses) &&
          (promo.minOrderAmount === null || subtotal >= promo.minOrderAmount.toNumber())
        ) {
          if (promo.type === 'PERCENTAGE') {
            discount = Math.round((subtotal * promo.value.toNumber()) / 100)
          } else {
            discount = Math.min(Math.round(promo.value.toNumber()), subtotal)
          }
          // Incrémenter le compteur d'utilisation (non-bloquant)
          prisma.promoCode.update({
            where: { id: promo.id },
            data: { usedCount: { increment: 1 } },
          }).catch(() => {})
        }
      }

      const total = subtotal + shippingCost - discount + tax

      // ── 4. Créer la commande ───────────────────────────────────────────
      const orderNumber = `MP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: resolvedUserId,
          customerEmail: data.customerEmail,
          customerFirstName: data.customerFirstName,
          customerLastName: data.customerLastName,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress,
          shippingCity: data.shippingCity,
          shippingCountry: data.shippingCountry,
          shippingNotes: data.shippingNotes || null,
          subtotal,
          shippingCost,
          tax,
          discount,
          total,
          currency: 'XOF',
          paymentMethod: data.paymentMethod as any,
          paymentProvider: data.paymentProvider || null,
          paymentStatus: 'PENDING',
          status: 'PENDING',
          items: { create: orderItems },
        },
        include: { items: true },
      })

      // ── 5. Simuler paiement (TODO: FeexPay) ───────────────────────────
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'PAID',
          paidAt: new Date(),
          paymentReference: `FP-${Date.now()}`,
        },
        include: { items: true },
      })

      // ── 6. Notifications in-app ────────────────────────────────────────
      // Notifier l'acheteur s'il a un compte actif
      if (resolvedUserId) {
        notificationService.create({
          userId: resolvedUserId,
          type: 'ORDER_STATUS',
          title: 'Commande confirmée',
          body: `Votre commande ${orderNumber} a été confirmée et payée avec succès.`,
          resourceId: order.id,
          resourceUrl: `/account`,
        }).catch(() => {})
      }

      // ── 7. Emails (en parallèle, sans bloquer la réponse) ─────────────
      const emailPayload = {
        orderNumber: updatedOrder.orderNumber,
        customerFirstName: data.customerFirstName,
        customerLastName: data.customerLastName,
        total: updatedOrder.total.toString(),
        currency: updatedOrder.currency,
        items: updatedOrder.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
        })),
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingCountry: data.shippingCountry,
        paymentMethod: updatedOrder.paymentMethod,
        paymentProvider: updatedOrder.paymentProvider ?? undefined,
        subtotal: updatedOrder.subtotal.toString(),
        shippingCost: updatedOrder.shippingCost.toString(),
        discount: updatedOrder.discount.toString(),
      }

      // Email de confirmation au client
      mailService.sendOrderConfirmationEmail(data.customerEmail, emailPayload).catch((e) =>
        console.error('[Order] confirmation email failed:', e.message)
      )

      // Email de notification admin
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'default' },
        select: { contactEmail: true },
      })
      const adminEmail = settings?.contactEmail
      if (adminEmail) {
        mailService.sendAdminNewOrderEmail(adminEmail, {
          orderNumber: updatedOrder.orderNumber,
          customerFirstName: data.customerFirstName,
          customerLastName: data.customerLastName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          total: updatedOrder.total.toString(),
          currency: updatedOrder.currency,
          itemCount: updatedOrder.items.length,
          paymentMethod: updatedOrder.paymentMethod,
          paymentProvider: updatedOrder.paymentProvider,
          shippingCity: data.shippingCity,
          shippingCountry: data.shippingCountry,
        }).catch((e) => console.error('[Order] admin email failed:', e.message))
      }

      // Email compte créé automatiquement pour le guest
      if (guestAccountCreated && guestTempPassword && guestResetToken) {
        mailService.sendGuestAccountCreatedEmail(
          data.customerEmail,
          data.customerFirstName,
          data.customerLastName,
          guestTempPassword,
          guestResetToken
        ).catch((e) => console.error('[Order] guest account email failed:', e.message))
      }

      // Générer un JWT pour le nouveau compte guest afin de le connecter automatiquement
      let guestToken: string | null = null
      let guestUser: { id: string; email: string; fullName: string | null; role: string; isEmailVerified: boolean; isActive: boolean; phone: string | null; avatar: null } | null = null
      if (guestAccountCreated && resolvedUserId) {
        const newUser = await prisma.user.findUnique({
          where: { id: resolvedUserId },
          select: { id: true, email: true, fullName: true, role: true, isEmailVerified: true, isActive: true, phone: true },
        })
        if (newUser) {
          guestToken = JwtService.generateToken({ userId: newUser.id, email: newUser.email, role: newUser.role })
          guestUser = { ...newUser, avatar: null }
        }
      }

      return response.created({
        message: 'Commande créée avec succès',
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          total: updatedOrder.total,
          currency: updatedOrder.currency,
        },
        accountCreated: guestAccountCreated,
        ...(guestToken ? { token: guestToken, user: guestUser } : {}),
      })
    } catch (error) {
      console.error('Error creating order:', error)
      return response.internalServerError({
        message: 'Erreur lors de la création de la commande',
      })
    }
  }

  /**
   * @index
   * @summary Lister les commandes de l'utilisateur connecté
   * @tag Orders
   * @responseBody 200 - {"orders": [{"id": "uuid", "orderNumber": "MP-123", "total": 15000, "status": "PAID"}]}
   * @responseBody 401 - {"message": "Non authentifie"}
   */
  async index({ response, authenticatedUser }: HttpContext) {
    try {
      const user = authenticatedUser

      if (!user) {
        return response.unauthorized({ message: 'Non authentifié' })
      }

      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { userId: user.id },
            { customerEmail: user.email },
          ],
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return response.ok({ orders })
    } catch (error) {
      console.error('Error fetching orders:', error)
      return response.internalServerError({
        message: 'Erreur lors de la récupération des commandes',
      })
    }
  }

  /**
   * @show
   * @summary Détails d'une commande (par ID ou orderNumber)
   * @tag Orders
   * @paramPath id - ID ou numéro de commande - @type(string)
   * @responseBody 200 - {"order": {"id": "uuid", "orderNumber": "MP-123", "total": 15000, "status": "PAID"}}
   * @responseBody 403 - {"message": "Accès refusé"}
   * @responseBody 404 - {"message": "Commande introuvable"}
   */
  async show({ params, response, authenticatedUser }: HttpContext) {
    try {
      const user = authenticatedUser
      const { id } = params

      // On peut récupérer par ID ou par orderNumber
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id }, { orderNumber: id }],
        },
        include: {
          items: true,
        },
      })

      if (!order) {
        return response.notFound({ message: 'Commande introuvable' })
      }

      // Vérifier que la commande appartient bien à l'utilisateur (si connecté)
      if (user && order.customerEmail !== user.email) {
        return response.forbidden({ message: 'Accès refusé' })
      }

      return response.ok({ order })
    } catch (error) {
      console.error('Error fetching order:', error)
      return response.internalServerError({
        message: 'Erreur lors de la récupération de la commande',
      })
    }
  }

}
