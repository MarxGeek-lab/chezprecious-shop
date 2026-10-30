import styles from "./Marquee.module.scss";

const ITEMS = [
  "Nouvelle collection",
  "Livraison offerte dès 50 000 F CFA",
  "Qualité premium",
  "Retours gratuits",
  "ChezPrecious — 2025",
  "Produits 100 % naturels",
];

export default function Marquee() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className={styles.wrapper}>
      <div className={styles.track}>
        {doubled.map((text, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.text}>{text}</span>
            <span className={styles.dot} aria-hidden />
          </div>
        ))}
      </div>
    </div>
  );
}
