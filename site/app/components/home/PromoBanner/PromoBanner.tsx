"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Tag } from "lucide-react";
import { usePromotions } from "@/app/hooks/useHomepage";
import { formatPrice } from "@/app/utils/format";
import styles from "./PromoBanner.module.scss";

const IMAGE = "/uploads/products/catalogue/thymoq-super7-scene.webp";

export default function PromoBanner() {
  const { data: promos = [] } = usePromotions(2);
  const deals = promos.filter((p) => p.images?.[0]?.url).slice(0, 2);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.banner}>
          <div className={styles.content}>
            <span className={styles.tag}>
              <Tag size={14} strokeWidth={2} />
              Offres du moment
            </span>
            <h2 className={styles.title}>
              Vos coups de cœur à <em>prix doux</em>
            </h2>
            <p className={styles.desc}>
              Profitez de nos prix réduits sur une sélection de produits — les quantités sont limitées,
              ne tardez pas.
            </p>
            <div className={styles.actions}>
              <Link href="/shop" className={styles.btnLight}>
                J&apos;en profite
                <ArrowRight size={18} strokeWidth={2} />
              </Link>
              <Link href="/shop?filter=new" className={styles.btnGhost}>
                Voir les nouveautés
              </Link>
            </div>
          </div>

          {deals.length > 0 ? (
            <div className={styles.deals}>
              {deals.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} className={styles.deal}>
                  <div className={styles.dealImage}>
                    <Image src={p.images[0].url} alt={p.name} fill sizes="(max-width: 768px) 45vw, 20vw" />
                    {p.comparePrice && Number(p.comparePrice) > Number(p.price) && (
                      <span className={styles.dealBadge}>
                        -{Math.round((1 - Number(p.price) / Number(p.comparePrice)) * 100)}%
                      </span>
                    )}
                  </div>
                  <p className={styles.dealName}>{p.name}</p>
                  <p className={styles.dealPrice}>
                    {formatPrice(p.price)}
                    {p.comparePrice && Number(p.comparePrice) > Number(p.price) && <s>{formatPrice(p.comparePrice)}</s>}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.visual}>
              <Image src={IMAGE} alt="Offres ChezPrecious" fill sizes="(max-width: 1024px) 100vw, 45vw" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
