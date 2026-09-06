import { SITE_ORIGIN } from "@/lib/site-config";
import type { MetadataRoute } from "next";

const base = SITE_ORIGIN;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/learn`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/learn/austrian-economics`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/learn/bitcoin-sovereignty`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.4 },
  ];
}
