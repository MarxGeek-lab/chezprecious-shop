"use client";

import { formatPrice } from "@/app/utils/format";
import { getShippingCost } from "@/app/utils/shipping";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Lock, ChevronRight, CreditCard, Smartphone, Loader2, AlertCircle } from "lucide-react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { useCart } from "@/app/store/cartStore";
import { ordersApi } from "@/app/lib/api";
import type { CreateOrderPayload } from "@/app/lib/api";
import { useAbandonedCart } from "@/app/hooks/useAbandonedCart";
import styles from "./page.module.scss";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "livraison" | "paiement" | "confirmation";
type PaymentMethod = "CARD" | "MOBILE_MONEY" | "PAYPAL" | "GOOGLE_PAY" | "APPLE_PAY";

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  notes: string;
  mode: "standard" | "express";
}

const EMPTY_SHIPPING: ShippingForm = {
  firstName: "", lastName: "", email: "", phone: "",
  address: "", zip: "", city: "", country: "Bénin",
  notes: "", mode: "standard",
};

const STEPS: { key: Step; label: string }[] = [
  { key: "livraison", label: "Livraison" },
  { key: "paiement",  label: "Paiement"  },
  { key: "confirmation", label: "Confirmation" },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; note?: string }[] = [
  {
    id: "CARD",
    label: "Carte bancaire",
    icon: <CreditCard size={18} strokeWidth={1.5} />,
    note: "Visa, Mastercard, CB",
  },
  {
    id: "MOBILE_MONEY",
    label: "Mobile Money",
    icon: <Smartphone size={18} strokeWidth={1.5} />,
    note: "MTN, Moov, Wave",
  },
  {
    id: "PAYPAL",
    label: "PayPal",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M7 5h8.5c2.5 0 4 1.5 3.5 4C18.5 12 16.5 13 14 13H11L10 19H7L7 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M4 8h7.5c2.5 0 4 1.5 3.5 4C14.5 15 12.5 16 10 16H7L6 22H3L4 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
    note: "Compte PayPal",
  },
  {
    id: "GOOGLE_PAY",
    label: "Google Pay",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 12V8.5A3.5 3.5 0 0 1 18.5 8.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    note: "Paiement Google",
  },
  {
    id: "APPLE_PAY",
    label: "Apple Pay",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 4C10.5 4 9.5 5 8.5 5C7.5 5 6 4 4.5 4C3 4 1.5 5.5 1.5 8C1.5 12 5 17 7 17C8 17 8.5 16.5 9.5 16.5C10.5 16.5 11 17 12 17C14.5 17 17.5 12 17.5 8C17.5 5.5 16 4 12 4Z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2C11 2 10 2.5 10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    note: "iPhone / Mac",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCard(val: string) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val: string) {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d;
}

// ─── Sous-composants (définis HORS du parent pour éviter le remount au re-render) ──

function Stepper({ stepIndex }: { stepIndex: number }) {
  return (
    <div className={styles.stepper}>
      {STEPS.map((s, i) => (
        <div key={s.key} className={styles.stepperItem}>
          <div className={`${styles.stepCircle} ${i < stepIndex ? styles.stepDone : ""} ${i === stepIndex ? styles.stepActive : ""}`}>
            {i < stepIndex ? <Check size={13} strokeWidth={2.5} /> : i + 1}
          </div>
          <span className={`${styles.stepLabel} ${i === stepIndex ? styles.stepLabelActive : ""}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={14} className={styles.stepArrow} />}
        </div>
      ))}
    </div>
  );
}

interface OrderSummaryProps {
  items: ReturnType<typeof useCart>["items"];
  totalPrice: number;
  shippingCost: number;
  total: number;
}
function OrderSummary({ items, totalPrice, shippingCost, total }: OrderSummaryProps) {
  return (
    <div className={styles.summary}>
      <h3 className={styles.summaryTitle}>Votre commande</h3>
      <div className={styles.summaryItems}>
        {items.map((item) => (
          <div key={`${item.productId}-${item.color}-${item.size}`} className={styles.summaryItem}>
            <div className={styles.summaryItemLeft}>
              {item.image && (
                <div className={styles.summaryItemImg}>
                  <Image src={item.image} alt={item.name} fill sizes="48px" className={styles.summaryItemImgEl} />
                </div>
              )}
              <span className={styles.summaryItemName}>
                {item.name}
                {item.size && <em> — {item.size}</em>}
                {" "}×{item.quantity}
              </span>
            </div>
            <span className={styles.summaryItemPrice}>{formatPrice((item.price * item.quantity))}</span>
          </div>
        ))}
      </div>
      <div className={styles.summaryLines}>
        <div className={styles.summaryLine}>
          <span>Sous-total</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>
        <div className={styles.summaryLine}>
          <span>Livraison</span>
          <span>{shippingCost === 0 ? "Offerte" : `${formatPrice(shippingCost)}`}</span>
        </div>
      </div>
      <div className={styles.summaryTotal}>
        <span>Total TTC</span>
        <span>{formatPrice(total)}</span>
      </div>
      <div className={styles.secureNote}>
        <Lock size={12} strokeWidth={1.5} />
        <span>Paiement 100% sécurisé</span>
      </div>
    </div>
  );
}

interface StepLivraisonProps {
  shipping: ShippingForm;
  shippingCost: number;
  onChange: (k: keyof ShippingForm, v: string) => void;
  onNext: () => void;
  onEmailChange?: (email: string) => void;
}
function StepLivraison({ shipping, shippingCost, onChange, onNext, onEmailChange }: StepLivraisonProps) {
  const valid = !!(shipping.firstName && shipping.lastName && shipping.email && shipping.address && shipping.zip && shipping.city);

  return (
    <form className={styles.form} onSubmit={(e) => { e.preventDefault(); if (valid) onNext(); }}>
      <h2 className={styles.formTitle}>Adresse de livraison</h2>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Prénom *</span>
          <input className={styles.input} value={shipping.firstName} onChange={(e) => onChange("firstName", e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Nom *</span>
          <input className={styles.input} value={shipping.lastName} onChange={(e) => onChange("lastName", e.target.value)} required />
        </label>
      </div>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Email *</span>
          <input className={styles.input} type="email" value={shipping.email} onChange={(e) => { onChange("email", e.target.value); onEmailChange?.(e.target.value); }} required />
        </label>
        <label className={styles.field}>
          <span>Téléphone</span>
          <input className={styles.input} type="tel" value={shipping.phone} onChange={(e) => onChange("phone", e.target.value)} />
        </label>
      </div>

      <label className={styles.field}>
        <span>Adresse *</span>
        <input className={styles.input} value={shipping.address} onChange={(e) => onChange("address", e.target.value)} required />
      </label>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Code postal *</span>
          <input className={styles.input} value={shipping.zip} onChange={(e) => onChange("zip", e.target.value)} required />
        </label>
        <label className={styles.field}>
          <span>Ville *</span>
          <input className={styles.input} value={shipping.city} onChange={(e) => onChange("city", e.target.value)} required />
        </label>
      </div>

      <label className={styles.field}>
        <span>Pays</span>
        <select className={styles.input} value={shipping.country} onChange={(e) => onChange("country", e.target.value)}>
          <option>Bénin</option>
          <option>Côte d&apos;Ivoire</option>
          <option>Sénégal</option>
          <option>Togo</option>
          <option>Cameroun</option>
          <option>Mali</option>
          <option>Burkina Faso</option>
          <option>Niger</option>
          <option>Guinée</option>
          <option>Maroc</option>
          <option>France</option>
          <option>Belgique</option>
          <option>Suisse</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Notes de livraison</span>
        <textarea className={`${styles.input} ${styles.textarea}`} value={shipping.notes}
          onChange={(e) => onChange("notes", e.target.value)} placeholder="Instructions particulières…" rows={2} />
      </label>

      <div className={styles.shippingModes}>
        <h3 className={styles.shippingModesTitle}>Mode de livraison</h3>
        <label className={`${styles.shippingMode} ${shipping.mode === "standard" ? styles.shippingModeActive : ""}`}>
          <input type="radio" name="mode" value="standard"
            checked={shipping.mode === "standard"} onChange={() => onChange("mode", "standard")} />
          <div className={styles.shippingModeBody}>
            <span className={styles.shippingModeName}>Standard — 3 à 5 jours ouvrés</span>
            <span className={styles.shippingModePrice}>
              {shippingCost === 0 ? <strong>Offerte</strong> : formatPrice(shippingCost)}
            </span>
          </div>
        </label>
      </div>

      <button type="submit" className={styles.submitBtn} disabled={!valid}>
        Continuer vers le paiement
      </button>
    </form>
  );
}

interface StepPaiementProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (m: PaymentMethod) => void;
  cardNumber: string; setCardNumber: (v: string) => void;
  cardHolder: string; setCardHolder: (v: string) => void;
  cardExpiry: string; setCardExpiry: (v: string) => void;
  cardCvv: string;   setCardCvv:   (v: string) => void;
  mobileNumber: string; setMobileNumber: (v: string) => void;
  total: number;
  loading: boolean;
  error: string;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}
function StepPaiement({
  paymentMethod, setPaymentMethod,
  cardNumber, setCardNumber,
  cardHolder, setCardHolder,
  cardExpiry, setCardExpiry,
  cardCvv, setCardCvv,
  mobileNumber, setMobileNumber,
  total, loading, error, onBack, onSubmit,
}: StepPaiementProps) {
  const isCardValid = cardNumber.replace(/\s/g, "").length === 16 && cardHolder && cardExpiry.length === 5 && cardCvv.length >= 3;
  const isMobileValid = mobileNumber.length >= 8;
  const isExternalValid = ["PAYPAL", "GOOGLE_PAY", "APPLE_PAY"].includes(paymentMethod);
  const canSubmit = paymentMethod === "CARD" ? isCardValid : paymentMethod === "MOBILE_MONEY" ? isMobileValid : isExternalValid;

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <h2 className={styles.formTitle}>Méthode de paiement</h2>

      {error && (
        <div className={styles.errorBox}>
          <AlertCircle size={14} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      <div className={styles.paymentMethods}>
        {PAYMENT_METHODS.map((pm) => (
          <button
            key={pm.id}
            type="button"
            className={`${styles.paymentMethod} ${paymentMethod === pm.id ? styles.paymentMethodActive : ""}`}
            onClick={() => setPaymentMethod(pm.id)}
          >
            <span className={styles.paymentMethodIcon}>{pm.icon}</span>
            <div className={styles.paymentMethodInfo}>
              <span className={styles.paymentMethodLabel}>{pm.label}</span>
              {pm.note && <span className={styles.paymentMethodNote}>{pm.note}</span>}
            </div>
            {paymentMethod === pm.id && (
              <span className={styles.paymentMethodCheck}><Check size={12} strokeWidth={2.5} /></span>
            )}
          </button>
        ))}
      </div>

      {paymentMethod === "CARD" && (
        <div className={styles.paymentFields}>
          <label className={styles.field}>
            <span>Numéro de carte *</span>
            <input className={styles.input} placeholder="0000 0000 0000 0000"
              value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} maxLength={19} required />
          </label>
          <label className={styles.field}>
            <span>Titulaire *</span>
            <input className={styles.input} placeholder="NOM PRÉNOM"
              value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} required />
          </label>
          <div className={styles.row2}>
            <label className={styles.field}>
              <span>Expiration *</span>
              <input className={styles.input} placeholder="MM/AA"
                value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} required />
            </label>
            <label className={styles.field}>
              <span>CVV *</span>
              <input className={styles.input} placeholder="000"
                value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} required />
            </label>
          </div>
        </div>
      )}

      {paymentMethod === "MOBILE_MONEY" && (
        <div className={styles.paymentFields}>
          <label className={styles.field}>
            <span>Numéro Mobile Money *</span>
            <input className={styles.input} type="tel" placeholder="+229 XX XX XX XX"
              value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
          </label>
          <p className={styles.paymentNote}>
            Vous recevrez une notification sur votre téléphone pour confirmer le paiement.
          </p>
        </div>
      )}

      {["PAYPAL", "GOOGLE_PAY", "APPLE_PAY"].includes(paymentMethod) && (
        <div className={styles.paymentFields}>
          <div className={styles.externalPayInfo}>
            <p>
              En cliquant sur &quot;Payer&quot;, vous serez redirigé vers{" "}
              {paymentMethod === "PAYPAL" ? "PayPal" : paymentMethod === "GOOGLE_PAY" ? "Google Pay" : "Apple Pay"}{" "}
              pour finaliser votre paiement en toute sécurité.
            </p>
            <p className={styles.comingSoon}>
              Intégration en cours — disponible prochainement.
            </p>
          </div>
        </div>
      )}

      <div className={styles.secureNote}>
        <Lock size={13} strokeWidth={1.5} />
        <span>Paiement sécurisé SSL — vos données sont chiffrées</span>
      </div>

      <div className={styles.formActions}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Retour
        </button>
        <button type="submit" className={styles.submitBtn} disabled={!canSubmit || loading}>
          {loading
            ? <><Loader2 size={15} className={styles.spin} /> Traitement…</>
            : <>Payer {total.toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</>
          }
        </button>
      </div>
    </form>
  );
}

interface StepConfirmationProps {
  orderResult: { orderNumber: string; email: string } | null;
  shipping: ShippingForm;
  total: number;
}
function StepConfirmation({ orderResult, shipping, total }: StepConfirmationProps) {
  return (
    <div className={styles.confirmation}>
      <div className={styles.confirmCheck}><Check size={28} strokeWidth={2.5} /></div>
      <h2 className={styles.confirmTitle}>Commande confirmée !</h2>
      <p className={styles.confirmSub}>
        Merci pour votre commande. Un email de confirmation a été envoyé à{" "}
        <strong>{orderResult?.email || shipping.email}</strong>.
      </p>
      {orderResult && (
        <div className={styles.confirmDetails}>
          <div className={styles.confirmRow}>
            <span>Numéro de commande</span>
            <strong>{orderResult.orderNumber}</strong>
          </div>
          <div className={styles.confirmRow}>
            <span>Livraison</span>
            <strong>{shipping.mode === "express" ? "Express (24-48h)" : "Standard (3-5 jours)"}</strong>
          </div>
          {shipping.address && (
            <div className={styles.confirmRow}>
              <span>Adresse</span>
              <strong>{shipping.address}, {shipping.zip} {shipping.city}</strong>
            </div>
          )}
          <div className={styles.confirmRow}>
            <span>Total payé</span>
            <strong>{total.toLocaleString("fr-FR", { style: "currency", currency: "XOF" })}</strong>
          </div>
        </div>
      )}
      <div className={styles.confirmActions}>
        <Link href="/account/orders" className={styles.submitBtn}>
          Voir mes commandes
        </Link>
        <Link href="/" className={styles.backBtn}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { saveCart, markConverted } = useAbandonedCart();
  const [step, setStep] = useState<Step>("livraison");
  const [shipping, setShipping] = useState<ShippingForm>(EMPTY_SHIPPING);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CARD");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderResult, setOrderResult] = useState<{ orderNumber: string; email: string } | null>(null);

  const shippingCost = getShippingCost(totalItems);
  const total = totalPrice + shippingCost;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const handleShippingChange = (k: keyof ShippingForm, v: string) =>
    setShipping((p) => ({ ...p, [k]: v }));

  const handleEmailChange = (email: string) => {
    if (email && items.length > 0) {
      saveCart(email, shipping.firstName || undefined, items);
    }
  };
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const backendMethod =
        paymentMethod === "PAYPAL" || paymentMethod === "GOOGLE_PAY" || paymentMethod === "APPLE_PAY"
          ? "FEEXPAY_WALLET"
          : paymentMethod;

      const payload: CreateOrderPayload = {
        customerEmail: shipping.email,
        customerFirstName: shipping.firstName,
        customerLastName: shipping.lastName,
        customerPhone: shipping.phone || "+22900000000",
        shippingAddress: `${shipping.address}, ${shipping.zip}`,
        shippingCity: shipping.city,
        shippingCountry: shipping.country,
        shippingNotes: shipping.notes || undefined,
        paymentMethod: backendMethod as CreateOrderPayload["paymentMethod"],
        paymentProvider:
          paymentMethod === "MOBILE_MONEY" ? "MTN"
          : paymentMethod === "PAYPAL" ? "PayPal"
          : paymentMethod === "GOOGLE_PAY" ? "GooglePay"
          : paymentMethod === "APPLE_PAY" ? "ApplePay"
          : undefined,
        mobileNumber: paymentMethod === "MOBILE_MONEY" ? mobileNumber : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantData: item.size || item.color ? { size: item.size, color: item.color } : undefined,
        })),
      };

      const res = await ordersApi.create(payload);
      clearCart();

      // Si un compte a été créé automatiquement, connecter l'utilisateur
      if (res.data.accountCreated && res.data.token && res.data.user) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      }

      markConverted(shipping.email);
      setOrderResult({ orderNumber: res.data.order.orderNumber, email: shipping.email });
      setStep("confirmation");
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && step !== "confirmation") {
    return (
      <main className={styles.main}>
        <Container maxWidth="lg">
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <h1 style={{ marginBottom: "1rem" }}>Votre panier est vide</h1>
            <Link href="/shop" className={styles.submitBtn} style={{ display: "inline-flex" }}>
              Découvrir la boutique
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <Container maxWidth="lg">
        <Stepper stepIndex={stepIndex} />

        {step === "confirmation" ? (
          <StepConfirmation orderResult={orderResult} shipping={shipping} total={total} />
        ) : (
          <Grid container spacing={{ xs: 4, lg: 6 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              {step === "livraison" && (
                <StepLivraison
                  shipping={shipping}
                  shippingCost={shippingCost}
                  onChange={handleShippingChange}
                  onNext={() => setStep("paiement")}
                  onEmailChange={handleEmailChange}
                />
              )}
              {step === "paiement" && (
                <StepPaiement
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cardNumber={cardNumber} setCardNumber={setCardNumber}
                  cardHolder={cardHolder} setCardHolder={setCardHolder}
                  cardExpiry={cardExpiry} setCardExpiry={setCardExpiry}
                  cardCvv={cardCvv}       setCardCvv={setCardCvv}
                  mobileNumber={mobileNumber} setMobileNumber={setMobileNumber}
                  total={total}
                  loading={loading}
                  error={error}
                  onBack={() => setStep("livraison")}
                  onSubmit={handlePaymentSubmit}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <OrderSummary
                items={items}
                totalPrice={totalPrice}
                shippingCost={shippingCost}
                total={total}
              />
            </Grid>
          </Grid>
        )}
      </Container>
    </main>
  );
}
