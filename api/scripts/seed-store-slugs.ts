/**
 * Backfill : génère le slug pour chaque boutique qui n'en a pas.
 * Format : <mots-du-name-en-kebab-case>-<4 derniers caractères de l'id>
 * Exemple : "Ma Super Boutique" + id "...abcd1234" → "ma-super-boutique-1234"
 *
 * Usage (depuis le dossier api/) : npx tsx scripts/seed-store-slugs.ts
 */

import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) throw new Error('DATABASE_URL manquant dans .env')

const adapter = new PrismaPg({ connectionString: DATABASE_URL })
const prisma = new PrismaClient({ adapter } as any)

function toSlug(name: string, id: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[^a-z0-9\s-]/g, '')    // retire les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-')            // espaces → tirets
    .replace(/-+/g, '-')             // tirets multiples → un seul

  // 4 derniers caractères alphanumériques de l'id (sans les tirets UUID)
  const suffix = id.replace(/-/g, '').slice(-4)

  return `${base}-${suffix}`
}

async function main() {
  const stores = await (prisma as any).store.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  })

  console.log(`Boutiques sans slug : ${stores.length}`)

  for (const store of stores as { id: string; name: string }[]) {
    let slug = toSlug(store.name, store.id)

    // Vérifie l'unicité, ajoute un suffixe si collision (rare)
    const exists = await (prisma as any).store.findUnique({ where: { slug } })
    if (exists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    await (prisma as any).store.update({ where: { id: store.id }, data: { slug } })
    console.log(`  ✓ "${store.name}" → ${slug}`)
  }

  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect())
