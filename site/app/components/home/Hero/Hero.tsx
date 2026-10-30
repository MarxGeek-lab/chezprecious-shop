import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import styles from "./Hero.module.scss";

const MAIN_IMAGE = "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=85";
const SIDE_IMAGE = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=85";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.tag}>
            <Sparkles size={14} strokeWidth={2} />
            Nouvelle collection
          </span>

          <h1 className={styles.title}>
            Révélez votre <em>élégance</em> au quotidien
          </h1>

          <p className={styles.desc}>
            Des pièces choisies avec soin, des coupes qui subliment et des matières
            agréables à porter. Trouvez le style qui vous ressemble chez Precious.
          </p>

          <div className={styles.actions}>
            <Link href="/shop" className={styles.btnPrimary}>
              Découvrir la boutique
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/shop?filter=new" className={styles.btnSecondary}>
              Voir les nouveautés
            </Link>
          </div>

          <div className={styles.proof}>
            <div className={styles.stars} aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} strokeWidth={0} fill="currentColor" />
              ))}
            </div>
            <p>
              <strong>Clientes ravies</strong> — qualité, coupe et service salués
            </p>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.mainImage}>
            <Image
              src={MAIN_IMAGE}
              alt="Nouvelle collection ChezPrecious"
              fill
              priority
              sizes="(max-width: 1024px) 90vw, 40vw"
            />
          </div>

          <div className={styles.sideImage}>
            <Image
              src={SIDE_IMAGE}
              alt="Sélection ChezPrecious"
              fill
              sizes="(max-width: 1024px) 40vw, 18vw"
            />
          </div>

          <Link href="/shop?filter=new" className={styles.floatCard}>
            <span className={styles.floatIcon}><Sparkles size={18} strokeWidth={2} /></span>
            <span>
              <strong>Nouveautés</strong>
              <small>Découvrir la sélection →</small>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
