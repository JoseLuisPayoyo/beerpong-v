// Avisos (toasts) del panel: un pequeño store fuera de React para que cualquier
// módulo (por ejemplo, el de Realtime) pueda avisar sin depender de un contexto.
import { useSyncExternalStore } from 'react';

export type TipoAviso = 'info' | 'exito' | 'error';
export interface Aviso {
  id: number;
  texto: string;
  tipo: TipoAviso;
  accion?: { etiqueta: string; fn: () => void };
}

let avisos: Aviso[] = [];
let siguiente = 1;
const subs = new Set<() => void>();
const emitir = () => subs.forEach((f) => f());

export function avisar(
  texto: string,
  tipo: TipoAviso = 'info',
  accion?: Aviso['accion'],
): number {
  const id = siguiente++;
  // como mucho 4 a la vista: los más viejos se van
  avisos = [...avisos.slice(-3), { id, texto, tipo, accion }];
  emitir();
  const ms = tipo === 'error' ? 9000 : accion ? 7000 : 4500;
  setTimeout(() => quitarAviso(id), ms);
  return id;
}

export function quitarAviso(id: number): void {
  if (!avisos.some((a) => a.id === id)) return;
  avisos = avisos.filter((a) => a.id !== id);
  emitir();
}

export function useAvisos(): Aviso[] {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => avisos,
    () => avisos,
  );
}
