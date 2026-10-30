"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { authApi } from "@/app/lib/api";
import styles from "./page.module.scss";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "login" | "register";
type View = Tab | "forgot" | "reset" | "confirm";

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function usePassword() {
  const [show, setShow] = useState(false);
  return { show, toggle: () => setShow((v) => !v) };
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className={styles.errorBox}>
      <AlertCircle size={14} strokeWidth={2} />
      <span>{msg}</span>
    </div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialView = (searchParams.get("view") as View) ?? "login";
  const resetToken = searchParams.get("token") ?? "";

  const [view, setView] = useState<View>(resetToken ? "reset" : initialView);

  // Rediriger si déjà connecté
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) router.replace("/");
  }, [router]);

  return (
    <main className={styles.main}>
      {/* ── Partie gauche — éditoriale ── */}
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
          alt="Collection Chez Precious"
          fill
          className={styles.leftImage}
          priority
        />
        <div className={styles.leftOverlay} />
      </div>

      {/* ── Partie droite — formulaires ── */}
      <div className={styles.right}>
        <Link href="/" className={styles.homeBack} aria-label="Retour à l'accueil">
          ← Accueil
        </Link>
        {view === "login"    && <LoginForm    onSwitch={setView} />}
        {view === "register" && <RegisterForm onSwitch={setView} />}
        {view === "forgot"   && <ForgotForm   onSwitch={setView} />}
        {view === "reset"    && <ResetForm    onSwitch={setView} token={resetToken} />}
        {view === "confirm"  && <ConfirmView  onSwitch={setView} />}
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthContent />
    </Suspense>
  );
}

// ─── Onglets Login / Register ────────────────────────────────────────────────

