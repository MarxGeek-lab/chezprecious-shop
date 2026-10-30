import type { HttpContext } from '@adonisjs/core/http'
import prisma from '#services/prisma_service'

export default class AddressController {
  /**
   * @index
   * @summary Lister les adresses de l'utilisateur connecté
   * @tag Addresses
   */
  async index({ response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    if (authenticatedUser.role === 'STORE_MEMBER') {
      return response.forbidden({ message: 'Les membres d\'équipe ne peuvent pas gérer des adresses utilisateur' })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: authenticatedUser.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    return response.ok({ addresses })
  }

  /**
   * @store
   * @summary Créer une nouvelle adresse
   * @tag Addresses
   */
  async store({ request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    if (authenticatedUser.role === 'STORE_MEMBER') {
      return response.forbidden({ message: 'Les membres d\'équipe ne peuvent pas gérer des adresses utilisateur' })
    }

    const { label, fullName, phone, street, city, postalCode, country, isDefault } =
      request.only(['label', 'fullName', 'phone', 'street', 'city', 'postalCode', 'country', 'isDefault'])

    if (!label || !fullName || !street || !city) {
      return response.badRequest({ message: 'label, fullName, street et city sont requis' })
    }

    // Si la nouvelle adresse doit être par défaut, enlever l'ancienne valeur par défaut
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: authenticatedUser.id },
        data: { isDefault: false },
      })
    }

    // Si c'est la première adresse, elle est automatiquement par défaut
    const count = await prisma.address.count({ where: { userId: authenticatedUser.id } })
    const shouldBeDefault = isDefault === true || count === 0

    const address = await prisma.address.create({
      data: {
        userId: authenticatedUser.id,
        label,
        fullName,
        phone: phone || null,
        street,
        city,
        postalCode: postalCode || null,
        country: country || 'Bénin',
        isDefault: shouldBeDefault,
      },
    })

    return response.created({ message: 'Adresse créée avec succès', address })
  }

  /**
   * @update
   * @summary Modifier une adresse
   * @tag Addresses
   */
  async update({ params, request, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const address = await prisma.address.findUnique({ where: { id: params.id } })

    if (!address) {
      return response.notFound({ message: 'Adresse introuvable' })
    }

    if (address.userId !== authenticatedUser.id) {
      return response.forbidden({ message: 'Accès refusé' })
    }

    const { label, fullName, phone, street, city, postalCode, country, isDefault } =
      request.only(['label', 'fullName', 'phone', 'street', 'city', 'postalCode', 'country', 'isDefault'])

    // Si on met cette adresse comme défaut, enlever l'ancienne
    if (isDefault === true) {
      await prisma.address.updateMany({
        where: { userId: authenticatedUser.id, id: { not: params.id } },
        data: { isDefault: false },
      })
    }

    const updated = await prisma.address.update({
      where: { id: params.id },
      data: {
        ...(label !== undefined && { label }),
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(street !== undefined && { street }),
        ...(city !== undefined && { city }),
        ...(postalCode !== undefined && { postalCode: postalCode || null }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    return response.ok({ message: 'Adresse mise à jour', address: updated })
  }

  /**
   * @destroy
   * @summary Supprimer une adresse
   * @tag Addresses
   */
  async destroy({ params, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const address = await prisma.address.findUnique({ where: { id: params.id } })

    if (!address) {
      return response.notFound({ message: 'Adresse introuvable' })
    }

    if (address.userId !== authenticatedUser.id) {
      return response.forbidden({ message: 'Accès refusé' })
    }

    await prisma.address.delete({ where: { id: params.id } })

    // Si c'était l'adresse par défaut, promouvoir la première restante
    if (address.isDefault) {
      const first = await prisma.address.findFirst({
        where: { userId: authenticatedUser.id },
        orderBy: { createdAt: 'asc' },
      })
      if (first) {
        await prisma.address.update({ where: { id: first.id }, data: { isDefault: true } })
      }
    }

    return response.ok({ message: 'Adresse supprimée' })
  }

  /**
   * @setDefault
   * @summary Définir une adresse comme adresse par défaut
   * @tag Addresses
   */
  async setDefault({ params, response, authenticatedUser }: HttpContext) {
    if (!authenticatedUser) {
      return response.unauthorized({ message: 'Authentification requise' })
    }

    const address = await prisma.address.findUnique({ where: { id: params.id } })

    if (!address) {
      return response.notFound({ message: 'Adresse introuvable' })
    }

    if (address.userId !== authenticatedUser.id) {
      return response.forbidden({ message: 'Accès refusé' })
    }

    // Enlever l'ancien défaut
    await prisma.address.updateMany({
      where: { userId: authenticatedUser.id },
      data: { isDefault: false },
    })

    // Définir le nouveau
    const updated = await prisma.address.update({
      where: { id: params.id },
      data: { isDefault: true },
    })

    return response.ok({ message: 'Adresse par défaut mise à jour', address: updated })
  }
}
