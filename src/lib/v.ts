// Datos de la página de espera de la V edición (la raíz de la web).
// Solo texto y constantes, fácil de editar.

// ───────────────────────────────────────────────────────────────────────────
// Fecha del torneo: jueves 5 de agosto de 2027 a las 18:00, hora de Madrid.
// En agosto Madrid va en horario de verano (CEST = UTC+2), de ahí el +02:00.
export const FECHA_TORNEO = '2027-08-05T18:00:00+02:00';

// La fecha todavía NO está confirmada. Mientras esto sea false, en el recuadro
// se pinta FECHA_PROVISIONAL con «fecha por confirmar» a tiza. Al confirmarla,
// pon true (y revisa FECHA_TORNEO): aparece la cuenta atrás en su lugar.
export const FECHA_CONFIRMADA = false;
export const FECHA_PROVISIONAL = ['AGOSTO', '2027'] as const;
// ───────────────────────────────────────────────────────────────────────────

export const EDICION = 5;

export const SITIO = 'https://elperezyesos.com';

// La web de la edición anterior (IV), a la que lleva el acceso discreto.
export const URL_IV = 'https://iv.elperezyesos.com';

// Así fue la IV (2026): lo que se cuenta en ese acceso.
export const IV = {
  campeones: 'De Rodríguez',
  final: '7–6',
  equipos: 51,
  vasos: 1063,
};

// 1063 → «1.063» (es-ES no agrupa los millares de cuatro cifras si no se le pide)
export const miles = (n: number) =>
  new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(n);
