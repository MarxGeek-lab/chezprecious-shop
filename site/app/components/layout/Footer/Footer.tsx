"use client";

import Link from "next/link";
import NewsletterForm from "./NewsletterForm";
import { usePublicSettings } from "@/app/hooks/usePublicSettings";
import styles from "./Footer.module.scss";

const LINKS = {
  boutique: {
    title: "Boutique",
    items: [
      { label: "Nouveautés", href: "/shop?filter=new" },
      { label: "Femme", href: "/shop?cat=femme" },
      { label: "Homme", href: "/shop?cat=homme" },
      { label: "Tous les produits", href: "/shop" },
    ],
  },
  aide: {
    title: "Aide",
    items: [
      { label: "Livraison & retours", href: "/livraison" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

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

  const siteName = settings?.siteName ?? "Chez Precious";
  const tagline = settings?.siteSlogan ?? "Vêtements premium. Design épuré. Qualité sans compromis.";
  const address = [settings?.address, settings?.city].filter(Boolean).join(", ") || null;
  const email = settings?.contactEmail ?? null;
  const phone = settings?.phoneMain ?? null;

  const socials = SOCIAL_KEYS
    .map((key) => ({ key, label: key.charAt(0).toUpperCase() + key.slice(1), href: settings?.[key] }))
    .filter((s) => s.href);

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        {/* Branding + Contact */}
        <div className={styles.brand}>
          <Link href="/" className={styles.logo}>
            <img 
              src={"/images/logo/logo_footer.png"} 
              alt={"Chez Precious"} 
              width={100} height={"auto"} />
          </Link>
          <p className={styles.tagline}>{tagline}</p>

          {/* Réseaux sociaux */}
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

          {/* Adresse & contact */}
          <div className={styles.contact}>
            {address && (
              <p className={styles.contactItem}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                {address}
              </p>
            )}
            {email && (
              <a href={`mailto:${email}`} className={styles.contactLink}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                {email}
              </a>
            )}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className={styles.contactLink}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.56a16 16 0 0 0 6.53 6.53l1.06-.93a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {phone}
              </a>
            )}
          </div>
        </div>

        {/* Colonnes liens */}
        {Object.values(LINKS).map((col) => (
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

        {/* Newsletter */}
        <div className={styles.col}>
          <span className={styles.newsletterTitle}>Newsletter</span>
          <p className={styles.newsletterSub}>
            Accédez en avant-première aux nouvelles collections.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copy}>
          © {new Date().getFullYear()} {siteName}. Tous droits réservés.
        </p>
        <nav className={styles.legal}>
          <Link href="/mentions" className={styles.legalLink}>Mentions légales</Link>
          <Link href="/confidentialite" className={styles.legalLink}>Confidentialité</Link>
        </nav>
      </div>
    </footer>
  );
}
