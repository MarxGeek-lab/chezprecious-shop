"use client";

import { use } from "react";
import Link from "next/link";
import Container from "@mui/material/Container";
import { usePublicProduct } from "@/app/hooks/useProducts";
import ProductDetail from "./ProductDetail";
import styles from "./page.module.scss";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: product, isLoading, isError } = usePublicProduct(slug);

  if (isLoading) {
    return (
      <main className={styles.main}>
        <Container maxWidth="xl">
          <div style={{ height: 600, background: "#f5f5f5", borderRadius: 4, marginTop: 24 }} />
        </Container>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className={styles.main}>
        <Container maxWidth="xl">
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <h1>Produit introuvable</h1>
            <Link href="/shop" style={{ color: "#7B1E3A" }}>Retour à la boutique</Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Container maxWidth="xl">
        <nav className={styles.breadcrumb} aria-label="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <span>{product.category}</span>
        </nav>

        <ProductDetail product={product} />
      </Container>
    </main>
  );
}
