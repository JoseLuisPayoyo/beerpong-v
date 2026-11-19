// Cliente Supabase del NAVEGADOR para el panel (/admin): publishable key + la
// sesión de Supabase Auth del admin. La seguridad la pone RLS (es_admin()).
// El panel no usa la secret key ni endpoints de servidor.
//
// Solo lo importa la isla del panel: la página / no carga este módulo.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const key = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'beerpong-v-admin',
        },
      })
    : null;

// Para cuando ya se sabe que hay configuración (todo lo que va detrás del login).
export function sb(): SupabaseClient {
  if (!supabase) throw new Error('Supabase sin configurar');
  return supabase;
}

// Mensaje claro para un error de Supabase o de red.
export function mensajeError(error: unknown, que = 'La operación'): string {
  const e = error as { message?: string; code?: string } | null;
  const msg = e?.message ?? '';
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) {
    return `${que} no se ha podido hacer: sin conexión. Revisa la red e inténtalo de nuevo.`;
  }
  if (e?.code === '42501') return `${que} no se ha podido hacer: tu cuenta no tiene permiso.`;
  if (e?.code === 'PGRST301' || /jwt/i.test(msg)) {
    return `${que} no se ha podido hacer: la sesión ha caducado. Vuelve a entrar.`;
  }
  return `${que} no se ha podido hacer${e?.code ? ` (error ${e.code})` : ''}. Inténtalo de nuevo.`;
}
