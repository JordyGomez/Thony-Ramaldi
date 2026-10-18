"use client";
import { useEffect } from "react";
import { useSite } from "./site-provider";

/** Un controlador por página: sin bucle continuo, cursor falso ni scroll bloqueado. */
export function MotionDirector() {
  const { settings } = useSite();
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".site-experience");
    if (!root || settings.experience.motion === "off") return;
    const media = matchMedia("(prefers-reduced-motion: no-preference)");
    const pointerMedia = matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px)",
    );
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, listener: EventListener) => void;
        removeEventListener?: (type: string, listener: EventListener) => void;
      };
    };
    const surfaces = new Set<HTMLElement>();
    const visible = new Set<HTMLElement>();
    let frame = 0;
    let pointer: { element: HTMLElement; x: number; y: number } | null = null;
    const eligible = () =>
      media.matches &&
      !device.connection?.saveData &&
      !(device.deviceMemory && device.deviceMemory <= 4) &&
      !document.hidden;
    const reset = (element: HTMLElement) => {
      element.removeAttribute("data-depth-active");
      ["--tilt-x", "--tilt-y", "--parallax-y"].forEach((key) =>
        element.style.removeProperty(key),
      );
    };
    const update = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!eligible()) {
          surfaces.forEach(reset);
          root.dataset.motionReady = "false";
          return;
        }
        root.dataset.motionReady = "true";
        visible.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const progress = Math.max(
            -1,
            Math.min(
              1,
              (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight,
            ),
          );
          const amount = settings.experience.motion === "expressive" ? 1 : 0.35;
          element.style.setProperty(
            "--parallax-y",
            `${progress * (pointerMedia.matches ? 35 : 12) * amount}px`,
          );
          if (pointerMedia.matches) element.dataset.depthActive = "true";
          if (pointer?.element === element && pointerMedia.matches) {
            element.style.setProperty(
              "--tilt-x",
              `${pointer.x * 4 * amount}deg`,
            );
            element.style.setProperty(
              "--tilt-y",
              `${-pointer.y * 3 * amount}deg`,
            );
          }
        });
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(element);
          else {
            visible.delete(element);
            reset(element);
          }
        });
        update();
      },
      { rootMargin: "40px" },
    );
    const discover = () => {
      surfaces.forEach((element) => {
        if (!element.isConnected) {
          observer.unobserve(element);
          surfaces.delete(element);
          visible.delete(element);
        }
      });
      root
        .querySelectorAll<HTMLElement>(
          ".depth-plane,.property-image-link,.showcase-image,.footer-image,.gallery-main",
        )
        .forEach((element) => {
          if (!surfaces.has(element)) {
            surfaces.add(element);
            observer.observe(element);
          }
        });
    };
    const onPointer = (event: PointerEvent) => {
      if (!pointerMedia.matches || !eligible()) return;
      const element = (event.target as Element).closest<HTMLElement>(
        ".depth-plane,.property-image-link,.showcase-image,.footer-image,.gallery-main",
      );
      if (pointer && pointer.element !== element) {
        reset(pointer.element);
        pointer = null;
      }
      if (!element || !visible.has(element)) return;
      const rect = element.getBoundingClientRect();
      pointer = {
        element,
        x: Math.max(
          -1,
          Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
        ),
        y: Math.max(
          -1,
          Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
        ),
      };
      update();
    };
    const clearPointer = () => {
      if (pointer) reset(pointer.element);
      pointer = null;
      update();
    };
    discover();
    const mutations = new MutationObserver(discover);
    mutations.observe(root, { childList: true, subtree: true });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    root.addEventListener("pointermove", onPointer, { passive: true });
    root.addEventListener("pointerleave", clearPointer);
    media.addEventListener("change", update);
    pointerMedia.addEventListener("change", clearPointer);
    document.addEventListener("visibilitychange", update);
    device.connection?.addEventListener?.("change", update);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      surfaces.forEach(reset);
      root.removeAttribute("data-motion-ready");
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      root.removeEventListener("pointermove", onPointer);
      root.removeEventListener("pointerleave", clearPointer);
      media.removeEventListener("change", update);
      pointerMedia.removeEventListener("change", clearPointer);
      document.removeEventListener("visibilitychange", update);
      device.connection?.removeEventListener?.("change", update);
    };
  }, [settings.experience.motion]);
  return null;
}
