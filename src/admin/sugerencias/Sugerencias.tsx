// Pestaña Sugerencias: lo que la gente deja en el buzón de la página de la V.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { avisar } from '../avisar';
import Confirmar from '../Confirmar';
import CabeceraSeccion from '../CabeceraSeccion';
import {
  IconoAlerta,
  IconoArchivar,
  IconoBandeja,
  IconoBorrar,
  IconoBuscar,
  IconoDesarchivar,
  IconoLeida,
  IconoNueva,
  IconoRecargar,
  IconoTodasLeidas,
} from '../iconos';
import { fechaExacta, fechaRelativa, useAhora } from '../tiempo';
import {
  borrar,
  cambiarEstado,
  cargar,
  useSugerencias,
  type EstadoSug,
  type Id,
  type Sugerencia,
} from './store';

type Filtro = EstadoSug | 'todas';
const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: 'nueva', etiqueta: 'Nuevas' },
  { id: 'leida', etiqueta: 'Leídas' },
  { id: 'archivada', etiqueta: 'Archivadas' },
  { id: 'todas', etiqueta: 'Todas' },
];
const ETIQUETA_ESTADO: Record<EstadoSug, string> = { nueva: 'Nueva', leida: 'Leída', archivada: 'Archivada' };
const VACIO: Record<Filtro, string> = {
  nueva: 'No hay sugerencias nuevas. Cuando alguien escriba una, aparecerá aquí al momento.',
  leida: 'No hay sugerencias leídas.',
  archivada: 'No hay sugerencias archivadas.',
  todas: 'Todavía no ha llegado ninguna sugerencia.',
};
// Lo que se cuenta tras cada cambio de estado (y lo que deshace «Deshacer»).
const HECHO: Record<EstadoSug, string> = {
  nueva: 'Marcada como nueva',
  leida: 'Marcada como leída',
  archivada: 'Archivada',
};

// sin mayúsculas ni tildes: «canción» encuentra «cancion»
const normal = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export default function Sugerencias() {
  const { fase, filas, error, recientes, enDirecto } = useSugerencias();
  const [filtro, setFiltro] = useState<Filtro>('nueva');
  const [busqueda, setBusqueda] = useState('');
  const [aBorrar, setABorrar] = useState<Sugerencia | null>(null);
  const ahora = useAhora();

  const filasRef = useRef(new Map<Id, HTMLElement>());
  const listaRef = useRef<HTMLDivElement>(null);
  const [enfocar, setEnfocar] = useState<Id | 'lista' | null>(null);

  const q = normal(busqueda.trim());
  const coinciden = useMemo(() => (q ? filas.filter((f) => normal(f.texto).includes(q)) : filas), [filas, q]);
  const cuenta = useMemo(() => {
    const c: Record<Filtro, number> = { nueva: 0, leida: 0, archivada: 0, todas: coinciden.length };
    for (const f of coinciden) c[f.estado]++;
    return c;
  }, [coinciden]);
  const visibles = filtro === 'todas' ? coinciden : coinciden.filter((f) => f.estado === filtro);
  const nuevas = filas.filter((f) => f.estado === 'nueva');

  // Tras quitar una fila de la vista, el foco pasa a la siguiente (o a la lista).
  useEffect(() => {
    if (enfocar == null) return;
    const el = enfocar === 'lista' ? listaRef.current : filasRef.current.get(enfocar);
    (el ?? listaRef.current)?.focus();
    setEnfocar(null);
  }, [enfocar, visibles]);

  function siguienteTras(id: Id): Id | 'lista' {
    const i = visibles.findIndex((f) => f.id === id);
    const sig = visibles[i + 1] ?? visibles[i - 1];
    return sig ? sig.id : 'lista';
  }

  async function cambiar(f: Sugerencia, estado: EstadoSug) {
    const antes = f.estado;
    const saleDeLaVista = filtro !== 'todas' && estado !== filtro;
    if (saleDeLaVista) setEnfocar(siguienteTras(f.id));
    const ok = await cambiarEstado([f.id], estado);
    if (ok) {
      avisar(HECHO[estado], 'exito', {
        etiqueta: 'Deshacer',
        fn: () => void cambiarEstado([f.id], antes),
      });
    }
  }

  async function marcarTodas() {
    const ids = nuevas.map((f) => f.id);
    if (filtro === 'nueva') setEnfocar('lista');
    const ok = await cambiarEstado(ids, 'leida');
    if (ok) {
      avisar(ids.length === 1 ? '1 marcada como leída' : `${ids.length} marcadas como leídas`, 'exito', {
        etiqueta: 'Deshacer',
        fn: () => void cambiarEstado(ids, 'nueva'),
      });
    }
  }

  async function confirmarBorrado() {
    const f = aBorrar;
    if (!f) return;
    setABorrar(null);
    setEnfocar(siguienteTras(f.id));
    if (await borrar(f.id)) avisar('Sugerencia borrada', 'exito');
  }

  // Resumen para lectores de pantalla al filtrar o buscar (con calma: no a cada tecla).
  const [resumen, setResumen] = useState('');
  useEffect(() => {
    if (fase !== 'listo') return;
    const t = setTimeout(() => {
      const n = visibles.length;
      setResumen(n === 1 ? '1 sugerencia' : `${n} sugerencias`);
    }, 600);
    return () => clearTimeout(t);
  }, [fase, filtro, q]);

  return (
    <>
      <CabeceraSeccion
        titulo="Sugerencias"
        subtitulo={
          <>
            Lo que la gente deja en el buzón de la página.
            {fase === 'listo' && (
              <span className={`directo ${enDirecto ? 'si' : 'no'}`}>
                {enDirecto ? 'En directo' : 'Sin conexión en directo'}
              </span>
            )}
          </>
        }
        acciones={
          <button
            type="button"
            className="boton"
            onClick={marcarTodas}
            disabled={fase !== 'listo' || nuevas.length === 0}
          >
            <IconoTodasLeidas />
            <span>Marcar todas como leídas</span>
          </button>
        }
      />

      <div className="herramientas">
        <div className="filtros" role="group" aria-label="Filtrar por estado">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="filtro"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
            >
              {f.etiqueta}
              <span className="filtro-num">{fase === 'listo' ? cuenta[f.id] : '–'}</span>
            </button>
          ))}
        </div>
        <label className="buscador">
          <span className="sr">Buscar en las sugerencias</span>
          <IconoBuscar />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>
      </div>

      <p className="sr" aria-live="polite">
        {resumen}
      </p>

      <div ref={listaRef} tabIndex={-1} className="lista" aria-label="Sugerencias" aria-busy={fase === 'cargando'}>
        {fase === 'cargando' || fase === 'inactivo' ? (
          <Esqueleto />
        ) : fase === 'error' ? (
          <div className="estado-vacio error" role="alert">
            <IconoAlerta tam={28} />
            <p>{error}</p>
            <button type="button" className="boton primario" onClick={() => void cargar()}>
              <IconoRecargar />
              <span>Reintentar</span>
            </button>
          </div>
        ) : visibles.length === 0 ? (
          <div className="estado-vacio">
            <IconoBandeja tam={28} />
            <p>{q ? `Nada coincide con «${busqueda.trim()}».` : VACIO[filtro]}</p>
            {q && (
              <button type="button" className="boton" onClick={() => setBusqueda('')}>
                Borrar búsqueda
              </button>
            )}
          </div>
        ) : (
          <ul className="filas">
            {visibles.map((f) => (
              <Fila
                key={f.id}
                f={f}
                ahora={ahora}
                reciente={recientes.has(f.id)}
                refEl={(el) => {
                  if (el) filasRef.current.set(f.id, el);
                  else filasRef.current.delete(f.id);
                }}
                onEstado={(e) => void cambiar(f, e)}
                onBorrar={() => setABorrar(f)}
              />
            ))}
          </ul>
        )}
      </div>

      <Confirmar
        abierto={aBorrar != null}
        titulo="¿Borrar esta sugerencia?"
        confirmar="Borrar"
        peligro
        onConfirmar={() => void confirmarBorrado()}
        onCancelar={() => setABorrar(null)}
      >
        <p className="dialogo-texto">Se borra para siempre; no se puede deshacer.</p>
        {aBorrar && <blockquote className="dialogo-cita">{aBorrar.texto}</blockquote>}
      </Confirmar>
    </>
  );
}

