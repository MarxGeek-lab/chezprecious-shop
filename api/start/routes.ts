/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import AutoSwagger from 'adonis-autoswagger'
import swagger from '#config/swagger'
import { middleware } from '#start/kernel'

const AdminAuthController = () => import('#controllers/admin_auth_controller')
const AdminSettingsController = () => import('#controllers/admin_settings_controller')
const AdminTeamController = () => import('#controllers/admin_team_controller')
const AdminDataController = () => import('#controllers/admin_data_controller')
const AdminProductController = () => import('#controllers/admin_product_controller')
const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/user_controller')
const AddressController = () => import('#controllers/address_controller')
const UploadController = () => import('#controllers/upload_controller')
const ProductController = () => import('#controllers/product_controller')
const ReviewController = () => import('#controllers/review_controller')
const CategoryController = () => import('#controllers/category_controller')
const OrderController = () => import('#controllers/order_controller')
const HomepageController = () => import('#controllers/homepage_controller')
const SearchController = () => import('#controllers/search_controller')
const MessageController = () => import('#controllers/message_controller')
const NotificationController = () => import('#controllers/notification_controller')
const NewsletterController = () => import('#controllers/newsletter_controller')
const PromoCodeController = () => import('#controllers/promo_code_controller')
const AbandonedCartController = () => import('#controllers/abandoned_cart_controller')

router.on('/').render('pages/home')

// ==========================================
// Swagger Documentation
// ==========================================
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.ui('/swagger', swagger)
})

