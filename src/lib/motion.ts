// Un mismo ritmo, con intensidades distintas según el contenido.
export const editorialEase = [0.22, 1, 0.36, 1] as const;
export const motionTiming = { fast: 0.2, normal: 0.4, reveal: 0.7, image: 0.9, stagger: 0.06 } as const;
export const entryTiming = { sequence: 1600, exit: 500, deadline: 5000 } as const;

export const entryEvents = {
  start: "thony:entry-start",
  reveal: "thony:entry-reveal",
} as const;
