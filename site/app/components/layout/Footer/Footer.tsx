"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, MessageCircle, Phone, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { whatsappLink } from "@/app/utils/format";
import NewsletterForm from "./NewsletterForm";
import { usePublicSettings } from "@/app/hooks/usePublicSettings";
import styles from "./Footer.module.scss";

const COLUMNS = [
  {
    title: "Boutique",
    items: [
      { label: "Compléments", href: "/shop?cat=complements-alimentaires" },
      { label: "Soins & beauté", href: "/shop?cat=soins-beaute" },
      { label: "Café", href: "/shop?cat=cafe-boissons" },
      { label: "Tous les produits", href: "/shop" },
    ],
  },
  {
    title: "Aide",
    items: [
      { label: "Livraison & retours", href: "/livraison" },
      { label: "FAQ", href: "/faq" },
      { label: "Avis clients", href: "/avis" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Mon compte",
    items: [
      { label: "Connexion", href: "/auth" },
      { label: "Mes commandes", href: "/account/orders" },
      { label: "Mes favoris", href: "/account/wishlist" },
      { label: "À propos", href: "/about" },
    ],
  },
];

const PERKS = [
  { icon: Truck, label: "Livraison offerte dès 4 produits achetés" },
  { icon: RotateCcw, label: "Retours gratuits 30 jours" },
  { icon: ShieldCheck, label: "Paiement sécurisé" },
];

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  tiktok: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.91a8.16 8.16 0 0 0 4.77 1.52V7a4.85 4.85 0 0 1-1-.31z"/>
    </svg>
  ),
  facebook: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  youtube: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
    </svg>
  ),
  twitter: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.742-8.855L1.813 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
    </svg>
  ),
};

const SOCIAL_KEYS = ["instagram", "tiktok", "facebook", "youtube", "twitter", "linkedin"] as const;

export default function Footer() {
  const { data: settings } = usePublicSettings();

  const siteName = settings?.siteName ?? "ChezPrecious";
  const tagline = settings?.siteSlogan ?? "Des produits naturels pour votre santé, votre énergie et votre beauté au quotidien.";
  const address = [settings?.address, settings?.city].filter(Boolean).join(", ") || null;
  const email = settings?.contactEmail ?? null;
  const phone = settings?.phoneMain ?? null;
  const whatsapp = settings?.phoneWhatsapp ?? null;

  const socials = SOCIAL_KEYS
    .map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), href: settings?.[key] }))
    .filter((s) => s.href);

  return (
    <footer className={styles.footer}>
      {/* Bandeau newsletter */}
      <div className={styles.newsletterBand}>
        <div className={styles.newsletterInner}>
          <div>
            <p className={styles.newsletterTitle}>Rejoignez le cercle <em>ChezPrecious</em></p>
            <p className={styles.newsletterSub}>
              Nouveautés, offres et ventes privées : recevez-les en avant-première.
            </p>
          </div>
          <NewsletterForm />
        </div>
      </div>

      <div className={styles.top}>
        {/* Marque + contact */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo} aria-label="ChezPrecious — Accueil">
            <Image src="/logo-light.png" alt="Golden Precious" width={900} height={271} />
          </Link>
          <p className={styles.tagline}>{tagline}</p>

          <div className={styles.contact}>
            {address && (
              <p className={styles.contactItem}>
                <MapPin size={15} strokeWidth={1.75} />
                {address}
              </p>
            )}
            {email && (
              <a href={`mailto:${email}`} className={styles.contactItem}>
                <Mail size={15} strokeWidth={1.75} />
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={styles.contactItem}>
                <Phone size={15} strokeWidth={1.75} />
                {phone}
              </a>
            )}
            {whatsapp && (
              <a href={whatsappLink(whatsapp)} className={styles.contactItem} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} strokeWidth={1.75} />
                WhatsApp : {whatsapp}
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <div className={styles.socials}>
              {socials.map((s) => (
                <a key={s.key} href={s.href!} className={styles.socialBtn}
                  aria-label={s.label} target="_blank" rel="noopener noreferrer">
                  {SOCIAL_ICONS[s.key]}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Colonnes liens */}
        {COLUMNS.map((col) => (
          <div key={col.title} className={styles.col}>
            <span className={styles.colTitle}>{col.title}</span>
            <ul className={styles.colLinks}>
              {col.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.colLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.perks}>
        {PERKS.map(({ icon: Icon, label }) => (
          <span key={label} className={styles.perk}>
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </span>
        ))}
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          © {new Date().getFullYear()} {siteName}. Tous droits réservés.
        </p>
        {/* Liens légaux masqués pour le moment (contenus à mettre à jour)
        <nav className={styles.legal}>
          <Link href="/mentions" className={styles.legalLink}>Mentions légales</Link>
          <Link href="/confidentialite" className={styles.legalLink}>Confidentialité</Link>
          <Link href="/livraison" className={styles.legalLink}>CGV & retours</Link>
        </nav>
        */}
      </div>
    </footer>
  );
}
