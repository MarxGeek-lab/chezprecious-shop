import * as tf from '@tensorflow/tfjs-node'
import * as mobilenet from '@tensorflow-models/mobilenet'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

/**
 * Service de recherche par image utilisant TensorFlow.js et MobileNet
 * MobileNet extrait des features visuelles de 1024 dimensions par image
 * La similarité est calculée avec la distance cosinus
 */
class ImageSearchService {
  private model: any = null
  private isInitialized = false

  /**
   * Initialise le modèle MobileNet (appelé automatiquement au premier usage)
   */
  async initialize() {
    if (this.isInitialized) return

    console.log('🤖 Initialisation du modèle MobileNet pour recherche par image...')
    try {
      this.model = await mobilenet.load({
        version: 2,
        alpha: 1.0,
      })
      this.isInitialized = true
      console.log('✅ Modèle MobileNet initialisé avec succès')
    } catch (error) {
      console.error('❌ Erreur initialisation MobileNet:', error)
      throw error
    }
  }

  /**
   * Extrait les features visuelles d'une image (vecteur 1024D)
   * @param imagePath - Chemin vers l'image (local ou URL)
   * @returns Vecteur de features normalisé
   */
  async extractFeatures(imagePath: string): Promise<number[]> {
    await this.initialize()

    try {
      // Charger et prétraiter l'image
      let imageBuffer: Buffer

      if (imagePath.startsWith('data:image/')) {
        // Data URI : décoder directement le base64
        const commaIdx = imagePath.indexOf(',')
        if (commaIdx === -1) throw new Error('Data URI invalide')
        const base64Data = imagePath.slice(commaIdx + 1)
        imageBuffer = Buffer.from(base64Data, 'base64')
      } else if (imagePath.startsWith('http')) {
        // Télécharger l'image depuis URL
        const response = await fetch(imagePath, {
          headers: { 'Accept': 'image/*, */*' },
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} lors du téléchargement de l'image`)
        }
        const contentType = response.headers.get('content-type') ?? ''
        if (!contentType.startsWith('image/')) {
          throw new Error(`L'URL ne pointe pas vers une image (Content-Type: ${contentType}). Veuillez fournir un lien direct vers un fichier image (jpg, png, webp...).`)
        }
        imageBuffer = Buffer.from(await response.arrayBuffer())
      } else {
        // Chemin absolu filesystem (ex: tmp/) → utilisé tel quel
        // Chemin relatif web (ex: /uploads/...) → résolu depuis public/
        const fullPath = imagePath.startsWith('/') && !imagePath.startsWith('/home') && !imagePath.startsWith('/tmp')
          ? join(app.publicPath(), imagePath)
          : imagePath
        imageBuffer = await readFile(fullPath)
      }

      // Redimensionner et convertir en RGB (force PNG pour gérer WebP, AVIF, etc.)
      const processedImage = await sharp(imageBuffer)
        .resize(224, 224)
        .toFormat('png')
        .removeAlpha()
        .raw()
        .toBuffer()

      // Convertir en tensor TensorFlow
      const tensor = tf.tensor3d(
        new Uint8Array(processedImage),
        [224, 224, 3],
        'int32'
      )

      // Extraire les features avec MobileNet
      const features = await this.model.infer(tensor, true)
      const featuresArray = await features.data()

      // Nettoyer les tensors
      tensor.dispose()
      features.dispose()

      return Array.from(featuresArray)
    } catch (error) {
      console.error(`Erreur extraction features de ${imagePath}:`, error)
      throw error
    }
  }

  /**
   * Calcule la similarité cosinus entre deux vecteurs de features
   * @returns Score de similarité entre 0 (différent) et 1 (identique)
   */
  cosineSimilarity(features1: number[], features2: number[]): number {
    if (features1.length !== features2.length) {
      throw new Error('Les vecteurs doivent avoir la même dimension')
    }

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < features1.length; i++) {
      dotProduct += features1[i] * features2[i]
      norm1 += features1[i] * features1[i]
      norm2 += features2[i] * features2[i]
    }

