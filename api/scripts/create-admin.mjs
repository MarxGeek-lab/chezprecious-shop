/**
 * Crée le compte super admin dans la table `admins` (si absent).
 * Version JS pure de prisma/seed-admin.ts, utilisable dans l'image Docker.
 *
 * Usage :
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.mjs
 */

import { randomUUID } from 'node:crypto'
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
import pg from 'pg'

const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_NAME || 'Super Admin'

if (!email || !password || password.length < 12) {
  console.error('❌ ADMIN_EMAIL et ADMIN_PASSWORD (12 caractères min.) sont requis')
  process.exit(1)
}

// Mêmes paramètres que config/hash.ts, pour que hash.verify() reconnaisse le mot de passe
const hasher = new Scrypt({ cost: 16384, blockSize: 8, parallelization: 1, maxMemory: 33554432 })
const hashPassword = (value) => hasher.make(value)

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  const existing = await client.query('SELECT id FROM admins WHERE email = $1', [email])
  if (existing.rowCount > 0) {
    console.log(`✅ Admin déjà existant : ${email}`)
  } else {
    await client.query(
      `INSERT INTO admins (id, email, full_name, password, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', true, NOW(), NOW())`,
      [randomUUID(), email, fullName, await hashPassword(password)]
    )
    console.log(`✅ Super admin créé : ${email}`)
  }
} finally {
  await client.end()
}
