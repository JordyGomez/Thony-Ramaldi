import { notFound } from "next/navigation";
import { getPlatformSnapshot } from "@/data/get-platform";
import { AgentDirectory } from "@/components/corporate-portal";
import { PublicModeContent } from "@/components/public-mode";
export const metadata = { title: "Nuestros asesores" };
export default async function AgentsPage() {
  const platform = await getPlatformSnapshot();
  if (platform?.mode !== "ramaldi") notFound();
  return (
    <PublicModeContent mode="ramaldi" revision={platform.revision}>
      <main id="contenido" className="section-pad">
        <h1>Nuestros asesores</h1>
        <AgentDirectory agents={platform.agents} />
      </main>
    </PublicModeContent>
  );
}
