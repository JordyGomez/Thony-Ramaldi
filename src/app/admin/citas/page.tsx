import { AdminBar } from "../admin-bar";
import {
  agendaPageContext,
  AgendaSetup,
} from "@/components/appointments/admin-server";
import { AppointmentWorkspace } from "./workspace";
import { isUuid } from "@/lib/appointments/validation";
export const dynamic = "force-dynamic";
export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ solicitud?: string }>;
}) {
  const context = await agendaPageContext("appointments");
  if (!context.data) return <AgendaSetup email={context.user.email} />;
  const query = await searchParams;
  return (
    <>
      <AdminBar email={context.user.email} />
      <AppointmentWorkspace
        initial={context.data}
        readOnly={context.readOnly}
        initialSelection={isUuid(query.solicitud) ? query.solicitud : undefined}
      />
    </>
  );
}
