import { ImageResponse } from "next/og";

// Bannière affichée quand on partage un lien de la boutique (WhatsApp, Facebook…)
export const alt = "ChezPrecious — Boutique de mode en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7B1E3A 0%, #5A1229 100%)",
          color: "#FFFFFF",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "10px 28px",
            borderRadius: 999,
            border: "2px solid rgba(255,255,255,0.35)",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Boutique en ligne
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 132, fontWeight: 700 }}>
          Chez
          <span style={{ color: "#F4BCCB", fontStyle: "italic", marginLeft: 8 }}>Precious</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: "rgba(255,255,255,0.85)" }}>
          Révélez votre élégance au quotidien
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 28, color: "rgba(255,255,255,0.7)" }}>
          chezprecious.com
        </div>
      </div>
    ),
    size,
  );
}
