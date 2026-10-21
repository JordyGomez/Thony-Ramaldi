export const appointmentKinds = {
  property_visit: "Visita a propiedad",
  buy: "Asesoría para comprar",
  rent: "Asesoría para alquilar",
  invest: "Asesoría para invertir",
  general: "Consulta general",
} as const;
export type AppointmentKind = keyof typeof appointmentKinds;
export const appointmentStatuses = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  rejected: "Rechazada",
  change_proposed: "Cambio de horario propuesto",
  reschedule_requested: "Reprogramación solicitada",
  cancelled_client: "Cancelada por el cliente",
  cancelled_thony: "Cancelada por Thony",
  expired: "Vencida",
  completed: "Completada",
  no_show: "Cliente no asistió",
} as const;
export type AppointmentStatus = keyof typeof appointmentStatuses;
export const leadStatuses = {
  new: "Nuevo",
  contacted: "Contactado",
  interested: "Interesado",
  visit_scheduled: "Visita programada",
  follow_up: "En seguimiento",
  negotiation: "Negociación",
  closed: "Cerrado",
  not_interested: "No interesado",
} as const;
export const notificationStatuses = {
  pending: "Pendiente",
  processing: "Procesando",
  blocked: "Integración pendiente",
  retry: "Reintento programado",
  sent: "Aceptado por el proveedor",
  delivered: "Entregado",
  failed: "Fallido",
  cancelled: "Cancelado",
  uncertain: "Envío incierto · revisar proveedor",
} as const;
export const operationalConsent =
  "Autorizo el uso de mi nombre, correo y teléfono para gestionar esta solicitud, sus cambios y recordatorios. Este consentimiento no autoriza publicidad.";
export const whatsappConsent =
  "Autorizo mensajes operativos de esta cita por WhatsApp. No autorizo publicidad.";
