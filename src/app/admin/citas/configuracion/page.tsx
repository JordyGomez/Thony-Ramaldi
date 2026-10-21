import { AdminBar } from "../../admin-bar";
import {
  agendaPageContext,
  AgendaSetup,
} from "@/components/appointments/admin-server";
import { AgendaConfiguration } from "./settings";
export const dynamic = "force-dynamic";
export default async function AgendaSettingsPage() {
  const context = await agendaPageContext("settings");
  if (!context.data) return <AgendaSetup email={context.user.email} />;
  return (
    <>
      <AdminBar email={context.user.email} />
      <AgendaConfiguration initial={context.data} readOnly={context.readOnly} />
    </>
  );
}
