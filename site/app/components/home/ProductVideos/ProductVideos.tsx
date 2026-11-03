"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import styles from "./ProductVideos.module.scss";

// Vidéos servies directement par le site (public/videos) pour un chargement rapide
const VIDEO_DIR = "/videos";

type VideoProduct = { name: string; slug: string };

const PRODUCTS = {
  eau: { name: "Eau alcaline", slug: "eau-alcaline-label-bien-etre" },
  thymoq: { name: "thymoQ", slug: "thymoq-huile-de-nigelle" },
  super7: { name: "SUPER7", slug: "super7-brain-health" },
  women7: { name: "WOMEN7", slug: "women7-w7" },
  men7: { name: "MEN7", slug: "men7-m7" },
  cream7: { name: "Cream7", slug: "cream7-refresh-restore-rejuvenate" },
} satisfies Record<string, VideoProduct>;

// Même ordre que les produits : eau, thymoQ, SUPER7, WOMEN7, MEN7, café, Cream7
const VIDEOS: { file: string; title: string; products: VideoProduct[] }[] = [
  { file: "eau-alcaline", title: "Eau alcaline Label Bien-être", products: [PRODUCTS.eau] },
  { file: "thymoq-super7", title: "Le duo thymoQ + SUPER7", products: [PRODUCTS.thymoq, PRODUCTS.super7] },
  { file: "women7-super7", title: "Le duo WOMEN7 + SUPER7", products: [PRODUCTS.women7, PRODUCTS.super7] },
  { file: "men7-super7", title: "Le duo MEN7 + SUPER7", products: [PRODUCTS.men7, PRODUCTS.super7] },
  { file: "trio-fertilite", title: "Le trio thymoQ, WOMEN7 et SUPER7", products: [PRODUCTS.thymoq, PRODUCTS.women7, PRODUCTS.super7] },
  { file: "cream7", title: "Cream7, l'éclat naturel", products: [PRODUCTS.cream7] },
];

export default function ProductVideos() {
  // Une seule vidéo chargée et lue à la fois ; les autres restent en miniature
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.eyebrow}>En vidéo</span>
          <h2 className={styles.title}>Nos produits <em>en vidéo</em></h2>
        </div>

        <div className={styles.track}>
          {VIDEOS.map((v) => (
            <article key={v.file} className={styles.card}>
              <div className={styles.player}>
                {playing === v.file ? (
                  <video
                    className={styles.video}
                    src={`${VIDEO_DIR}/${v.file}.mp4`}
                    poster={`${VIDEO_DIR}/${v.file}.jpg`}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onEnded={() => setPlaying(null)}
                  />
                ) : (
                  <button
                    className={styles.poster}
                    onClick={() => setPlaying(v.file)}
                    aria-label={`Lire la vidéo : ${v.title}`}
                  >
                    <Image
                      src={`${VIDEO_DIR}/${v.file}.jpg`}
                      alt={v.title}
                      fill
                      sizes="(max-width: 768px) 62vw, 240px"
                    />
                    <span className={styles.playBtn}><Play size={26} strokeWidth={0} fill="currentColor" /></span>
                  </button>
                )}
              </div>

              <p className={styles.cardTitle}>{v.title}</p>
              <div className={styles.links}>
                {v.products.map((p) => (
                  <Link key={p.slug} href={`/product/${p.slug}`} className={styles.productLink}>
                    {p.name}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
