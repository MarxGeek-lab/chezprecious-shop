"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useCart } from "@/app/store/cartStore";
import type { CartItem } from "@/app/store/cartStore";
import api from "@/app/lib/api";

function RecoverContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const router = useRouter();
  const { addItem, clearCart } = useCart();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide ou expiré.");
      return;
    }

    api.get<{ cartData: CartItem[] }>(`/carts/recover/${token}`)
      .then((res) => {
        const items: CartItem[] = res.data.cartData ?? [];
        clearCart();
        items.forEach((item) => addItem(item));
        setStatus("success");
        setTimeout(() => router.replace("/cart"), 1500);
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        const msg = err?.response?.data?.message;
        setStatus("error");
        setMessage(msg || "Ce lien est invalide ou a déjà été utilisé.");
      });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main style={{
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "16px",
      padding: "40px 20px",
      fontFamily: "inherit",
    }}>
      {status === "loading" && (
        <>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: "#0F5C4A" }} />
          <p style={{ fontSize: "16px", color: "#6b7280" }}>Récupération de votre panier…</p>
        </>
      )}
      {status === "success" && (
        <>
          <CheckCircle size={48} style={{ color: "#2a7a3b" }} strokeWidth={1.5} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#1A1A2E" }}>Panier récupéré !</h1>
          <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>Vous allez être redirigé vers votre panier…</p>
          <ShoppingBag size={20} style={{ color: "#0F5C4A" }} strokeWidth={1.5} />
        </>
      )}
      {status === "error" && (
        <>
          <XCircle size={48} style={{ color: "#e05353" }} strokeWidth={1.5} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#1A1A2E" }}>Lien invalide</h1>
          <p style={{ fontSize: "15px", color: "#6b7280", margin: 0 }}>{message}</p>
          <a href="/shop" style={{
            marginTop: "8px",
            padding: "12px 28px",
            background: "#0F5C4A",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
          }}>
            Retour à la boutique
          </a>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

export default function CartRecoverPage() {
  return (
    <Suspense>
      <RecoverContent />
    </Suspense>
  );
}
