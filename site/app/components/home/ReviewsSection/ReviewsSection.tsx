"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@/app/lib/api";
import type { ApiReview } from "@/app/lib/api";
import styles from "./ReviewsSection.module.scss";

// ── Sous-composants ───────────────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} étoiles`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13} fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  const initials = (review.user.fullName ?? "C")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const date = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    new Date(review.createdAt)
  );

  return (
    <div className={styles.card}>
      <Quote size={26} className={styles.quoteIcon} strokeWidth={1.2} />
      <Stars rating={review.rating} />
      {review.title && <h3 className={styles.cardTitle}>{review.title}</h3>}
      <p className={styles.cardContent}>{review.content}</p>
      <div className={styles.cardFooter}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.authorInfo}>
          <span className={styles.authorName}>{review.user.fullName ?? "Client"}</span>
          {review.product && (
            <Link href={`/product/${review.product.slug}`} className={styles.productLink}>
              {review.product.name}
            </Link>
          )}
          <span className={styles.date}>{date}</span>
        </div>
        {review.isVerified && <span className={styles.verified}>Achat vérifié</span>}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ReviewsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-reviews-home"],
    queryFn: () => reviewsApi.publicList({ limit: 8 }).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // Uniquement de vrais avis clients : la section est masquée tant qu'il n'y en a pas
  const reviews = data?.reviews ?? [];

  const stats = data?.stats;
  const avgRating = stats?.averageRating ?? 0;
  const totalReviews = stats?.totalReviews ?? 0;

  // Dupliquer pour le défilement infini
  const doubled = [...reviews, ...reviews];

  // Pause/reprise au survol
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.animationPlayState = paused ? "paused" : "running";
  }, [paused]);

  if (isLoading) {
    return (
      <section className={styles.section}>
        <div className={styles.skeleton} />
      </section>
    );
  }

  if (reviews.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.overline}>Ce qu'elles en disent</p>
        <h2 className={styles.title}>Nos clientes <em>nous recommandent</em></h2>
        <div className={styles.globalStats}>
          <Stars rating={Math.round(avgRating)} />
          <span className={styles.avgScore}>{avgRating.toFixed(1)}</span>
          {totalReviews > 0 && (
            <span className={styles.totalCount}>— {totalReviews} avis vérifiés</span>
          )}
        </div>
      </div>

      {/* Carousel infini */}
      <div
        className={styles.carouselWrapper}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Masque fondu gauche/droite */}
        <div className={styles.fadeLeft} />
        <div className={styles.fadeRight} />

        <div ref={trackRef} className={styles.track}>
          {doubled.map((r, i) => (
            <div key={`${r.id}-${i}`} className={styles.slide}>
              <ReviewCard review={r} />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.cta}>
        <Link href="/avis" className={styles.ctaLink}>
          Voir tous les avis
        </Link>
      </div>
    </section>
  );
}
