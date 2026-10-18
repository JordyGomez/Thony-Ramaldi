import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente del navegador: lo usa el formulario para subir fotos directamente
// al almacenamiento con la sesión del administrador.
export const createBrowserSupabase = () =>
  createBrowserClient(supabaseUrl, supabaseAnonKey);
