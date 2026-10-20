import { notFound } from "next/navigation";
import { requirePlatform } from "@/lib/platform-access";
import { parseCorporateSettings, parseAgentContent } from "@/lib/platform";
import type { PropertyRow } from "@/data/property-row";
import {
  CorporateFrame,
  CorporateHome,
  AgentDirectory,
  CorporateAgent,
  CorporateProperty,
} from "@/components/corporate-portal";
export default async function CorporatePreviewContent({
  params,
}: {
  params: Promise<{ route?: string[] }>;
}) {
  const context = await requirePlatform("superadmin").catch(() => null);
  if (!context) notFound();
  const { supabase, access } = context;
  const [settings, profiles, properties, members] = await Promise.all([
    supabase
      .from("site_mode_settings")
      .select("draft")
      .eq("mode", "ramaldi")
      .single(),
    supabase
      .from("agent_profiles")
      .select("user_id,published_slug,published_content")
      .eq("organization_id", access.organizationId)
      .not("published_content", "is", null)
      .eq("public_enabled", true),
    supabase
      .from("properties")
      .select("*")
      .eq("organization_id", access.organizationId)
      .eq("published", true)
      .eq("workflow_state", "published")
      .eq("ramaldi_visible", true)
      .eq("demo", false)
      .eq("price_provisional", false),
    supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", access.organizationId)
      .eq("status", "active"),
  ]);
  if ([settings, profiles, properties, members].some((r) => r.error))
    throw new Error("No se pudo cargar la vista privada.");
  const active = new Set(members.data?.map((m) => m.user_id));
  const s = parseCorporateSettings(settings.data?.draft || {});
  const agents = (profiles.data || [])
    .filter((a) => active.has(a.user_id))
    .map((a) => ({
      userId: a.user_id,
      slug: a.published_slug,
      content: parseAgentContent(a.published_content),
    }));
  const publishedAgents = new Set(agents.map((a) => a.userId));
  const rows = ((properties.data || []) as PropertyRow[]).filter(
    (p) => active.has(p.agent_id) && publishedAgents.has(p.agent_id || ""),
  );
  const route = (await params).route || [];
  let content;
  if (!route.length)
    content = (
      <CorporateHome settings={s} properties={rows} agents={agents} preview />
    );
  else if (route[0] === "asesores" && route.length === 1)
    content = (
      <main id="contenido" className="section-pad">
        <h1>Nuestros asesores</h1>
        <AgentDirectory agents={agents} preview />
      </main>
    );
  else if (route[0] === "asesores" && route.length === 2) {
    const a = agents.find((a) => a.slug === route[1]);
    if (!a) notFound();
    content = (
      <CorporateAgent agent={a} properties={rows} agents={agents} preview />
    );
  } else if (route[0] === "propiedades" && route.length === 2) {
    const p = rows.find((p) => p.slug === route[1]);
    if (!p) notFound();
    content = (
      <CorporateProperty property={p} agents={agents} settings={s} preview />
    );
  } else notFound();
  return (
    <CorporateFrame settings={s} preview>
      {content}
    </CorporateFrame>
  );
}
