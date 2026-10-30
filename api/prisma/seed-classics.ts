import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Chemin relatif — l'API préfixe automatiquement APP_URL à la réponse
const BASE = '/uploads'

const classics = [
  {
    slug: 'tshirt-signature-ivoire',
    name: 'T-Shirt Signature — Ivoire',
    shortDescription: 'Le t-shirt essentiel Chez Precious en coton premium, coupe oversize, broderie signature.',
    description: 'Le t-shirt fondateur de la maison Chez Precious. Confectionné dans un coton 280g/m² oversize, il arbore la broderie signature Chez Precious sur la poitrine gauche. Coloris ivoire chaud, intemporel par définition.',
    category: 'T-Shirts',
    subCategory: 'Hauts & Blouses',
    brand: 'Chez Precious',
    condition: 'NEW' as const,
    price: 25000,
    comparePrice: null,
    stock: 100,
    status: 'ACTIVE' as const,
    isFeatured: true,
    tags: ['tshirt', 'signature', 'classique', 'collection-permanente', 'homme', 'unisexe'],
    images: [
      { url: `${BASE}/products/tshirt-ivoire.jpg`, alt: 'T-Shirt Signature Ivoire — Chez Precious', position: 0, isPrimary: true },
    ],
    variants: [
      { combination: { Couleur: 'Ivoire', Taille: 'S' },  price: 25000, stock: 20 },
      { combination: { Couleur: 'Ivoire', Taille: 'M' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Ivoire', Taille: 'L' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Ivoire', Taille: 'XL' }, price: 25000, stock: 20 },
    ],
  },
  {
    slug: 'tshirt-signature-blanc',
    name: 'T-Shirt Signature — Blanc',
    shortDescription: 'T-shirt Chez Precious en coton premium oversize, logo brodé doré sur blanc immaculé.',
    description: 'La version blanc pur du t-shirt signature Chez Precious. Broderie logo doré sur fond blanc immaculé. Coton 280g/m² oversize pour un confort optimal et une silhouette moderne.',
    category: 'T-Shirts',
    subCategory: 'Hauts & Blouses',
    brand: 'Chez Precious',
    condition: 'NEW' as const,
    price: 25000,
    comparePrice: null,
    stock: 100,
    status: 'ACTIVE' as const,
    isFeatured: true,
    tags: ['tshirt', 'signature', 'classique', 'collection-permanente', 'homme', 'unisexe'],
    images: [
      { url: `${BASE}/products/tshirt-blanc.jpg`, alt: 'T-Shirt Signature Blanc — Chez Precious', position: 0, isPrimary: true },
    ],
    variants: [
      { combination: { Couleur: 'Blanc', Taille: 'S' },  price: 25000, stock: 20 },
      { combination: { Couleur: 'Blanc', Taille: 'M' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Blanc', Taille: 'L' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Blanc', Taille: 'XL' }, price: 25000, stock: 20 },
    ],
  },
  {
    slug: 'tshirt-signature-noir-gold',
    name: 'T-Shirt Signature — Noir / Or',
    shortDescription: 'T-shirt Chez Precious noir oversize, logo brodé doré — l\'alliance du luxe et de la sobriété.',
    description: 'Le classique absolu : noir profond, broderie or. Ce t-shirt signature Chez Precious en coton 280g/m² oversize conjugue sobriété et prestige. Le logo brodé or sur la poitrine fait de chaque pièce une déclaration.',
    category: 'T-Shirts',
    subCategory: 'Hauts & Blouses',
    brand: 'Chez Precious',
    condition: 'NEW' as const,
    price: 28000,
    comparePrice: null,
    stock: 100,
    status: 'ACTIVE' as const,
    isFeatured: true,
    tags: ['tshirt', 'signature', 'classique', 'collection-permanente', 'homme', 'unisexe', 'premium'],
    images: [
      { url: `${BASE}/products/tshirt-noir-gold.jpg`, alt: 'T-Shirt Signature Noir Or — Chez Precious', position: 0, isPrimary: true },
    ],
    variants: [
      { combination: { Couleur: 'Noir / Or', Taille: 'S' },  price: 28000, stock: 20 },
      { combination: { Couleur: 'Noir / Or', Taille: 'M' },  price: 28000, stock: 30 },
      { combination: { Couleur: 'Noir / Or', Taille: 'L' },  price: 28000, stock: 30 },
      { combination: { Couleur: 'Noir / Or', Taille: 'XL' }, price: 28000, stock: 20 },
    ],
  },
  {
    slug: 'tshirt-signature-noir-blanc',
    name: 'T-Shirt Signature — Noir / Blanc',
    shortDescription: 'T-shirt Chez Precious noir oversize, logo brodé blanc — minimalisme à l\'état pur.',
    description: 'Noir et blanc, le duo intemporel. Ce t-shirt signature Chez Precious en coton 280g/m² oversize arbore le logo Chez Precious brodé en blanc sur fond noir. Discret et impactant à la fois.',
    category: 'T-Shirts',
    subCategory: 'Hauts & Blouses',
    brand: 'Chez Precious',
    condition: 'NEW' as const,
    price: 25000,
    comparePrice: null,
    stock: 100,
    status: 'ACTIVE' as const,
    isFeatured: true,
    tags: ['tshirt', 'signature', 'classique', 'collection-permanente', 'homme', 'unisexe'],
    images: [
      { url: `${BASE}/products/tshirt-noir-white.jpg`, alt: 'T-Shirt Signature Noir Blanc — Chez Precious', position: 0, isPrimary: true },
    ],
    variants: [
      { combination: { Couleur: 'Noir / Blanc', Taille: 'S' },  price: 25000, stock: 20 },
      { combination: { Couleur: 'Noir / Blanc', Taille: 'M' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Noir / Blanc', Taille: 'L' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Noir / Blanc', Taille: 'XL' }, price: 25000, stock: 20 },
    ],
  },
  {
    slug: 'tshirt-signature-noir-outline',
    name: 'T-Shirt Signature — Noir / Outline',
    shortDescription: 'T-shirt Chez Precious noir oversize, logo outline blanc — édition graphique.',
    description: 'L\'édition la plus graphique de la collection permanente Chez Precious. Logo outline en blanc sur noir intense. Coton 280g/m² oversize pour un confort maximum et une présence affirmée.',
    category: 'T-Shirts',
    subCategory: 'Hauts & Blouses',
    brand: 'Chez Precious',
    condition: 'NEW' as const,
    price: 25000,
    comparePrice: null,
    stock: 100,
    status: 'ACTIVE' as const,
    isFeatured: true,
    tags: ['tshirt', 'signature', 'classique', 'collection-permanente', 'homme', 'unisexe'],
    images: [
      { url: `${BASE}/products/tshirt-noir-outline.jpg`, alt: 'T-Shirt Signature Noir Outline — Chez Precious', position: 0, isPrimary: true },
    ],
    variants: [
      { combination: { Couleur: 'Noir / Outline', Taille: 'S' },  price: 25000, stock: 20 },
      { combination: { Couleur: 'Noir / Outline', Taille: 'M' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Noir / Outline', Taille: 'L' },  price: 25000, stock: 30 },
      { combination: { Couleur: 'Noir / Outline', Taille: 'XL' }, price: 25000, stock: 20 },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding collection permanente Chez Precious...\n')

  for (const p of classics) {
    const { images, variants, ...productData } = p

    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        ...productData,
        price: productData.price,
        comparePrice: productData.comparePrice ?? undefined,
      },
      create: {
        ...productData,
        price: productData.price,
        comparePrice: productData.comparePrice ?? undefined,
      },
    })

    await prisma.productImage.deleteMany({ where: { productId: product.id } })
    await prisma.productImage.createMany({
      data: images.map((img) => ({ ...img, productId: product.id })),
    })

    await prisma.productVariant.deleteMany({ where: { productId: product.id } })
    await prisma.productVariant.createMany({
      data: variants.map((v) => ({
        productId: product.id,
        combination: v.combination,
        price: v.price,
        stock: v.stock,
        isActive: v.stock > 0,
      })),
    })

    console.log(`  ✓ ${product.name}`)
  }

  console.log('\n✅ Collection permanente seedée !')
}

main()
  .catch((e) => { console.error('❌ Erreur :', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
