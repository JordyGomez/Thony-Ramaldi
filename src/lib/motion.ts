// Un mismo ritmo, con intensidades distintas según el contenido.
export const editorialEase = [0.22, 1, 0.36, 1] as const;
export const motionTiming = { fast: 0.2, normal: 0.4, reveal: 0.7 } as const;

export const entryEvents = {
  start: "thony:entry-start",
  reveal: "thony:entry-reveal",
} as const;