// ==========================================
// API Routes
// ==========================================
router
  .group(() => {
    // ------------------------------------------
    // Auth routes
    // ------------------------------------------
    router
      .group(() => {
        // Routes publiques
        router.post('register', [AuthController, 'register'])
        router.post('login', [AuthController, 'login'])
        router.get('activate/:token', [AuthController, 'activateAccount'])
        router.post('forgot-password', [AuthController, 'forgotPassword'])
        router.post('reset-password', [AuthController, 'resetPassword'])
        router.get('verify-email/:email', [AuthController, 'verifyEmail'])
        router.get('confirm-login/:token', [AuthController, 'confirmLogin'])

        // OAuth — Google
        router.get('oauth/google', [AuthController, 'oauthGoogle'])
        router.get('oauth/google/callback', [AuthController, 'oauthGoogleCallback'])

        // OAuth — Facebook
        router.get('oauth/facebook', [AuthController, 'oauthFacebook'])
        router.get('oauth/facebook/callback', [AuthController, 'oauthFacebookCallback'])

        // Routes protégées (JWT)
        router
          .group(() => {
            router.get('me', [AuthController, 'me'])
            router.post('logout', [AuthController, 'logout'])
          })
          .use(middleware.jwt())
      })
      .prefix('auth')

    // ------------------------------------------
    // User routes (protégées JWT — clients uniquement)
    // ------------------------------------------
    router
      .group(() => {
        router.get('reviews', [UserController, 'myReviews'])
        router.put('profile', [UserController, 'updateProfile'])
        router.put('password', [UserController, 'updatePassword'])
        router.put('avatar', [UserController, 'updateAvatar'])
      })
      .prefix('user')
      .use([middleware.jwt(), middleware.userOnly()])

    // ------------------------------------------
    // Address routes (protégées JWT — clients uniquement)
    // ------------------------------------------
    router
      .group(() => {
        router.get('/', [AddressController, 'index'])
        router.post('/', [AddressController, 'store'])
        router.put(':id', [AddressController, 'update'])
        router.delete(':id', [AddressController, 'destroy'])
        router.patch(':id/default', [AddressController, 'setDefault'])
      })
      .prefix('addresses')
      .use([middleware.jwt(), middleware.userOnly()])

    // ------------------------------------------
    // Upload route (protégée JWT)
    // ------------------------------------------
    router
      .post('upload/image', [UploadController, 'uploadImage'])
      .use(middleware.jwt())


    // ------------------------------------------
    // Reviews routes
    // ------------------------------------------
    router
      .group(() => {
        // Public
        router.get('/', [ReviewController, 'index'])
        router.get('public', [ReviewController, 'publicList'])
        router.post(':id/helpful', [ReviewController, 'helpful'])

        // Protégées JWT — clients uniquement
        router
          .group(() => {
            router.post('/', [ReviewController, 'store'])
            router.put(':id', [ReviewController, 'update'])
            router.delete(':id', [ReviewController, 'destroy'])
          })
          .use([middleware.jwt(), middleware.userOnly()])
      })
      .prefix('reviews')

    // ------------------------------------------
    // Categories routes
    // ------------------------------------------
    router
      .group(() => {
        // Public
        router.get('/', [CategoryController, 'index'])
        router.get(':slug', [CategoryController, 'show'])

        // Admin (protégées JWT)
        router
          .group(() => {
            router.get('/admin/all', [CategoryController, 'adminIndex'])
            router.post('/', [CategoryController, 'store'])
            router.put(':id', [CategoryController, 'update'])
            router.delete(':id', [CategoryController, 'destroy'])

            // Sous-catégories
            router.post('sub', [CategoryController, 'storeSubCategory'])
            router.put('sub/:id', [CategoryController, 'updateSubCategory'])
            router.delete('sub/:id', [CategoryController, 'destroySubCategory'])
          })
          .use(middleware.jwt())
      })
      .prefix('categories')

    // ------------------------------------------
    // Products routes publiques (storefront)
    // ------------------------------------------
    router
      .group(() => {
        router.get('/', [ProductController, 'publicList'])
        router.get(':slug', [ProductController, 'publicShow'])
        router.get(':slug/similar', [ProductController, 'publicSimilar'])
      })
      .prefix('catalog')

    // ------------------------------------------
    // Homepage routes (publiques)
    // ------------------------------------------
    router
      .group(() => {
        router.get('featured', [HomepageController, 'featured'])
        router.get('new', [HomepageController, 'newProducts'])
        router.get('promotions', [HomepageController, 'promotions'])
        router.get('best-sellers', [HomepageController, 'bestSellers'])
        router.get('recommended', [HomepageController, 'recommended'])
        router.get('stats', [HomepageController, 'stats'])
        router.post('contact', [HomepageController, 'contact'])
        router.get('config', [HomepageController, 'config'])
      })
      .prefix('homepage')

    // ------------------------------------------
    // Newsletter routes (publiques)
    // ------------------------------------------
    router
      .group(() => {
        router.post('subscribe', [NewsletterController, 'subscribe'])
        router.get('unsubscribe', [NewsletterController, 'unsubscribe'])
      })
      .prefix('newsletter')

    // ------------------------------------------
    // Search routes (publiques)
    // ------------------------------------------
    router
      .group(() => {
        router.post('image', [SearchController, 'searchByImage'])
        router.get('suggestions', [SearchController, 'suggestions'])
        router.get('advanced', [SearchController, 'advancedSearch'])
      })
      .prefix('search')

    // ------------------------------------------
    // Orders routes
    // ------------------------------------------
    router
      .group(() => {
        // Public - Créer une commande (JWT optionnel pour lier à l'utilisateur si connecté)
        router.post('/', [OrderController, 'store']).use(middleware.jwtOptional())
        router.get('/:id', [OrderController, 'show'])

        // Protégées JWT - Mes commandes
        router
          .group(() => {
            router.get('/', [OrderController, 'index'])
          })
          .use(middleware.jwt())

        // Seller - Commandes reçues
      })
      .prefix('orders')

    // ------------------------------------------
    // Messages routes (protégées JWT)
    // ------------------------------------------
    router
      .group(() => {
        router.get('/', [MessageController, 'index'])
        router.get('/unread-count', [MessageController, 'unreadCount'])
        router.get('/:customerEmail', [MessageController, 'show'])
        router.post('/', [MessageController, 'store'])
      })
      .prefix('messages')
      .use(middleware.jwt())

    router
      .group(() => {
        router.get('/', [MessageController, 'customerConversations'])
        router.get('/thread', [MessageController, 'customerThread'])
        router.post('/', [MessageController, 'customerSend'])
      })
      .prefix('customer/messages')
      .use(middleware.jwt())

    // ------------------------------------------
    // Admin routes — Publiques (pas de JWT)
    // ------------------------------------------
    router
      .group(() => {
        router.post('auth/login', [AdminAuthController, 'login'])
        router.post('auth/request-reset', [AdminTeamController, 'requestPasswordReset'])
        router.post('auth/verify-token', [AdminTeamController, 'verifyToken'])
        router.post('auth/set-password', [AdminTeamController, 'setPassword'])
      })
      .prefix('admin')

    // ------------------------------------------
    // Admin routes — Protégées (JWT + rôle ADMIN)
    // ------------------------------------------
    router
      .group(() => {
        // Auth admin
        router.get('auth/me', [AdminAuthController, 'me'])
        router.put('auth/profile', [AdminAuthController, 'updateProfile'])
        router.put('auth/password', [AdminAuthController, 'updatePassword'])

        // Dashboard stats
        router.get('dashboard', [AdminAuthController, 'dashboard'])
        router.get('analytics', [AdminAuthController, 'analytics'])

        // Settings — Lecture
        router.get('settings', [AdminSettingsController, 'getAll'])

        // Settings — Mise à jour par section
        router.put('settings/general', [AdminSettingsController, 'updateGeneral'])
        router.put('settings/contact', [AdminSettingsController, 'updateContact'])
        router.put('settings/social', [AdminSettingsController, 'updateSocial'])
        router.put('settings/appearance', [AdminSettingsController, 'updateAppearance'])
        router.put('settings/commerce', [AdminSettingsController, 'updateCommerce'])
        router.put('settings/shipping', [AdminSettingsController, 'updateShipping'])
        router.put('settings/seo', [AdminSettingsController, 'updateSeo'])
        router.put('settings/legal', [AdminSettingsController, 'updateLegal'])
        router.put('settings/notifications', [AdminSettingsController, 'updateNotifications'])
        router.put('settings/advanced', [AdminSettingsController, 'updateAdvanced'])
        router.put('settings/security', [AdminSettingsController, 'updateSecurity'])
        router.put('settings/homepage-content', [AdminSettingsController, 'updateHomepageContent'])

        // Data — Users
        router.get('users', [AdminDataController, 'users'])
        router.get('users/stats', [AdminDataController, 'userStats'])
        router.get('users/export', [AdminDataController, 'exportUsers'])
        router.get('users/:id', [AdminDataController, 'getUser'])
        router.patch('users/:id', [AdminDataController, 'updateUser'])
        router.delete('users/:id', [AdminDataController, 'deleteUser'])
        router.patch('users/:id/toggle-active', [AdminDataController, 'toggleUserActive'])

        // Data — Products (lecture + modération)
        router.get('products', [AdminDataController, 'products'])
        router.get('products/export', [AdminDataController, 'exportProducts'])
        router.get('products/:id', [AdminDataController, 'getProduct'])
        router.patch('products/:id/status', [AdminDataController, 'updateProductStatus'])
        router.delete('products/:id', [AdminDataController, 'deleteProduct'])

        // Admin Products (création/édition par admin — boutique système)
        router.post('products/admin-create', [AdminProductController, 'store'])
        router.put('products/admin-update/:id', [AdminProductController, 'update'])
        router.delete('products/:id/images/:imageId', [AdminProductController, 'deleteImage'])
        router.delete('products/:id/videos/:videoId', [AdminProductController, 'deleteVideo'])
        router.patch('products/:id/images/:imageId/main', [AdminProductController, 'setMainImage'])

        // Data — Orders
        router.get('orders', [AdminDataController, 'orders'])
        router.get('orders/export', [AdminDataController, 'exportOrders'])
        router.get('orders/:id', [AdminDataController, 'getOrder'])

        // Data — Categories
        router.get('categories', [AdminDataController, 'categories'])
        router.post('categories', [AdminDataController, 'createCategory'])
        router.put('categories/:id', [AdminDataController, 'updateCategory'])
        router.delete('categories/:id', [AdminDataController, 'deleteCategory'])
        router.patch('categories/:id/toggle-active', [AdminDataController, 'toggleCategoryActive'])
        router.post('categories/:categoryId/sub-categories', [AdminDataController, 'createSubCategory'])
        router.put('sub-categories/:id', [AdminDataController, 'updateSubCategory'])
        router.delete('sub-categories/:id', [AdminDataController, 'deleteSubCategory'])

        // Journal d'activité
        router.get('activity-logs', [AdminDataController, 'activityLogs'])

        // Statistiques sécurité
        router.get('security-stats', [AdminDataController, 'securityStats'])

        // Recherche globale
        router.get('search', [AdminDataController, 'globalSearch'])

        // Notifications admin
        router.get('notifications', [AdminDataController, 'adminNotifications'])
        router.post('notifications/send', [AdminDataController, 'adminSendNotification'])

        // Messages — Conversations directes admin ↔ utilisateurs
        router.get('messages', [AdminDataController, 'adminMessages'])
        router.get('messages/stats', [AdminDataController, 'adminMessageStats'])
        router.get('messages/:userId', [AdminDataController, 'adminMessageThread'])
        router.post('messages/send', [AdminDataController, 'adminSendMessage'])

        // Newsletter — Abonnés & Campagnes
        router.get('newsletter/subscribers', [NewsletterController, 'subscribers'])
        router.get('newsletter/subscribers/stats', [NewsletterController, 'subscriberStats'])
        router.delete('newsletter/subscribers/:id', [NewsletterController, 'deleteSubscriber'])
        router.get('newsletter/campaigns', [NewsletterController, 'campaigns'])
        router.post('newsletter/campaigns', [NewsletterController, 'createCampaign'])
        router.put('newsletter/campaigns/:id', [NewsletterController, 'updateCampaign'])
        router.delete('newsletter/campaigns/:id', [NewsletterController, 'deleteCampaign'])
        router.post('newsletter/campaigns/:id/send', [NewsletterController, 'sendCampaign'])

        // Team — Gestion des admins
        router.get('team', [AdminTeamController, 'index'])
        router.get('team/:id', [AdminTeamController, 'show'])
        router.post('team/invite', [AdminTeamController, 'invite'])
        router.put('team/:id', [AdminTeamController, 'update'])
        router.delete('team/:id', [AdminTeamController, 'destroy'])
        router.post('team/:id/resend-setup', [AdminTeamController, 'resendSetupLink'])
        router.patch('team/:id/toggle-active', [AdminTeamController, 'toggleActive'])

        // Abandoned carts — Admin
        router.get('abandoned-carts', [AbandonedCartController, 'adminList'])
        router.post('abandoned-carts/:id/send-reminder', [AbandonedCartController, 'adminSendReminder'])
        router.post('abandoned-carts/send-all', [AbandonedCartController, 'adminSendAllReminders'])

        // Settings — Upload media
        router.put('settings/logo', [AdminSettingsController, 'updateLogo'])
        router.put('settings/favicon', [AdminSettingsController, 'updateFavicon'])
        router.put('settings/banner', [AdminSettingsController, 'updateBanner'])
        router.delete('settings/logo', [AdminSettingsController, 'deleteLogo'])
        router.delete('settings/favicon', [AdminSettingsController, 'deleteFavicon'])
        router.delete('settings/banner', [AdminSettingsController, 'deleteBanner'])
      })
      .prefix('admin')
      .use([middleware.jwt(), middleware.admin()])

    // ------------------------------------------
    // Notifications (protégées JWT — clients uniquement)
    // ------------------------------------------
    router
      .group(() => {
        router.get('/', [NotificationController, 'index'])
        router.get('/unread-count', [NotificationController, 'unreadCount'])
        router.patch('/:id/read', [NotificationController, 'markRead'])
        router.patch('/read-all', [NotificationController, 'markAllRead'])
        router.delete('/read', [NotificationController, 'destroyRead'])
        router.delete('/:id', [NotificationController, 'destroy'])
      })
      .prefix('notifications')
      .use([middleware.jwt(), middleware.userOnly()])


    // ------------------------------------------
    // Codes promo (public — validation au checkout)
    // ------------------------------------------
    router.post('promo-codes/validate', [PromoCodeController, 'validate'])

    // ------------------------------------------
    // Settings publiques (pour le frontend)
    // ------------------------------------------
    router.get('settings/public', [AdminSettingsController, 'getPublic'])
    router.get('settings/legal/:page', [AdminSettingsController, 'getLegal'])

    // ------------------------------------------
    // Paniers abandonnés
    // ------------------------------------------
    router
      .group(() => {
        // Sauvegarde panier (JWT optionnel — fonctionne connecté ou non)
        router.post('save', [AbandonedCartController, 'save']).use(middleware.jwtOptional())
        // Récupération via token email
        router.get('recover/:token', [AbandonedCartController, 'recover'])
        // Marquer converti après commande
        router.post('converted', [AbandonedCartController, 'markConverted'])
        // Cron interne (protégé par CRON_SECRET header)
        router.post('cron/send-reminders', [AbandonedCartController, 'sendReminders'])
      })
      .prefix('carts')
  })
  .prefix('api')
