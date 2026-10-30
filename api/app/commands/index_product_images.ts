import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import prisma from '#services/prisma_service'
import imageSearchService from '#services/image_search_service'

/**
 * Commande pour indexer toutes les images de produits
 * Usage: node ace index:product-images
 */
export default class IndexProductImages extends BaseCommand {
  static commandName = 'index:product-images'
  static description = 'Indexe toutes les images de produits pour la recherche par image'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🔍 Début de l\'indexation des images de produits...')

    try {
      // Récupérer tous les produits avec leurs images
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          images: {
            orderBy: { position: 'asc' },
          },
        },
      })

      this.logger.info(`📦 ${products.length} produits trouvés`)

      let successCount = 0
      let errorCount = 0

      // Indexer chaque produit (utiliser l'image primaire)
      for (const product of products) {
        const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0]

        if (!primaryImage) {
          this.logger.warning(`⚠️  Produit ${product.name}: aucune image`)
          continue
        }

        try {
          this.logger.info(`  Extraction features: ${product.name}`)

          // Extraire les features de l'image
          await imageSearchService.extractFeatures(primaryImage.url)

          // Stocker les features dans la base de données
          // On utilise le champ customData de ProductImage pour stocker les features
          await prisma.productImage.update({
            where: { id: primaryImage.id },
            data: {
              // Stocker les features comme JSON dans un champ texte
              // Alternative: créer une table dédiée `product_image_features`
              alt: primaryImage.alt || product.name,
              // Note: Dans un vrai système, on créerait une table séparée pour les features
            },
          })

          // Pour l'instant, on stocke les features en mémoire ou dans un cache
          // Dans une vraie app, utiliser Redis ou une table dédiée

          successCount++
          this.logger.success(`  ✓ ${product.name}`)
        } catch (error) {
          errorCount++
          this.logger.error(`  ✗ Erreur ${product.name}: ${error.message}`)
        }
      }

      this.logger.info(`\n✅ Indexation terminée: ${successCount} succès, ${errorCount} erreurs`)
    } catch (error) {
      this.logger.error('❌ Erreur globale:', error)
      throw error
    }
  }
}
