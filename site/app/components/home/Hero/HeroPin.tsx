"use client";

import { type ReactNode, useEffect, useRef } from "react";
import styles from "./Hero.module.scss";

// Nombre de produits qui défilent pendant que le hero reste épinglé
export const PIN_STEPS = { desktop: 4, mobile: 3 };
export const HERO_SCROLL_EVENT = "hero-scroll-step";

/**
 * Garde le hero à l'écran sur une courte distance de défilement : les cartes 3D
 * avancent au rythme du défilement, puis la page reprend normalement.
 * Jamais bloquant : le défilement continue toujours, sans interception.
 */
export default function HeroPin({ children }: { children: ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const hero = heroRef.current;
    if (!wrap || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let extra = 0;
    let pinTop = 0;
    let steps = PIN_STEPS.desktop;
    let lastStep = 0;
    let frame = 0;

    // Distance d'épinglage et position collante, recalculées au redimensionnement
    const measure = () => {
      const vh = window.innerHeight;
      const mobile = window.innerWidth < 1024;
      steps = mobile ? PIN_STEPS.mobile : PIN_STEPS.desktop;
      extra = Math.round(vh * (mobile ? 0.6 : 0.9));
      // Épinglé en haut, y compris sur mobile où le hero dépasse l'écran : la vitrine reste visible
      pinTop = 0;
      wrap.style.setProperty("--pin-extra", `${extra}px`);
      wrap.style.setProperty("--pin-top", `${pinTop}px`);
      update();
    };

    const update = () => {
      frame = 0;
      const scrolled = pinTop - wrap.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, scrolled / extra));
      wrap.style.setProperty("--hero-p", p.toFixed(4));
      const step = Math.min(steps, Math.floor(p * (steps + 0.999)));
      if (step !== lastStep) {
        window.dispatchEvent(new CustomEvent(HERO_SCROLL_EVENT, { detail: step - lastStep }));
        lastStep = step;
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    measure();
    // capture : le défilement peut se faire sur body (overflow-x: hidden) et non sur window
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={wrapRef} className={styles.pinWrap}>
      <div ref={heroRef} className={styles.pinSticky}>
        {children}
      </div>
      <div className={styles.pinSpacer} aria-hidden />
    </div>
  );
}
