import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Remettre les URLs absolues IP en chemins relatifs
  const images = await prisma.productImage.findMany({
    where: { url: { contains: '192.168.1.79' } }
  })
  console.log(`Images à corriger: ${images.length}`)
  for (const img of images) {
    const newUrl = img.url.replace(/^https?:\/\/[^/]+/, '')
    await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } })
    console.log(' ✓', img.url, '→', newUrl)
  }
  console.log('Done.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
