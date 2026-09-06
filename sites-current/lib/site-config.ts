declare const __ABCM_PUBLIC_ORIGIN__: string;
export const SITE_ORIGIN = typeof __ABCM_PUBLIC_ORIGIN__ === "string" ? __ABCM_PUBLIC_ORIGIN__ : "https://austrian-business-cycle-monitor.jimblogic.chatgpt.site";
export const IS_SITES_HOST = new URL(SITE_ORIGIN).hostname.endsWith(".chatgpt.site");
