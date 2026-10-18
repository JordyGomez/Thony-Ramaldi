import { randomUUID } from "node:crypto";
import {
  AdminError,
  adminFailure,
  adminJson,
  checkOrigin,
  requireAdmin,
} from "@/lib/admin-access";
import {
  detectMediaFormat,
  MAX_UPLOAD_BYTES,
  storageErrorMessage,
} from "@/lib/media-validation";
import { STORAGE_BUCKET, storagePublicUrl } from "@/lib/supabase/env";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { supabase } = await requireAdmin();
    if (
      Number(request.headers.get("content-length")) >
      MAX_UPLOAD_BYTES + 65536
    )
      throw new AdminError(
        "El archivo es demasiado grande. La subida admite hasta 3 MB por archivo.",
        413,
      );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size)
      throw new AdminError("Selecciona una foto o un folleto PDF.");
    if (file.size > MAX_UPLOAD_BYTES)
      throw new AdminError(
        "El archivo supera 3 MB. Reduce el tamaño y reintenta.",
        413,
      );
    const format = detectMediaFormat(
      new Uint8Array(await file.slice(0, 16).arrayBuffer()),
    );
    if (!format)
      throw new AdminError(
        "Formato no compatible. Usa JPG, PNG, WebP o PDF; convierte las fotos HEIC a JPG.",
        415,
      );
    const path = `media/${randomUUID()}.${format.extension}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        contentType: format.mime,
        upsert: false,
        cacheControl: "31536000",
      });
    if (error)
      throw new AdminError(
        storageErrorMessage(error),
        Number(error.statusCode) === 403 ? 403 : 503,
      );
    return adminJson(
      {
        ok: true,
        path,
        url: storagePublicUrl(path),
        mime: format.mime,
        size: file.size,
      },
      201,
    );
  } catch (error) {
    return adminFailure(error);
  }
}
export async function GET(request: Request) {
  try {
    const { supabase } = await requireAdmin();
    const offset = Math.max(
      0,
      Math.min(
        100000,
        Number(new URL(request.url).searchParams.get("offset")) || 0,
      ),
    );
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list("media", {
        limit: 48,
        offset,
        sortBy: { column: "created_at", order: "desc" },
      });
    if (error) throw new AdminError(storageErrorMessage(error), 503);
    return adminJson({
      ok: true,
      files: (data || [])
        .filter((file) => file.id)
        .map((file) => ({
          name: file.name,
          path: `media/${file.name}`,
          url: storagePublicUrl(`media/${file.name}`),
          mime: file.metadata?.mimetype || "",
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
        })),
      hasMore: data?.length === 48,
    });
  } catch (error) {
    return adminFailure(error);
  }
}
