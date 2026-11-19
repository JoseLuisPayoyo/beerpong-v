// Pila de avisos. Dos regiones vivas siempre presentes (deben existir antes de
// que llegue el texto para que el lector de pantalla lo anuncie): una educada
// para lo normal y otra que interrumpe para los errores.
import { quitarAviso, useAvisos, type Aviso } from './avisar';
import { IconoAlerta, IconoCerrar, IconoLeida, IconoSugerencias } from './iconos';

export default function Avisos() {
  const avisos = useAvisos();
  const normales = avisos.filter((a) => a.tipo !== 'error');
  const errores = avisos.filter((a) => a.tipo === 'error');
  return (
    <div className="avisos">
      <div role="alert" className="avisos-grupo">
        {errores.map((a) => (
          <Tostada key={a.id} a={a} />
        ))}
      </div>
      <div role="status" aria-live="polite" className="avisos-grupo">
        {normales.map((a) => (
          <Tostada key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}

function Tostada({ a }: { a: Aviso }) {
  const Icono = a.tipo === 'error' ? IconoAlerta : a.tipo === 'exito' ? IconoLeida : IconoSugerencias;
  return (
    <div className={`aviso ${a.tipo}`}>
      <Icono className="aviso-icono" />
      <span className="aviso-texto">{a.texto}</span>
      {a.accion && (
        <button
          type="button"
          className="aviso-accion"
          onClick={() => {
            a.accion!.fn();
            quitarAviso(a.id);
          }}
        >
          {a.accion.etiqueta}
        </button>
      )}
      <button type="button" className="aviso-cerrar" aria-label="Cerrar aviso" onClick={() => quitarAviso(a.id)}>
        <IconoCerrar tam={18} />
      </button>
    </div>
  );
}
