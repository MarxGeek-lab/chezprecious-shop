"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Star, Quote } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reviewsApi } from "@/app/lib/api";
import type { ApiReview } from "@/app/lib/api";
import styles from "./ReviewsSection.module.scss";

// ── Mock data (fallback / complément) ─────────────────────────────────────────

const MOCK_REVIEWS: ApiReview[] = [
  {
    id: "mock-1", productId: "", userId: "m1", rating: 5,
    title: "Qualité exceptionnelle",
    content: "Je suis vraiment impressionné par la qualité des matières. La coupe est parfaite, le rendu est élégant. Je recommande vivement Chez Precious.",
    isVerified: true, helpful: 0,
    createdAt: "2024-11-10T10:00:00Z", updatedAt: "2024-11-10T10:00:00Z",
    user: { id: "m1", fullName: "Sophie M.", avatar: null },
  },
  {
    id: "mock-2", productId: "", userId: "m2", rating: 5,
    title: "Livraison rapide, produit impeccable",
    content: "Commande reçue en 2 jours. Le tissu est d'une douceur incroyable. J'ai déjà commandé une deuxième pièce.",
    isVerified: true, helpful: 0,
    createdAt: "2024-10-22T14:30:00Z", updatedAt: "2024-10-22T14:30:00Z",
    user: { id: "m2", fullName: "Karim D.", avatar: null },
  },
  {
    id: "mock-3", productId: "", userId: "m3", rating: 5,
    title: "Une marque qui se démarque",
    content: "Des vêtements avec un vrai savoir-faire. Les finitions sont soignées, les couleurs tenues au lavage. Très satisfait de mon achat.",
    isVerified: true, helpful: 0,
    createdAt: "2024-09-15T09:00:00Z", updatedAt: "2024-09-15T09:00:00Z",
    user: { id: "m3", fullName: "Aïcha B.", avatar: null },
  },
  {
    id: "mock-4", productId: "", userId: "m4", rating: 4,
    title: "Bel article, bonne coupe",
    content: "La pièce est vraiment belle en vrai. La coupe est flatteuse et le tissu respire bien. Je suis très content de mon choix.",
    isVerified: true, helpful: 0,
    createdAt: "2024-08-30T16:00:00Z", updatedAt: "2024-08-30T16:00:00Z",
    user: { id: "m4", fullName: "Théo L.", avatar: null },
  },
  {
    id: "mock-5", productId: "", userId: "m5", rating: 5,
    title: "Un vrai coup de cœur",
    content: "Je cherchais quelque chose d'élégant mais confortable. Chez Precious a exactement ce qu'il faut. Le rapport qualité-prix est excellent.",
    isVerified: true, helpful: 0,
    createdAt: "2024-08-05T11:00:00Z", updatedAt: "2024-08-05T11:00:00Z",
    user: { id: "m5", fullName: "Fatou N.", avatar: null },
  },
];

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

  // Combiner avis réels + mocks pour toujours avoir au moins 5 cartes
  const realReviews = data?.reviews ?? [];
  const needed = Math.max(0, 5 - realReviews.length);
  const reviews = [
    ...realReviews,
    ...MOCK_REVIEWS.slice(0, needed),
  ];

  const stats = data?.stats;
  const avgRating = stats?.averageRating ?? 4.9;
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

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <p className={styles.overline}>Ce qu'ils disent</p>
        <h2 className={styles.title}>Avis clients</h2>
        <div className={styles.globalStats}>
          <Stars rating={5} />
          <span className={styles.avgScore}>{avgRating > 0 ? avgRating.toFixed(1) : "4.9"}</span>
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
