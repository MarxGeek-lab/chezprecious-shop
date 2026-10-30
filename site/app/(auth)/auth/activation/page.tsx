"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";
import { authApi } from "@/app/lib/api";
import styles from "../page.module.scss";

function ActivationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien d'activation invalide ou manquant.");
      return;
    }

    authApi.activateAccount(token)
      .then(() => {
        setStatus("success");
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message;
        setStatus("error");
        setMessage(msg || "Ce lien est invalide ou a déjà été utilisé.");
      });
  }, [token]);

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

      {/* Droite — résultat activation */}
      <div className={styles.right}>
        <Link href="/" className={styles.homeBack}>← Accueil</Link>

        <div className={styles.formWrap}>
          {status === "loading" && (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>
                <Loader2 size={32} className={styles.spin} />
              </div>
              <h1 className={styles.formTitle}>Activation en cours…</h1>
              <p className={styles.formSub}>Veuillez patienter quelques instants.</p>
            </div>
          )}

          {status === "success" && (
            <div className={styles.successBox}>
              <div className={styles.successIcon} style={{ color: "#2a7a3b" }}>
                <CheckCircle size={40} strokeWidth={1.5} />
              </div>
              <h1 className={styles.formTitle}>Compte activé !</h1>
              <p className={styles.formSub}>
                Votre compte ChezPrecious est maintenant actif. Vous pouvez vous connecter.
              </p>
              <Link href="/auth" className={styles.submitBtn} style={{ display: "inline-flex", justifyContent: "center" }}>
                Se connecter
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className={styles.successBox}>
              <div className={styles.successIcon} style={{ color: "#e05353" }}>
                <XCircle size={40} strokeWidth={1.5} />
              </div>
              <h1 className={styles.formTitle}>Activation échouée</h1>
              <p className={styles.formSub}>{message}</p>
              <p className={styles.formSub} style={{ marginTop: 0 }}>
                Si le problème persiste, contactez-nous à{" "}
                <a href="mailto:contact@chezprecious.com" className={styles.link}>contact@chezprecious.com</a>.
              </p>
              <Link href="/auth" className={styles.submitBtn} style={{ display: "inline-flex", justifyContent: "center" }}>
                Retour à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ActivationPage() {
  return (
    <Suspense>
      <ActivationContent />
    </Suspense>
  );
}
