import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'
import activityLogService from '#services/activity_log_service'
import {
  settingsGeneralValidator,
  settingsContactValidator,
  settingsSocialValidator,
  settingsAppearanceValidator,
  settingsCommerceValidator,
  settingsShippingValidator,
  settingsSeoValidator,
  settingsLegalValidator,
  settingsNotificationsValidator,
  settingsAdvancedValidator,
  settingsSecurityValidator,
  settingsHomepageContentValidator,
} from '#validators/admin_validator'

/**
 * Helper pour récupérer ou créer les settings par défaut
 */
async function getOrCreateSettings() {
  let settings = await prisma.siteSettings.findUnique({
    where: { id: 'default' },
  })

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: 'default' },
    })
  }

  return settings
}

export default class AdminSettingsController {
  // ==============================================
  // GET — Récupérer tous les paramètres
  // ==============================================

  /**
   * @getAll
   * @summary Récupérer tous les paramètres du site
   * @tag Admin Settings
   * @responseBody 200 - {"settings": {"id": "default", "siteName": "Marketplace", "currency": "XOF"}}
   */
  async getAll({ response }: HttpContext) {
    const settings = await getOrCreateSettings()
    return response.ok({ settings })
  }

  /**
   * @getPublic
   * @summary Paramètres publics (pour le frontend, sans données sensibles)
   * @tag Settings
   * @responseBody 200 - {"settings": {"id": "default", "siteName": "Marketplace", "currency": "XOF"}}
   */
  async getPublic({ response }: HttpContext) {
    const settings = await getOrCreateSettings()

    return response.ok({
      settings: {
        siteName: settings.siteName,
        siteSlogan: settings.siteSlogan,
        siteDescription: settings.siteDescription,
        siteUrl: settings.siteUrl,
        language: settings.language,
        logo: settings.logo,
        favicon: settings.favicon,
        banner: settings.banner,

        contactEmail: settings.contactEmail,
        phoneMain: settings.phoneMain,
        phoneWhatsapp: settings.phoneWhatsapp,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        businessHours: settings.businessHours,

        facebook: settings.facebook,
        instagram: settings.instagram,
        twitter: settings.twitter,
        youtube: settings.youtube,
        linkedin: settings.linkedin,
        tiktok: settings.tiktok,

        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        accentColor: settings.accentColor,

        currency: settings.currency,
        freeShippingMin: settings.freeShippingMin,

        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        metaKeywords: settings.metaKeywords,
        googleAnalytics: settings.googleAnalytics,
        facebookPixel: settings.facebookPixel,

        maintenanceMode: settings.maintenanceMode,

        // Contenu dynamique homepage
        homepageBanners: settings.homepageBanners,
        flashSaleConfig: settings.flashSaleConfig,
        adSectionConfig: settings.adSectionConfig,
      },
    })
  }

  /**
   * @getLegal
   * @summary Récupérer une page légale spécifique (publique)
   * @tag Settings
   * @paramPath page - cgu | privacy | mentions | return-policy
   * @responseBody 200 - {"content": "..."}
   */
  async getLegal({ params, response }: HttpContext) {
    const settings = await getOrCreateSettings()
    const { page } = params

    const pageMap: Record<string, string | null> = {
      cgu: settings.cguContent,
      privacy: settings.privacyContent,
      mentions: settings.mentionsContent,
      'return-policy': settings.returnPolicy,
    }

    if (!(page in pageMap)) {
      return response.notFound({ message: 'Page légale non trouvée' })
    }

    return response.ok({
      page,
      content: pageMap[page],
    })
  }

  // ==============================================
  // PUT — Mise à jour par section
  // ==============================================

