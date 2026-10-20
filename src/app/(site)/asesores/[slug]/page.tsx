import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlatformSnapshot } from "@/data/get-platform";
import { CorporateAgent } from "@/components/corporate-portal";
import { PublicModeContent } from "@/components/public-mode";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPlatformSnapshot();
  const a =
    p?.mode === "ramaldi" ? p.agents.find((a) => a.slug === slug) : null;
  return {
    title: a?.content.name || "Asesor no encontrado",
    description: a?.content.description,
    robots: { index: !!a, follow: !!a },
  };
}
export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPlatformSnapshot();
  if (p?.mode !== "ramaldi") notFound();
  const a = p.agents.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <PublicModeContent mode="ramaldi" revision={p.revision}>
      <CorporateAgent agent={a} agents={p.agents} properties={p.properties} />
    </PublicModeContent>
  );
}
