import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantiene la sesión activa al recargar la página
    storage: window.localStorage, // Fuerza el uso de localStorage
    autoRefreshToken: true, // Renueva el token automáticamente antes de que expire
    detectSessionInUrl: true, // Útil si usas recuperación de contraseña o magic links
  },
});
