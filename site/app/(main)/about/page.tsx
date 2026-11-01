import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.scss";

export const metadata = { title: "À propos — ChezPrecious" };

const VALUES = [
  { label: "Naturel", text: "Des compléments, des soins et des boissons aux ingrédients naturels, choisis pour accompagner votre bien-être au quotidien." },
  { label: "Qualité", text: "Une sélection de produits premium, présentés avec leur composition, leurs bienfaits et leurs précautions d'emploi." },
  { label: "Proximité", text: "Une équipe à votre écoute pour vous conseiller, et une livraison offerte à partir de 4 produits achetés." },
];

export default function AboutPage() {
  return (
    <main className={styles.main}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="/uploads/products/catalogue/thymoq-super7-scene.webp"
            alt="Produits ChezPrecious"
            fill
            className={styles.heroBgImg}
            priority
          />
          <div className={styles.heroOverlay} />
        </div>
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>À propos</span>
          <h1 className={styles.heroTitle}>Le bien-être,<br />naturellement</h1>
          <p className={styles.heroSub}>ChezPrecious réunit des produits naturels pour prendre soin de votre santé, de votre énergie et de votre beauté.</p>
        </div>
      </section>

      {/* Story */}
      <section className={styles.story}>
        <div className={styles.storyGrid}>
          <div className={styles.storyImg}>
            <Image
              src="/uploads/products/catalogue/cream7-ingredients.webp"
              alt="Ingrédients naturels Cream7"
              fill
              className={styles.storyImgEl}
            />
          </div>
          <div className={styles.storyText}>
            <span className={styles.eyebrow}>Notre sélection</span>
            <h2 className={styles.sectionTitle}>Des produits choisis pour votre bien-être</h2>
            <p>Compléments alimentaires, soins de la peau, café enrichi et eau alcaline : chaque produit de notre boutique est sélectionné pour ses ingrédients naturels et sa qualité.</p>
            <p>Sur chaque fiche, retrouvez la composition, les bienfaits et les précautions d'emploi pour choisir en toute confiance. Nos compléments alimentaires accompagnent une alimentation variée et un mode de vie sain, sans remplacer l'avis d'un professionnel de santé.</p>
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

      {/* CTA */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Découvrez nos produits</h2>
        <p className={styles.ctaSub}>Compléments, soins et boissons pour votre bien-être au quotidien.</p>
        <Link href="/shop" className={styles.ctaBtn}>Explorer la boutique</Link>
      </section>

    </main>
  );
}
