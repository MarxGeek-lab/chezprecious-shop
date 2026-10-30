import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import hash from '@adonisjs/core/services/hash'
import prisma from '#services/prisma_service'

/**
 * Commande pour créer un compte super admin dans la table admins
 *
 * Usage:
 *   node ace make:admin
 *   node ace make:admin --email=admin@test.com --password=monMotDePasse
 */
export default class MakeAdmin extends BaseCommand {
  static commandName = 'make:admin'
  static description = 'Créer un super administrateur dans la table admins'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: "Email de l'admin", default: 'admin@marketplace.com' })
  declare email: string

  @flags.string({ description: 'Mot de passe (min 6 caractères)', default: 'Admin@123456' })
  declare password: string

  @flags.string({ description: 'Nom complet', default: 'Super Admin' })
  declare name: string

  @flags.boolean({ description: 'Forcer la mise à jour si l\'admin existe déjà' })
  declare force: boolean

  async run() {
    const existing = await prisma.admin.findUnique({ where: { email: this.email } })

    if (existing && !this.force) {
      this.logger.warning(`L'admin ${this.email} existe déjà (utilisez --force pour mettre à jour)`)
      return
    }

    const hashedPassword = await hash.make(this.password)

    if (existing) {
      await prisma.admin.update({
        where: { id: existing.id },
        data: { password: hashedPassword, isActive: true },
      })
      this.logger.success(`Mot de passe mis à jour pour ${this.email}`)
      return
    }

    const admin = await prisma.admin.create({
      data: {
        email: this.email,
        fullName: this.name,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    })

    this.logger.success('Super admin créé avec succès !')
    this.logger.info(`  Email    : ${admin.email}`)
    this.logger.info(`  Nom      : ${admin.fullName}`)
    this.logger.info(`  Password : ${this.password}`)
    this.logger.warning('  Changez le mot de passe après la première connexion !')
  }
}
