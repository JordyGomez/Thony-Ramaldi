import { AdminBar } from "../admin-bar";
import {
  agendaPageContext,
  AgendaSetup,
} from "@/components/appointments/admin-server";
import { isUuid } from "@/lib/appointments/validation";
import { LeadsWorkspace } from "./workspace";
export const dynamic = "force-dynamic";
export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const context = await agendaPageContext("leads");
  if (!context.data) return <AgendaSetup email={context.user.email} />;
  const query = await searchParams;
  return (
    <>
      <AdminBar email={context.user.email} />
      <LeadsWorkspace
        initial={context.data}
        readOnly={context.readOnly}
        initialSelection={isUuid(query.cliente) ? query.cliente : undefined}
      />
    </>
  );
}
