/**
 * Seed du catalogue ChezPrecious (produits SAG7 International).
 *
 * - copie les images de prisma/seed-assets/products vers public/uploads/products/catalogue
 * - crée / met à jour les catégories et les produits (par slug, donc relançable)
 * - remplace les images de chaque produit à chaque exécution
 *
 * Usage (dans le conteneur de l'API) :
 *   node scripts/seed-products.mjs
 */

import { copyFileSync, mkdirSync, readdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS_DIR = join(root, 'prisma', 'seed-assets', 'products')
const UPLOAD_DIR = join(root, 'public', 'uploads', 'products', 'catalogue')
const UPLOAD_URL = '/uploads/products/catalogue'
const VIDEO_ASSETS_DIR = join(root, 'prisma', 'seed-assets', 'videos')
const VIDEO_UPLOAD_DIR = join(UPLOAD_DIR, 'videos')
const VIDEO_UPLOAD_URL = `${UPLOAD_URL}/videos`

// Numéros affichés dans les publicités
const CONTACT = {
  phoneMain: '01 47 24 06 06',
  phoneWhatsapp: '01 90 30 37 57',
}

// Ordre d'affichage partout (accueil, hero, boutique) : l'API trie par date de
// création décroissante, le premier slug reçoit donc la date la plus récente.
const DISPLAY_ORDER = [
  'eau-alcaline-label-bien-etre',
  'thymoq-huile-de-nigelle',
  'super7-brain-health',
  'women7-w7',
  'men7-m7',
  'royal-coffee-sacha-inchi',
  'cream7-refresh-restore-rejuvenate',
]

// Vidéos publicitaires (fichier sans extension → .mp4 + miniature .jpg)
const VIDEOS = {
  'eau-alcaline': 'Eau alcaline Label Bien-être',
  'thymoq-super7': 'thymoQ + SUPER7',
  'women7-super7': 'WOMEN7 + SUPER7',
  'men7-super7': 'MEN7 + SUPER7',
  'trio-fertilite': 'Trio thymoQ + WOMEN7 + SUPER7',
  'cream7': 'Cream7',
}

const PRODUCT_VIDEOS = {
  'eau-alcaline-label-bien-etre': ['eau-alcaline'],
  'thymoq-huile-de-nigelle': ['thymoq-super7', 'trio-fertilite'],
  'super7-brain-health': ['thymoq-super7', 'women7-super7', 'men7-super7', 'trio-fertilite'],
  'women7-w7': ['women7-super7', 'trio-fertilite'],
  'men7-m7': ['men7-super7'],
  'cream7-refresh-restore-rejuvenate': ['cream7'],
}

// Valeurs par défaut, surchargées produit par produit (price, brand) si besoin
const PRICE = 21000
const STOCK = 50
const BRAND = 'SAG7 International'

const SUPPLEMENT_NOTICE =
  'Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée ni un avis ou un traitement médical. ' +
  'Femmes enceintes ou allaitantes et personnes sous traitement : demandez conseil à votre médecin avant utilisation. ' +
  'Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des enfants.'

// ─── Catégories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    slug: 'complements-alimentaires',
    name: 'Compléments alimentaires',
    description: 'Compléments naturels SAG7 pour l\'énergie, l\'immunité et l\'équilibre au quotidien, dont SUPER7, WOMEN7 et MEN7 aux cellules souches diplexifiées.',
    image: 'coffrets-sag7-floral.webp',
  },
  {
    slug: 'soins-beaute',
    name: 'Soins & beauté',
    description: 'Soins aux ingrédients naturels pour une peau hydratée et lumineuse.',
    image: 'cream7-eclat.webp',
  },
  {
    slug: 'cafe-boissons',
    name: 'Café & boissons',
    description: 'Café premium enrichi et eau alcaline pour une hydratation au quotidien.',
    image: 'royal-coffee-emballage.webp',
  },
]

// ─── Produits ────────────────────────────────────────────────────────────────
// Description : paragraphes séparés par une ligne vide, « ### » pour un titre,
// « - » pour une liste (rendu sur la page produit).

