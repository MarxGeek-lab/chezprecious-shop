/**
 * Script pour créer le compte super admin par défaut dans la table `admins`
 *
 * Usage: npx tsx prisma/seed-admin.ts
 */

import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { scrypt, randomBytes } from 'node:crypto'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

/**
 * Hash compatible avec AdonisJS @adonisjs/core hash (scrypt driver)
 * Format: $scrypt$N=16384,r=8,p=1$<salt>$<hash>
 */
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const N = 16384
  const r = 8
  const p = 1
  const keylen = 64

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, { N, r, p }, (err, key) => {
      if (err) reject(err)
      else resolve(key)
    })
  })

  return `$scrypt$N=${N},r=${r},p=${p}$${salt}$${derivedKey.toString('hex')}`
}

async function main() {
  const email = 'admin@marketplace.com'
  const password = 'Admin@123456'
  const fullName = 'Super Admin'

  console.log('🔧 Création du super admin par défaut...\n')

  const existing = await prisma.admin.findUnique({ where: { email } })

  if (existing) {
    console.log(`✅ Admin déjà existant : ${email}`)
    console.log(`   ID       : ${existing.id}`)
    console.log(`   Nom      : ${existing.fullName}`)
    console.log(`   Rôle     : ${existing.role}`)
    console.log(`   Actif    : ${existing.isActive}`)
    return
  }

  const hashedPassword = await hashPassword(password)

  const admin = await prisma.admin.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  })

  console.log('✅ Super admin créé avec succès !\n')
  console.log(`   ID       : ${admin.id}`)
  console.log(`   Email    : ${admin.email}`)
  console.log(`   Nom      : ${admin.fullName}`)
  console.log(`   Rôle     : ${admin.role}`)
  console.log(`   Password : ${password}  ← à changer en production !`)
  console.log('\n⚠️  Pensez à changer le mot de passe après la première connexion !\n')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error('❌ Erreur :', e)
    prisma.$disconnect()
    process.exit(1)
  })
