"use client";

import { formatPrice } from "@/app/utils/format";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ChevronDown, ChevronUp, Heart, Share2, Copy, Check as CheckIcon, Quote, Play } from "lucide-react";
import Grid from "@mui/material/Grid";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiProduct, ApiReview } from "@/app/lib/api";
import { reviewsApi } from "@/app/lib/api";
import { useSimilarProducts } from "@/app/hooks/useProducts";
import { useCurrentUser } from "@/app/hooks/useAuth";
import ProductCard from "@/app/components/home/ProductCard/ProductCard";
import { useCart } from "@/app/store/cartStore";
import { useWishlist } from "@/app/context/WishlistContext";
import styles from "./page.module.scss";

function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.accordionItem}>
      <button className={styles.accordionHeader} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
}

// ─── Description structurée ──────────────────────────────────────────────────
// Format saisi dans l'admin / le seed : paragraphes séparés par une ligne vide,
// « ### Titre » pour démarrer une section, « - » pour une liste.

type DescriptionSection = { title: string; blocks: string[] };

function parseDescription(text: string): DescriptionSection[] {
  const sections: DescriptionSection[] = [{ title: "Description", blocks: [] }];
  for (const raw of text.split(/\n\s*\n/)) {
    const block = raw.trim();
    if (!block) continue;
    const heading = block.match(/^###\s+(.+?)(?:\n([\s\S]*))?$/);
    if (heading) {
      sections.push({ title: heading[1].trim(), blocks: heading[2]?.trim() ? [heading[2].trim()] : [] });
    } else {
      sections[sections.length - 1].blocks.push(block);
    }
  }
  return sections.filter((s) => s.blocks.length > 0);
}

function DescriptionBlock({ block }: { block: string }) {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.every((l) => l.startsWith("- "))) {
    return (
      <ul className={styles.descList}>
        {lines.map((l) => {
          const item = l.slice(2);
          const sep = item.indexOf(" : ");
          return (
            <li key={item}>
              {sep > 0 ? <><strong>{item.slice(0, sep)}</strong> : {item.slice(sep + 3)}</> : item}
            </li>
          );
        })}
      </ul>
    );
  }
  return <p>{lines.join(" ")}</p>;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} étoiles sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} fill={n <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

// ─── Stars clickable input ────────────────────────────────────────────────────

function StarsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className={styles.starsInput}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={styles.starInputBtn}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            fill={(hover || value) >= n ? "currentColor" : "none"}
            strokeWidth={1.5}
            style={{ color: (hover || value) >= n ? "#C9A45C" : "rgba(10,10,10,0.25)" }}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Reviews section ──────────────────────────────────────────────────────────

function ProductReviews({ productId }: { productId: string }) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();

  const { data, isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => reviewsApi.list({ productId, limit: 20, sort: "newest" }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  const reviews: ApiReview[] = data?.reviews ?? [];
  const stats = data?.stats;

  // Form state
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const mutation = useMutation({
    mutationFn: () => reviewsApi.create({ productId, rating, content: content || undefined }),
    onSuccess: () => {
      setSubmitted(true);
      setRating(0); setContent("");
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? "Une erreur est survenue.");
    },
  });

  const alreadyReviewed = reviews.some((r) => r.userId === user?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (rating === 0) { setFormError("Veuillez sélectionner une note."); return; }
    mutation.mutate();
  };

  const avgRating = stats?.averageRating ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;

  return (
    <section className={styles.reviewsSection}>
      <div className={styles.reviewsHeader}>
        <h2 className={styles.reviewsTitle}>Avis clients</h2>
        {totalReviews > 0 && (
          <div className={styles.reviewsGlobalStats}>
            <span className={styles.reviewsBigScore}>{avgRating.toFixed(1)}</span>
            <div>
              <Stars rating={Math.round(avgRating)} />
              <span className={styles.reviewsTotalCount}>{totalReviews} avis</span>
            </div>
          </div>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className={styles.reviewsLoading}>
          {[1, 2, 3].map((i) => <div key={i} className={styles.reviewSkeleton} />)}
        </div>
      ) : reviews.length === 0 ? (
        <p className={styles.reviewsEmpty}>Soyez le premier à laisser un avis.</p>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((r) => {
            const initials = (r.user.fullName ?? "A").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(r.createdAt));
            return (
              <article key={r.id} className={styles.reviewCard}>
                <Quote size={20} className={styles.reviewQuote} strokeWidth={1.2} />
                <div className={styles.reviewCardHeader}>
                  <Stars rating={r.rating} />
                  {r.isVerified && <span className={styles.reviewVerified}>Achat vérifié</span>}
                </div>
                {r.title && <h3 className={styles.reviewCardTitle}>{r.title}</h3>}
                {r.content && <p className={styles.reviewCardContent}>{r.content}</p>}
                <div className={styles.reviewCardFooter}>
                  <div className={styles.reviewAvatar}>{initials}</div>
                  <div>
                    <span className={styles.reviewAuthor}>{r.user.fullName ?? "Client"}</span>
                    <span className={styles.reviewDate}>{date}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Formulaire */}
      <div className={styles.reviewFormWrap}>
        <h3 className={styles.reviewFormTitle}>Laisser un avis</h3>
        {!user ? (
          <p className={styles.reviewFormNote}>
            <Link href="/auth" className={styles.reviewFormLink}>Connectez-vous</Link> pour laisser un avis.
          </p>
        ) : alreadyReviewed ? (
          <p className={styles.reviewFormNote}>Vous avez déjà laissé un avis pour ce produit.</p>
        ) : submitted ? (
          <p className={styles.reviewFormSuccess}>Merci pour votre avis ! Il sera visible après vérification.</p>
        ) : (
          <form className={styles.reviewForm} onSubmit={handleSubmit}>
            <div className={styles.reviewFormField}>
              <label className={styles.reviewFormLabel}>Note *</label>
              <StarsInput value={rating} onChange={setRating} />
            </div>
            <div className={styles.reviewFormField}>
              <label className={styles.reviewFormLabel}>Commentaire</label>
              <textarea
                className={`${styles.reviewFormInput} ${styles.reviewFormTextarea}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Partagez votre avis sur ce produit…"
                rows={4}
                maxLength={1000}
              />
            </div>
            {formError && <p className={styles.reviewFormError}>{formError}</p>}
            <button type="submit" className={styles.reviewFormSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? "Envoi…" : "Publier mon avis"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function ProductDetail({ product }: { product: ApiProduct }) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const { id, name, price, comparePrice, images, category, description, variants, rating, reviewCount, stock, lowStockThreshold, trackInventory } = product;

  const { data: similarRaw } = useSimilarProducts(product.slug, 4);
  const similar = similarRaw ?? [];

  const inWishlist = isInWishlist(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = (network: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Découvrez ${name}`);
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter:  `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer,width=600,height=500");
    setShareOpen(false);
  };

  // Extraire les attributs distincts des variantes (ex: Couleur, Taille)
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>();
    variants?.forEach((v) => {
      Object.keys(v.combination).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [variants]);

  // État de sélection par attribut
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    attributeKeys.forEach((key) => {
      const first = variants?.find((v) => v.isActive && v.combination[key]);
      if (first) init[key] = first.combination[key];
    });
    return init;
  });

  // Valeurs distinctes par attribut
  const optionsByKey = useMemo(() => {
    const map: Record<string, string[]> = {};
    attributeKeys.forEach((key) => {
      const values = [...new Set(variants?.map((v) => v.combination[key]).filter(Boolean))];
      map[key] = values;
    });
    return map;
  }, [attributeKeys, variants]);

  // Variante correspondant à la sélection courante
  const matchedVariant = useMemo(() => {
    if (!variants?.length) return null;
    return variants.find((v) =>
      Object.entries(selected).every(([k, val]) => v.combination[k] === val)
    ) ?? null;
  }, [variants, selected]);

  const effectivePrice = matchedVariant?.price ?? price;
  const currentStock = matchedVariant ? matchedVariant.stock : stock;
  const inStock = currentStock > 0;
  const threshold = lowStockThreshold || 5;
  const isLowStock = trackInventory && inStock && currentStock <= threshold;
  const showStock = trackInventory;

  const [mainImg, setMainImg] = useState(0);
  // Les vidéos du produit suivent les photos dans la galerie (index >= images.length)
  const videos = product.videos ?? [];
  const activeVideo = mainImg >= images.length ? videos[mainImg - images.length] : undefined;
  const [added, setAdded] = useState(false);

  const isSale = comparePrice !== null && comparePrice !== undefined && Number(comparePrice) > Number(price);

  const handleAddToCart = () => {
    addItem({
      productId: id,
      name,
      price: Number(effectivePrice),
      image: images?.[0]?.url ?? "",
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  // Miniatures de la galerie (desktop et mobile) : photos puis vidéos
  const galleryThumbs = (
    <>
      {images.map((img, i) => (
        <button key={img.id ?? i} className={`${styles.thumb} ${mainImg === i ? styles.thumbActive : ""}`}
          onClick={() => setMainImg(i)} aria-label={`Image ${i + 1}`}>
          <Image src={img.url} alt={`${name} vue ${i + 1}`} fill sizes="80px" className={styles.thumbImg} />
        </button>
      ))}
      {videos.map((video, i) => {
        const index = images.length + i;
        return (
          <button key={video.id} className={`${styles.thumb} ${styles.thumbVideo} ${mainImg === index ? styles.thumbActive : ""}`}
            onClick={() => setMainImg(index)} aria-label={`Vidéo : ${video.title ?? name}`}>
            {video.thumbnail && (
              <Image src={video.thumbnail} alt={video.title ?? name} fill sizes="80px" className={styles.thumbVideoImg} />
            )}
            <span className={styles.thumbPlay}><Play size={14} strokeWidth={0} fill="currentColor" /></span>
          </button>
        );
      })}
    </>
  );

  return (
    <>
      <div className={styles.productLayout}>
        {/* ── Galerie ── */}
        <div className={styles.gallery}>
          <div className={styles.thumbs}>
            {galleryThumbs}
          </div>

          <div className={styles.mainImage}>
            {activeVideo ? (
              <video
                key={activeVideo.id}
                className={styles.mainVideo}
                src={activeVideo.url}
                poster={activeVideo.thumbnail ?? undefined}
                controls
                autoPlay
                playsInline
              />
            ) : images[mainImg]?.url && (
              <Image src={images[mainImg].url} alt={name} fill sizes="(max-width: 768px) 100vw, 55vw" priority className={styles.mainImg} />
            )}
            {isSale && <span className={`${styles.badge} ${styles.badgeSale}`}>Soldes</span>}
            {product.isFeatured && !isSale && <span className={`${styles.badge} ${styles.badgeNew}`}>Nouveau</span>}

            <div className={styles.galleryActions}>
              <button
                className={`${styles.galleryBtn} ${inWishlist ? styles.galleryBtnActive : ""}`}
                aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={() => toggleItem(product as any)}
              >
                <Heart size={18} strokeWidth={inWishlist ? 0 : 1.5} fill={inWishlist ? "currentColor" : "none"} />
              </button>

              <div style={{ position: "relative" }}>
                <button
                  className={styles.galleryBtn}
                  aria-label="Partager"
                  onClick={() => setShareOpen((v) => !v)}
                >
                  <Share2 size={18} strokeWidth={1.5} />
                </button>

                {shareOpen && (
                  <>
                    <div className={styles.shareBackdrop} onClick={() => setShareOpen(false)} />
                    <div className={styles.sharePopup}>
                      <p className={styles.shareTitle}>Partager</p>
                      <button className={styles.shareBtn} onClick={() => handleShare("facebook")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        Facebook
                      </button>
                      <button className={styles.shareBtn} onClick={() => handleShare("twitter")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        Twitter / X
                      </button>
                      <button className={styles.shareBtn} onClick={() => handleShare("whatsapp")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        WhatsApp
                      </button>
                      <button className={styles.shareBtn} onClick={() => handleShare("pinterest")}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.22-5.17 1.22-5.17s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.58 2.25-.87 3.5-.25 1.04.52 1.89 1.54 1.89 1.84 0 3.08-2.37 3.08-5.18 0-2.14-1.44-3.75-4.04-3.75-2.95 0-4.79 2.21-4.79 4.67 0 .85.25 1.45.63 1.91.18.21.2.3.14.54-.05.17-.16.59-.2.75-.07.24-.28.33-.51.24-1.41-.58-2.07-2.13-2.07-3.88 0-2.89 2.44-6.37 7.26-6.37 3.89 0 6.46 2.82 6.46 5.85 0 4.01-2.23 7.01-5.51 7.01-1.1 0-2.14-.59-2.49-1.26l-.68 2.6c-.24.94-.9 2.11-1.35 2.83.67.2 1.38.31 2.11.31 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
                        Pinterest
                      </button>
                      <div className={styles.shareDivider} />
                      <button className={styles.shareBtn} onClick={handleCopyLink}>
                        {copied ? <CheckIcon size={16} strokeWidth={2} /> : <Copy size={16} strokeWidth={1.5} />}
                        {copied ? "Lien copié !" : "Copier le lien"}
                      </button>
                      {copied && <p className={styles.shareCopied}>✓ Copié</p>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.thumbsMobile}>
            {galleryThumbs}
          </div>
        </div>

        {/* ── Infos ── */}
        <div className={styles.info}>
          {rating ? (
            <div className={styles.ratingRow}>
              <Stars rating={rating} />
              <span className={styles.ratingNum}>{rating.toFixed(1)}</span>
              <span className={styles.ratingCount}>({reviewCount} avis)</span>
            </div>
          ) : null}

          <h1 className={styles.productName}>{name}</h1>

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatPrice(effectivePrice)}</span>
            {isSale && <span className={styles.priceOld}>{formatPrice(comparePrice)}</span>}
          </div>

          {showStock && (
            <p className={`${styles.stockIndicator} ${!inStock ? styles.outOfStock : isLowStock ? styles.lowStock : styles.inStock}`}>
              {!inStock
                ? "Rupture de stock"
                : isLowStock
                  ? `Plus que ${currentStock} en stock`
                  : "En stock"}
            </p>
          )}

          {/* Sélecteurs de variantes */}
          {attributeKeys.map((key) => (
            <div key={key} className={styles.variantSection}>
              <p className={styles.variantLabel}>
                {key} : <span>{selected[key]}</span>
              </p>
              {key.toLowerCase() === "couleur" ? (
                <div className={styles.colorOptions}>
                  {optionsByKey[key].map((val) => {
                    const variant = variants?.find((v) => v.combination[key] === val);
                    const available = variant ? variant.stock > 0 : false;
                    return (
                      <button
                        key={val}
                        className={`${styles.colorSwatch} ${selected[key] === val ? styles.colorActive : ""} ${!available ? styles.colorOutOfStock : ""}`}
                        onClick={() => available && setSelected(s => ({ ...s, [key]: val }))}
                        aria-label={val}
                        aria-pressed={selected[key] === val}
                        disabled={!available}
                        title={available ? val : `${val} (rupture de stock)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className={styles.sizeOptions}>
                  {optionsByKey[key].map((val) => {
                    const variant = variants?.find((v) => v.combination[key] === val);
                    const available = variant ? variant.stock > 0 : false;
                    return (
                      <button
                        key={val}
                        className={`${styles.sizeBtn} ${selected[key] === val ? styles.sizeActive : ""} ${!available ? styles.sizeUnavailable : ""}`}
                        onClick={() => available && setSelected(s => ({ ...s, [key]: val }))}
                        disabled={!available}
                        aria-pressed={selected[key] === val}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          <div className={styles.ctaGroup}>
            <button
              className={`${styles.btnAddToCart} ${added ? styles.btnAdded : ""}`}
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {added ? "Ajouté !" : "Ajouter au panier"}
            </button>
            <Link href="/checkout" className={styles.btnBuyNow}>
              Acheter maintenant
            </Link>
          </div>

          <div className={styles.accordion}>
            {parseDescription(description ?? "").map((section, i) => (
              <AccordionItem key={section.title} title={section.title} defaultOpen={i < 2}>
                {section.blocks.map((block) => <DescriptionBlock key={block} block={block} />)}
              </AccordionItem>
            ))}
            <AccordionItem title="Livraison & Retours">
              <p>Livraison standard en 3 à 5 jours ouvrés : 2 500 F CFA, offerte à partir de 4 produits achetés. Retours gratuits sous 30 jours.</p>
            </AccordionItem>
          </div>
        </div>
      </div>

      <ProductReviews productId={id} />

      {similar.length > 0 && (
        <section className={styles.recommended}>
          <h2 className={styles.recommendedTitle}>Vous aimerez aussi</h2>
          <Grid container spacing={3}>
            {similar.map((p) => (
              <Grid key={p.id} size={{ xs: 6, md: 3 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
        </section>
      )}
    </>
  );
}
