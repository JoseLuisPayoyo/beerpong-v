import { useEffect, useState } from 'react';

const rel = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
const exacta = new Intl.DateTimeFormat('es-ES', {
  dateStyle: 'full',
  timeStyle: 'short',
  timeZone: 'Europe/Madrid',
});
const corta = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });
const conAno = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Europe/Madrid',
});

// «hace 2 h», «ayer», «hace 3 días», «12 nov»…
export function fechaRelativa(iso: string, ahora: number): string {
  const t = new Date(iso).getTime();
  const s = Math.round((t - ahora) / 1000);
  const abs = Math.abs(s);
  if (abs < 45) return 'ahora mismo';
  if (abs < 3600) return rel.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rel.format(Math.round(s / 3600), 'hour');
  if (abs < 7 * 86400) return rel.format(Math.round(s / 86400), 'day');
  const d = new Date(t);
  return (d.getFullYear() === new Date(ahora).getFullYear() ? corta : conAno).format(d);
}

export function fechaExacta(iso: string): string {
  const txt = exacta.format(new Date(iso));
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// La hora actual, refrescada cada minuto (para que «hace 2 min» no se quede quieto).
export function useAhora(cadaMs = 60_000): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), cadaMs);
    return () => clearInterval(id);
  }, [cadaMs]);
  return ahora;
}
