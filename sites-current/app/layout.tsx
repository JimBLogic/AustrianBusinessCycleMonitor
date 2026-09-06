import { SITE_ORIGIN } from "@/lib/site-config";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./engine.css";
import "./academy.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: "Austrian Business Cycle Monitor · Análisis macro verificable", template: "%s · ABCM" },
  description: "Monitor verificable del ciclo económico: política monetaria, crédito, economía real y activos duros con fuentes públicas e interpretación austriaca separada de los datos.",
  keywords: ["ciclo económico", "teoría austriaca del ciclo económico", "ABCT", "política monetaria", "mercados de crédito", "economía real", "FRED", "Bitcoin", "M2"],
  authors: [{ name: "JimBLogic", url: "https://github.com/JimBLogic" }],
  creator: "JimBLogic",
  publisher: "JimBLogic",
  alternates: {
    canonical: "/",
    languages: {},
  },
  openGraph: {
    type: "website", locale: "es_ES", alternateLocale: "en_US", url: "/",
    siteName: "Austrian Business Cycle Monitor", title: "ABCM · El ciclo, descifrado",
    description: "Datos oficiales, cálculos reproducibles e interpretación austriaca claramente separada de la evidencia.",
  },
  twitter: { card: "summary", title: "Austrian Business Cycle Monitor", description: "Análisis macro verificable con una lente austriaca y cypherpunk." },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "theme-color": "#f3f0e5",
    "color-scheme": "light",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "SoftwareApplication",
          name: "Austrian Business Cycle Monitor", applicationCategory: "FinanceApplication",
          operatingSystem: "Web", url: SITE_ORIGIN,
          codeRepository: "https://github.com/JimBLogic/AustrianBusinessCycleMonitor",
          author: { "@type": "Person", name: "JimBLogic" }, isAccessibleForFree: true,
          license: "https://opensource.org/licenses/MIT", inLanguage: ["es", "en"],
          description: "Monitor verificable del ciclo económico con datos públicos e interpretación austriaca diferenciada.",
        }) }} />
        {children}
      </body>
    </html>
  );
}
