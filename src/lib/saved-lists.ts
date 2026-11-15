"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Listas guardadas en el navegador del visitante (favoritos y comparador).
 * No requieren cuenta ni envían nada al servidor.
 */
const EVENT = "thony:saved-lists";
const EMPTY: string[] = [];
const cache = new Map<string, { raw: string | null; list: string[] }>();

function read(key: string): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY;
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.list;
  let list = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed))
      list = parsed
        .filter((item): item is string => typeof item === "string")
        .slice(0, 100);
  } catch {
    list = EMPTY;
  }
  cache.set(key, { raw, list });
  return list;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export const FAVORITES_KEY = "thony-favoritos";
export const COMPARE_KEY = "thony-comparar";
export const COMPARE_MAX = 4;

export function useSavedList(key: string, max = 100) {
  const list = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  );
  const write = useCallback(
    (next: string[]) => {
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        return false;
      }
      window.dispatchEvent(new Event(EVENT));
      return true;
    },
    [key],
  );
  const toggle = useCallback(
    (slug: string) => {
      const current = read(key);
      if (current.includes(slug))
        return write(current.filter((item) => item !== slug));
      if (current.length >= max) return false;
      return write([...current, slug]);
    },
    [key, max, write],
  );
  const clear = useCallback(() => write([]), [write]);
  return { list, toggle, clear };
}
