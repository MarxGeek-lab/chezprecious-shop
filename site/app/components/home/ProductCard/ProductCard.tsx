"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Check } from "lucide-react";
import type { ApiProduct } from "@/app/lib/api";
import { useCart } from "@/app/store/cartStore";
import { useWishlist } from "@/app/context/WishlistContext";
import styles from "./ProductCard.module.scss";

export default function ProductCard({ product }: { product: ApiProduct }) {
  const { id, name, price, comparePrice, images, slug, category, stock, lowStockThreshold, trackInventory } = product;
  const isLowStock = trackInventory && stock > 0 && stock <= (lowStockThreshold || 5);
  const showStock = true;
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const mainImage = images?.[0]?.url ?? "";
  const isSale = comparePrice !== null && comparePrice !== undefined && comparePrice > price;
  const isNew = !isSale && product.isFeatured;
  const inWishlist = isInWishlist(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: id,
      name,
      price,
      image: mainImage,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product as any);
  };

  return (
    <Link href={`/product/${slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        {mainImage && (
          <Image
            className={styles.image}
            src={mainImage}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        )}
        {isSale && (
          <span className={`${styles.badge} ${styles.sale}`}>
            -{Math.round((1 - price / comparePrice!) * 100)}%
          </span>
        )}
        {isNew && <span className={`${styles.badge} ${styles.new}`}>Nouveau</span>}

        <button
          className={`${styles.wishlist} ${inWishlist ? styles.wishlistActive : ""}`}
          aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
          onClick={handleToggleWishlist}
        >
          <Heart size={20} strokeWidth={inWishlist ? 0 : 1.5} fill={inWishlist ? "currentColor" : "none"} />
        </button>

        <button
          className={`${styles.addToCart} ${added ? styles.addToCartDone : ""}`}
          aria-label="Ajouter au panier"
          onClick={handleAddToCart}
        >
          {added ? (
            <><Check size={13} strokeWidth={2.5} /> Ajouté</>
          ) : (
            <><ShoppingBag size={13} strokeWidth={1.5} /> Ajouter au panier</>
          )}
        </button>
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <p className={styles.name}>{name}</p>
          <span className={styles.category}>{category}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>
          {isSale && <span className={styles.priceOld}>{comparePrice!.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</span>}
        </div>
        {/* {showStock && ( */}
          <p className={`${styles.lowStock} ${stock === 0 ? styles.outOfStock : isLowStock ? styles.lowStockWarn : styles.inStock}`}>
            {stock === 0 ? "Rupture de stock" : `Plus que ${stock} en stock`}
          </p>
        {/* )} */}
      </div>

      {/* Mobile only: cart button below info */}
      <button
        className={`${styles.mobileCartBtn} ${added ? styles.mobileCartBtnDone : ""}`}
        aria-label="Ajouter au panier"
        onClick={handleAddToCart}
      >
        {added ? (
          <><Check size={13} strokeWidth={2.5} /> Ajouté</>
        ) : (
          <><ShoppingBag size={13} strokeWidth={1.5} /> Ajouter au panier</>
        )}
      </button>
    </Link>
  );
}
