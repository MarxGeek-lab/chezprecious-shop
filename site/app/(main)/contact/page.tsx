"use client";

import { useState } from "react";
import { MapPin, Mail, Phone, Clock, Send, Check } from "lucide-react";
import { usePublicSettings } from "@/app/hooks/usePublicSettings";
import styles from "./page.module.scss";

export default function ContactPage() {
  const { data: settings } = usePublicSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  };

  return (
    <main className={styles.main}>

      {/* Hero */}
      <div className={styles.hero}>
        <span className={styles.eyebrow}>Nous contacter</span>
        <h1 className={styles.heroTitle}>Une question ?<br />Nous sommes là.</h1>
        <p className={styles.heroSub}>Notre équipe vous répond sous 24 heures ouvrées.</p>
      </div>

      <div className={styles.layout}>

        {/* Infos */}
        <aside className={styles.sidebar}>
          {([
            {
              icon: MapPin,
              label: "Adresse",
              value: settings
                ? [settings.address, settings.city, settings.country].filter(Boolean).join(", ") || null
                : null,
            },
            {
              icon: Mail,
              label: "Email",
              value: settings?.contactEmail ?? null,
              href: settings?.contactEmail ? `mailto:${settings.contactEmail}` : undefined,
            },
            {
              icon: Phone,
              label: "Téléphone",
              value: settings?.phoneMain ?? null,
              href: settings?.phoneMain ? `tel:${settings.phoneMain.replace(/\s/g, "")}` : undefined,
            },
            {
              icon: Clock,
              label: "Horaires",
              value: settings?.businessHours ?? null,
            },
          ] as { icon: React.ElementType; label: string; value: string | null; href?: string }[])
            .filter((item) => item.value)
            .map(({ icon: Icon, label, value, href }) => (
              <div key={label} className={styles.infoCard}>
                <div className={styles.infoIcon}><Icon size={18} strokeWidth={1.5} /></div>
                <div>
                  <p className={styles.infoLabel}>{label}</p>
                  {href
                    ? <a href={href} className={styles.infoValue}>{value}</a>
                    : <p className={styles.infoValue}>{value}</p>
                  }
                </div>
              </div>
            ))
          }

          <div className={styles.mapBox}>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=2.39%2C6.34%2C2.43%2C6.38&layer=mapnik"
              className={styles.map}
              title="Localisation Chez Precious"
              loading="lazy"
            />
          </div>
        </aside>

        {/* Formulaire */}
        <div className={styles.formWrap}>
          {sent ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}><Check size={28} strokeWidth={2} /></div>
              <h2 className={styles.successTitle}>Message envoyé !</h2>
              <p className={styles.successText}>Merci de nous avoir contactés. Nous vous répondrons dans les 24 heures ouvrées.</p>
              <button className={styles.successBtn} onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                Nouveau message
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}>Envoyer un message</h2>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Nom complet</label>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder="Jean Dupont"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="jean@exemple.com"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Sujet</label>
                <select
                  className={styles.input}
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                >
                  <option value="">Choisir un sujet…</option>
                  <option>Commande & livraison</option>
                  <option>Retour & remboursement</option>
                  <option>Produit & taille</option>
                  <option>Partenariat</option>
                  <option>Autre</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Message</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  placeholder="Décrivez votre demande…"
                  required
                  rows={6}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                />
              </div>

              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? "Envoi en cours…" : <><Send size={15} strokeWidth={1.5} /> Envoyer le message</>}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
