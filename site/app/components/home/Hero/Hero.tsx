import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import HeroSlider from "./HeroSlider";
import styles from "./Hero.module.scss";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <span className={styles.tag}>
            <Leaf size={14} strokeWidth={2} />
            Produits 100 % naturels
          </span>

          <h1 className={styles.title}>
            Prenez soin de vous, <em>naturellement</em>
          </h1>

          <p className={styles.desc}>
            Compléments alimentaires aux <strong>cellules souches diplexifiées</strong>, soins, café enrichi
            et eau alcaline : des produits naturels pour votre énergie, votre équilibre et votre beauté au quotidien.
          </p>

          <div className={styles.actions}>
            <Link href="/shop" className={styles.btnPrimary}>
              Découvrir nos produits
              <ArrowRight size={18} strokeWidth={2} />
            </Link>
            <Link href="/shop?cat=complements-alimentaires" className={styles.btnSecondary}>
              <span className={styles.btnStack}>
                Compléments alimentaires
                <small>aux cellules souches diplexifiées</small>
              </span>
            </Link>
          </div>

          <ul className={styles.proof}>
            <li><Sparkles size={16} strokeWidth={2} /> Qualité premium</li>
            <li><Leaf size={16} strokeWidth={2} /> Formules naturelles</li>
            <li><ShieldCheck size={16} strokeWidth={2} /> Paiement sécurisé</li>
          </ul>
        </div>

        <div className={styles.visual}>
          <HeroSlider />
        </div>
      </div>
    </section>
  );
}
