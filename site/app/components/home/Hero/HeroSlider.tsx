"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf } from "lucide-react";
import { useFeaturedProducts } from "@/app/hooks/useHomepage";
import { formatPrice } from "@/app/utils/format";
import styles from "./Hero.module.scss";

const INTERVAL_MS = 3500;

// Carrousel des produits phares, affiché à droite du hero
export default function HeroSlider() {
  const { data = [], isLoading } = useFeaturedProducts(8);
  const products = data.filter((p) => p.images?.length > 0);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || products.length < 2) return;
    const id = setInterval(() => setCurrent((i) => (i + 1) % products.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, products.length]);

  if (isLoading || products.length === 0) {
    return <div className={`${styles.slider} ${styles.sliderSkeleton}`} aria-hidden />;
  }

  const active = products[current % products.length];

  return (
    <div
      className={styles.slider}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.sliderStage}>
        {products.map((p, i) => {
          const img = p.images.find((im) => im.isPrimary) ?? p.images[0];
          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className={`${styles.slide} ${i === current % products.length ? styles.slideActive : ""}`}
              aria-hidden={i !== current % products.length}
              tabIndex={i === current % products.length ? 0 : -1}
            >
              <Image
                src={img.url}
                alt={p.name}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 90vw, 45vw"
              />
            </Link>
          );
        })}
      </div>

      <Link href={`/product/${active.slug}`} className={styles.floatCard} key={active.id}>
        <span className={styles.floatIcon}><Leaf size={18} strokeWidth={2} /></span>
        <span className={styles.floatText}>
          <strong>{active.name}</strong>
          <small>{formatPrice(active.price)}</small>
        </span>
        <ArrowRight size={18} strokeWidth={2} className={styles.floatArrow} />
      </Link>

      {products.length > 1 && (
        <div className={styles.sliderDots}>
          {products.map((p, i) => (
            <button
              key={p.id}
              className={`${styles.sliderDot} ${i === current % products.length ? styles.sliderDotActive : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Voir ${p.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
