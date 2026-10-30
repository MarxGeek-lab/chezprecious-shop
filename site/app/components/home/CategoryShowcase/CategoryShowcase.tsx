"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useCategories } from "@/app/hooks/useCategories";
import styles from "./CategoryShowcase.module.scss";

type Tile = { name: string; href: string; image: string; count?: number };

// Visuels de repli tant que les catégories n'ont pas d'image dans l'admin
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1000&q=80",
  "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
];

const DEFAULT_TILES: Tile[] = [
  { name: "Femme", href: "/shop?cat=femme", image: FALLBACK_IMAGES[0] },
  { name: "Homme", href: "/shop?cat=homme", image: FALLBACK_IMAGES[1] },
  { name: "Nouveautés", href: "/shop?filter=new", image: FALLBACK_IMAGES[2] },
  { name: "Toute la boutique", href: "/shop", image: FALLBACK_IMAGES[3] },
];

export default function CategoryShowcase() {
  const { data: categories = [] } = useCategories();

  const tiles: Tile[] = categories.length > 0
    ? categories
        .filter((c) => c.isActive)
        .slice(0, 4)
        .map((c, i) => ({
          name: c.name,
          href: `/shop?cat=${c.slug}`,
          image: c.image || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length],
          count: c.productCount,
        }))
    : DEFAULT_TILES;

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
                  {tile.count !== undefined && <small>{tile.count} article{tile.count > 1 ? "s" : ""}</small>}
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
