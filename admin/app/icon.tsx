import { ImageResponse } from "next/og";

// Favicon ChezPrecious : monogramme « CP » sur fond rouge vin
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          background: "#FF2C2C",
          color: "#FFFFFF",
          fontSize: 34,
          fontWeight: 700,
          fontFamily: "serif",
        }}
      >
        CP
      </div>
    ),
    size,
  );
}
