import type { APIRoute } from 'astro';
import { json, leerBody, clienteServidor } from '../../lib/supabase-servidor';
import { EDICION } from '../../lib/v';

// On-demand (SSR): necesita ejecutarse en el servidor para usar la secret key.
export const prerender = false;

// Buzón de sugerencias de la página de la V. La tabla `sugerencias` tiene RLS
// sin políticas: el navegador no puede leerla ni escribirla, así que la única
// puerta es esta, con la SUPABASE_SECRET_KEY (solo servidor).
//
// Se guarda el texto y la edición. Nada más: ni IP, ni user-agent, ni ningún
// dato de quien escribe.

const MIN = 3;
const MAX = 1000;

// Rastro del fallo real en el log del servidor. Al cliente NUNCA le llega.
function logError(donde: string, error: unknown): void {
  const e = error as
    | { message?: string; code?: string; details?: string | null; hint?: string | null }
    | null;
  console.error(`[sugerencia] ${donde}:`, {
    message: e?.message,
    code: e?.code,
    details: e?.details,
    hint: e?.hint,
  });
}

export const POST: APIRoute = async ({ request }) => {
  const body = await leerBody(request);
  if (!body || typeof body !== 'object') {
    return json({ ok: false, error: 'texto' }, 400);
  }

  // Campo trampa: una persona no lo ve ni lo rellena. Si viene con algo es un
  // bot: se le responde que ha ido bien y no se guarda nada.
  if (String(body.web ?? '').trim()) {
    return json({ ok: true });
  }

  // Validación de servidor (no nos fiamos del cliente). Se cuenta por
  // caracteres, igual que el char_length() del check de la tabla.
  const texto = typeof body.texto === 'string' ? body.texto.trim() : '';
  const largo = [...texto].length;
  if (largo < MIN || largo > MAX) {
    return json({ ok: false, error: 'texto' }, 400);
  }

  const sb = clienteServidor();
  if (!sb) {
    logError('configuración', { message: 'Falta PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY' });
    return json({ ok: false }, 500);
  }

  const { error } = await sb.from('sugerencias').insert({ texto, edicion: EDICION });
  if (error) {
    logError('insertar', error);
    return json({ ok: false }, 500);
  }

  return json({ ok: true });
};
