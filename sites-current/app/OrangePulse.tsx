"use client";

import { useEffect } from "react";

/** One shared peripheral layer. Native actions never wait for feedback. */
export function OrangePulse() {
  useEffect(() => {
    const halo = document.createElement("div");
    halo.className = "orange-pulse";
    halo.setAttribute("aria-hidden", "true");
    document.body.append(halo);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    let timer: number | undefined;
    let previous: HTMLElement | null = null;
    let lastActivation = 0;
    const clear = () => {
      animation?.cancel();
      animation = undefined;
      window.clearTimeout(timer);
      halo.style.opacity = "0";
    };
    const activate = (event: Event) => {
      const target = event.target instanceof Element
        ? event.target.closest<HTMLElement>('button,a[href],summary,input:not([type="hidden"]),select,textarea,[role="button"],[role="tab"]')
        : null;
      if (!target || target.closest('[inert],[aria-disabled="true"]') || target.matches(":disabled")) return;
      if (target === previous && performance.now() - lastActivation < 50) return;
      previous = target;
      lastActivation = performance.now();
      clear();
      const rect = target.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      Object.assign(halo.style, {
        left: `${rect.left}px`, top: `${rect.top}px`,
        width: `${rect.width}px`, height: `${rect.height}px`,
        borderRadius: getComputedStyle(target).borderRadius,
      });
      if (motion.matches || typeof halo.animate !== "function") {
        halo.style.opacity = "0.65";
        timer = window.setTimeout(clear, 180);
      } else {
        animation = halo.animate([
          { opacity: 0, offset: 0 },
          { opacity: 0.75, offset: 0.35 },
          { opacity: 0, offset: 1 },
        ], { duration: 400, easing: "ease-out" });
      }
    };
    document.addEventListener("click", activate, { passive: true });
    document.addEventListener("change", activate, { passive: true });
    document.addEventListener("scroll", clear, { capture: true, passive: true });
    window.addEventListener("resize", clear, { passive: true });
    motion.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("click", activate);
      document.removeEventListener("change", activate);
      document.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
      motion.removeEventListener("change", clear);
      halo.remove();
    };
  }, []);
  return null;
}
