"use client";

import { formatPrice } from "@/app/utils/format";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, Lock } from "lucide-react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { useCart } from "@/app/store/cartStore";
import styles from "./page.module.scss";

import { FREE_SHIPPING_THRESHOLD as SHIPPING_THRESHOLD, SHIPPING_COST } from "@/app/utils/shipping";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();

  const shipping = totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = totalPrice + shipping;

  if (items.length === 0) {
    return (
      <main className={styles.main}>
        <Container maxWidth="xl">
          <div className={styles.empty}>
            <ShoppingBag size={56} strokeWidth={1} className={styles.emptyIcon} />
            <h1 className={styles.emptyTitle}>Votre panier est vide</h1>
            <p className={styles.emptyDesc}>
              Découvrez nos collections et ajoutez vos pièces favorites.
            </p>
            <Link href="/shop" className={styles.emptyBtn}>
              Découvrir la boutique
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Container maxWidth="xl">
        <h1 className={styles.pageTitle}>
          Mon panier <span className={styles.itemCount}>({totalItems} article{totalItems > 1 ? "s" : ""})</span>
        </h1>

        <Grid container spacing={{ xs: 4, lg: 8 }}>

          {/* ── Articles ── */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <div className={styles.itemList}>
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.color}-${item.size}`}
                  className={styles.cartItem}
                >
                  {/* Image */}
                  <div className={styles.itemImage}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="100px"
                      className={styles.itemImg}
                    />
                  </div>

                  {/* Infos */}
                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <div>
                        <p className={styles.itemName}>{item.name}</p>
                        <div className={styles.itemMeta}>
                          {item.color && (
                            <span className={styles.itemVariant}>
                              {item.colorHex && (
                                <span
                                  className={styles.itemColorDot}
                                  style={{ backgroundColor: item.colorHex }}
                                />
                              )}
                              {item.color}
                            </span>
                          )}
                          {item.size && (
                            <span className={styles.itemVariant}>Taille {item.size}</span>
                          )}
                        </div>
                      </div>
                      <p className={styles.itemPrice}>{formatPrice((item.price * item.quantity))}</p>
                    </div>

                    <div className={styles.itemBottom}>
                      {/* Quantité */}
                      <div className={styles.qtyControl}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity - 1)}
                          aria-label="Diminuer"
                        >
                          <Minus size={13} strokeWidth={2} />
                        </button>
                        <span className={styles.qtyNum}>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateQuantity(item.productId, item.color, item.size, item.quantity + 1)}
                          aria-label="Augmenter"
                        >
                          <Plus size={13} strokeWidth={2} />
                        </button>
                      </div>

                      {/* Supprimer */}
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeItem(item.productId, item.color, item.size)}
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} strokeWidth={1.5} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/shop" className={styles.continueShopping}>
              ← Continuer mes achats
            </Link>
          </Grid>

          {/* ── Récapitulatif ── */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <div className={styles.summary}>
              <h2 className={styles.summaryTitle}>Récapitulatif</h2>

              <div className={styles.summaryLines}>
                <div className={styles.summaryLine}>
                  <span>Sous-total</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className={styles.summaryLine}>
                  <span>Livraison</span>
                  <span className={shipping === 0 ? styles.freeShipping : ""}>
                    {shipping === 0 ? "Offerte" : `${formatPrice(SHIPPING_COST)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className={styles.shippingHint}>
                    Plus que {formatPrice((SHIPPING_THRESHOLD - totalPrice))} pour la livraison offerte
                  </p>
                )}
              </div>

              <div className={styles.summaryTotal}>
                <span>Total TTC</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Link href="/checkout" className={styles.checkoutBtn}>
                Commander
              </Link>

              <div className={styles.secureRow}>
                <Lock size={13} strokeWidth={1.5} />
                <span>Paiement 100% sécurisé</span>
              </div>

              <p className={styles.paymentLogos}>Visa · Mastercard · CB · PayPal</p>
            </div>
          </Grid>

        </Grid>
      </Container>
    </main>
  );
}
