// Datos de la pestaña Sugerencias: la lista, Realtime y las acciones
// (optimistas, con marcha atrás si Supabase dice que no).
//
// Vive fuera de React para que el contador de la barra lateral y la propia
// pestaña compartan los mismos datos, y para que Realtime siga escuchando
// aunque se esté en otra pestaña del panel.
import { useSyncExternalStore } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { sb, mensajeError } from '../supabase';
import { avisar } from '../avisar';

export type EstadoSug = 'nueva' | 'leida' | 'archivada';
export type Id = number; // bigint en la tabla
export interface Sugerencia {
  id: Id;
  texto: string;
  estado: EstadoSug;
  creada_en: string;
}

// Columnas que lee el panel (si en la tabla se llaman de otra forma, es aquí).
const TABLA = 'sugerencias';
const COLUMNAS = 'id, texto, estado, creada_en';
// Cuánto dura el resaltado de una sugerencia recién llegada.
const RESALTE_MS = 4000;

export interface EstadoStore {
  fase: 'inactivo' | 'cargando' | 'listo' | 'error';
  filas: Sugerencia[];
  error: string | null;
  // ids recién llegados por Realtime (se resaltan un momento)
  recientes: ReadonlySet<Id>;
  // si la suscripción de Realtime está activa
  enDirecto: boolean;
}

const INICIAL: EstadoStore = {
  fase: 'inactivo',
  filas: [],
  error: null,
  recientes: new Set(),
  enDirecto: false,
};

let st: EstadoStore = INICIAL;
const subs = new Set<() => void>();
function set(parcial: Partial<EstadoStore>) {
  st = { ...st, ...parcial };
  subs.forEach((f) => f());
}

export function useSugerencias(): EstadoStore {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => st,
    () => st,
  );
}

// Contador de la barra lateral (null mientras no hay datos).
export function useNuevas(): number | null {
  const s = useSugerencias();
  return s.fase === 'listo' ? s.filas.filter((f) => f.estado === 'nueva').length : null;
}

// ---------- cambios que llegan por Realtime ----------

type Cambio = RealtimePostgresChangesPayload<Sugerencia>;

// Por fecha real, no por texto: la API y Realtime pueden escribir la misma
// hora con distinto formato («Z» o «+00:00»).
const masNuevaPrimero = (a: Sugerencia, b: Sugerencia) => Date.parse(b.creada_en) - Date.parse(a.creada_en);

function aplicar(filas: Sugerencia[], c: Cambio): Sugerencia[] {
  if (c.eventType === 'DELETE') {
    const id = (c.old as Partial<Sugerencia>).id;
    return filas.filter((f) => f.id !== id);
  }
  const fila = c.new as Sugerencia;
  if (!fila || fila.id == null) return filas;
  const resto = filas.filter((f) => f.id !== fila.id);
  return [...resto, fila].sort(masNuevaPrimero);
}

// Mientras hay una carga en vuelo, los cambios se apuntan aquí para volver a
// aplicarlos sobre lo que devuelva la carga (y no perder ninguno).
let pendientes: Cambio[] | null = null;

function alCambio(c: Cambio) {
  if (pendientes) pendientes.push(c);
  const esNueva =
    c.eventType === 'INSERT' && c.new && !st.filas.some((f) => f.id === (c.new as Sugerencia).id);
  set({ filas: aplicar(st.filas, c) });
  if (esNueva && st.fase === 'listo') {
    const id = (c.new as Sugerencia).id;
    set({ recientes: new Set([...st.recientes, id]) });
    setTimeout(() => {
      const r = new Set(st.recientes);
      r.delete(id);
      set({ recientes: r });
    }, RESALTE_MS);
    avisar('Nueva sugerencia');
  }
}

// ---------- carga ----------

let turno = 0;

