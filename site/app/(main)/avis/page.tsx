"use client";

import { useState } from "react";
import Link from "next/link";
import Container from "@mui/material/Container";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@/app/lib/api";
import type { ApiReview } from "@/app/lib/api";
import styles from "./page.module.scss";

const LIMIT = 12;

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className={styles.stars} aria-label={`${rating} étoiles`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className={styles.ratingBar}>
      <span className={styles.ratingBarLabel}>{star} ★</span>
      <div className={styles.ratingBarTrack}>
        <div className={styles.ratingBarFill} style={{ width: `${pct}%` }} />
      </div>
      <span className={styles.ratingBarCount}>{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: ApiReview }) {
  const initials = (review.user.fullName ?? "A")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(review.createdAt)
  );

  return (
    <article className={styles.card}>
      <Quote size={24} className={styles.quoteIcon} strokeWidth={1.2} />
      <div className={styles.cardHeader}>
        <Stars rating={review.rating} />
        {review.isVerified && <span className={styles.verified}>Achat vérifié</span>}
      </div>
      {review.title && <h3 className={styles.cardTitle}>{review.title}</h3>}
      {review.content && <p className={styles.cardContent}>{review.content}</p>}
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
      </div>
    </article>
  );
}

export default function AvisPage() {
  const [page, setPage] = useState(1);
  const [filterRating, setFilterRating] = useState<number | undefined>();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["public-reviews", page, filterRating],
    queryFn: () =>
      reviewsApi.publicList({ page, limit: LIMIT, rating: filterRating }).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

  const reviews = data?.reviews ?? [];
  const stats = data?.stats;
  const pagination = data?.pagination;
  const totalReviews = stats?.totalReviews ?? 0;
  const avgRating = stats?.averageRating ?? 0;

  return (
    <main className={styles.main}>
      <Container maxWidth="lg">

        {/* ── En-tête ── */}
        <div className={styles.hero}>
          <p className={styles.overline}>Témoignages</p>
          <h1 className={styles.heroTitle}>Avis clients</h1>
          {avgRating > 0 && (
            <div className={styles.heroStats}>
              <Stars rating={Math.round(avgRating)} size={18} />
              <strong>{avgRating.toFixed(1)}</strong>
              <span>sur 5 — {totalReviews} avis vérifiés</span>
            </div>
          )}
        </div>

        {/* ── Sidebar stats + filtres / liste ── */}
        <div className={styles.layout}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {stats && (
              <div className={styles.statsBox}>
                <div className={styles.bigScore}>
                  <span className={styles.bigScoreNum}>{avgRating.toFixed(1)}</span>
                  <div>
                    <Stars rating={Math.round(avgRating)} size={16} />
                    <p className={styles.bigScoreSub}>{totalReviews} avis</p>
                  </div>
                </div>
                <div className={styles.distribution}>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <RatingBar
                      key={s}
                      star={s}
                      count={stats.ratingDistribution[s] ?? 0}
                      total={totalReviews}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className={styles.filterBox}>
              <p className={styles.filterTitle}>Filtrer par note</p>
              <button
                className={`${styles.filterBtn} ${!filterRating ? styles.filterBtnActive : ""}`}
                onClick={() => { setFilterRating(undefined); setPage(1); }}
              >
                Tous
              </button>
              {[5, 4, 3, 2, 1].map((s) => (
                <button
                  key={s}
                  className={`${styles.filterBtn} ${filterRating === s ? styles.filterBtnActive : ""}`}
                  onClick={() => { setFilterRating(s); setPage(1); }}
                >
                  {s} étoile{s > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </aside>

          {/* Liste */}
          <div className={styles.list}>
            {isLoading || isFetching ? (
              <div className={styles.loadingGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard} />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className={styles.empty}>
                <p>Aucun avis pour ce filtre.</p>
                <button className={styles.resetBtn} onClick={() => { setFilterRating(undefined); setPage(1); }}>
                  Voir tous les avis
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={16} strokeWidth={1.5} />
                </button>
                {Array.from({ length: pagination.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`${styles.pageBtn} ${page === i + 1 ? styles.pageBtnActive : ""}`}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  aria-label="Page suivante"
                >
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
