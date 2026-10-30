"use client";

import { categoryLabel, formatPrice } from "@/app/utils/format";
import Link from "next/link";
import Image from "next/image";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { Star, TrendingUp } from "lucide-react";
import { useBestSellers } from "@/app/hooks/useHomepage";
import styles from "./Bestsellers.module.scss";

export default function Bestsellers() {
  const { data = [], isLoading } = useBestSellers(7);

  if (isLoading) {
    return (
      <section className={styles.section}>
        <Container maxWidth="xl">
          <div style={{ height: 300, background: "#F6ECE8", borderRadius: 14 }} />
        </Container>
      </section>
    );
  }

  if (data.length === 0) return null;

  const [hero, ...rest] = data;

  return (
    <section className={styles.section}>
      <Container maxWidth="xl">

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>
              <TrendingUp size={13} strokeWidth={2} />
              Tendances
            </span>
            <h2 className={styles.title}>Nos <em>meilleures ventes</em></h2>
          </div>
          <Link href="/shop?sort=populaires" className={styles.seeAll}>
            Voir tout →
          </Link>
        </div>

        <Grid container spacing={{ xs: 1.5, md: 3 }}>

          {/* Carte héro — grande */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Link href={`/product/${hero.slug}`} className={`${styles.card} ${styles.cardHero}`}>
              <div className={styles.imageWrap}>
                {hero.images?.[0]?.url && (
                  <Image
                    className={styles.image}
                    src={hero.images[0].url}
                    alt={hero.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    priority
                  />
                )}
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                  <span className={styles.rankBadge}>#1</span>
                  <p className={styles.heroCategory}>{categoryLabel(hero.category)}</p>
                  <p className={styles.heroName}>{hero.name}</p>
                  {hero.rating ? (
                    <div className={styles.ratingRow}>
                      <Star size={12} strokeWidth={0} fill="#FF2C2C" />
                      <span className={styles.ratingVal}>{hero.rating.toFixed(1)}</span>
                      <span className={styles.ratingCount}>({hero.reviewCount} avis)</span>
                    </div>
                  ) : null}
                  <p className={styles.heroPrice}>{formatPrice(hero.price)}</p>
                </div>
              </div>
            </Link>
          </Grid>

          {/* Grille petites cartes */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              {rest.map((product, i) => (
                <Grid key={product.id} size={{ xs: 6, sm: 4 }}>
                  <Link href={`/product/${product.slug}`} className={styles.card}>
                    <div className={styles.imageWrap}>
                      {product.images?.[0]?.url && (
                        <Image
                          className={styles.image}
                          src={product.images[0].url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 20vw"
                        />
                      )}
                      <span className={styles.rankBadgeSmall}>#{i + 2}</span>
                    </div>
                    <div className={styles.info}>
                      <p className={styles.category}>{categoryLabel(product.category)}</p>
                      <p className={styles.name}>{product.name}</p>
                      {product.rating ? (
                        <div className={styles.ratingRow}>
                          <Star size={10} strokeWidth={0} fill="#FF2C2C" />
                          <span className={styles.ratingVal}>{product.rating.toFixed(1)}</span>
                          <span className={styles.ratingCount}>({product.reviewCount})</span>
                        </div>
                      ) : null}
                      <div className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                        {product.comparePrice && (
                          <span className={styles.priceOld}>{formatPrice(product.comparePrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </Grid>
              ))}
            </Grid>
          </Grid>

        </Grid>
      </Container>
    </section>
  );
}
