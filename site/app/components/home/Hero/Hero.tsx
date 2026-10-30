"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Hero.module.scss";

const SLIDES = [
  {
    tag: "Nouvelle collection",
    title: "L'élégance",
    titleEm: "sans compromis",
    desc: "Des pièces pensées pour durer. Une esthétique minimaliste qui met en valeur l'essentiel.",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1600&q=90",
    cta: { label: "Découvrir", href: "/shop" },
    ctaSecondary: { label: "Nouveautés", href: "/shop?filter=new" },
  },
  {
    tag: "Collection Femme",
    title: "Féminité",
    titleEm: "intemporelle",
    desc: "Robes, vestes, manteaux — des silhouettes pensées pour toutes les occasions.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=90",
    cta: { label: "Voir la collection", href: "/shop?cat=femme" },
    ctaSecondary: { label: "Homme", href: "/shop?cat=homme" },
  },
  {
    tag: "Collection Homme",
    title: "Élégance",
    titleEm: "masculine",
    desc: "Des coupes structurées, des matières premium. Le vestiaire masculin réinventé.",
    image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=1600&q=90",
    cta: { label: "Voir la collection", href: "/shop?cat=homme" },
    ctaSecondary: { label: "Femme", href: "/shop?cat=femme" },
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 800);
  }, [animating]);

  const next = useCallback(() =>
    goTo((current + 1) % SLIDES.length), [current, goTo]);
  const prev = useCallback(() =>
    goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const slide = SLIDES[current];

  return (
    <section className={styles.hero}>
      {/* Images en crossfade */}
      {SLIDES.map((s, i) => (
        <div key={i} className={`${styles.bg} ${i === current ? styles.bgActive : ""}`}>
          <Image
            src={s.image}
            alt={s.tag}
            fill
            priority={i === 0}
            sizes="100vw"
            className={styles.bgImg}
          />
        </div>
      ))}

      {/* Overlay gradient */}
      <div className={styles.overlay} />

      {/* Contenu éditorial */}
      <div className={styles.content} key={current}>
        <div className={styles.inner}>
          <span className={styles.tag}>{slide.tag}</span>

          <h1 className={styles.title}>
            <span className={styles.titleLine}>{slide.title}</span>
            <em className={styles.titleEm}>{slide.titleEm}</em>
          </h1>

          <p className={styles.desc}>{slide.desc}</p>

          <div className={styles.actions}>
            <Link href={slide.cta.href} className={styles.btnPrimary}>
              {slide.cta.label}
              <ArrowRight size={16} strokeWidth={1.5} className={styles.btnArrow} />
            </Link>
            <Link href={slide.ctaSecondary.href} className={styles.btnSecondary}>
              {slide.ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Barre de navigation slides — en bas */}
      <div className={styles.nav}>
        {/* Numéro courant */}
        <span className={styles.navNum}>
          <strong>{String(current + 1).padStart(2, "0")}</strong>
          <span className={styles.navTotal}>/ {String(SLIDES.length).padStart(2, "0")}</span>
        </span>

        {/* Dots */}
        <div className={styles.dots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotActive : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Flèches */}
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={prev} aria-label="Précédent">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button className={styles.arrow} onClick={next} aria-label="Suivant">
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollHint} aria-hidden>
        <span className={styles.scrollLine} />
        <span className={styles.scrollLabel}>Scroll</span>
      </div>
    </section>
  );
}
