"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { useFeaturedProducts, useNewProducts } from "@/app/hooks/useHomepage";
import type { ApiProduct } from "@/app/lib/api";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./FeaturedProducts.module.scss";

const TABS = [
  { label: "Nouveautés", key: "new" },
  { label: "Vedettes", key: "featured" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ProductSkeleton() {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
      <div style={{ aspectRatio: "3/4", background: "#EEF2EE", borderRadius: 14 }} />
    </Grid>
  );
}

export default function FeaturedProducts() {
  const [active, setActive] = useState<TabKey>("new");

  const newQuery = useNewProducts(8);
  const featuredQuery = useFeaturedProducts(8);

  const query = active === "new" ? newQuery : featuredQuery;
  const products: ApiProduct[] = (query.data ?? []).slice(0, 8);
  const loading = query.isLoading;

  return (
    <section className={styles.section}>
      <Container maxWidth="xl">

        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.eyebrow}>Notre sélection</span>
            <h2 className={styles.title}>Nos produits <em>coup de cœur</em></h2>
          </div>

          <nav className={styles.tabs} aria-label="Filtrer les produits">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.tab} ${active === tab.key ? styles.tabActive : ""}`}
                onClick={() => setActive(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <Link href="/shop" className={styles.seeAll}>
            Voir tout →
          </Link>
        </div>

        <Grid container spacing={{ xs: 1, md: 3 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => (
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