function Tabs({ active, onSwitch }: { active: Tab; onSwitch: (v: View) => void }) {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${active === "login" ? styles.tabActive : ""}`}
        onClick={() => onSwitch("login")}
      >
        Connexion
      </button>
      <button
        className={`${styles.tab} ${active === "register" ? styles.tabActive : ""}`}
        onClick={() => onSwitch("register")}
      >
        Créer un compte
      </button>
    </div>
  );
}

// ─── Connexion ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const router = useRouter();
  const pwd = usePassword();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login({ email: form.email, password: form.password });
      const { token, user } = res.data;
      if (token && user) {
        localStorage.setItem("auth_token", token);
        localStorage.setItem("auth_user", JSON.stringify(user));
        router.replace("/");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 403 && msg?.includes("email")) {
        setError("Votre compte n'est pas encore activé. Vérifiez votre boîte mail.");
      } else {
        setError(msg || "Identifiants incorrects. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrap}>
      <Tabs active="login" onSwitch={onSwitch} />

      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Bon retour</h1>
        <p className={styles.formSub}>Connectez-vous à votre compte Chez Precious</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ErrorMsg msg={error} />

        <div className={styles.field}>
          <label className={styles.label}>Adresse email</label>
          <div className={styles.inputWrap}>
            <Mail size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input
              className={styles.input} type="email" placeholder="votre@email.com"
              value={form.email} onChange={(e) => upd("email", e.target.value)} required
            />
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label className={styles.label}>Mot de passe</label>
            <Link href="/auth/forgot-password" className={styles.link}>
              Mot de passe oublié ?
            </Link>
          </div>
          <div className={styles.inputWrap}>
            <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input
              className={styles.input} type={pwd.show ? "text" : "password"}
              placeholder="••••••••" value={form.password}
              onChange={(e) => upd("password", e.target.value)} required
            />
            <button type="button" className={styles.eyeBtn} onClick={pwd.toggle} aria-label="Voir">
              {pwd.show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading
            ? <><Loader2 size={15} className={styles.spin} /> Connexion…</>
            : <>Se connecter <ArrowRight size={15} strokeWidth={2} /></>
          }
        </button>
      </form>

      <p className={styles.switchText}>
        Pas encore de compte ?{" "}
        <button className={styles.link} onClick={() => onSwitch("register")}>Créer un compte</button>
      </p>
    </div>
  );
}

// ─── Inscription ─────────────────────────────────────────────────────────────

function RegisterForm({ onSwitch }: { onSwitch: (v: View) => void }) {
  const pwd = usePassword();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", newsletter: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upd = (k: keyof typeof form, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
      });
      onSwitch("confirm");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (err?.response?.status === 409) {
        setError("Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.");
      } else {
        setError(msg || "Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formWrap}>
      <Tabs active="register" onSwitch={onSwitch} />

      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Créer un compte</h1>
        <p className={styles.formSub}>Rejoignez la communauté Chez Precious</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ErrorMsg msg={error} />

        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>Prénom</label>
            <div className={styles.inputWrap}>
              <User size={15} strokeWidth={1.5} className={styles.inputIcon} />
              <input className={styles.input} placeholder="Prénom"
                value={form.firstName} onChange={(e) => upd("firstName", e.target.value)} required />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Nom</label>
            <div className={styles.inputWrap}>
              <User size={15} strokeWidth={1.5} className={styles.inputIcon} />
              <input className={styles.input} placeholder="Nom"
                value={form.lastName} onChange={(e) => upd("lastName", e.target.value)} required />
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Adresse email</label>
          <div className={styles.inputWrap}>
            <Mail size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input className={styles.input} type="email" placeholder="votre@email.com"
              value={form.email} onChange={(e) => upd("email", e.target.value)} required />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Mot de passe</label>
          <div className={styles.inputWrap}>
            <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input
              className={styles.input} type={pwd.show ? "text" : "password"}
              placeholder="8 caractères minimum" value={form.password}
              onChange={(e) => upd("password", e.target.value)} minLength={8} required
            />
            <button type="button" className={styles.eyeBtn} onClick={pwd.toggle} aria-label="Voir">
              {pwd.show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={form.newsletter as boolean}
            onChange={(e) => upd("newsletter", e.target.checked)} />
          <span>Recevoir nos nouveautés et offres exclusives</span>
        </label>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading
            ? <><Loader2 size={15} className={styles.spin} /> Création…</>
            : <>Créer mon compte <ArrowRight size={15} strokeWidth={2} /></>
          }
        </button>

        <p className={styles.terms}>
          En créant un compte, vous acceptez nos{" "}
          <Link href="/cgv" className={styles.link}>Conditions générales de vente</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className={styles.link}>Politique de confidentialité</Link>.
        </p>
      </form>

      <p className={styles.switchText}>
        Déjà un compte ?{" "}
        <button className={styles.link} onClick={() => onSwitch("login")}>Se connecter</button>
      </p>
    </div>
  );
}

// ─── Force du mot de passe ───────────────────────────────────────────────────

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

// ─── Mot de passe oublié ─────────────────────────────────────────────────────

function ForgotForm({ onSwitch }: { onSwitch: (v: View) => void }) {
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

  if (sent) {
    return (
      <div className={styles.formWrap}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}><Mail size={24} strokeWidth={1.5} /></div>
          <h2 className={styles.formTitle}>Email envoyé</h2>
          <p className={styles.formSub}>
            Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation a été envoyé.
            Vérifiez votre boîte mail (et vos spams).
          </p>
          <button className={styles.submitBtn} onClick={() => onSwitch("login")}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <button className={styles.backLink} onClick={() => onSwitch("login")}>
        ← Retour à la connexion
      </button>

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
            <input className={styles.input} type="email" placeholder="votre@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading
            ? <><Loader2 size={15} className={styles.spin} /> Envoi…</>
            : <>Envoyer le lien <ArrowRight size={15} strokeWidth={2} /></>
          }
        </button>
      </form>
    </div>
  );
}

// ─── Réinitialisation du mot de passe ────────────────────────────────────────

function ResetForm({ onSwitch, token }: { onSwitch: (v: View) => void; token: string }) {
  const pwd1 = usePassword();
  const pwd2 = usePassword();
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

  if (done) {
    return (
      <div className={styles.formWrap}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}><Check size={24} strokeWidth={2} /></div>
          <h2 className={styles.formTitle}>Mot de passe mis à jour</h2>
          <p className={styles.formSub}>Votre mot de passe a été réinitialisé avec succès.</p>
          <button className={styles.submitBtn} onClick={() => onSwitch("login")}>
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formWrap}>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Nouveau mot de passe</h1>
        <p className={styles.formSub}>Choisissez un mot de passe sécurisé.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <ErrorMsg msg={error} />

        <div className={styles.field}>
          <label className={styles.label}>Nouveau mot de passe</label>
          <div className={styles.inputWrap}>
            <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input className={styles.input} type={pwd1.show ? "text" : "password"}
              placeholder="8 caractères minimum" value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} minLength={8} required />
            <button type="button" className={styles.eyeBtn} onClick={pwd1.toggle} aria-label="Voir">
              {pwd1.show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Confirmer le mot de passe</label>
          <div className={styles.inputWrap}>
            <Lock size={15} strokeWidth={1.5} className={styles.inputIcon} />
            <input className={styles.input} type={pwd2.show ? "text" : "password"}
              placeholder="Répéter le mot de passe" value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))} required />
            <button type="button" className={styles.eyeBtn} onClick={pwd2.toggle} aria-label="Voir">
              {pwd2.show ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
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
    </div>
  );
}

// ─── Confirmation email ──────────────────────────────────────────────────────

function ConfirmView({ onSwitch }: { onSwitch: (v: View) => void }) {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  return (
    <div className={styles.formWrap}>
      <div className={styles.successBox}>
        <div className={styles.successIcon}><Mail size={28} strokeWidth={1.5} /></div>
        <h2 className={styles.formTitle}>Confirmez votre email</h2>
        <p className={styles.formSub}>
          Un email de confirmation a été envoyé à votre adresse. Cliquez sur le lien pour activer votre compte.
        </p>
        <p className={styles.formSub} style={{ marginTop: 0 }}>
          Vous n&apos;avez pas reçu l&apos;email ?{" "}
          <button
            className={styles.link}
            disabled={resending || resent}
            onClick={async () => {
              setResending(true);
              await new Promise((r) => setTimeout(r, 800));
              setResending(false);
              setResent(true);
            }}
          >
            {resent ? "Email renvoyé ✓" : resending ? "Envoi…" : "Renvoyer"}
          </button>
        </p>
        <button className={styles.submitBtn} onClick={() => onSwitch("login")}>
          Retour à la connexion
        </button>
      </div>
    </div>
  );
}
