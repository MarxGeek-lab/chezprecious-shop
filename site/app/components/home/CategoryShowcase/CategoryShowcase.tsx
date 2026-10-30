"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "@/app/hooks/useCategories";
import styles from "./CategoryShowcase.module.scss";

type Tile = { name: string; href: string; image: string; count?: number };

// Visuels du catalogue (copiés dans les uploads de l'API par le seed produits)
const CATALOGUE = "/uploads/products/catalogue";

const DEFAULT_TILES: Tile[] = [
  { name: "Compléments alimentaires", href: "/shop?cat=complements-alimentaires", image: `${CATALOGUE}/coffrets-sag7-floral.webp` },
  { name: "Soins & beauté", href: "/shop?cat=soins-beaute", image: `${CATALOGUE}/cream7-eclat.webp` },
  { name: "Café & boissons", href: "/shop?cat=cafe-boissons", image: `${CATALOGUE}/royal-coffee-emballage.webp` },
];

// Dernière tuile, toujours présente pour compléter la grille
const ALL_PRODUCTS_TILE: Tile = {
  name: "Toute la boutique",
  href: "/shop",
  image: `${CATALOGUE}/w7-super7-rose-or.webp`,
};

export default function CategoryShowcase() {
  const { data: categories = [] } = useCategories();

  const categoryTiles: Tile[] = categories.length > 0
    ? categories
        .filter((c) => c.isActive)
        .slice(0, 3)
        .map((c, i) => ({
          name: c.name,
          href: `/shop?cat=${c.slug}`,
          image: c.image || DEFAULT_TILES[i % DEFAULT_TILES.length].image,
          count: c.productCount,
        }))
    : DEFAULT_TILES;

  const tiles = [...categoryTiles, ALL_PRODUCTS_TILE];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Nos univers</span>
          <h2 className={styles.title}>Acheter par <em>catégorie</em></h2>
        </div>

        <div className={styles.grid}>
          {tiles.map((tile, i) => (
            <Link key={tile.href} href={tile.href} className={`${styles.tile} ${i === 0 ? styles.tileLarge : ""}`}>
              <Image
                src={tile.image}
                alt={tile.name}
                fill
                className={styles.image}
                sizes={i === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
              />
              <span className={styles.overlay} />
              <span className={styles.label}>
                <span>
                  <strong>{tile.name}</strong>
                  {tile.count !== undefined && <small>{tile.count} produit{tile.count > 1 ? "s" : ""}</small>}
                </span>
                <span className={styles.arrow}><ArrowUpRight size={18} strokeWidth={2} /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
