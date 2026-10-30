import type { Metadata } from "next";
import FaqContent from "./FaqContent";

export const metadata: Metadata = { title: "FAQ — Chez Precious" };

export default function FaqPage() {
  return <FaqContent />;
}