const PRODUCTS = [
  {
    slug: 'super7-brain-health',
    name: 'SUPER7 Brain & Health',
    category: 'complements-alimentaires',
    tags: ['energie', 'immunite', 'concentration', 'antioxydant', 'mixte'],
    isFeatured: true,
    shortDescription:
      'Complément aux cellules souches diplexifiées, en sachets : sel des 7 continents, champignon des neiges et AFA, enrichi en vitamines C et E, pour l\'énergie, la concentration et la vitalité au quotidien.',
    description: `SUPER7 Brain & Health est un complément alimentaire aux cellules souches diplexifiées, en sachets, signé SAG7 International. Sa formule associe le sel « Garam 7 Benua », le champignon des neiges et l'AFA, enrichis en vitamines C et E, avec un prémix de glutathion, miel, dattes, cerise acérola, baies et extrait de grenade.

### Bienfaits
- Protection cellulaire : contribue à lutter contre le stress oxydatif et le vieillissement prématuré des cellules.
- Mémoire et concentration : aide à soutenir les fonctions cognitives au quotidien.
- Énergie et vitalité : contribue à réduire la fatigue et favorise la récupération après l'effort.
- Immunité : aide à soutenir les défenses naturelles, notamment lors des changements de saison.
- Cœur et circulation : contribue au bien-être cardiovasculaire.
- Os et équilibre minéral : le calcium et le magnésium contribuent au maintien d'une ossature normale.
- Beauté de la peau : aide à préserver l'hydratation et l'éclat de la peau.
- Sommeil et équilibre : contribue à un sommeil de qualité et à la détente nerveuse.

### Composition
- Cellules souches diplexifiées
- Garam 7 Benua (sel des 7 continents), champignon des neiges, AFA
- Vitamines C et E, calcium, magnésium
- Glutathion, miel, dattes, cerise acérola, baies, extrait de grenade

### Format
Boîte de 30 sachets de 3 g.

### Précautions
${SUPPLEMENT_NOTICE}`,
    weight: 0.09,
    images: [
      'super7-boite.webp',
      'w7-super7-sachets-verre.webp',
      'thymoq-super7-scene.webp',
      'w7-super7-rose-or.webp',
      'coffrets-sag7-floral.webp',
      'w7-super7-demonstration.webp',
      'thymoq-super7-capsules.webp',
      'coffrets-sag7-couple.webp',
    ],
  },
  {
    slug: 'women7-w7',
    name: 'WOMEN7 (W7) Beauty · Balance · Beyond',
    category: 'complements-alimentaires',
    tags: ['femme', 'equilibre-hormonal', 'beaute', 'bien-etre'],
    isFeatured: true,
    shortDescription:
      'Complément aux cellules souches diplexifiées, en sachets, dédié au bien-être féminin : équilibre hormonal, confort intime, éclat de la peau et vitalité.',
    description: `WOMEN7 (W7) est le complément alimentaire SAG7 International aux cellules souches diplexifiées, pensé pour les femmes. En sachets, enrichi en calcium, magnésium, vitamines et minéraux, il accompagne l'équilibre et la beauté au féminin, à chaque étape de la vie.

### Bienfaits
- Équilibre féminin : contribue à l'équilibre hormonal et au confort du cycle menstruel.
- Confort intime : aide à atténuer la sécheresse intime et favorise le bien-être au quotidien.
- Ménopause : aide à mieux vivre les inconforts liés à la ménopause.
- Circulation : contribue au bien-être cardiovasculaire et à une bonne circulation sanguine.
- Défenses naturelles : aide à soutenir l'immunité.
- Beauté : contribue à unifier le teint, à préserver l'élasticité de la peau et à fortifier les cheveux.

### Composition
- Cellules souches diplexifiées
- Calcium, magnésium
- Vitamines et minéraux

### Format
Boîte de 15 sachets de 3 g.

### Précautions
${SUPPLEMENT_NOTICE}`,
    weight: 0.045,
    images: [
      'women7-boite.webp',
      'w7-super7-sachets-verre.webp',
      'w7-super7-rose-or.webp',
      'w7-super7-demonstration.webp',
      'coffrets-sag7-floral.webp',
      'coffrets-sag7-couple.webp',
    ],
  },
  {
    slug: 'men7-m7',
    name: 'MEN7 (M7) Power · Performance · Protection',
    category: 'complements-alimentaires',
    tags: ['homme', 'energie', 'endurance', 'vitalite'],
    isFeatured: true,
    shortDescription:
      'Complément aux cellules souches diplexifiées, en sachets, pour la vitalité masculine : énergie, endurance, performance et défenses naturelles.',
    description: `MEN7 (M7) est le complément alimentaire SAG7 International aux cellules souches diplexifiées, dédié aux hommes. En sachets, enrichi en calcium, magnésium, vitamines et minéraux, il accompagne l'énergie, l'endurance et la vitalité au quotidien.

### Bienfaits
- Énergie et performance : contribue à la vitalité et à la vigueur au quotidien.
- Vitalité masculine : aide à soutenir le bien-être intime et la vitalité reproductive.
- Endurance et concentration : contribue à l'endurance physique et à la concentration.
- Cœur et circulation : contribue au bien-être cardiovasculaire.
- Défenses naturelles : aide à soutenir l'immunité ; ses antioxydants favorisent la récupération.
- Équilibre émotionnel : aide à mieux gérer le stress et favorise la sérénité.
- Peau et cheveux : contribue à préserver la santé des cheveux et l'hydratation de la peau.

### Composition
- Cellules souches diplexifiées
- Calcium, magnésium
- Vitamines et minéraux

### Format
Boîte de 15 sachets de 3 g.

### Précautions
${SUPPLEMENT_NOTICE}`,
    weight: 0.045,
    images: ['men7-boite.webp'],
  },
  {
    slug: 'thymoq-huile-de-nigelle',
    name: 'thymoQ Huile de nigelle 500 mg',
    category: 'complements-alimentaires',
    tags: ['immunite', 'nigelle', 'omega', 'antioxydant', 'mixte'],
    isFeatured: true,
    shortDescription:
      'Capsules d\'huile de nigelle (Nigella sativa) extraite par CO₂ supercritique, riches en thymoquinone et en oméga 3, 6 et 9.',
    description: `thymoQ réunit en capsules molles l'huile de nigelle (graine noire, Nigella sativa), obtenue par extraction au fluide supercritique (SFE) pour préserver sa richesse en thymoquinone et en oméga 3, 6 et 9. Qualité garantie sans adultération.

### Bienfaits
- Soutien immunitaire : la nigelle contribue au bon fonctionnement des défenses naturelles.
- Confort respiratoire : aide à apaiser la gorge et favorise une respiration plus fluide.
- Action antioxydante : la thymoquinone contribue à protéger les cellules contre le stress oxydatif.
- Apaisement : aide à apaiser les petits inconforts du quotidien.
- Digestion : contribue au confort digestif et aide à réduire les ballonnements.
- Énergie et vitalité : les oméga 3, 6 et 9 contribuent au tonus général et à la récupération.

### Composition
- Huile de nigelle (Nigella sativa) : 500 mg par capsule
- Thymoquinone, oméga 3, oméga 6, oméga 9
- Extraction au fluide supercritique (SFE)

### Format
Boîte de 30 capsules molles.

### Précautions
${SUPPLEMENT_NOTICE}`,
    weight: 0.05,
    images: [
      'thymoq-boite.webp',
      'thymoq-super7-scene.webp',
      'thymoq-super7-capsules.webp',
      'coffrets-sag7-floral.webp',
      'coffrets-sag7-couple.webp',
    ],
  },
  {
    slug: 'cream7-refresh-restore-rejuvenate',
    name: 'Cream7 Refresh · Restore · Rejuvenate',
    category: 'soins-beaute',
    tags: ['peau', 'hydratation', 'eclat', 'soin-visage'],
    isFeatured: true,
    shortDescription:
      'Crème de soin aux ingrédients naturels (aloe vera, jojoba, datte, kigelia) pour une peau hydratée, ferme et lumineuse.',
    description: `Cream7 est le soin SAG7 International qui rafraîchit, restaure et revitalise la peau. Sa texture fondante associe des ingrédients naturels sélectionnés pour hydrater, raffermir et révéler l'éclat du teint.

### Bienfaits
- Hydratation intense : l'aloe vera et le champignon trémelle hydratent et apaisent la peau.
- Protection : l'huile de jojoba nourrit la peau et la protège du dessèchement.
- Fermeté : le kigelia africana contribue à un effet tenseur et raffermissant.
- Éclat : l'extrait de datte et la tourmaline aident à raviver l'éclat du teint.
- Vitalité de la peau : le tongkat ali et la labisia pumila contribuent au tonus et à l'équilibre de la peau.

### Ingrédients clés
- Aloe vera, huile de jojoba, extrait de datte
- Kigelia africana, tongkat ali, labisia pumila
- Champignon trémelle, tourmaline

### Conseils d'utilisation
Appliquer sur une peau propre et sèche, en massant doucement jusqu'à pénétration complète.

### Format
Tube de 30 g.

### Précautions
Usage externe uniquement. Éviter le contact avec les yeux. Faire un essai sur une petite zone de peau avant la première utilisation.`,
    weight: 0.03,
    images: [
      'cream7-coffret.webp',
      'cream7-eclat.webp',
      'cream7-ingredients.webp',
      'cream7-application.webp',
    ],
  },
  {
    slug: 'royal-coffee-sacha-inchi',
    name: 'Royal Coffee Sacha Inchi + Sarang Burung',
    category: 'cafe-boissons',
    tags: ['cafe', 'energie', 'omega', 'antioxydant', 'mixte'],
    isFeatured: true,
    shortDescription:
      'Café premium enrichi au Sacha Inchi et à l\'extrait de nid d\'hirondelle, avec vitamines, minéraux et antioxydants naturels.',
    description: `Royal Coffee est un café premium SAG7 International enrichi au Sacha Inchi et à l'extrait de nid d'hirondelle (Sarang Burung). Un café au goût riche et onctueux qui allie plaisir et bien-être.

### Bienfaits
- Énergie et concentration : le café aide à rester alerte et concentré.
- Oméga 3, 6 et 9 : le Sacha Inchi apporte des acides gras qui contribuent au bien-être cardiovasculaire et à la forme physique.
- Antioxydants naturels : contribuent à protéger les cellules contre le stress oxydatif.
- Vitalité : les vitamines et minéraux contribuent à réduire la fatigue.
- Plaisir au quotidien : une tasse gourmande à savourer chaque jour.

### Composition
- Café premium
- Sacha Inchi, extrait de nid d'hirondelle (Sarang Burung)
- Vitamines, minéraux et antioxydants naturels

### Format
Paquet de café en sachets individuels.

### Précautions
Contient de la caféine : déconseillé aux enfants et aux femmes enceintes ou allaitantes.`,
    weight: null,
    images: ['royal-coffee-emballage.webp'],
  },
  {
    slug: 'eau-alcaline-label-bien-etre',
    name: 'Eau alcaline Label Bien-être pH 8+ (9 × 1,5 L)',
    category: 'cafe-boissons',
    brand: 'Label Bien-être',
    price: 5000,
    tags: ['eau', 'hydratation', 'alcaline', 'mixte'],
    isFeatured: true,
    shortDescription:
      'Eau alcaline naturelle pH 8+, riche en minéraux et faible en sodium, pour une hydratation quotidienne de toute la famille.',
    description: `Label Bien-être est une eau alcaline « source de vie » au pH de 8 et plus. Riche en minéraux naturels et faible en sodium, elle accompagne l'hydratation de toute la famille, au quotidien comme pendant l'effort.

### Bienfaits
- Hydratation quotidienne : idéale pour boire tout au long de la journée et après l'effort.
- Équilibre acido-basique : son pH 8+ contribue à un bon équilibre acido-basique.
- Minéraux naturels : apporte des minéraux qui participent au bien-être de l'organisme.
- Action antioxydante : aide à protéger l'organisme contre le stress oxydatif.
- Pour toute la famille : faible teneur en sodium, elle convient à tous les âges.

### Caractéristiques
- Eau alcaline, pH 8+
- Riche en minéraux naturels
- Faible teneur en sodium

### Format
Carton de 9 bouteilles de 1,5 L.

### Conservation
À conserver à l'abri de la lumière et de la chaleur. Après ouverture, à consommer rapidement.`,
    weight: 13.5,
    images: [
      'eau-alcaline-carton.webp',
      'eau-alcaline-bouteille.webp',
      'eau-alcaline-eclaboussure.webp',
    ],
  },
]

