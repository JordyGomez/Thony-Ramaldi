import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAdminUser } from "@/lib/supabase/server";
import { requireAdmin, AdminError } from "@/lib/admin-access";
import { treoAssets, treoPropertyInput } from "@/data/treo-ii";
import type { Property } from "@/data/properties";
import { TreoShowcase } from "@/components/project/treo-showcase";
import { getSiteSettings } from "@/data/get-site-settings";
import styles from "@/components/project/project.module.css";
export const metadata = {
  title: "TREO II · Vista previa privada",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Preview() {
  const { user } = await getAdminUser();
  if (!user) redirect("/admin/login");
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError && e.status === 403) notFound();
    throw e;
  }
  const input = treoPropertyInput(),
    settings = await getSiteSettings();
  const property: Property = {
    ...input,
    currency: "USD",
    images: treoAssets,
    brochure: undefined,
  };
  return (
    <>
      <div className={styles.previewBanner}>
        Vista previa privada del material preparado · No modifica la publicación
        actual ·{" "}
        <Link href="/admin/proyectos/treo-ii">Volver a preparación</Link>
      </div>
      <TreoShowcase
        property={property}
        whatsapp={settings.texts.whatsapp}
        advisorName={settings.texts.name}
        preview
      />
    </>
  );
}