export async function cargar(): Promise<void> {
  const mio = ++turno;
  pendientes ??= [];
  if (st.fase !== 'listo') set({ fase: 'cargando', error: null });

  const { data, error } = await sb()
    .from(TABLA)
    .select(COLUMNAS)
    .order('creada_en', { ascending: false });

  if (mio !== turno) return; // ha empezado otra carga después: manda esa
  const cola = pendientes ?? [];
  pendientes = null;

  if (error) {
    if (st.fase === 'listo') avisar(mensajeError(error, 'La actualización de la lista'), 'error');
    else set({ fase: 'error', error: mensajeError(error, 'La carga de sugerencias') });
    return;
  }
  let filas = (data ?? []) as Sugerencia[];
  for (const c of cola) filas = aplicar(filas, c);
  set({ fase: 'listo', filas, error: null });
}

// ---------- ciclo de vida (lo llama el panel al entrar y al salir) ----------

let canal: RealtimeChannel | null = null;
let ocultoDesde = 0;

function alCambiarVisibilidad() {
  if (document.visibilityState === 'hidden') {
    ocultoDesde = Date.now();
  } else if (ocultoDesde && Date.now() - ocultoDesde > 30_000) {
    // el móvil duerme el socket en segundo plano: al volver, se pone al día
    void cargar();
  }
}

export function iniciar(): () => void {
  if (canal) return detener;
  void cargar();
  canal = sb()
    .channel('admin-sugerencias')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLA }, (c) => alCambio(c as Cambio))
    .subscribe((estado) => {
      if (estado === 'SUBSCRIBED') {
        set({ enDirecto: true });
        // al (re)conectar se recarga: lo que pasara mientras no se escuchaba
        if (st.fase === 'listo') void cargar();
      } else {
        set({ enDirecto: false });
      }
    });
  document.addEventListener('visibilitychange', alCambiarVisibilidad);
  return detener;
}

export function detener(): void {
  document.removeEventListener('visibilitychange', alCambiarVisibilidad);
  if (canal) void sb().removeChannel(canal);
  canal = null;
  turno++;
  pendientes = null;
  st = INICIAL;
  subs.forEach((f) => f());
}

// ---------- acciones (optimistas) ----------

// Cambia el estado de una o varias. Devuelve si Supabase lo ha aceptado.
export async function cambiarEstado(ids: Id[], estado: EstadoSug): Promise<boolean> {
  if (!ids.length) return true;
  const antes = new Map<Id, EstadoSug>();
  for (const f of st.filas) if (ids.includes(f.id)) antes.set(f.id, f.estado);
  set({ filas: st.filas.map((f) => (antes.has(f.id) ? { ...f, estado } : f)) });

  // .select() para saber cuántas filas ha cambiado de verdad: si RLS no deja,
  // Supabase no da error, simplemente no cambia ninguna.
  const { data, error } = await sb().from(TABLA).update({ estado }).in('id', ids).select('id');
  const ok = !error && (data?.length ?? 0) === ids.length;
  if (!ok) {
    // marcha atrás (solo de las que siguen como las dejamos)
    set({
      filas: st.filas.map((f) =>
        antes.has(f.id) && f.estado === estado ? { ...f, estado: antes.get(f.id)! } : f,
      ),
    });
    avisar(
      error
        ? mensajeError(error, 'El cambio')
        : 'El cambio no se ha guardado: puede que ya no exista o que tu cuenta no tenga permiso.',
      'error',
    );
  }
  return ok;
}

export async function borrar(id: Id): Promise<boolean> {
  const fila = st.filas.find((f) => f.id === id);
  if (!fila) return true;
  set({ filas: st.filas.filter((f) => f.id !== id) });

  const { data, error } = await sb().from(TABLA).delete().eq('id', id).select('id');
  const ok = !error && (data?.length ?? 0) === 1;
  if (!ok) {
    if (!st.filas.some((f) => f.id === id)) {
      set({ filas: [...st.filas, fila].sort(masNuevaPrimero) });
    }
    avisar(
      error
        ? mensajeError(error, 'El borrado')
        : 'No se ha borrado: puede que tu cuenta no tenga permiso.',
      'error',
    );
  }
  return ok;
}
