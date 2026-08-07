import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./engine.css";
import "./academy.css";
import "./workspace.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://austrian-business-cycle-monitor.jimblogic.chatgpt.site"),
  title: { default: "Austrian Business Cycle Monitor · Verifiable macro intelligence", template: "%s · ABCM" },
  description: "Official monetary, credit, production and hard-asset data with reproducible formulas, source-level provenance and an explicitly labelled Austrian interpretation.",
  keywords: ["Austrian Business Cycle Theory", "ABCT", "FRED", "Bitcoin", "M2", "credit cycle", "macroeconomics"],
  authors: [{ name: "JimBLogic", url: "https://github.com/JimBLogic" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website", locale: "es_ES", alternateLocale: "en_US", url: "/",
    siteName: "Austrian Business Cycle Monitor", title: "ABCM · The cycle, decoded",
    description: "Official data, reproducible calculations and a clearly separated Austrian interpretation.",
  },
  twitter: { card: "summary", title: "Austrian Business Cycle Monitor", description: "Verifiable macro intelligence through an Austrian and cypherpunk lens." },
  robots: { index: true, follow: true },
  other: {
    "codex-preview": "development",
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
          operatingSystem: "Web", url: "https://austrian-business-cycle-monitor.jimblogic.chatgpt.site",
          codeRepository: "https://github.com/JimBLogic/AustrianBusinessCycleMonitor",
          author: { "@type": "Person", name: "JimBLogic" }, isAccessibleForFree: true,
          license: "https://opensource.org/licenses/MIT",
        }) }} />
        {children}
      </body>
    </html>
  );
}
