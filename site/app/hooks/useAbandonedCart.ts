import { useCallback, useRef } from "react";
import api from "@/app/lib/api";
import type { CartItem } from "@/app/store/cartStore";

const DEBOUNCE_MS = 2000;

export function useAbandonedCart() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveCart = useCallback(
    (email: string, firstName: string | undefined, cartItems: CartItem[]) => {
      if (!email || cartItems.length === 0) return;

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        console.log("[AbandonedCart] saveCart →", { email, firstName, itemCount: cartItems.length });
        api
          .post("/carts/save", {
            email,
            firstName: firstName ?? null,
            cartItems: cartItems.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
              image: item.image ?? "",
              color: item.color,
              size: item.size,
              quantity: item.quantity,
            })),
          })
          .then((res) => console.log("[AbandonedCart] saveCart ✓", res.data))
          .catch((err) => console.error("[AbandonedCart] saveCart ✗", err?.response?.data ?? err.message));
      }, DEBOUNCE_MS);
    },
    []
  );

  const markConverted = useCallback((email: string) => {
    if (!email) return;
    api.post("/carts/converted", { email }).catch(() => {});
  }, []);

  return { saveCart, markConverted };
}
