import Link from "next/link";
import styles from "./BrandStatement.module.scss";

export default function BrandStatement() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <span className={styles.label}>Notre philosophie</span>
        <p className={styles.statement}>
          Moins, mais <em>mieux</em>. Chaque pièce est conçue pour traverser les saisons sans jamais perdre son élégance.
        </p>
        <p className={styles.sub}>
          ChezPrecious, c&apos;est l&apos;art du vêtement épuré — des matières premium, des coupes intemporelles, un soin apporté aux moindres détails.
        </p>
        <Link href="/about" className={styles.cta}>
          Notre histoire →
        </Link>
      </div>
    </section>
  );
}
