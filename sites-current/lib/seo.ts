import type { Metadata } from "next";
import { SITE_ORIGIN } from "./site-config";
export function pageMetadata(path: string, title: string, description: string): Metadata {
  return { metadataBase: new URL(SITE_ORIGIN), title, description,
    alternates: { canonical: path, languages: {} },
    openGraph: { type: "website", url: path, title, description, locale: "es_ES", siteName: "Austrian Business Cycle Monitor" },
    twitter: {card: "summary", title, description} };
}