  /**
   * @updateGeneral
   * @summary Mettre à jour les paramètres généraux
   * @tag Admin Settings
   */
  async updateGeneral({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsGeneralValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'general' },
    }).catch(() => {})

    return response.ok({
      message: 'Paramètres généraux mis à jour',
      settings,
    })
  }

  /**
   * @updateContact
   * @summary Mettre à jour les informations de contact
   * @tag Admin Settings
   */
  async updateContact({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsContactValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'contact' },
    }).catch(() => {})

    return response.ok({
      message: 'Informations de contact mises à jour',
      settings,
    })
  }

  /**
   * @updateSocial
   * @summary Mettre à jour les réseaux sociaux
   * @tag Admin Settings
   */
  async updateSocial({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsSocialValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'social' },
    }).catch(() => {})

    return response.ok({
      message: 'Réseaux sociaux mis à jour',
      settings,
    })
  }

  /**
   * @updateAppearance
   * @summary Mettre à jour l'apparence
   * @tag Admin Settings
   */
  async updateAppearance({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsAppearanceValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'appearance' },
    }).catch(() => {})

    return response.ok({
      message: 'Apparence mise à jour',
      settings,
    })
  }

  /**
   * @updateCommerce
   * @summary Mettre à jour les paramètres commerciaux
   * @tag Admin Settings
   */
  async updateCommerce({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsCommerceValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'commerce' },
    }).catch(() => {})

    return response.ok({
      message: 'Paramètres commerciaux mis à jour',
      settings,
    })
  }

  /**
   * @updateShipping
   * @summary Mettre à jour les méthodes de livraison
   * @tag Admin Settings
   */
  async updateShipping({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsShippingValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'shipping' },
    }).catch(() => {})

    return response.ok({
      message: 'Méthodes de livraison mises à jour',
      settings,
    })
  }

  /**
   * @updateSeo
   * @summary Mettre à jour les paramètres SEO
   * @tag Admin Settings
   */
  async updateSeo({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsSeoValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'seo' },
    }).catch(() => {})

    return response.ok({
      message: 'Paramètres SEO mis à jour',
      settings,
    })
  }

  /**
   * @updateLegal
   * @summary Mettre à jour les pages légales
   * @tag Admin Settings
   */
  async updateLegal({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsLegalValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'legal' },
    }).catch(() => {})

    return response.ok({
      message: 'Pages légales mises à jour',
      settings,
    })
  }

  /**
   * @updateNotifications
   * @summary Mettre à jour les paramètres de notifications
   * @tag Admin Settings
   */
  async updateNotifications({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsNotificationsValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'notifications' },
    }).catch(() => {})

    return response.ok({
      message: 'Paramètres de notifications mis à jour',
      settings,
    })
  }

  /**
   * @updateAdvanced
   * @summary Mettre à jour les paramètres avancés
   * @tag Admin Settings
   */
  async updateAdvanced({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsAdvancedValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'advanced' },
    }).catch(() => {})

    return response.ok({
      message: 'Paramètres avancés mis à jour',
      settings,
    })
  }

  // ==============================================
  // Upload — Logo, Favicon, Banner
  // ==============================================

  /**
   * @updateLogo
   * @summary Mettre à jour le logo du site
   * @tag Admin Settings
   */
  async updateLogo({ request, response }: HttpContext) {
    const { logo } = request.only(['logo'])

    if (!logo) {
      return response.badRequest({ message: 'URL du logo requise' })
    }

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { logo },
    })

    return response.ok({
      message: 'Logo mis à jour',
      logo: settings.logo,
    })
  }

  /**
   * @updateFavicon
   * @summary Mettre à jour le favicon
   * @tag Admin Settings
   */
  async updateFavicon({ request, response }: HttpContext) {
    const { favicon } = request.only(['favicon'])

    if (!favicon) {
      return response.badRequest({ message: 'URL du favicon requise' })
    }

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { favicon },
    })

    return response.ok({
      message: 'Favicon mis à jour',
      favicon: settings.favicon,
    })
  }

  /**
   * @updateBanner
   * @summary Mettre à jour la bannière
   * @tag Admin Settings
   */
  async updateBanner({ request, response }: HttpContext) {
    const { banner } = request.only(['banner'])

    if (!banner) {
      return response.badRequest({ message: 'URL de la bannière requise' })
    }

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { banner },
    })

    return response.ok({
      message: 'Bannière mise à jour',
      banner: settings.banner,
    })
  }

  /**
   * @deleteLogo
   * @summary Supprimer le logo
   * @tag Admin Settings
   */
  async deleteLogo({ response }: HttpContext) {
    await getOrCreateSettings()
    await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { logo: null },
    })

    return response.ok({ message: 'Logo supprimé' })
  }

  /**
   * @deleteFavicon
   * @summary Supprimer le favicon
   * @tag Admin Settings
   */
  async deleteFavicon({ response }: HttpContext) {
    await getOrCreateSettings()
    await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { favicon: null },
    })

    return response.ok({ message: 'Favicon supprimé' })
  }

  /**
   * @deleteBanner
   * @summary Supprimer la bannière
   * @tag Admin Settings
   */
  async deleteBanner({ response }: HttpContext) {
    await getOrCreateSettings()
    await prisma.siteSettings.update({
      where: { id: 'default' },
      data: { banner: null },
    })

    return response.ok({ message: 'Bannière supprimée' })
  }

  /**
   * @updateSecurity
   * @summary Mettre à jour les paramètres de sécurité
   * @tag Admin Settings
   */
  async updateSecurity({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsSecurityValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'security' },
    }).catch(() => {})

    return response.ok({ message: 'Paramètres de sécurité mis à jour', settings })
  }

  /**
   * @updateHomepageContent
   * @summary Mettre à jour le contenu dynamique de la homepage (bannières, vente flash, section pub)
   * @tag Admin Settings
   */
  async updateHomepageContent({ request, response, authenticatedAdmin }: HttpContext) {
    const data = await request.validateUsing(settingsHomepageContentValidator)

    await getOrCreateSettings()
    const settings = await prisma.siteSettings.update({
      where: { id: 'default' },
      data,
    })

    activityLogService.log({
      adminId: authenticatedAdmin?.id,
      adminEmail: authenticatedAdmin?.email,
      adminRole: authenticatedAdmin?.role,
      action: 'UPDATE_SETTINGS',
      metadata: { section: 'homepage-content' },
    }).catch(() => {})

    return response.ok({ message: 'Contenu homepage mis à jour', settings })
  }
}