export const appointmentTimezone = "America/Santo_Domingo";
export type AppointmentAccess = {
  installed: boolean;
  calendarId: string | null;
  manage: boolean;
  leads: boolean;
  export: boolean;
  permissions: boolean;
  notifications: boolean;
};
export type CustomerGrant = { id: string; nonce: string; expiresAt: number };
export type Booking = {
  name: string;
  email: string;
  phone: string;
  kind: AppointmentKind;
  modality: "presencial" | "virtual";
  startsAt: string;
  propertyId?: string;
  comments: string;
  communicationPreference: "email" | "whatsapp" | "both";
  operationalConsent: true;
  whatsappConsent: boolean;
};
export type PublicAgenda = {
  installed: boolean;
  enabled: boolean;
  timezone: string;
  durations: Record<AppointmentKind, number>;
  bufferMinutes: number;
  holdHours: number;
  minimumNoticeMinutes: number;
  bookingHorizonDays: number;
  retentionDays: number;
  modalities: ("presencial" | "virtual")[];
  cancellationMinutes: number;
};
export type Slot = { startsAt: string; endsAt: string };
export type AgendaSettings = {
  id: string;
  enabled: boolean;
  timezone: string;
  durations: Record<AppointmentKind, number>;
  buffer_minutes: number;
  hold_hours: number;
  minimum_notice_minutes: number;
  booking_horizon_days: number;
  max_daily_appointments: number;
  modalities: string[];
  meeting_locations: string[];
  cancellation_minutes: number;
  reminder_24h: boolean;
  reminder_day: boolean;
  reminder_time: string;
  owner_whatsapp_opt_in: boolean;
  retention_days: number;
  revision: number;
};
export type AvailabilityRule = {
  id: string;
  weekday: number | null;
  on_date: string | null;
  starts_at: string;
  ends_at: string;
  enabled: boolean;
};
export type Blackout = {
  id: string;
  label: string;
  starts_at: string | null;
  ends_at: string | null;
  weekday: number | null;
  start_time: string | null;
  end_time: string | null;
  valid_from: string | null;
  valid_until: string | null;
  enabled: boolean;
};
export type HistoryEntry = {
  id: string;
  event: string;
  from_status: string | null;
  to_status: string | null;
  actor_kind: string;
  details: Record<string, unknown>;
  created_at: string;
};
export type Proposal = {
  id: string;
  starts_at: string;
  ends_at: string;
  expires_at: string;
  initiated_by: "thony" | "client";
  status: "pending" | "accepted" | "declined" | "expired" | "withdrawn";
};
export type AppointmentRow = {
  id: string;
  lead_id: string;
  property_id: string | null;
  property_snapshot: {
    id: string;
    reference: string;
    title: string;
    slug: string;
  } | null;
  kind: AppointmentKind;
  modality: "presencial" | "virtual";
  starts_at: string;
  ends_at: string;
  buffer_minutes: number;
  status: AppointmentStatus;
  proposal_base_status: "pending" | "confirmed" | null;
  hold_expires_at: string;
  confirmed_at: string | null;
  instructions: string;
  comments: string;
  version: number;
  schedule_version: number;
  created_at: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
    preference: string;
    whatsappConsent: boolean;
  };
  proposals: Proposal[];
  history: HistoryEntry[];
};
export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  interest: AppointmentKind;
  source: string;
  commercial_status: keyof typeof leadStatuses;
  communication_preference: string;
  whatsapp_consent_at: string | null;
  responsible_user_id: string | null;
  first_contact_at: string;
  last_interaction_at: string;
  anonymized_at: string | null;
  version: number;
  duplicateCandidates: { id: string; name: string }[];
  notes: { id: string; body: string; author_id: string; created_at: string }[];
  tasks: {
    id: string;
    title: string;
    due_at: string;
    status: "open" | "done" | "cancelled";
  }[];
  history: HistoryEntry[];
  appointmentCounts: {
    requested: number;
    confirmed: number;
    completed: number;
  };
};
export type NotificationView = {
  id: string;
  appointment_id: string;
  event: string;
  recipient: "owner" | "client";
  channel: "email" | "whatsapp";
  status: keyof typeof notificationStatuses;
  attempts: number;
  scheduled_at: string;
  available_at?: string;
  sent_at: string | null;
  delivered_at: string | null;
  last_error: string | null;
  provider_id: string | null;
};
export type ProviderStatus = {
  configured: boolean;
  ready: boolean;
  reason: string;
};
export type IntegrationStatus = {
  bookingReady: boolean;
  captcha: boolean;
  links: boolean;
  server: boolean;
  email: ProviderStatus;
  whatsapp: ProviderStatus;
};
export type AgendaWorkspace = {
  access: AppointmentAccess;
  settings: AgendaSettings;
  rules: AvailabilityRule[];
  blackouts: Blackout[];
  runtime: {
    lastWorkerAt: string | null;
    schedulerEnabledAt: string | null;
    lastWorkerError: string | null;
    serverConfigured: boolean;
  };
  appointments: AppointmentRow[];
  appointmentTotal: number;
  leads?: Lead[];
  leadTotal?: number;
  leadProperties?: { id: string; title: string; reference: string }[];
  metrics: Record<string, number | null>;
  notifications?: NotificationView[];
  notificationAttempts?: {
    id: string;
    job_id: string;
    attempt: number;
    outcome: string;
    error_code: string | null;
    started_at: string;
    finished_at: string | null;
  }[];
  notificationEvents?: {
    id: string;
    job_id: string;
    provider: string;
    status: string;
    occurred_at: string;
  }[];
  notificationMetrics?: { pending: number; errors: number };
  grants?: ({
    user_id: string;
    kind: string;
    revoked_at: string | null;
  } & Record<string, unknown>)[];
  integrations?: IntegrationStatus;
};
export type CustomerAppointment = {
  id: string;
  name: string;
  email: string;
  phone: string;
  kind: AppointmentKind;
  modality: "presencial" | "virtual";
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  baseStatus: "pending" | "confirmed" | null;
  expiresAt: string;
  instructions: string;
  property: AppointmentRow["property_snapshot"];
  sequence: number;
  updatedAt: string;
  cancellationMinutes: number;
  communicationPreference: "email" | "whatsapp" | "both";
  whatsappConsent: boolean;
  proposal: {
    id: string;
    startsAt: string;
    endsAt: string;
    expiresAt: string;
    initiatedBy: "thony" | "client";
  } | null;
  history: { event: string; createdAt: string; status: string }[];
};
export type NotificationPayload = {
  appointmentId: string;
  name: string;
  email: string;
  phone: string;
  kind: AppointmentKind;
  modality: string;
  startsAt: string;
  endsAt: string;
  originalStartsAt: string;
  instructions: string;
  property: AppointmentRow["property_snapshot"];
  comments: string;
  status: AppointmentStatus;
  ownerName: string;
  ownerEmail: string;
  ownerWhatsapp: string;
  grant: CustomerGrant | null;
  sequence: number;
  proposalId: string | null;
};
export type NotificationJob = {
  id: string;
  appointment_id: string;
  event: string;
  recipient: "owner" | "client";
  channel: "email" | "whatsapp";
  payload: NotificationPayload;
  attempts: number;
  claim_token: string;
  first_attempt_at: string;
  created_at: string;
};
export class AppointmentError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function rdDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: appointmentTimezone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
export function rdTime(value: string | Date) {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: appointmentTimezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
export function rdDay(value: string | Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: appointmentTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export const weekdays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const notificationTitles: Record<string, string> = {
  received: "Solicitud recibida · pendiente de confirmación",
  confirmed: "Cita confirmada",
  rejected: "Sobre tu solicitud de cita",
  proposal: "Propuesta de nuevo horario",
  rescheduled: "Cita reprogramada",
  cancelled_client: "Cita cancelada",
  cancelled_thony: "Cita cancelada",
  expired: "Solicitud vencida",
  proposal_expired: "La propuesta de horario venció",
  proposal_declined: "Propuesta no aceptada",
  reminder_24h: "Recordatorio de tu cita",
  reminder_day: "Recordatorio de cita",
  completed: "Cita completada",
  no_show: "Coordinemos una nueva cita",
};