// ─── Exécution ───────────────────────────────────────────────────────────────

function copyAssets() {
  mkdirSync(UPLOAD_DIR, { recursive: true })
  const files = readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.webp'))
  for (const file of files) copyFileSync(join(ASSETS_DIR, file), join(UPLOAD_DIR, file))

  mkdirSync(VIDEO_UPLOAD_DIR, { recursive: true })
  for (const file of readdirSync(VIDEO_ASSETS_DIR)) {
    copyFileSync(join(VIDEO_ASSETS_DIR, file), join(VIDEO_UPLOAD_DIR, file))
  }
  return new Set(files)
}

async function main() {
  const available = copyAssets()
  for (const p of PRODUCTS) {
    for (const img of p.images) {
      if (!available.has(img)) throw new Error(`Image manquante pour ${p.slug} : ${img}`)
    }
  }
  console.log(`🖼️  ${available.size} images copiées dans ${UPLOAD_URL}`)

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    await client.query('BEGIN')

    for (const [position, c] of CATEGORIES.entries()) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, image, position, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name, description = EXCLUDED.description, image = EXCLUDED.image,
               position = EXCLUDED.position, is_active = true, updated_at = NOW()`,
        [randomUUID(), c.name, c.slug, c.description, `${UPLOAD_URL}/${c.image}`, position]
      )
    }
    console.log(`📂 ${CATEGORIES.length} catégories prêtes`)

    // Coordonnées affichées au footer et sur la page contact
    await client.query(
      `UPDATE site_settings SET phone_main = $1, phone_whatsapp = $2, updated_at = NOW()`,
      [CONTACT.phoneMain, CONTACT.phoneWhatsapp]
    )
    console.log(`📞 Téléphone ${CONTACT.phoneMain} · WhatsApp ${CONTACT.phoneWhatsapp}`)

    for (const p of PRODUCTS) {
      const { rows } = await client.query(
        `INSERT INTO products (id, name, slug, short_description, description, category, brand,
                               price, tax_rate, stock, low_stock_threshold, track_inventory,
                               weight, tags, status, is_featured, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, 5, true, $10, $11, 'ACTIVE', $12, NOW() - make_interval(mins => $13), NOW())
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name, short_description = EXCLUDED.short_description,
               description = EXCLUDED.description, category = EXCLUDED.category, brand = EXCLUDED.brand,
               price = EXCLUDED.price, tax_rate = EXCLUDED.tax_rate, weight = EXCLUDED.weight,
               tags = EXCLUDED.tags, status = 'ACTIVE', is_featured = EXCLUDED.is_featured, 
               created_at = EXCLUDED.created_at, updated_at = NOW()
         RETURNING id`,
        [
          randomUUID(), p.name, p.slug, p.shortDescription, p.description, p.category, p.brand ?? BRAND,
          p.price ?? PRICE, STOCK, p.weight, p.tags, p.isFeatured,
          DISPLAY_ORDER.indexOf(p.slug),
        ]
      )
      const productId = rows[0].id

      await client.query('DELETE FROM product_images WHERE product_id = $1', [productId])
      for (const [i, img] of p.images.entries()) {
        await client.query(
          `INSERT INTO product_images (id, product_id, url, alt, position, is_primary, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [randomUUID(), productId, `${UPLOAD_URL}/${img}`, `${p.name} — visuel ${i + 1}`, i, i === 0]
        )
      }
      await client.query('DELETE FROM product_videos WHERE product_id = $1', [productId])
      const videos = PRODUCT_VIDEOS[p.slug] ?? []
      for (const [i, file] of videos.entries()) {
        await client.query(
          `INSERT INTO product_videos (id, product_id, url, source, thumbnail, title, position, created_at)
           VALUES ($1, $2, $3, 'upload', $4, $5, $6, NOW())`,
          [randomUUID(), productId, `${VIDEO_UPLOAD_URL}/${file}.mp4`, `${VIDEO_UPLOAD_URL}/${file}.jpg`, VIDEOS[file], i]
        )
      }
      console.log(`✅ ${p.name} (${p.images.length} image${p.images.length > 1 ? 's' : ''}, ${videos.length} vidéo${videos.length > 1 ? 's' : ''})`)
    }

    await client.query('COMMIT')
    console.log(`\n🌱 Catalogue prêt : ${PRODUCTS.length} produits`)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error('❌ Seed interrompu :', e.message)
  process.exit(1)
})
