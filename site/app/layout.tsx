import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { CartProvider as StoreCartProvider } from "./store/cartStore";
import { QueryProvider } from "@/app/context/QueryProvider";
import { AuthProvider } from "@/app/context/AuthContext";
import { WishlistProvider } from "@/app/context/WishlistContext";
import { CartProvider } from "@/app/context/CartContext";
import "./globals.scss";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const apiUrl = process.env.API_BACKEND_URL ?? "http://localhost:3333";
    const res = await fetch(`${apiUrl}/api/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("settings fetch failed");
    const { settings } = await res.json();
    return {
      title: settings.metaTitle ?? `${settings.siteName} — Collection`,
      description: settings.metaDescription ?? settings.siteSlogan ?? "Vêtements premium",
    };
  } catch {
    return { title: "Chez Precious — Collection", description: "Vêtements premium" };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <AppRouterCacheProvider>
        <QueryProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <StoreCartProvider>
                  {children}
                </StoreCartProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </QueryProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