interface PropsFila {
  f: Sugerencia;
  ahora: number;
  reciente: boolean;
  refEl: (el: HTMLElement | null) => void;
  onEstado: (e: EstadoSug) => void;
  onBorrar: () => void;
}

function Fila({ f, ahora, reciente, refEl, onEstado, onBorrar }: PropsFila) {
  const idTexto = useId();
  return (
    <li>
      <article
        ref={refEl}
        tabIndex={-1}
        className={`fila ${f.estado}${reciente ? ' reciente' : ''}`}
        aria-labelledby={idTexto}
      >
        <div className="fila-cabeza">
          <span className={`insignia ${f.estado}`}>{ETIQUETA_ESTADO[f.estado]}</span>
          <time className="fila-fecha" dateTime={f.created_at} title={fechaExacta(f.created_at)}>
            {fechaRelativa(f.created_at, ahora)}
          </time>
        </div>
        <Texto id={idTexto} texto={f.texto} />
        <div className="fila-acciones">
          {f.estado === 'archivada' ? (
            <button type="button" className="accion" onClick={() => onEstado('leida')}>
              <IconoDesarchivar />
              <span>Desarchivar</span>
            </button>
          ) : (
            <>
              {f.estado === 'nueva' ? (
                <button type="button" className="accion" onClick={() => onEstado('leida')}>
                  <IconoLeida />
                  <span>Leída</span>
                </button>
              ) : (
                <button type="button" className="accion" onClick={() => onEstado('nueva')}>
                  <IconoNueva />
                  <span>Nueva</span>
                </button>
              )}
              <button type="button" className="accion" onClick={() => onEstado('archivada')}>
                <IconoArchivar />
                <span>Archivar</span>
              </button>
            </>
          )}
          <button type="button" className="accion peligro" onClick={onBorrar} aria-label="Borrar sugerencia">
            <IconoBorrar />
            <span className="solo-ancho">Borrar</span>
          </button>
        </div>
      </article>
    </li>
  );
}

// El texto, cortado a 3 líneas; «Ver más» solo si de verdad no cabe.
function Texto({ id, texto }: { id: string; texto: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [corta, setCorta] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      if (!abierto) setCorta(el.scrollHeight > el.clientHeight + 1);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [texto, abierto]);

  return (
    <div className="fila-texto">
      <p ref={ref} id={id} className={abierto ? '' : 'cortado'}>
        {texto}
      </p>
      {(corta || abierto) && (
        <button
          type="button"
          className="ver-mas"
          aria-expanded={abierto}
          aria-controls={id}
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
}

function Esqueleto() {
  return (
    <ul className="filas" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i}>
          <div className="fila esqueleto">
            <div className="fila-cabeza">
              <span className="hueso" style={{ width: 64 }} />
              <span className="hueso" style={{ width: 80 }} />
            </div>
            <span className="hueso linea" />
            <span className="hueso linea" style={{ width: i % 2 ? '70%' : '85%' }} />
            <div className="fila-acciones">
              <span className="hueso boton-hueso" />
              <span className="hueso boton-hueso" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
