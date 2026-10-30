// ─── Types ───────────────────────────────────────────────────────────────────

export type VariantType = "color" | "size";

export interface VariantOption {
  label: string;
  value: string;
  hex?: string;
  inStock: boolean;
}

export interface Variant {
  type: VariantType;
  label: string;
  options: VariantOption[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceOld?: number;
  images: string[];
  badge?: string;
  href: string;
  category: string;
  gender?: "femme" | "homme" | "unisexe";
  description?: string;
  variants?: Variant[];
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
}

// ─── Catalogue ───────────────────────────────────────────────────────────────

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "veste-structuree",
    name: "Veste structurée",
    price: 189,
    badge: "Nouveau",
    href: "/product/veste-structuree",
    category: "Vestes",
    gender: "femme",
    description: "Veste tailleur minimaliste, coupe ajustée et structurée.",
    rating: 4.8,
    reviewCount: 142,
    soldCount: 320,
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80",
      "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800&q=80",
      "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Ivoire", value: "ivory", hex: "#F4F1EC", inStock: true },
          { label: "Camel", value: "camel", hex: "#C19A6B", inStock: false },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: false },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
  {
    id: "2",
    slug: "pantalon-epure",
    name: "Pantalon épuré",
    price: 129,
    priceOld: 159,
    badge: "Soldes",
    href: "/product/pantalon-epure",
    category: "Pantalons",
    gender: "femme",
    description: "Pantalon droit, taille haute, tombé parfait.",
    rating: 4.6,
    reviewCount: 89,
    soldCount: 210,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Gris", value: "grey", hex: "#6B6B6B", inStock: true },
          { label: "Beige", value: "beige", hex: "#D4C5A9", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "34", value: "34", inStock: false },
          { label: "36", value: "36", inStock: true },
          { label: "38", value: "38", inStock: true },
          { label: "40", value: "40", inStock: true },
          { label: "42", value: "42", inStock: true },
          { label: "44", value: "44", inStock: false },
        ],
      },
    ],
  },
  {
    id: "3",
    slug: "chemise-oversize",
    name: "Chemise oversize",
    price: 99,
    href: "/product/chemise-oversize",
    category: "Chemises",
    gender: "unisexe",
    description: "Chemise oversize en coton premium, col classique.",
    rating: 4.7,
    reviewCount: 203,
    soldCount: 490,
    images: [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80",
      "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=800&q=80",
      "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Blanc", value: "white", hex: "#FFFFFF", inStock: true },
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Bleu ciel", value: "sky", hex: "#7EC8E3", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: false },
        ],
      },
    ],
  },
  {
    id: "4",
    slug: "manteau-long",
    name: "Manteau long",
    price: 249,
    badge: "Nouveau",
    href: "/product/manteau-long",
    category: "Manteaux",
    gender: "femme",
    description: "Manteau long en laine mélangée, coupe droite élégante.",
    rating: 4.9,
    reviewCount: 67,
    soldCount: 145,
    images: [
      "https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800&q=80",
      "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Camel", value: "camel", hex: "#C19A6B", inStock: true },
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Gris anthracite", value: "anthracite", hex: "#3D3D3D", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: false },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
  {
    id: "5",
    slug: "pull-col-roule",
    name: "Pull col roulé",
    price: 89,
    href: "/product/pull-col-roule",
    category: "Pulls",
    gender: "unisexe",
    description: "Pull col roulé en cachemire doux, coupe slim.",
    rating: 4.5,
    reviewCount: 311,
    soldCount: 680,
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80",
      "https://images.unsplash.com/photo-1614093302611-8efc5dd4f621?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Crème", value: "cream", hex: "#F5F0E8", inStock: true },
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Bordeaux", value: "bordeaux", hex: "#6D1A36", inStock: true },
          { label: "Taupe", value: "taupe", hex: "#8B7D6B", inStock: false },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
  {
    id: "6",
    slug: "robe-midi",
    name: "Robe midi",
    price: 149,
    priceOld: 179,
    badge: "Soldes",
    href: "/product/robe-midi",
    category: "Robes",
    gender: "femme",
    description: "Robe midi à coupe fluide, tissu satiné léger.",
    rating: 4.7,
    reviewCount: 178,
    soldCount: 390,
    images: [
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Ivoire", value: "ivory", hex: "#F4F1EC", inStock: true },
          { label: "Taupe", value: "taupe", hex: "#8B7D6B", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "34", value: "34", inStock: true },
          { label: "36", value: "36", inStock: true },
          { label: "38", value: "38", inStock: true },
          { label: "40", value: "40", inStock: false },
          { label: "42", value: "42", inStock: true },
        ],
      },
    ],
  },
  {
    id: "7",
    slug: "blazer-croise",
    name: "Blazer croisé",
    price: 219,
    href: "/product/blazer-croise",
    category: "Vestes",
    gender: "homme",
    description: "Blazer croisé en laine vierge, double boutonnage.",
    rating: 4.8,
    reviewCount: 94,
    soldCount: 230,
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Gris", value: "grey", hex: "#6B6B6B", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: false },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
  {
    id: "8",
    slug: "jupe-plissee",
    name: "Jupe plissée",
    price: 109,
    badge: "Nouveau",
    href: "/product/jupe-plissee",
    category: "Jupes",
    gender: "femme",
    description: "Jupe plissée mi-longue, taille élastiquée.",
    rating: 4.4,
    reviewCount: 56,
    soldCount: 120,
    images: [
      "https://images.unsplash.com/photo-1583496661160-fb5218afa5e9?w=800&q=80",
      "https://images.unsplash.com/photo-1592301933927-35b597393c0a?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Beige", value: "beige", hex: "#D4C5A9", inStock: true },
          { label: "Bordeaux", value: "bordeaux", hex: "#6D1A36", inStock: false },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "34", value: "34", inStock: true },
          { label: "36", value: "36", inStock: true },
          { label: "38", value: "38", inStock: true },
          { label: "40", value: "40", inStock: true },
          { label: "42", value: "42", inStock: false },
        ],
      },
    ],
  },
  {
    id: "9",
    slug: "trench-coat",
    name: "Trench coat classique",
    price: 279,
    priceOld: 329,
    badge: "Soldes",
    href: "/product/trench-coat",
    category: "Manteaux",
    gender: "unisexe",
    description: "Trench coat intemporel, ceinture à nouer, doublure premium.",
    rating: 4.9,
    reviewCount: 201,
    soldCount: 510,
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
      "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Camel", value: "camel", hex: "#C19A6B", inStock: true },
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
  {
    id: "10",
    slug: "costume-deux-pieces",
    name: "Costume deux pièces",
    price: 349,
    badge: "Nouveau",
    href: "/product/costume-deux-pieces",
    category: "Costumes",
    gender: "homme",
    description: "Costume slim fit en laine italienne, veste et pantalon coordonnés.",
    rating: 4.9,
    reviewCount: 38,
    soldCount: 90,
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80",
      "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Gris anthracite", value: "anthracite", hex: "#3D3D3D", inStock: true },
          { label: "Marine", value: "navy", hex: "#1B2A4A", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: false },
        ],
      },
    ],
  },
  {
    id: "11",
    slug: "debardeur-soie",
    name: "Débardeur en soie",
    price: 79,
    priceOld: 99,
    badge: "Soldes",
    href: "/product/debardeur-soie",
    category: "Tops",
    gender: "femme",
    description: "Débardeur en soie naturelle, tombé fluide et lumineux.",
    rating: 4.6,
    reviewCount: 124,
    soldCount: 280,
    images: [
      "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=800&q=80",
      "https://images.unsplash.com/photo-1485231183945-fffde7f6b1bf?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Ivoire", value: "ivory", hex: "#F4F1EC", inStock: true },
          { label: "Noir", value: "black", hex: "#0A0A0A", inStock: true },
          { label: "Or rose", value: "rosegold", hex: "#C9947A", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "XS", value: "xs", inStock: true },
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: false },
        ],
      },
    ],
  },
  {
    id: "12",
    slug: "pardessus-cachemire",
    name: "Pardessus cachemire",
    price: 399,
    href: "/product/pardessus-cachemire",
    category: "Manteaux",
    gender: "homme",
    description: "Pardessus en pur cachemire, coupe droite, longueur genou.",
    rating: 5.0,
    reviewCount: 22,
    soldCount: 55,
    images: [
      "https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=800&q=80",
      "https://images.unsplash.com/photo-1614251056798-0a63eda2bb25?w=800&q=80",
    ],
    variants: [
      {
        type: "color",
        label: "Couleur",
        options: [
          { label: "Camel", value: "camel", hex: "#C19A6B", inStock: true },
          { label: "Gris clair", value: "lightgrey", hex: "#C4C4C4", inStock: true },
        ],
      },
      {
        type: "size",
        label: "Taille",
        options: [
          { label: "S", value: "s", inStock: true },
          { label: "M", value: "m", inStock: true },
          { label: "L", value: "l", inStock: true },
          { label: "XL", value: "xl", inStock: true },
        ],
      },
    ],
  },
];

// ─── Sélections thématiques ───────────────────────────────────────────────────

export const FEATURED_PRODUCTS = PRODUCTS.slice(0, 4);

export const FLASH_SALE_PRODUCTS = PRODUCTS.filter((p) => p.badge === "Soldes");

export const NEW_ARRIVALS = PRODUCTS.filter((p) => p.badge === "Nouveau");

export const BEST_SELLERS = [...PRODUCTS]
  .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0))
  .slice(0, 6);

export const RECOMMENDED_PRODUCTS = [...PRODUCTS]
  .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  .slice(0, 8);

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getProductsByGender(gender: "femme" | "homme" | "unisexe"): Product[] {
  return PRODUCTS.filter((p) => p.gender === gender || p.gender === "unisexe");
}

export const CATEGORIES = [...new Set(PRODUCTS.map((p) => p.category))];
