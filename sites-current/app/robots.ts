import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/workspace"] },
    sitemap: "https://austrian-business-cycle-monitor.jimblogic.chatgpt.site/sitemap.xml",
  };
}
