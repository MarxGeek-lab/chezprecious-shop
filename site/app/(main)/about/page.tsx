import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata = { title: "À propos — Chez Precious" };

const VALUES = [
  { label: "Qualité", text: "Chaque pièce est confectionnée à partir de matières sélectionnées pour leur tenue, leur toucher et leur durabilité." },
  { label: "Élégance", text: "Un design épuré, sans excès. Nos silhouettes s'inscrivent dans le temps et s'adaptent à tous les instants." },
  { label: "Éthique", text: "Nous travaillons avec des ateliers locaux qui respectent les conditions de travail et minimisent l'impact environnemental." },
];

const TEAM = [
  { name: "Awa Gansané", role: "Fondatrice & Directrice Créative", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80" },
  { name: "Marc Tossou", role: "Directeur Artistique", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80" },
  { name: "Isabelle Koffi", role: "Responsable Collections", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80" },
];

export default function AboutPage() {
  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85"
            alt="Chez Precious atelier"
            fill
            className={styles.heroBgImg}
            priority
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Notre histoire</span>
          <h1 className={styles.heroTitle}>Une maison de mode<br />née à Cotonou</h1>
          <p className={styles.heroSub}>Depuis 2018, Chez Precious incarne une vision moderne du vêtement premium africain.</p>
        </div>
      </section>

      {/* Story */}
      <section className={styles.story}>
        <div className={styles.storyGrid}>
          <div className={styles.storyImg}>
            <Image
              src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&q=85"
              alt="Atelier Chez Precious"
              fill
              className={styles.storyImgEl}
            />
          </div>
          <div className={styles.storyText}>
            <span className={styles.eyebrow}>Notre origine</span>
            <h2 className={styles.sectionTitle}>Né d'une passion pour l'excellence</h2>
            <p>Chez Precious a été fondée avec une conviction simple : le prêt-à-porter de qualité ne devrait pas être un privilège réservé à quelques-uns. Chaque collection est pensée pour s'inscrire dans la durée, loin des tendances éphémères.</p>
            <p>Nos pièces sont imaginées à Cotonou, produites en collaboration avec des artisans locaux, et pensées pour une clientèle exigeante qui ne fait pas de compromis sur la qualité.</p>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className={styles.values}>
        <div className={styles.valuesInner}>
          <span className={styles.eyebrow}>Ce qui nous guide</span>
          <h2 className={styles.sectionTitle}>Nos valeurs</h2>
          <div className={styles.valuesGrid}>
            {VALUES.map((v, i) => (
              <div key={i} className={styles.valueCard}>
                <span className={styles.valueNum}>0{i + 1}</span>
                <h3 className={styles.valueLabel}>{v.label}</h3>
                <p className={styles.valueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className={styles.team}>
        <div className={styles.teamInner}>
          <span className={styles.eyebrow}>Les visages de Chez Precious</span>
          <h2 className={styles.sectionTitle}>Notre équipe</h2>
          <div className={styles.teamGrid}>
            {TEAM.map((m) => (
              <div key={m.name} className={styles.memberCard}>
                <div className={styles.memberImg}>
                  <Image src={m.img} alt={m.name} fill className={styles.memberImgEl} />
                </div>
                <h3 className={styles.memberName}>{m.name}</h3>
                <p className={styles.memberRole}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Découvrez nos collections</h2>
        <p className={styles.ctaSub}>Des pièces pensées pour durer, conçues pour vous.</p>
        <Link href="/shop" className={styles.ctaBtn}>Explorer la boutique</Link>
      </section>

    </main>
  );
}
