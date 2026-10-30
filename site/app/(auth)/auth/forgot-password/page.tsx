"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { authApi } from "@/app/lib/api";
import styles from "../page.module.scss";

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className={styles.errorBox}><span>{msg}</span></div>;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* Gauche éditoriale */}
      <div className={styles.left}>
        <div className={styles.leftInner}>
          <Link href="/" className={styles.brand}>AG<span>M</span></Link>
          <blockquote className={styles.quote}>
            <p>L&apos;élégance, c&apos;est ne pas être remarquée,</p>
            <p>c&apos;est être mémorisée.</p>
          </blockquote>
          <p className={styles.quoteAuthor}>— Yves Saint Laurent</p>
        </div>
        <Image
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&q=85"
          alt="Collection ChezPrecious"
          fill
          className={styles.leftImage}
          priority
        />
        <div className={styles.leftOverlay} />
      </div>

      {/* Droite */}
      <div className={styles.right}>
        <Link href="/auth" className={styles.homeBack}>← Connexion</Link>

        <div className={styles.formWrap}>
          {sent ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}><Mail size={32} strokeWidth={1.5} /></div>
              <h2 className={styles.formTitle}>Email envoyé</h2>
              <p className={styles.formSub}>
                Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation a été envoyé.
                Vérifiez votre boîte mail et vos spams.
              </p>
              <Link href="/auth" className={styles.submitBtn} style={{ display: "inline-flex", justifyContent: "center" }}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Mot de passe oublié</h1>
                <p className={styles.formSub}>
                  Saisissez votre email et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <ErrorMsg msg={error} />

                <div className={styles.field}>
                  <label className={styles.label}>Adresse email</label>
                  <div className={styles.inputWrap}>
                    <Mail size={15} strokeWidth={1.5} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading
                    ? <><Loader2 size={15} className={styles.spin} /> Envoi…</>
                    : <>Envoyer le lien <ArrowRight size={15} strokeWidth={2} /></>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
