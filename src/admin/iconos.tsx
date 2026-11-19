// Iconos SVG en línea (trazo de 24×24, heredan el color del texto). Sin librerías.
import type { ReactNode, SVGProps } from 'react';

export type PropsIcono = SVGProps<SVGSVGElement> & { tam?: number };

function Svg({ tam = 20, children, ...props }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoMenu = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const IconoCerrar = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
// Sugerencias: un bocadillo con una bombilla de idea
export const IconoSugerencias = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1.1-4.2A7.5 7.5 0 1 1 20 12.5Z" />
    <path d="M9.5 11h5M9.5 14h3" />
  </Svg>
);
export const IconoSalir = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 16l-4-4 4-4M6 12h10" />
  </Svg>
);
export const IconoLeida = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const IconoTodasLeidas = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M2.5 12.5L7 17l9.5-9.5M12 16.5l.5.5L22 7.5" />
  </Svg>
);
export const IconoNueva = (p: PropsIcono) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="8.5" />
  </Svg>
);
export const IconoArchivar = (p: PropsIcono) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1.2" />
    <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" />
  </Svg>
);
export const IconoDesarchivar = (p: PropsIcono) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="5" rx="1.2" />
    <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M12 17v-5M9.5 14.5L12 12l2.5 2.5" />
  </Svg>
);
export const IconoBorrar = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
  </Svg>
);
export const IconoBuscar = (p: PropsIcono) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Svg>
);
export const IconoRecargar = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
  </Svg>
);
export const IconoAlerta = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M12 3.5L2.5 20h19L12 3.5Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Svg>
);
export const IconoBandeja = (p: PropsIcono) => (
  <Svg {...p}>
    <path d="M3 13l2.6-7.2A2 2 0 0 1 7.5 4.5h9a2 2 0 0 1 1.9 1.3L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Z" />
    <path d="M3 13h5l1.5 2.5h5L16 13h5" />
  </Svg>
);
export const IconoCandado = (p: PropsIcono) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);
