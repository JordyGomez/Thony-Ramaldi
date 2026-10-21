export const appointmentTestEnvironment = {
  THONY_APPOINTMENT_TESTS: "1",
  THONY_ADMIN_TESTS: "1",
  THONY_TEST_FIXTURES: "",
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:3337",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "local-anon-key-for-isolated-appointment-tests",
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3401",
  NEXT_PUBLIC_APPOINTMENTS_CAPTCHA_SITE_KEY: "isolated-booking-site-key",
  APPOINTMENTS_TURNSTILE_SECRET: "isolated-turnstile-secret",
  APPOINTMENTS_SERVER_SECRET:
    "isolated-appointments-server-secret-2026-only-tests",
  APPOINTMENTS_LINK_SIGNING_SECRET:
    "isolated-customer-signing-secret-2026-only-tests",
  APPOINTMENTS_TEST_PROVIDER_URL: "http://127.0.0.1:3337",
  APPOINTMENTS_PUBLIC_ORIGIN: "http://127.0.0.1:3401",
  RESEND_API_KEY: "isolated-resend-token",
  RESEND_DOMAIN_ID: "isolated-domain",
  APPOINTMENTS_EMAIL_FROM: "Agenda de pruebas <agenda@example.test>",
  RESEND_WEBHOOK_SECRET:
    "whsec_aXNvbGF0ZWQtd2ViaG9vay1zaWduaW5nLXNlY3JldC1vbmx5LXRlc3Rz",
  WHATSAPP_ACCESS_TOKEN: "isolated-meta-token",
  WHATSAPP_PHONE_NUMBER_ID: "123456789",
  WHATSAPP_BUSINESS_ACCOUNT_ID: "987654321",
  WHATSAPP_API_VERSION: "v23.0",
  WHATSAPP_TEMPLATE_OWNER: "agenda_owner",
  WHATSAPP_TEMPLATE_CLIENT: "agenda_client",
  WHATSAPP_APP_SECRET: "isolated-meta-app-secret-2026-only-tests",
  WHATSAPP_VERIFY_TOKEN: "isolated-meta-verify-token-2026-only-tests",
  WHATSAPP_TEMPLATE_LANGUAGE: "es",
};
