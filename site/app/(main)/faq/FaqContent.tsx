"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import styles from "./page.module.scss";

const CATEGORIES = [
  {
    label: "Commandes",
    items: [
      { q: "Comment passer une commande ?", a: "Parcourez notre boutique, ajoutez vos articles au panier, puis validez votre commande en renseignant vos informations de livraison et de paiement. Un email de confirmation vous sera envoyé immédiatement." },
      { q: "Puis-je modifier ou annuler ma commande ?", a: "Vous pouvez modifier ou annuler votre commande dans l'heure qui suit sa passation, depuis votre espace compte. Passé ce délai, la commande est en cours de préparation et ne peut plus être modifiée." },
      { q: "Comment suivre ma commande ?", a: "Dès l'expédition de votre colis, vous recevrez un email avec un numéro de suivi. Vous pouvez également suivre l'état de vos commandes depuis votre espace compte." },
    ],
  },
  {
    label: "Livraison",
    items: [
      { q: "Quels sont les délais de livraison ?", a: "La livraison standard est effectuée sous 3 à 5 jours ouvrés." },
      { q: "La livraison est-elle gratuite ?", a: "Oui ! La livraison standard est offerte à partir de 4 produits achetés. En dessous, les frais de livraison sont de 2 500 F CFA." },
      { q: "Livrez-vous partout en France ?", a: "Nous livrons dans toute la France métropolitaine ainsi qu'en Belgique, Suisse et Luxembourg. D'autres destinations européennes sont en cours d'ajout." },
    ],
  },
  {
    label: "Retours & Remboursements",
    items: [
      { q: "Quelle est la politique de retour ?", a: "Vous disposez de 30 jours à compter de la réception de votre commande pour retourner un article non porté, dans son emballage d'origine. Les retours sont gratuits." },
      { q: "Comment initier un retour ?", a: "Connectez-vous à votre espace compte, rendez-vous dans Mes commandes, sélectionnez l'article concerné et suivez les instructions. Une étiquette de retour vous sera envoyée par email." },
      { q: "Sous quel délai suis-je remboursé(e) ?", a: "Le remboursement est effectué sous 5 à 10 jours ouvrés après réception et vérification de l'article retourné, sur le moyen de paiement utilisé lors de la commande." },
    ],
  },
  {
    label: "Produits & Tailles",
    items: [
      { q: "Comment choisir ma taille ?", a: "Chaque fiche produit dispose d'un guide des tailles avec les mensurations correspondantes. En cas de doute, nous conseillons de prendre la taille au-dessus." },
      { q: "Les produits sont-ils en stock ?", a: "Tous les articles affichés sur le site sont disponibles en stock. Si un article est épuisé, vous pouvez activer une alerte de disponibilité depuis la fiche produit." },
      { q: "Les couleurs sur les photos sont-elles fidèles ?", a: "Nous faisons notre maximum pour que les couleurs affichées correspondent à la réalité. De légères variations peuvent exister selon les calibrages d'écran." },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`${styles.item} ${open ? styles.itemOpen : ""}`}>
      <button className={styles.question} onClick={() => setOpen(v => !v)}>
        <span>{q}</span>
        {open ? <Minus size={16} strokeWidth={2} /> : <Plus size={16} strokeWidth={2} />}
      </button>
      {open && <p className={styles.answer}>{a}</p>}
    </div>
  );
}

export default function FaqContent() {
  const [active, setActive] = useState(0);

  return (
    <main className={styles.main}>

      <div className={styles.hero}>
        <span className={styles.eyebrow}>Centre d'aide</span>
        <h1 className={styles.heroTitle}>Questions fréquentes</h1>
        <p className={styles.heroSub}>Trouvez rapidement les réponses à vos questions.</p>
      </div>

      <div className={styles.layout}>
        <nav className={styles.tabs}>
          {CATEGORIES.map((cat, i) => (
            <button
              key={cat.label}
              className={`${styles.tab} ${i === active ? styles.tabActive : ""}`}
              onClick={() => setActive(i)}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        <div className={styles.items}>
          {CATEGORIES[active].items.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </div>

      <div className={styles.contactBanner}>
        <p className={styles.contactText}>Vous n'avez pas trouvé la réponse que vous cherchiez ?</p>
        <a href="/contact" className={styles.contactBtn}>Contacter le support</a>
      </div>

    </main>
  );
}
