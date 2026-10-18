"use client";

import { MAX_UPLOAD_BYTES } from "./media-validation";
export type UploadedMedia = {
  path: string;
  url: string;
  mime: string;
  size: number;
};

export async function prepareMediaFile(file: File): Promise<File> {
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    if (file.size > MAX_UPLOAD_BYTES)
      throw new Error("El PDF supera 3 MB. Reduce su tamaño antes de subirlo.");
    return file;
  }
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type))
    throw new Error(
      "Usa una foto JPG, PNG, WebP o AVIF. Si está en HEIC, expórtala como JPG.",
    );
  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let release = () => {};
  try {
    const bitmap = await createImageBitmap(file);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    release = () => bitmap.close();
  } catch {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.src = url;
    try {
      await image.decode();
    } catch {
      URL.revokeObjectURL(url);
      throw new Error(
        "No se pudo leer esta foto. Expórtala como JPG o PNG y vuelve a elegirla.",
      );
    }
    source = image;
    width = image.naturalWidth;
    height = image.naturalHeight;
    release = () => URL.revokeObjectURL(url);
  }
  try {
    if (!width || !height)
      throw new Error("Esta imagen no contiene una foto válida.");
    if (
      Math.max(width, height) <= 2400 &&
      file.size <= 1500000 &&
      file.type !== "image/avif"
    )
      return file;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "El navegador no pudo preparar esta foto. Prueba con una imagen más pequeña.",
      );
    let scale = Math.min(1, 2400 / Math.max(width, height));
    const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, Math.max(0.58, 0.86 - attempt * 0.05)),
      );
      if (blob && blob.size <= MAX_UPLOAD_BYTES)
        return new File(
          [blob],
          `${file.name.replace(/\.[^.]+$/, "")}.${mime === "image/png" ? "png" : "jpg"}`,
          { type: mime },
        );
      scale *= 0.8;
    }
    throw new Error(
      "No se pudo reducir esta foto a 3 MB. Prueba con una copia más pequeña.",
    );
  } finally {
    release();
  }
}

/** La sesión se verifica en el servidor; el navegador solo habla con su propia web. */
export function uploadMediaFile(
  file: File,
  onProgress: (progress: number) => void,
  signal?: AbortSignal,
): Promise<UploadedMedia> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.withCredentials = true;
    xhr.timeout = 45000;
    const abort = () => xhr.abort();
    if (signal?.aborted) return reject(new Error("Subida cancelada."));
    signal?.addEventListener("abort", abort, { once: true });
    const cleanup = () => signal?.removeEventListener("abort", abort);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.min(95, Math.round((event.loaded / event.total) * 95)));
    };
    xhr.onerror = () => {
      cleanup();
      reject(
        new Error(
          "No se pudo contactar con la web. Tu formulario sigue aquí; revisa la conexión y reintenta.",
        ),
      );
    };
    xhr.ontimeout = () => {
      cleanup();
      reject(
        new Error(
          "La subida tardó demasiado. Conservamos tu selección para que puedas reintentar.",
        ),
      );
    };
    xhr.onabort = () => {
      cleanup();
      reject(new Error("Subida cancelada."));
    };
    xhr.onload = () => {
      cleanup();
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        return reject(
          new Error(
            xhr.status === 413
              ? "El archivo supera el límite del servidor. Elige uno de menos de 3 MB."
              : "El servidor no respondió correctamente. Reintenta la subida.",
          ),
        );
      }
      if (xhr.status < 200 || xhr.status >= 300 || !data.ok)
        return reject(new Error(data.error || "No se pudo subir el archivo."));
      onProgress(100);
      resolve(data);
    };
    const form = new FormData();
    form.set("file", file);
    xhr.send(form);
  });
}
