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

const SITE_URL = "https://chezprecious.com";
const SITE_NAME = "ChezPrecious";

// Métadonnées communes : aperçu des liens partagés (WhatsApp, Facebook, X…).
// L'image vient de app/opengraph-image.tsx.
function buildMetadata(title: string, description: string): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      url: SITE_URL,
      siteName: SITE_NAME,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const DEFAULT_TITLE = "ChezPrecious — Produits naturels santé & beauté";
const DEFAULT_DESCRIPTION = "Compléments alimentaires, soins et café enrichi SAG7 International. Des produits naturels pour votre énergie, votre équilibre et votre beauté. Livraison rapide au Bénin.";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const apiUrl = process.env.API_BACKEND_URL ?? "http://localhost:3333";
    const res = await fetch(`${apiUrl}/api/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error("settings fetch failed");
    const { settings } = await res.json();
    return buildMetadata(
      settings.metaTitle ?? DEFAULT_TITLE,
      settings.metaDescription ?? settings.siteSlogan ?? DEFAULT_DESCRIPTION,
    );
  } catch {
    return buildMetadata(DEFAULT_TITLE, DEFAULT_DESCRIPTION);
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
