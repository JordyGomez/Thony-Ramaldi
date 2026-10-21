import "server-only";
import {
  appointmentClient,
  appointmentMissing,
} from "@/lib/appointments/access";
import { isSupabaseConfigured } from "@/lib/supabase/env";
export type BookingProperty = {
  id: string;
  slug: string;
  reference: string;
  title: string;
};
export async function getBookingProperties(): Promise<BookingProperty[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await appointmentClient().rpc(
    "appointment_public_properties",
  );
  if (error) {
    if (appointmentMissing(error.code)) return [];
    throw new Error("No se pudo verificar el catálogo para visitas.");
  }
  return data || [];
}
