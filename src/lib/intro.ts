/**
 * Introducción 3D (puerta de caoba). Valores compartidos entre el servidor,
 * la hoja de estilos, la escena WebGL y la generación del póster.
 */

/** Cookie de sesión: el servidor deja de enviar la introducción una vez vista. */
export const INTRO_COOKIE = "thony_intro";

/** Recursos propios de la escena. Procedencia en docs/ASSETS.md. */
export const introAssets = {
  woodColor: "/intro/caoba-color.webp",
  woodRoughness: "/intro/caoba-rugosidad.webp",
  posterLandscape: "/intro/puerta-horizontal.webp",
  posterPortrait: "/intro/puerta-vertical.webp",
} as const;

/**
 * Encuadre en metros. La cámara mantiene siempre visible una caja de
 * FRAME_W × FRAME_H centrada en la puerta. El póster se escala con la misma
 * regla en CSS, de modo que la imagen fija y el lienzo coinciden en cualquier
 * proporción de pantalla.
 */
export const introFrame = {
  width: 1.9,
  height: 3.3,
  centerY: 1.47,
  cameraDistance: 6.4,
  /** Cobertura en metros de cada póster alrededor del centro del encuadre. */
  posterLandscape: { width: 5.8667, height: 3.3 },
  posterPortrait: { width: 2.6, height: 4.42 },
} as const;

/**
 * Tiempos en milisegundos. No son editables desde el panel: la secuencia es
 * breve por diseño y nunca supera `deadline` desde el primer pintado.
 */
export const introTiming = {
  /** Fundido del lienzo sobre el póster. */
  canvasFade: 260,
  /** Pausa con la puerta cerrada, ya en 3D. */
  hold: 380,
  /** Giro de la hoja sobre sus bisagras. */
  open: 1850,
  /** La cámara empieza a avanzar con la hoja ya en movimiento. */
  dollyDelay: 520,
  dolly: 2150,
  /** Disolución hacia la portada; se solapa con el final del avance. */
  exit: 640,
  /** Duración total de la secuencia 3D una vez lista. */
  total: 2780,
  /** Si la escena no está lista en este plazo, se usa la salida sin WebGL. */
  readyBudget: 2100,
  /** Con un primer pintado más antiguo que esto, se sale sin iniciar WebGL. */
  lateMount: 2600,
  /** Límite absoluto desde el primer pintado. */
  deadline: 5000,
} as const;

export type IntroMode = "door" | "off";
export type IntroFrequency = "session" | "always";
