"use client";

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf } from "lucide-react";
import { useFeaturedProducts } from "@/app/hooks/useHomepage";
import { formatPrice } from "@/app/utils/format";
import styles from "./Hero.module.scss";

const INTERVAL_MS = 4000;
const SWIPE_PX = 40;

// Écart circulaire entre une carte et la carte active (−n/2 … n/2)
function offsetOf(i: number, current: number, n: number) {
  let d = i - current;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

// Vitrine 3D des produits phares : carte active au premier plan, voisines en perspective
export default function HeroSlider() {
  const { data = [], isLoading } = useFeaturedProducts(8);
  const products = data.filter((p) => p.images?.length > 0);
  const n = products.length;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeCard = useRef<HTMLAnchorElement>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (paused || n < 2) return;
    const id = setTimeout(() => setCurrent((i) => (i + 1) % n), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [paused, n, current]);

  if (isLoading || n === 0) {
    return <div className={`${styles.slider} ${styles.sliderSkeleton}`} aria-hidden />;
  }

  const idx = current % n;
  const active = products[idx];
  const go = (i: number) => setCurrent(((i % n) + n) % n);

  // Inclinaison 3D + reflet qui suivent la souris sur la carte active
  const onTilt = (e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 18}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  };
  const resetTilt = () => {
    const el = activeCard.current;
    if (!el) return;
    for (const prop of ["--rx", "--ry", "--gx", "--gy"]) el.style.removeProperty(prop);
  };

  return (
    <div
      className={styles.slider}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        resetTilt();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) go(idx + (dx < 0 ? 1 : -1));
      }}
    >
      <div className={styles.sliderStage}>
        {/* Décor : lueur, halo doré en rotation, particules */}
        <div className={styles.glow} aria-hidden />
        <div className={styles.halo} aria-hidden />
        <div className={styles.sparkles} aria-hidden>
          {Array.from({ length: 7 }, (_, i) => <span key={i} />)}
        </div>
        <div className={styles.floor} aria-hidden />

        <div className={styles.deck}>
          {products.map((p, i) => {
            const offset = offsetOf(i, idx, n);
            const depth = Math.abs(offset);
            const isActive = offset === 0;
            const img = p.images.find((im) => im.isPrimary) ?? p.images[0];
            return (
              <Link
                key={p.id}
                ref={isActive ? activeCard : undefined}
                href={`/product/${p.slug}`}
                className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
                style={{ "--offset": offset, "--depth": depth, zIndex: 10 - depth } as CSSProperties}
                data-hidden={depth > 2 || undefined}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={(e) => {
                  // Une carte voisine passe d'abord au premier plan
                  if (!isActive) {
                    e.preventDefault();
                    go(i);
                  }
                }}
                onPointerMove={isActive ? onTilt : undefined}
                onPointerLeave={isActive ? resetTilt : undefined}
              >
                <span className={styles.cardInner}>
                  <Image
                    src={img.url}
                    alt={p.name}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 80vw, 36vw"
                  />
                  <span className={styles.cardSheen} aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link href={`/product/${active.slug}`} className={styles.floatCard} key={active.id}>
        <span className={styles.floatIcon}><Leaf size={18} strokeWidth={2} /></span>
        <span className={styles.floatText}>
          <strong>{active.name}</strong>
          <small>{formatPrice(active.price)}</small>
        </span>
        <ArrowRight size={18} strokeWidth={2} className={styles.floatArrow} />
      </Link>

      {n > 1 && (
        <div className={styles.sliderDots}>
          {products.map((p, i) => (
            <button
              type="button"
              key={p.id}
              className={`${styles.sliderDot} ${i === idx ? styles.sliderDotActive : ""}`}
              onClick={() => go(i)}
              aria-label={`Voir ${p.name}`}
            >
              {/* Barre de progression : repart de zéro à chaque produit et à la reprise */}
              {i === idx && (
                <span
                  key={`${idx}-${paused}`}
                  className={styles.sliderDotFill}
                  style={{ "--interval": `${INTERVAL_MS}ms` } as CSSProperties}
                  data-paused={paused || undefined}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