    norm1 = Math.sqrt(norm1)
    norm2 = Math.sqrt(norm2)

    if (norm1 === 0 || norm2 === 0) {
      return 0
    }

    return dotProduct / (norm1 * norm2)
  }

  /**
   * Recherche les produits similaires à une image donnée
   * @param queryImagePath - Chemin de l'image de recherche
   * @param productImages - Liste des images de produits avec leurs features
   * @param topK - Nombre de résultats à retourner
   * @returns Liste des produits triés par similarité
   */
  async searchSimilarProducts(
    queryImagePath: string,
    productImages: Array<{ productId: string; imageUrl: string; features?: number[] }>,
    topK: number = 10,
    minSimilarity: number = 0.4
  ): Promise<Array<{ productId: string; similarity: number }>> {
    // Extraire les features de l'image de recherche
    const queryFeatures = await this.extractFeatures(queryImagePath)

    // Calculer la similarité avec chaque produit
    const similarities = await Promise.all(
      productImages.map(async (product) => {
        let productFeatures = product.features

        // Extraire les features si pas déjà calculées
        if (!productFeatures) {
          try {
            productFeatures = await this.extractFeatures(product.imageUrl)
          } catch (error) {
            console.error(`Erreur features pour ${product.imageUrl}:`, error)
            return { productId: product.productId, similarity: 0 }
          }
        }

        const similarity = this.cosineSimilarity(queryFeatures, productFeatures)
        return { productId: product.productId, similarity }
      })
    )

    // Log pour calibration (visible dans les logs serveur)
    const sorted = similarities.sort((a, b) => b.similarity - a.similarity)
    console.log(`[ImageSearch] Top scores: ${sorted.slice(0, 5).map(s => s.similarity.toFixed(3)).join(', ')} | seuil: ${minSimilarity}`)

    // Filtrer par seuil de similarité minimum puis limiter à topK
    return sorted.filter((s) => s.similarity >= minSimilarity).slice(0, topK)
  }

  /**
   * Batch extraction de features pour plusieurs images
   * Utile pour indexer tous les produits en une fois
   */
  async batchExtractFeatures(
    imagePaths: string[]
  ): Promise<Array<{ imagePath: string; features: number[] | null }>> {
    await this.initialize()

    const results = []
    for (const imagePath of imagePaths) {
      try {
        const features = await this.extractFeatures(imagePath)
        results.push({ imagePath, features })
      } catch (error) {
        console.error(`Erreur batch extraction pour ${imagePath}:`, error)
        results.push({ imagePath, features: null })
      }
    }

    return results
  }

  /**
   * Indexe les images d'un produit (fire-and-forget).
   * À appeler après création ou mise à jour d'un produit.
   * Ne bloque pas la réponse HTTP.
   */
  async indexProductImagesAsync(productId: string): Promise<void> {
    try {
      const { default: prisma } = await import('#services/prisma_service')

      const images = await prisma.productImage.findMany({
        where: { productId },
        include: { features: true },
      })

      for (const image of images) {
        if (image.features) continue // déjà indexé

        try {
          const imagePath = image.url.startsWith('http')
            ? image.url
            : join(app.publicPath(), image.url)

          const features = await this.extractFeatures(imagePath)

          await prisma.imageFeatures.create({
            data: {
              productImageId: image.id,
              features,
              modelVersion: 'mobilenet-v2',
            },
          })
        } catch (err) {
          console.error(`[ImageSearch] Erreur indexation image ${image.id}:`, err)
        }
      }
    } catch (err) {
      console.error(`[ImageSearch] Erreur indexation produit ${productId}:`, err)
    }
  }

  /**
   * Nettoie les ressources du modèle
   */
  dispose() {
    if (this.model) {
      // TensorFlow.js dispose automatiquement
      this.isInitialized = false
      console.log('🧹 Modèle MobileNet nettoyé')
    }
  }
}

// Export singleton
export default new ImageSearchService()
