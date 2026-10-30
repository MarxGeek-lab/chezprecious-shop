import Link from "next/link";
import { Truck, RotateCcw, Package, Shield, Clock, MapPin } from "lucide-react";
import styles from "./page.module.scss";

export const metadata = { title: "Livraison & Retours — ChezPrecious" };

const SHIPPING = [
  {
    icon: Truck,
    title: "Livraison standard",
    delay: "3 – 5 jours ouvrés",
    price: "4,90 €",
    note: "Gratuite dès 80 € d'achat",
  },
  {
    icon: Clock,
    title: "Livraison express",
    delay: "24 – 48h",
    price: "9,90 €",
    note: "Commande avant 14h, jours ouvrés",
  },
];

const ZONES = [
  { country: "France métropolitaine", delay: "3 – 5 jours", price: "Gratuite dès 80 €" },
  { country: "Belgique", delay: "4 – 6 jours", price: "6,90 €" },
  { country: "Suisse", delay: "5 – 7 jours", price: "8,90 €" },
  { country: "Luxembourg", delay: "4 – 6 jours", price: "6,90 €" },
  { country: "Autres pays UE", delay: "5 – 8 jours", price: "9,90 €" },
];

const RETURN_STEPS = [
  { num: "01", title: "Initiez le retour", text: "Depuis votre espace compte → Mes commandes → Retourner un article, dans les 30 jours suivant la réception." },
  { num: "02", title: "Imprimez l'étiquette", text: "Vous recevez une étiquette de retour prépayée par email. Imprimez-la et collez-la sur votre colis." },
  { num: "03", title: "Déposez le colis", text: "Déposez votre colis dans le point relais ou bureau de poste indiqué. Un suivi vous est fourni." },
  { num: "04", title: "Remboursement", text: "Dès réception et vérification de l'article, vous êtes remboursé(e) sous 5 à 10 jours ouvrés." },
];

export default function LivraisonPage() {
  return (
    <main className={styles.main}>

      <div className={styles.hero}>
        <span className={styles.eyebrow}>Livraison & Retours</span>
        <h1 className={styles.heroTitle}>Simple, rapide, sans stress.</h1>
        <p className={styles.heroSub}>Toutes les informations sur nos modes de livraison et notre politique de retour.</p>
      </div>

      {/* Options livraison */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Options de livraison</h2>
          <div className={styles.cardsRow}>
            {SHIPPING.map((s) => (
              <div key={s.title} className={styles.shippingCard}>
                <s.icon size={28} strokeWidth={1.5} className={styles.shippingIcon} />
                <h3 className={styles.shippingTitle}>{s.title}</h3>
                <p className={styles.shippingDelay}>{s.delay}</p>
                <p className={styles.shippingPrice}>{s.price}</p>
                <p className={styles.shippingNote}>{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zones */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.inner}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleLight}`}>
            <MapPin size={20} strokeWidth={1.5} style={{ display: "inline", marginRight: 8 }} />
            Zones de livraison
          </h2>
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Pays</span>
              <span>Délai</span>
              <span>Tarif</span>
            </div>
            {ZONES.map((z) => (
              <div key={z.country} className={styles.tableRow}>
                <span>{z.country}</span>
                <span>{z.delay}</span>
                <span>{z.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Suivi */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.trackBox}>
            <Package size={32} strokeWidth={1.5} />
            <div>
              <h2 className={styles.trackTitle}>Suivi de commande</h2>
              <p className={styles.trackText}>
                Dès l'expédition de votre colis, vous recevrez un email avec un lien de suivi en temps réel. Vous pouvez également consulter l'état de vos livraisons depuis votre <Link href="/account/orders" className={styles.trackLink}>espace compte</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Retours */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.returnHeader}>
            <RotateCcw size={28} strokeWidth={1.5} />
            <div>
              <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Retours gratuits · 30 jours</h2>
              <p className={styles.returnSub}>Pas satisfait(e) ? Retournez votre article gratuitement, sans question posée.</p>
            </div>
          </div>

          <div className={styles.steps}>
            {RETURN_STEPS.map((s) => (
              <div key={s.num} className={styles.step}>
                <span className={styles.stepNum}>{s.num}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepText}>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantie */}
      <section className={`${styles.section} ${styles.sectionIvory}`}>
        <div className={styles.inner}>
          <div className={styles.guaranteeBox}>
            <Shield size={32} strokeWidth={1.5} />
            <div>
              <h3 className={styles.guaranteeTitle}>Notre engagement qualité</h3>
              <p className={styles.guaranteeText}>
                Si vous recevez un article défectueux ou différent de votre commande, nous le remplaçons ou vous remboursons intégralement, sans frais. Contactez-nous dans les 48h suivant la réception.
              </p>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
