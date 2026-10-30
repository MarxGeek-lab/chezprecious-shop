import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

const categories = [
  {
    name: 'Femme',
    slug: 'femme',
    description: 'Mode féminine — robes, vestes, manteaux et plus',
    icon: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    position: 0,
    subCategories: [
      { name: 'Robes & Jupes', slug: 'robes-jupes', description: 'Robes et jupes pour toutes les occasions', icon: 'Shirt', position: 0 },
      { name: 'Hauts & Blouses', slug: 'hauts-blouses', description: 'Tops, chemises et blouses', icon: 'Shirt', position: 1 },
      { name: 'Vestes & Manteaux', slug: 'vestes-manteaux-femme', description: 'Vestes, blazers et manteaux', icon: 'Shirt', position: 2 },
      { name: 'Pantalons & Jeans', slug: 'pantalons-jeans-femme', description: 'Pantalons, jeans et leggings', icon: 'Shirt', position: 3 },
      { name: 'Maillots de bain', slug: 'maillots-bain', description: 'Maillots et combinaisons de plage', icon: 'Waves', position: 4 },
      { name: 'Lingerie', slug: 'lingerie', description: 'Sous-vêtements et lingerie fine', icon: 'Heart', position: 5 },
    ],
  },
  {
    name: 'Homme',
    slug: 'homme',
    description: 'Mode masculine — coupes structurées, matières premium',
    icon: 'Briefcase',
    image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=800',
    position: 1,
    subCategories: [
      { name: 'T-shirts & Polos', slug: 't-shirts-polos', description: 'T-shirts, polos et débardeurs', icon: 'Shirt', position: 0 },
      { name: 'Chemises', slug: 'chemises', description: 'Chemises casual et habillées', icon: 'Shirt', position: 1 },
      { name: 'Vestes & Manteaux', slug: 'vestes-manteaux-homme', description: 'Vestes, blazers et manteaux', icon: 'Shirt', position: 2 },
      { name: 'Pantalons & Jeans', slug: 'pantalons-jeans-homme', description: 'Pantalons, jeans et chinos', icon: 'Shirt', position: 3 },
      { name: 'Pulls & Sweats', slug: 'pulls-sweats', description: 'Pulls, cardigans et sweats', icon: 'Shirt', position: 4 },
      { name: 'Sous-vêtements', slug: 'sous-vetements', description: 'Boxers, slips et chaussettes', icon: 'Package', position: 5 },
    ],
  },
  {
    name: 'Enfant',
    slug: 'enfant',
    description: 'Mode enfant — confort et style pour les petits',
    icon: 'Baby',
    image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800',
    position: 2,
    subCategories: [
      { name: 'Fille', slug: 'enfant-fille', description: 'Vêtements pour filles', icon: 'Heart', position: 0 },
      { name: 'Garçon', slug: 'enfant-garcon', description: 'Vêtements pour garçons', icon: 'Star', position: 1 },
      { name: 'Bébé', slug: 'bebe', description: 'Vêtements pour bébés 0-24 mois', icon: 'Baby', position: 2 },
    ],
  },
  {
    name: 'Chaussures',
    slug: 'chaussures',
    description: 'Chaussures homme, femme et enfant',
    icon: 'Footprints',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    position: 3,
    subCategories: [
      { name: 'Chaussures Femme', slug: 'chaussures-femme', description: 'Escarpins, sneakers, sandales', icon: 'Footprints', position: 0 },
      { name: 'Chaussures Homme', slug: 'chaussures-homme', description: 'Derbies, sneakers, mocassins', icon: 'Footprints', position: 1 },
      { name: 'Chaussures Enfant', slug: 'chaussures-enfant', description: 'Chaussures pour enfants', icon: 'Footprints', position: 2 },
    ],
  },
  {
    name: 'Accessoires',
    slug: 'accessoires',
    description: 'Sacs, ceintures, écharpes et bijoux',
    icon: 'Gem',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
    position: 4,
    subCategories: [
      { name: 'Sacs & Maroquinerie', slug: 'sacs-maroquinerie', description: 'Sacs à main, sacs à dos et pochettes', icon: 'ShoppingBag', position: 0 },
      { name: 'Bijoux', slug: 'bijoux', description: 'Colliers, bracelets, bagues et boucles', icon: 'Gem', position: 1 },
      { name: 'Ceintures & Cravates', slug: 'ceintures-cravates', description: 'Ceintures, cravates et nœuds papillon', icon: 'Package', position: 2 },
      { name: 'Écharpes & Chapeaux', slug: 'echarpes-chapeaux', description: 'Écharpes, chapeaux et bonnets', icon: 'Wind', position: 3 },
      { name: 'Lunettes', slug: 'lunettes', description: 'Lunettes de soleil et montures', icon: 'Glasses', position: 4 },
    ],
  },
  {
    name: 'Sport & Outdoor',
    slug: 'sport-outdoor',
    description: 'Vêtements techniques pour le sport et le plein air',
    icon: 'Dumbbell',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
    position: 5,
    subCategories: [
      { name: 'Fitness & Yoga', slug: 'fitness-yoga', description: 'Leggings, brassières et tenues de sport', icon: 'Dumbbell', position: 0 },
      { name: 'Running', slug: 'running', description: 'Tenues et chaussures de course', icon: 'Footprints', position: 1 },
      { name: 'Outdoor & Randonnée', slug: 'outdoor-randonnee', description: 'Vêtements pour l\'extérieur', icon: 'Mountain', position: 2 },
      { name: 'Sports d\'eau', slug: 'sports-eau', description: 'Maillots et combinaisons nautiques', icon: 'Waves', position: 3 },
    ],
  },
  {
    name: 'Grandes Tailles',
    slug: 'grandes-tailles',
    description: 'Mode inclusive — du 44 au 60',
    icon: 'Users',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    position: 6,
    subCategories: [
      { name: 'Femme Grande Taille', slug: 'femme-grande-taille', description: 'Mode féminine grandes tailles', icon: 'Sparkles', position: 0 },
      { name: 'Homme Grande Taille', slug: 'homme-grande-taille', description: 'Mode masculine grandes tailles', icon: 'Briefcase', position: 1 },
    ],
  },
]

async function main() {
  console.log('🌱 Seeding catégories mode & vêtements...\n')

  for (const cat of categories) {
    const { subCategories: subs, ...catData } = cat
    const created = await prisma.category.upsert({
      where: { slug: catData.slug },
      update: catData,
      create: catData,
    })

    for (const sub of subs) {
      await prisma.subCategory.upsert({
        where: { slug: sub.slug },
        update: { ...sub, categoryId: created.id },
        create: { ...sub, categoryId: created.id },
      })
    }

    console.log(`  ✓ ${created.name} (${subs.length} sous-catégories)`)
  }

  console.log('\n✅ Seed terminé !')
}

main()
  .catch((e) => {
    console.error('❌ Erreur :', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
