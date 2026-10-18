export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
export type MediaFormat = { mime: string; extension: string };
/** Se comprueban los bytes, no la extensión ni el MIME que envía el navegador. */
export function detectMediaFormat(bytes: Uint8Array): MediaFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return { mime: "image/jpeg", extension: "jpg" };
  if (
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  )
    return { mime: "image/png", extension: "png" };
  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP")
    return { mime: "image/webp", extension: "webp" };
  if (ascii(0, 5) === "%PDF-")
    return { mime: "application/pdf", extension: "pdf" };
  return null;
}
export function storageErrorMessage(error: {
  message?: string;
  status?: number;
  statusCode?: string | number;
}) {
  const message = (error.message || "").toLowerCase();
  const status = Number(error.statusCode || error.status);
  if (/bucket.*not found|bucket.*exist/.test(message))
    return "Falta el almacén de fotos «properties». Ejecuta la configuración de almacenamiento de Supabase.";
  if (status === 401 || /jwt|token.*expired/.test(message))
    return "Tu sesión terminó. Vuelve a entrar al panel y reintenta la subida.";
  if (
    status === 403 ||
    /row.level|policy|unauthorized|permission/.test(message)
  )
    return "Supabase rechazó la subida por permisos. Revisa que tu correo esté en admin_users y que las políticas del almacén properties estén instaladas.";
  if (status === 413 || /size|too large/.test(message))
    return "La foto supera el límite del almacenamiento. Elige una imagen más pequeña o revisa el límite del bucket properties.";
  if (/mime|content.type|type.*not.*allowed/.test(message))
    return "El almacenamiento no admite este formato. Permite JPG, PNG, WebP y PDF en el bucket properties.";
  return "No se pudo contactar con el almacenamiento. Tu formulario sigue intacto; reintenta la subida o comprueba el estado de Supabase.";
}
