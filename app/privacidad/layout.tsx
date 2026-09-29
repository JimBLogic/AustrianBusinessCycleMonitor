import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad y almacenamiento local",
  description:
    "Privacidad de ABCM: preferencias locales, métricas automáticas de ChatGPT Sites, datos macro compartidos y fuentes públicas.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
