import nodemailer from 'nodemailer'
import env from '#start/env'

class MailService {
  private transporter: nodemailer.Transporter
  private lastAuthTime: number = 0
  private readonly AUTH_COOLDOWN_MS = 2000

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.get('SMTP_HOST'),
      port: env.get('SMTP_PORT'),
      secure: true,
      pool: true,
      maxConnections: 1,
      maxMessages: 100,
      rateDelta: 2000,
      rateLimit: 1,
      auth: {
        user: env.get('SMTP_USER'),
        pass: env.get('SMTP_PASS'),
      },
    })
  }

  private get fromAddress(): string {
    return env.get('MAIL_FROM')
  }

  private get frontendUrl(): string {
    return env.get('FRONTEND_URL', 'http://localhost:3000')
  }

  private get adminUrl(): string {
    return env.get('FRONTEND_URL_ADMIN', 'http://localhost:3000')
  }

  // ============================================
  // Retry avec backoff exponentiel
  // ============================================
  private async ensureAuthCooldown(): Promise<void> {
    const now = Date.now()
    const timeSinceLastAuth = now - this.lastAuthTime
    if (timeSinceLastAuth < this.AUTH_COOLDOWN_MS) {
      await new Promise((resolve) => setTimeout(resolve, this.AUTH_COOLDOWN_MS - timeSinceLastAuth))
    }
    this.lastAuthTime = Date.now()
  }

  private async sendMailWithRetry(
    mailOptions: nodemailer.SendMailOptions,
    maxRetries: number = 3
  ): Promise<{ success: boolean; error?: any }> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.ensureAuthCooldown()
        await this.transporter.sendMail(mailOptions)
        return { success: true }
      } catch (error: any) {
        console.error(`[MailService] Tentative ${attempt}/${maxRetries} échouée:`, error.message)

        if (error.code === 'EAUTH' && attempt < maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise((resolve) => setTimeout(resolve, backoffTime))
          continue
        }

        if (attempt === maxRetries) {
          return { success: false, error }
        }
      }
    }
    return { success: false, error: new Error('Max retries exceeded') }
  }

  // ============================================
  // Template wrapper
  // ============================================
  private wrapTemplate(content: string): string {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f7;">
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #FF2C2C 0%, #FF5A5A 100%); padding: 28px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #ffffff; font-weight: 700;">ChezPrecious </h1>
          </div>
          <!-- Content -->
          <div style="padding: 32px;">
            ${content}
          </div>
          <!-- Footer -->
          <div style="padding: 20px 32px; border-top: 1px solid #e5e7eb; background-color: #fafafa;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0; line-height: 1.6;">
              Cet email a été envoyé automatiquement par .<br>
              Merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </div>
    `
  }

  // ============================================
  // Email d'activation de compte
  // ============================================
  async sendActivationEmail(email: string, fullName: string, token: string) {
    const activationUrl = `${this.frontendUrl}/auth/activation?token=${token}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Bienvenue ${fullName} !
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Merci de vous être inscrit sur ChezPrecious. Pour activer votre compte et commencer vos achats, cliquez sur le bouton ci-dessous :
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Activer mon compte
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        Ou copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${activationUrl}
      </p>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          Ce lien expire dans <strong>24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Activez votre compte - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email de réinitialisation du mot de passe
  // ============================================
  async sendResetPasswordEmail(email: string, fullName: string, token: string) {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${token}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Réinitialisation du mot de passe
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${fullName || 'Utilisateur'},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau :
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        Ou copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${resetUrl}
      </p>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Réinitialisation de mot de passe - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email de bienvenue (après activation)
  // ============================================
  async sendWelcomeEmail(email: string, fullName: string) {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Votre compte est actif !
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Bonjour ${fullName},<br><br>
        Votre compte ChezPrecious a été activé avec succès. Vous pouvez maintenant profiter de toutes les fonctionnalités de notre plateforme.
      </p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #065f46; font-weight: 600;">
          Ce que vous pouvez faire :
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #065f46; line-height: 1.8;">
          <li>Parcourir notre catalogue de produits</li>
          <li>Ajouter des articles aux favoris</li>
          <li>Passer vos premières commandes</li>
        </ul>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${this.frontendUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Commencer mes achats
        </a>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Bienvenue sur ChezPrecious !',
      html,
    })
  }

  // ============================================
  // Email de confirmation de demande vendeur
  // ============================================
  async sendSellerApplicationEmail(email: string, fullName: string, storeName: string) {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Demande vendeur reçue
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Bonjour ${fullName},<br><br>
        Nous avons bien reçu votre demande pour devenir vendeur sur . Notre équipe va examiner vos informations.
      </p>
      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;"><strong>Boutique :</strong></td>
            <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right;">${storeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;"><strong>Statut :</strong></td>
            <td style="padding: 8px 0; text-align: right;">
              <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">En attente</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #1e40af;">
          Le traitement de votre demande prend généralement <strong>24 à 48 heures</strong>. Vous recevrez un email dès que votre boutique sera approuvée.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Demande vendeur reçue - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email d'approbation vendeur
  // ============================================
  async sendSellerApprovedEmail(email: string, fullName: string, storeName: string) {
    const html = this.wrapTemplate(`
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px;">🎉</span>
      </div>
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0; text-align: center;">
        Votre boutique est approuvée !
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Bonjour ${fullName},<br><br>
        Bonne nouvelle ! Votre boutique <strong>${storeName}</strong> a été approuvée par notre équipe. Vous pouvez maintenant commencer à vendre sur .
      </p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #065f46; font-weight: 600;">
          Prochaines étapes :
        </p>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #065f46; line-height: 1.8;">
          <li>Accédez à votre espace vendeur</li>
          <li>Ajoutez vos premiers produits</li>
          <li>Configurez vos méthodes de livraison</li>
          <li>Commencez à vendre !</li>
        </ol>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${this.frontendUrl}/seller"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Accéder à mon espace vendeur
        </a>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Votre boutique est approuvée - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email de rejet vendeur
  // ============================================
  async sendSellerRejectedEmail(email: string, fullName: string, reason: string) {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Demande vendeur non approuvée
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Bonjour ${fullName},<br><br>
        Malheureusement, votre demande pour devenir vendeur n'a pas pu être approuvée.
      </p>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0 0 4px 0; font-size: 13px; color: #991b1b; font-weight: 600;">Raison :</p>
        <p style="margin: 0; font-size: 14px; color: #991b1b;">${reason}</p>
      </div>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7;">
        Vous pouvez corriger les informations et soumettre une nouvelle demande.
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${this.frontendUrl}/become-seller"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
          Soumettre à nouveau
        </a>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Demande vendeur - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email de confirmation de commande
  // ============================================
  async sendOrderConfirmationEmail(
    email: string,
    orderData: {
      orderNumber: string
      customerFirstName: string
      customerLastName: string
      total: string
      currency: string
      items: Array<{
        productName: string
        quantity: number
        unitPrice: string
        totalPrice: string
      }>
      shippingAddress: string
      shippingCity: string
      shippingCountry: string
      paymentMethod: string
      paymentProvider?: string
      subtotal: string
      shippingCost: string
      discount: string
    }
  ) {
    const formatPrice = (amount: string) => {
      const num = parseFloat(amount)
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: orderData.currency,
        minimumFractionDigits: 0,
      }).format(num)
    }

    const itemsHtml = orderData.items
      .map(
        (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 500;">${item.productName}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Quantité: ${item.quantity}</p>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #1f2937; font-weight: 500;">${formatPrice(item.totalPrice)}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${formatPrice(item.unitPrice)} / unité</p>
        </td>
      </tr>
    `
      )
      .join('')

    const html = this.wrapTemplate(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin-bottom: 16px;">
          <span style="font-size: 40px;">✓</span>
        </div>
      </div>

      <h2 style="color: #1F1416; font-size: 24px; margin: 0 0 8px 0; text-align: center;">
        Commande confirmée !
      </h2>

      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0; text-align: center;">
        Bonjour ${orderData.customerFirstName} ${orderData.customerLastName},<br>
        Merci pour votre commande. Nous avons bien reçu votre paiement et votre commande est en cours de traitement.
      </p>

      <!-- Order Number -->
      <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; padding: 20px; margin: 24px 0; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Numéro de commande</p>
        <p style="margin: 0; font-size: 24px; color: #3b82f6; font-weight: 700;">#${orderData.orderNumber}</p>
      </div>

      <!-- Order Items -->
      <div style="margin: 32px 0;">
        <h3 style="font-size: 18px; color: #1f2937; margin: 0 0 16px 0;">Articles commandés</h3>
        <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          ${itemsHtml}
        </table>
      </div>

      <!-- Order Summary -->
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <h3 style="font-size: 16px; color: #1f2937; margin: 0 0 16px 0;">Récapitulatif</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Sous-total</td>
            <td style="padding: 8px 0; font-size: 14px; color: #1f2937; text-align: right; font-weight: 500;">${formatPrice(orderData.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Livraison</td>
            <td style="padding: 8px 0; font-size: 14px; color: ${parseFloat(orderData.shippingCost) === 0 ? '#10b981' : '#1f2937'}; text-align: right; font-weight: 500;">
              ${parseFloat(orderData.shippingCost) === 0 ? 'Gratuite' : formatPrice(orderData.shippingCost)}
            </td>
          </tr>
          ${
            parseFloat(orderData.discount) > 0
              ? `
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Réduction</td>
            <td style="padding: 8px 0; font-size: 14px; color: #ef4444; text-align: right; font-weight: 500;">-${formatPrice(orderData.discount)}</td>
          </tr>
          `
              : ''
          }
          <tr style="border-top: 2px solid #d1d5db;">
            <td style="padding: 12px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">Total payé</td>
            <td style="padding: 12px 0 0 0; font-size: 18px; color: #3b82f6; text-align: right; font-weight: 700;">${formatPrice(orderData.total)}</td>
          </tr>
        </table>
      </div>

      <!-- Delivery & Payment Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
          <h4 style="font-size: 14px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">📍 Adresse de livraison</h4>
          <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.6;">
            ${orderData.shippingAddress}<br>
            ${orderData.shippingCity}, ${orderData.shippingCountry}
          </p>
        </div>
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px;">
          <h4 style="font-size: 14px; color: #1f2937; margin: 0 0 12px 0; font-weight: 600;">💳 Paiement</h4>
          <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.6;">
            ${orderData.paymentMethod.replace('_', ' ')}
            ${orderData.paymentProvider ? `<br>${orderData.paymentProvider}` : ''}
            <br><span style="color: #10b981; font-weight: 600;">✓ Confirmé</span>
          </p>
        </div>
      </div>

      <!-- Delivery Steps -->
      <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; padding: 20px; margin: 24px 0; border-radius: 12px;">
        <h4 style="font-size: 16px; color: #065f46; margin: 0 0 12px 0; font-weight: 600;">📦 Prochaines étapes</h4>
        <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #065f46; line-height: 1.8;">
          <li>Votre commande est en cours de préparation</li>
          <li>Vous recevrez un email dès l'expédition avec le numéro de suivi</li>
          <li>Livraison estimée sous 3-5 jours ouvrés</li>
        </ol>
      </div>

      <!-- Track Order Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${this.frontendUrl}/order-success?orderNumber=${orderData.orderNumber}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Suivre ma commande
        </a>
      </div>

      <!-- Help Section -->
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          <strong>Besoin d'aide ?</strong> Contactez notre service client à tout moment. Nous sommes là pour vous aider !
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: `Confirmation de commande #${orderData.orderNumber} - ChezPrecious`,
      html,
    })
  }
  // ============================================
  // Email de notification admin — nouvelle commande
  // ============================================
  async sendAdminNewOrderEmail(
    adminEmail: string,
    orderData: {
      orderNumber: string
      customerFirstName: string
      customerLastName: string
      customerEmail: string
      customerPhone: string
      total: string
      currency: string
      itemCount: number
      paymentMethod: string
      paymentProvider?: string | null
      shippingCity: string
      shippingCountry: string
    }
  ) {
    const formatPrice = (amount: string) =>
      new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: orderData.currency,
        minimumFractionDigits: 0,
      }).format(parseFloat(amount))

    const paymentLabel = orderData.paymentMethod.replace(/_/g, ' ')
      + (orderData.paymentProvider ? ` — ${orderData.paymentProvider}` : '')

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 8px 0;">
        Nouvelle commande reçue
      </h2>
      <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0;">
        Une nouvelle commande vient d'être passée sur la plateforme.
      </p>

      <div style="background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
        <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Numéro de commande</p>
        <p style="margin: 0; font-size: 28px; color: #3b82f6; font-weight: 700;">#${orderData.orderNumber}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Client</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; font-weight: 600; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ${orderData.customerFirstName} ${orderData.customerLastName}
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Téléphone</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.customerPhone}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Livraison</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.shippingCity}, ${orderData.shippingCountry}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Articles</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; text-align: right;">${orderData.itemCount} article${orderData.itemCount > 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Paiement</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; text-align: right;">${paymentLabel}</td>
        </tr>
        <tr>
          <td style="padding: 14px 16px; font-size: 16px; color: #1f2937; font-weight: 700;">Total</td>
          <td style="padding: 14px 16px; font-size: 20px; color: #FF2C2C; font-weight: 700; text-align: right;">${formatPrice(orderData.total)}</td>
        </tr>
      </table>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${this.frontendUrl}/admin/orders"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44,0.3);">
          Voir la commande dans l'admin
        </a>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: adminEmail,
      subject: `[Admin] Nouvelle commande #${orderData.orderNumber} — ${orderData.customerFirstName} ${orderData.customerLastName}`,
      html,
    })
  }

  // ============================================
  // Email de notification de connexion
  // ============================================
  async sendLoginNotificationEmail(
    email: string,
    fullName: string,
    ipAddress: string,
    userAgent: string
  ) {
    const date = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Porto-Novo' })

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Nouvelle connexion à votre compte
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${fullName || 'Utilisateur'},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Une connexion à votre compte vient d'être effectuée. Voici les détails de cette session.
      </p>

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Date :</td>
            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; text-align: right;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Adresse IP :</td>
            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; text-align: right;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">Appareil :</td>
            <td style="padding: 6px 0; font-size: 13px; color: #1f2937; text-align: right;">${userAgent.substring(0, 60)}...</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          Si vous n'êtes pas à l'origine de cette connexion, changez immédiatement votre mot de passe et contactez notre support.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Nouvelle connexion à votre compte - ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email compte créé automatiquement (guest)
  // ============================================
  async sendGuestAccountCreatedEmail(
    email: string,
    firstName: string,
    lastName: string,
    temporaryPassword: string,
    resetToken: string
  ) {
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${resetToken}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Votre compte a été créé !
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${firstName} ${lastName},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Suite à votre commande, un compte ChezPrecious a été créé automatiquement pour vous.
        Vous pouvez dès maintenant suivre vos commandes et bénéficier d'une expérience personnalisée.
      </p>

      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; margin: 24px 0; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #0369a1; font-weight: 600;">Vos identifiants :</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Email :</td>
            <td style="padding: 6px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Mot de passe temporaire :</td>
            <td style="padding: 6px 0; text-align: right;">
              <code style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 15px; font-weight: 700; letter-spacing: 0.05em;">${temporaryPassword}</code>
            </td>
          </tr>
        </table>
      </div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin: 24px 0; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">
          Pour votre sécurité, changez votre mot de passe dès maintenant.
        </p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Définir mon mot de passe
        </a>
      </div>

      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        Ou copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${resetUrl}
      </p>
      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 14px; margin-top: 16px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
          Ce lien de réinitialisation expire dans <strong>24 heures</strong>.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Votre compte ChezPrecious a été créé — Définissez votre mot de passe',
      html,
    })
  }
  // ============================================
  // Email de formulaire de contact
  // ============================================
  async sendContactFormEmail(data: {
    name: string
    email: string
    phone?: string
    subject: string
    message: string
    adminEmail: string
  }) {
    const subjectLabels: Record<string, string> = {
      order: 'Suivi de commande',
      return: 'Retour produit',
      payment: 'Problème de paiement',
      product: 'Question sur un produit',
      partnership: 'Partenariat / Vendeur',
      other: 'Autre demande',
    }
    const subjectLabel = subjectLabels[data.subject] ?? data.subject

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 8px 0;">
        Nouveau message de contact
      </h2>
      <p style="font-size: 15px; color: #4b5563; margin: 0 0 24px 0;">
        Un visiteur a soumis le formulaire de contact.
      </p>

      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb; width: 130px;">Nom</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${data.name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Email</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">
            <a href="mailto:${data.email}" style="color: #FF2C2C;">${data.email}</a>
          </td>
        </tr>
        ${data.phone ? `
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Téléphone</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${data.phone}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 12px 16px; font-size: 14px; color: #6b7280;">Sujet</td>
          <td style="padding: 12px 16px;">
            <span style="background: #eff6ff; color: #1d4ed8; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${subjectLabel}</span>
          </td>
        </tr>
      </table>

      <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
        <p style="margin: 0; font-size: 15px; color: #1f2937; line-height: 1.8; white-space: pre-line;">${data.message}</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="mailto:${data.email}?subject=Re: ${subjectLabel}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Répondre à ${data.name}
        </a>
      </div>
    `)

    // Email à l'admin
    await this.sendMailWithRetry({
      from: this.fromAddress,
      to: data.adminEmail,
      replyTo: data.email,
      subject: `[Contact] ${subjectLabel} — ${data.name}`,
      html,
    })

    // Email de confirmation à l'expéditeur
    const confirmHtml = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Message bien reçu !
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${data.name},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Nous avons bien reçu votre message et nous vous répondrons dans les meilleurs délais (généralement sous 24h).
      </p>
      <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #065f46; font-weight: 600;">Récapitulatif de votre message :</p>
        <p style="margin: 0; font-size: 14px; color: #065f46;"><strong>Sujet :</strong> ${subjectLabel}</p>
      </div>
      <p style="font-size: 14px; color: #6b7280; line-height: 1.7;">
        En attendant, vous pouvez consulter notre <a href="${this.frontendUrl}/faq" style="color: #FF2C2C;">FAQ</a> pour trouver des réponses rapides à vos questions.
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: data.email,
      subject: 'Votre message a bien été reçu',
      html: confirmHtml,
    })
  }
  // ============================================
  // Email : message client → vendeur
  // ============================================
  async sendCustomerMessageEmail(
    to: string,
    data: {
      sellerName: string
      storeName: string
      customerName: string
      customerEmail: string
      messageBody: string
    }
  ): Promise<{ success: boolean; error?: any }> {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 20px; margin: 0 0 16px 0;">
        Nouveau message d'un client
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${data.sellerName},
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
        <strong>${data.customerName}</strong> (${data.customerEmail}) vous a envoyé un message :
      </p>
      <div style="background-color: #EFF6FF; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 15px; color: #1F1416; line-height: 1.7; white-space: pre-line;">${data.messageBody}</p>
      </div>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
        Connectez-vous à votre dashboard vendeur pour répondre à ce message.
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to,
      subject: `Nouveau message de ${data.customerName} — ${data.storeName}`,
      html,
    })
  }

  // ============================================
  // Email : message vendeur → client
  // ============================================
  async sendSellerMessageEmail(
    to: string,
    data: {
      customerName: string
      sellerName: string
      storeName: string
      messageBody: string
    }
  ): Promise<{ success: boolean; error?: any }> {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 20px; margin: 0 0 16px 0;">
        Nouveau message de <span style="color: #FF2C2C;">${data.storeName}</span>
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${data.customerName},
      </p>
      <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
        ${data.sellerName} vous a envoyé un message :
      </p>
      <div style="background-color: #FFF4EC; border-left: 4px solid #FF2C2C; padding: 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 15px; color: #1F1416; line-height: 1.7; white-space: pre-line;">${data.messageBody}</p>
      </div>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
        Vous pouvez répondre directement à cet email ou vous connecter à votre compte pour consulter vos messages.
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to,
      subject: `Nouveau message de ${data.storeName}`,
      html,
    })
  }
  // ============================================
  // Email : réinitialisation mot de passe admin
  // ============================================
  async sendAdminPasswordResetEmail(email: string, fullName: string | null, token: string) {
    const resetUrl = `${this.adminUrl}/set-password?token=${token}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Réinitialisation du mot de passe administrateur
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        Bonjour ${fullName || 'Administrateur'},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Vous avez demandé à réinitialiser votre mot de passe pour le panneau d'administration ChezPrecious. Cliquez sur le bouton ci-dessous pour en créer un nouveau :
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        Ou copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${resetUrl}
      </p>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Réinitialisation de mot de passe — ChezPrecious Admin',
      html,
    })
  }

  // ============================================
  // Email : invitation / setup mot de passe admin
  // ============================================
  async sendAdminInviteEmail(
    to: string,
    data: {
      fullName: string | null
      role: string
      setupUrl: string   // URL complète avec token
      isResend?: boolean
    }
  ): Promise<{ success: boolean; error?: any }> {
    const roleLabels: Record<string, string> = {
      SUPER_ADMIN: 'Super administrateur',
      ADMIN: 'Administrateur',
      MODERATOR: 'Modérateur',
    }
    const roleLabel = roleLabels[data.role] ?? data.role
    const greeting = data.fullName ? `Bonjour ${data.fullName},` : 'Bonjour,'
    const headline = data.isResend
      ? 'Lien de configuration renouvelé'
      : 'Vous êtes invité à rejoindre l\'équipe admin'

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 20px; margin: 0 0 16px 0;">
        ${headline}
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 8px 0;">
        ${greeting}
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        ${data.isResend
          ? 'Un nouveau lien de configuration a été généré pour votre compte administrateur .'
          : 'Votre compte administrateur ChezPrecious a été créé. Cliquez ci-dessous pour définir votre mot de passe et accéder au tableau de bord.'}
      </p>
      <div style="background-color: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Email :</td>
            <td style="padding: 4px 0; font-size: 14px; color: #1f2937; font-weight: 600; text-align: right;">${to}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; font-size: 14px; color: #6b7280;">Rôle :</td>
            <td style="padding: 4px 0; text-align: right;">
              <span style="background: rgba(255, 44, 44,0.1); color: #FF2C2C; padding: 2px 10px; border-radius: 10px; font-size: 13px; font-weight: 600;">${roleLabel}</span>
            </td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${data.setupUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44,0.3);">
          Définir mon mot de passe
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
        Ou copiez ce lien dans votre navigateur :
      </p>
      <p style="font-size: 12px; color: #9ca3af; word-break: break-all; background-color: #f9fafb; padding: 10px 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${data.setupUrl}
      </p>
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px; margin-top: 24px; border-radius: 0 6px 6px 0;">
        <p style="margin: 0; font-size: 13px; color: #92400e;">
          Ce lien expire dans <strong>72 heures</strong>. Si vous n'êtes pas à l'origine de cette invitation, ignorez cet email.
        </p>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to,
      subject: data.isResend
        ? 'Nouveau lien de configuration — ChezPrecious Admin'
        : 'Invitation à rejoindre ChezPrecious Admin',
      html,
    })
  }

  // ============================================
  // Email : message admin → utilisateur
  // ============================================
  async sendAdminMessageEmail(
    to: string,
    data: {
      userName: string
      messageBody: string
    }
  ): Promise<{ success: boolean; error?: any }> {
    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 20px; margin: 0 0 16px 0;">
        Message de l'administration
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 20px 0;">
        Bonjour ${data.userName},
      </p>
      <div style="background-color: #FFF4EC; border-left: 4px solid #FF2C2C; padding: 20px; border-radius: 0 8px 8px 0; margin: 0 0 24px 0;">
        <p style="margin: 0; font-size: 15px; color: #1F1416; line-height: 1.8; white-space: pre-line;">${data.messageBody}</p>
      </div>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
        Vous pouvez vous connecter à votre compte pour consulter la conversation.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${this.frontendUrl}/account"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44,0.3);">
          Voir mes messages
        </a>
      </div>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to,
      subject: 'Nouveau message de ChezPrecious',
      html,
    })
  }

  // ============================================
  // Email broadcast vendeur → clients
  // ============================================
  async sendBroadcastEmail(
    recipients: string[],
    data: {
      subject: string
      htmlBody: string
      senderName: string
      storeName: string
    }
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    const html = this.wrapTemplate(`
      <div style="margin-bottom: 12px; padding: 10px 14px; background: #FFF7ED; border-left: 4px solid #FF2C2C; border-radius: 0 8px 8px 0;">
        <p style="margin: 0; font-size: 12px; color: #92400e;">
          Message envoyé par <strong>${data.senderName}</strong> — boutique <strong>${data.storeName}</strong>
        </p>
      </div>
      <div style="font-size: 15px; color: #1f2937; line-height: 1.8;">
        ${data.htmlBody}
      </div>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
        Vous recevez cet email car vous êtes client de la boutique ${data.storeName} sur .
      </div>
    `)

    for (const to of recipients) {
      const result = await this.sendMailWithRetry({
        from: this.fromAddress,
        to,
        subject: data.subject,
        html,
      }, 2)
      if (result.success) {
        sent++
      } else {
        failed++
      }
    }

    return { sent, failed }
  }

  // ============================================
  // Boost approuvé
  // ============================================
  async sendBoostApprovedEmail(
    email: string,
    fullName: string,
    opts: { type: string; durationDays: number; price: number; currency: string; endsAt: string; productName?: string }
  ) {
    const typeLabels: Record<string, string> = {
      HOMEPAGE: 'Page d\'accueil',
      CATEGORY: 'Catégorie',
      SEARCH:   'Recherche',
      STORE:    'Boutique entière',
    }
    const typeLabel = typeLabels[opts.type] ?? opts.type
    const endDate   = new Date(opts.endsAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

    const html = this.wrapTemplate(`
      <div style="padding: 32px 28px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 56px; height: 56px; background: rgba(5,150,105,0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span style="font-size: 28px;">✅</span>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 22px; color: #111827; font-weight: 700;">Boost approuvé !</h2>
          <p style="margin: 0; color: #6B7280; font-size: 15px;">Votre demande de mise en avant a été validée.</p>
        </div>

        <p style="color: #374151; font-size: 15px; margin-bottom: 20px;">Bonjour ${fullName},</p>
        <p style="color: #374151; font-size: 15px;">Votre boost <strong>${typeLabel}</strong> est maintenant actif${opts.productName ? ` pour <strong>${opts.productName}</strong>` : ''}.</p>

        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6B7280; font-size: 14px; width: 140px;">Type</td><td style="color: #111827; font-weight: 600; font-size: 14px;">${typeLabel}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B7280; font-size: 14px;">Durée</td><td style="color: #111827; font-weight: 600; font-size: 14px;">${opts.durationDays} jours</td></tr>
            <tr><td style="padding: 6px 0; color: #6B7280; font-size: 14px;">Montant payé</td><td style="color: #111827; font-weight: 600; font-size: 14px;">${opts.price.toLocaleString('fr-FR')} ${opts.currency}</td></tr>
            <tr><td style="padding: 6px 0; color: #6B7280; font-size: 14px;">Expire le</td><td style="color: #059669; font-weight: 700; font-size: 14px;">${endDate}</td></tr>
          </table>
        </div>

        <p style="color: #374151; font-size: 14px;">Votre produit sera mis en avant sur la plateforme pendant toute la durée du boost. Bonne visibilité !</p>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${this.frontendUrl}/seller/promotions" style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #fff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Voir mes boosts
          </a>
        </div>
      </div>
    `)

    await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: '✅ Votre boost a été approuvé !',
      html,
    })
  }

  // ============================================
  // Boost rejeté
  // ============================================
  async sendBoostRejectedEmail(
    email: string,
    fullName: string,
    opts: { type: string; durationDays: number; price: number; currency: string; reason?: string }
  ) {
    const typeLabels: Record<string, string> = {
      HOMEPAGE: 'Page d\'accueil',
      CATEGORY: 'Catégorie',
      SEARCH:   'Recherche',
      STORE:    'Boutique entière',
    }
    const typeLabel = typeLabels[opts.type] ?? opts.type

    const html = this.wrapTemplate(`
      <div style="padding: 32px 28px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="width: 56px; height: 56px; background: rgba(220,38,38,0.1); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <span style="font-size: 28px;">❌</span>
          </div>
          <h2 style="margin: 0 0 8px; font-size: 22px; color: #111827; font-weight: 700;">Boost non approuvé</h2>
          <p style="margin: 0; color: #6B7280; font-size: 15px;">Votre demande de mise en avant a été refusée.</p>
        </div>

        <p style="color: #374151; font-size: 15px; margin-bottom: 16px;">Bonjour ${fullName},</p>
        <p style="color: #374151; font-size: 15px;">Votre demande de boost <strong>${typeLabel}</strong> (${opts.durationDays} jours — ${opts.price.toLocaleString('fr-FR')} ${opts.currency}) n'a pas pu être validée.</p>

        ${opts.reason ? `
        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #DC2626; text-transform: uppercase; letter-spacing: 0.05em;">Motif</p>
          <p style="margin: 0; color: #7F1D1D; font-size: 14px;">${opts.reason}</p>
        </div>` : ''}

        <p style="color: #374151; font-size: 14px;">Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez soumettre une nouvelle demande, n'hésitez pas à nous contacter.</p>

        <div style="text-align: center; margin-top: 28px;">
          <a href="${this.frontendUrl}/seller/promotions" style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #fff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
            Gérer mes boosts
          </a>
        </div>
      </div>
    `)

    await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: '❌ Votre boost n\'a pas été approuvé',
      html,
    })
  }

  // ============================================
  // Invitation d'un membre à une boutique
  // ============================================
  async sendStoreTeamInviteEmail(
    email: string,
    opts: {
      fullName: string | null
      storeName: string
      role: string
      setupUrl: string
      isResend?: boolean
    }
  ) {
    const roleLabel = opts.role === 'MANAGER' ? 'Manager' : 'Collaborateur'
    const subject = opts.isResend
      ? `🔁 Rappel : rejoignez la boutique ${opts.storeName}`
      : `🎉 Vous êtes invité à rejoindre la boutique ${opts.storeName}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        ${opts.isResend ? 'Rappel d\'invitation' : 'Invitation à rejoindre une boutique'}
      </h2>
      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        Bonjour${opts.fullName ? ` <strong>${opts.fullName}</strong>` : ''} !<br><br>
        Vous avez été invité(e) à rejoindre la boutique <strong>${opts.storeName}</strong>
        en tant que <strong>${roleLabel}</strong>.
      </p>
      <div style="background: #FFF7ED; border-left: 4px solid #FF2C2C; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 0 0 28px 0;">
        <p style="margin: 0; color: #92400E; font-size: 14px; font-weight: 600;">
          Ce lien est valable 72 heures. Définissez votre mot de passe pour accéder à votre espace vendeur.
        </p>
      </div>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${opts.setupUrl}"
           style="background: linear-gradient(135deg, #FF2C2C, #FF5A5A); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 44, 44, 0.3);">
          Définir mon mot de passe
        </a>
      </div>
      <p style="color: #6B7280; font-size: 13px; text-align: center; margin: 0;">
        Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>
    `)

    await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject,
      html,
    })
  }
  // ============================================
  // Email de confirmation d'abonnement newsletter
  // ============================================
  async sendNewsletterConfirmationEmail(email: string, name: string | null, unsubscribeToken: string) {
    const unsubscribeUrl = `${this.frontendUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`

    const html = this.wrapTemplate(`
      <h2 style="color: #1F1416; font-size: 22px; margin: 0 0 16px 0;">
        Inscription confirmée ! 🎉
      </h2>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 16px 0;">
        Bonjour ${name || 'cher(e) abonné(e)'},
      </p>
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 24px 0;">
        Vous êtes maintenant abonné(e) à notre newsletter. Vous recevrez en avant-première nos offres exclusives, promotions et nouveautés.
      </p>
      <div style="background: linear-gradient(135deg, #FFECEC, #FFE0B2); border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #FF2C2C;">
          Bienvenue dans notre communauté !
        </p>
        <p style="margin: 8px 0 0; font-size: 14px; color: #6b7280;">
          Des offres exclusives vous attendent.
        </p>
      </div>
      <p style="font-size: 12px; color: #9ca3af; margin: 24px 0 0; text-align: center;">
        Vous souhaitez vous désabonner ?
        <a href="${unsubscribeUrl}" style="color: #FF2C2C;">Cliquez ici</a>
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject: 'Bienvenue dans notre newsletter ! 🎉',
      html,
    })
  }

  // ============================================
  // Envoi d'une campagne newsletter
  // ============================================
  async sendNewsletterCampaign(
    email: string,
    name: string | null,
    subject: string,
    body: string,
    unsubscribeToken: string
  ) {
    const unsubscribeUrl = `${this.frontendUrl}/newsletter/unsubscribe?token=${unsubscribeToken}`

    const html = this.wrapTemplate(`
      <p style="font-size: 15px; color: #4b5563; line-height: 1.7; margin: 0 0 16px 0;">
        Bonjour ${name || 'cher(e) abonné(e)'},
      </p>
      <div style="font-size: 15px; color: #1F1416; line-height: 1.8;">
        ${body.replace(/\n/g, '<br>')}
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        Vous recevez cet email car vous êtes abonné(e) à notre newsletter.<br>
        <a href="${unsubscribeUrl}" style="color: #FF2C2C;">Se désabonner</a>
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject,
      html,
    })
  }
  // ============================================
  // Email de relance panier abandonné
  // ============================================
  async sendAbandonedCartEmail(
    email: string,
    firstName: string,
    cartItems: Array<{ name: string; price: number; quantity: number; image?: string }>,
    cartTotal: string,
    recoveryLink: string,
    reminderNumber: 1 | 2
  ): Promise<{ success: boolean; error?: any }> {
    const isSecond = reminderNumber === 2
    const subject = isSecond
      ? `⏰ Dernière chance — votre panier ChezPrecious vous attend`
      : `🛒 Vous avez oublié quelque chose chez ChezPrecious`

    const urgencyBanner = isSecond
      ? `<div style="background:#FEF3C7;border-left:4px solid #FF2C2C;padding:12px 16px;margin-bottom:24px;border-radius:4px;">
           <p style="margin:0;font-size:14px;color:#92400E;font-weight:600;">⚠️ Dernière relance — votre panier sera supprimé dans 24h.</p>
         </div>`
      : ''

    const itemsHtml = cartItems
      .map(
        (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="56" height="56" style="border-radius:6px;object-fit:cover;display:block;" />` : ''}
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1F1416;">${item.name}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Qté : ${item.quantity}</p>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid #f3f4f6;vertical-align:middle;text-align:right;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#FF2C2C;">${(item.price * item.quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
        </td>
      </tr>`
      )
      .join('')

    const html = this.wrapTemplate(`
      <h2 style="color:#1F1416;font-size:22px;margin:0 0 8px 0;">Bonjour ${firstName} 👋</h2>
      <p style="font-size:15px;color:#4b5563;line-height:1.7;margin:0 0 24px 0;">
        ${isSecond
          ? 'Vous avez laissé des articles dans votre panier. Ne laissez pas filer ces pépites !'
          : 'Vous avez commencé votre commande mais ne l\'avez pas finalisée. Vos articles vous attendent !'}
      </p>

      ${urgencyBanner}

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f3f4f6;" colspan="2">Article</th>
            <th style="text-align:right;padding:8px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #f3f4f6;">Total</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:12px 8px;font-size:15px;font-weight:700;color:#1F1416;text-align:right;">Total :</td>
            <td style="padding:12px 8px;font-size:16px;font-weight:800;color:#FF2C2C;text-align:right;">${cartTotal}</td>
          </tr>
        </tfoot>
      </table>

      <div style="text-align:center;margin:32px 0;">
        <a href="${recoveryLink}"
           style="display:inline-block;background:linear-gradient(135deg,#FF2C2C,#FF5A5A);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:.03em;">
          ✅ Finaliser ma commande
        </a>
      </div>

      <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
        Ce lien est valable 48h. Livraison offerte dès 80 €.
      </p>
    `)

    return await this.sendMailWithRetry({
      from: this.fromAddress,
      to: email,
      subject,
      html,
    })
  }
}

export default new MailService()
