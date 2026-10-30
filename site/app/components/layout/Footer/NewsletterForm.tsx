"use client";

import { useState, FormEvent } from "react";
import { newsletterApi } from "@/app/lib/api";
import styles from "./Footer.module.scss";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || status === "loading") return;

    setStatus("loading");
    try {
      const { data } = await newsletterApi.subscribe({ email });
      setStatus("success");
      setMessage(data.message || "Inscription réussie !");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.response?.data?.message || "Une erreur est survenue.");
    }
  };

  if (status === "success") {
    return (
      <p className={styles.newsletterSuccess}>
        {message}
      </p>
    );
  }

  return (
    <form className={styles.newsletterForm} onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Votre adresse e-mail"
        className={styles.input}
        aria-label="Adresse e-mail"
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
        required
        disabled={status === "loading"}
      />
      <button type="submit" className={styles.submitBtn} disabled={status === "loading"}>
        {status === "loading" ? "..." : "S'inscrire"}
      </button>
      {status === "error" && (
        <p className={styles.newsletterError}>{message}</p>
      )}
    </form>
  );
}
