"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { authApi } from "@/app/lib/api";
import styles from "../page.module.scss";

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div className={styles.errorBox}><span>{msg}</span></div>;
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const labels = ["", "Faible", "Moyen", "Bon", "Fort"];
  const colors = ["", "#e05353", "#e0a853", "#5fa05f", "#2a7a3b"];
  if (!password) return null;
  return (
    <div className={styles.pwdStrength}>
      <div className={styles.pwdBars}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={styles.pwdBar}
            style={{ backgroundColor: n <= score ? colors[score] : "rgba(10,10,10,0.1)" }} />
        ))}
      </div>
      <span className={styles.pwdLabel} style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const match = form.password === form.confirm && form.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match) return;
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password: form.password });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Lien invalide ou expiré. Recommencez la procédure.");
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
          src="/uploads/products/catalogue/w7-super7-rose-or.webp"
          alt="Produits ChezPrecious"
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
          {done ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon} style={{ color: "#2a7a3b" }}>
                <Check size={40} strokeWidth={2} />
              </div>
              <h2 className={styles.formTitle}>Mot de passe mis à jour</h2>
              <p className={styles.formSub}>Votre mot de passe a été réinitialisé avec succès.</p>
              <Link href="/auth" className={styles.submitBtn} style={{ display: "inline-flex", justifyContent: "center" }}>
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Nouveau mot de passe</h1>
                <p className={styles.formSub}>Choisissez un mot de passe sécurisé pour votre compte.</p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit}>
                <ErrorMsg msg={error} />

                <div className={styles.field}>
                  <label className={styles.label}>Nouveau mot de passe</label>
                  <div className={styles.inputWrap}>
                    <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type={show1 ? "text" : "password"}
                      placeholder="8 caractères minimum"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      minLength={8}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShow1(v => !v)} aria-label="Voir">
                      {show1 ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.password} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Confirmer le mot de passe</label>
                  <div className={styles.inputWrap}>
                    <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      type={show2 ? "text" : "password"}
                      placeholder="Répéter le mot de passe"
                      value={form.confirm}
                      onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShow2(v => !v)} aria-label="Voir">
                      {show2 ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
                    </button>
                  </div>
                  {form.confirm && !match && (
                    <p className={styles.errorMsg}>Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <button type="submit" className={styles.submitBtn} disabled={!match || loading}>
                  {loading
                    ? <><Loader2 size={15} className={styles.spin} /> Enregistrement…</>
                    : <>Réinitialiser <ArrowRight size={15} strokeWidth={2} /></>
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

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}
