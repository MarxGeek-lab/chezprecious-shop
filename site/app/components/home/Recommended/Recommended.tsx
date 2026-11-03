"use client";

import Link from "next/link";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { ArrowRight } from "lucide-react";
import { useRecommendedProducts } from "@/app/hooks/useHomepage";
import styles from "./Recommended.module.scss";
import ProductCard from "../ProductCard/ProductCard";
import { ProductSkeleton } from "../FeaturedProducts/FeaturedProducts";

export default function Recommended() {
  const { data = [], isLoading } = useRecommendedProducts(8);

  if (isLoading) {
    return (
      <section className={styles.section}>
        <Container maxWidth="xl">
          <div style={{ height: 300, background: "#EEF2EE", borderRadius: 14 }} />
        </Container>
      </section>
    );
  }

  if (data.length === 0) return null;

  return (
    <section className={styles.section}>
      <Container maxWidth="xl">

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>Sélection pour vous</span>
            <h2 className={styles.title}>Vous aimerez <em>aussi</em></h2>
          </div>
          <Link href="/shop" className={styles.seeAll}>
            Voir tout <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>

        <Grid container spacing={{ xs: 1, md: 3 }}>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            ) : data.length > 0 ? (
              data.map((product) => (
                <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3 }}>
                  <ProductCard product={product} />
                </Grid>
              ))
            ) : (
              <Grid size={{ xs: 12 }}>
                <p style={{ textAlign: "center", color: "#999", padding: "2rem 0" }}>
                  Aucun produit disponible pour le moment.
                </p>
              </Grid>
            )}
          </Grid>

      </Container>
    </section>
  );
}
