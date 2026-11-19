import type { ReactNode } from 'react';

// Cabecera de cada sección del panel: título, una línea de contexto y acciones.
export default function CabeceraSeccion({
  titulo,
  subtitulo,
  acciones,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <header className="seccion-cabecera">
      <div>
        <h1 className="seccion-titulo">{titulo}</h1>
        {subtitulo && <p className="seccion-sub">{subtitulo}</p>}
      </div>
      {acciones && <div className="seccion-acciones">{acciones}</div>}
    </header>
  );
}
