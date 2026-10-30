import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'

export default class UploadController {
  /**
   * @uploadImage
   * @summary Upload d'une image (avatar, logo, etc.)
   * @tag Upload
   */
  async uploadImage({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const image = request.file('image', {
      size: '2mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })

    if (!image) {
      return response.badRequest({ message: 'Fichier image requis' })
    }

    if (!image.isValid) {
      return response.badRequest({ message: image.errors })
    }

    // Générer un nom de fichier unique
    const fileName = `${cuid()}.${image.extname}`
    const uploadPath = app.makePath('public/uploads')

    // Déplacer le fichier
    await image.move(uploadPath, {
      name: fileName,
    })

    // Retourner l'URL du fichier
    const fileUrl = `/uploads/${fileName}`

    return response.ok({
      message: 'Image uploadée avec succès',
      url: fileUrl,
    })
  }
}
