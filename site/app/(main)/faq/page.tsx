import type { Metadata } from "next";
import FaqContent from "./FaqContent";

export const metadata: Metadata = { title: "FAQ — ChezPrecious" };

export default function FaqPage() {
  return <FaqContent />;
}
