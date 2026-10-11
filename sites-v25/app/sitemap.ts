import type { MetadataRoute } from "next";

const base = "https://austrian-business-cycle-monitor.jimblogic.chatgpt.site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: "daily", priority: 1 },
    { url: `${base}/learn`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/learn/austrian-economics`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/learn/bitcoin-sovereignty`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
