"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Profundidad solo con puntero fino, sin ahorro de datos y dentro del viewport. */
export function DepthPlane({ children, className = "" }: { children: ReactNode; className?: string }) {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = scene.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const media = matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    // En móvil y con movimiento reducido no se crean observadores ni listeners.
    if (!media.matches) return;
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    if (device.connection?.saveData || (device.deviceMemory && device.deviceMemory <= 4)) return;
    let visible = false;
    let frame = 0;
    let x = 0;
    let y = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      element.removeAttribute("data-depth-active");
      for (const name of ["--scene-x", "--scene-y", "--scene-scroll"]) element.style.removeProperty(name);
    };
    const update = () => {
      if (!visible || !media.matches || document.hidden || frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        const progress = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
        element.dataset.depthActive = "true";
        element.style.setProperty("--scene-x", `${x * 1.4}deg`);
        element.style.setProperty("--scene-y", `${y * -1.1}deg`);
        element.style.setProperty("--scene-scroll", `${progress * 22}px`);
      });
    };
    const pointer = (event: PointerEvent) => {
      if (!visible || !media.matches) return;
      const rect = element.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      update();
    };
    const leave = () => { x = 0; y = 0; update(); };
    const availability = () => {
      if (!media.matches || document.hidden) reset();
      else update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) update();
      else reset();
    });
    observer.observe(element);
    element.addEventListener("pointermove", pointer, { passive: true });
    element.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", update, { passive: true });
    media.addEventListener("change", availability);
    document.addEventListener("visibilitychange", availability);
    return () => {
      reset();
      observer.disconnect();
      element.removeEventListener("pointermove", pointer);
      element.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", update);
      media.removeEventListener("change", availability);
      document.removeEventListener("visibilitychange", availability);
    };
  }, []);
  return <div ref={scene} className={`depth-plane ${className}`}>{children}</div>;
}
