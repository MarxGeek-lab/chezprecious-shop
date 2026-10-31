import { Truck, RotateCcw, ShieldCheck, Headphones } from "lucide-react";
import styles from "./TrustBar.module.scss";

const ITEMS = [
  { icon: Truck, title: "Livraison rapide", text: "Offerte dès 4 produits achetés" },
  { icon: RotateCcw, title: "Retours faciles", text: "Gratuits sous 30 jours" },
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Transactions protégées" },
  { icon: Headphones, title: "Service client", text: "Une équipe à votre écoute" },
];

export default function TrustBar() {
  return (
    <section className={styles.section} aria-label="Nos engagements">
      <div className={styles.inner}>
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <div key={title} className={styles.item}>
            <span className={styles.icon}><Icon size={22} strokeWidth={1.75} /></span>
            <div>
              <p className={styles.title}>{title}</p>
              <p className={styles.text}>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
