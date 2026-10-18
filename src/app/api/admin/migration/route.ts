import { readFile } from "node:fs/promises";
import { adminFailure, requireAdmin } from "@/lib/admin-access";
export async function GET() {
  try {
    await requireAdmin();
    const sql = await readFile(
      process.cwd() + "/supabase/migrations/20261018_site_editor.sql",
      "utf8",
    );
    return new Response(sql, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=thony-editor-web.sql",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return adminFailure(error);
  }
}
