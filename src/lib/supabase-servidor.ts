// Lo mínimo para los endpoints de servidor (/api/*): cliente Supabase con la
// SUPABASE_SECRET_KEY y dos utilidades de respuesta. Solo se importa desde
// endpoints con prerender = false: la secret key nunca llega al navegador.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function leerBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// Cliente de SERVIDOR con la secret key (salta RLS). null si falta configuración.
export function clienteServidor(): SupabaseClient | null {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const secret = import.meta.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}
