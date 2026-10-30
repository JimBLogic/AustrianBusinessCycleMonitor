/// <reference types="vite/client" />
import type { D1Binding } from "../db/runtime";
/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Binding;
  FRED_API_KEY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "worker-src 'none'",
    "upgrade-insecure-requests",
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy":
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

function withSecurityHeaders(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  const url = new URL(request.url);
  // A plain-HTTP loopback self-host server has no TLS endpoint. WebKit upgrades
  // its scripts and API requests otherwise, preventing hydration entirely.
  // Public origins retain the production policy, including forced upgrades.
  const httpLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  // The managed preview is HTTP too. Vite removes this development-only
  // exception from the production bundle; a public/production Host cannot opt in.
  const managedDevelopmentPreview = import.meta.env.DEV && url.hostname === "terminal.local";
  if (url.protocol === "http:" && (httpLoopback || managedDevelopmentPreview)) {
    headers.set("Content-Security-Policy", SECURITY_HEADERS["Content-Security-Policy"].replace("; upgrade-insecure-requests", ""));
  }
  headers.delete("Server");
  headers.delete("X-Powered-By");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    (globalThis as unknown as { __ABCM_RUNTIME_ENV__: Env & {waitUntil:(promise:Promise<unknown>)=>void} }).__ABCM_RUNTIME_ENV__ = {...env,waitUntil:ctx.waitUntil.bind(ctx)};
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(response, request);
    }

    return withSecurityHeaders(await handler.fetch(request, env, ctx), request);
  },
};

export default worker;
