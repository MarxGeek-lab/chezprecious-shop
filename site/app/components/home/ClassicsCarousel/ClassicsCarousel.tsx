"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Heart } from "lucide-react";
import { usePublicProducts } from "@/app/hooks/useProducts";
import { useCart } from "@/app/store/cartStore";
import { useWishlist } from "@/app/context/WishlistContext";
import type { ApiProduct } from "@/app/lib/api";
import styles from "./ClassicsCarousel.module.scss";

const AUTOPLAY_MS = 3200;

function ClassicCard({ product }: { product: ApiProduct }) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);
  const img = product.images?.[0]?.url ?? "";

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ productId: product.id, name: product.name, price: product.price, image: img, quantity: 1 });
  };
  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product as any);
  };

  return (
    <Link href={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.imgWrap}>
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name} className={styles.img} />
        )}
        <button
          className={`${styles.wishBtn} ${inWishlist ? styles.wishBtnActive : ""}`}
          onClick={handleWishlist}
          aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={14} strokeWidth={inWishlist ? 0 : 1.5} fill={inWishlist ? "currentColor" : "none"} />
        </button>
        <button className={styles.cartBtn} onClick={handleCart} aria-label="Ajouter au panier">
          <ShoppingBag size={13} strokeWidth={1.5} />
          Ajouter au panier
        </button>
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{product.name}</p>
        <p className={styles.price}>{product.price.toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</p>
      </div>
    </Link>
  );
}

export default function ClassicsCarousel() {
  const { data, isLoading } = usePublicProducts({
    limit: 20,
    sort: "newest",
    category: "T-Shirts",
  });

  const products: ApiProduct[] = (data?.products ?? []).filter(
    (p) => p.tags?.includes("collection-permanente")
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = products.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % count), [count]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + count) % count), [count]);

  // Autoplay
  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [count, paused, next]);

  // Scroll track to current
  useEffect(() => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const card = track.children[current] as HTMLElement | undefined;
    if (!card) return;
    const offset = card.offsetLeft - (track.offsetWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: offset, behavior: "smooth" });
  }, [current, count]);

  if (isLoading) return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>Collection permanente</span>
          <h2 className={styles.title}>De tout temps</h2>
        </div>
        <div className={styles.skeletonRow}>
          {[0,1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      </div>
    </section>
  );

  if (products.length === 0) return null;

  return (
    <section
      className={styles.section}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Collection permanente</span>
            <h2 className={styles.title}>De tout temps</h2>
            <p className={styles.subtitle}>Les essentiels ChezPrecious — toujours disponibles, toujours parfaits.</p>
          </div>
          <div className={styles.controls}>
            <button className={styles.ctrlBtn} onClick={prev} aria-label="Précédent">
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
            <button className={styles.ctrlBtn} onClick={next} aria-label="Suivant">
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Track */}
        <div className={styles.trackWrap}>
          <div className={styles.track} ref={trackRef}>
            {products.map((p, i) => (
              <div
                key={p.id}
                className={`${styles.slide} ${i === current ? styles.slideActive : ""}`}
                onClick={() => setCurrent(i)}
              >
                <ClassicCard product={p} />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className={styles.dots}>
          {products.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`Aller au produit ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
