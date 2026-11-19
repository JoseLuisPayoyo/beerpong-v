// La estructura del panel: barra lateral (cajón en móvil) + contenido.
import { useEffect, useRef, useState } from 'react';
import Avisos from './Avisos';
import { IconoCerrar, IconoMenu, IconoSalir } from './iconos';
import { PESTANAS, type Pestana } from './pestanas';

const desdeHash = () => {
  const id = location.hash.slice(1);
  return PESTANAS.some((p) => p.id === id) ? id : PESTANAS[0].id;
};

export default function Shell({ email, onSalir }: { email: string; onSalir: () => void }) {
  const [actual, setActual] = useState(desdeHash);
  const [abierto, setAbierto] = useState(false);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const lateral = useRef<HTMLElement>(null);
  const contenido = useRef<HTMLElement>(null);
  const pestana = PESTANAS.find((p) => p.id === actual) ?? PESTANAS[0];

  // Datos de cada pestaña: arrancan al entrar y paran al salir del panel.
  useEffect(() => {
    const paradas = PESTANAS.map((p) => p.iniciar?.());
    return () => paradas.forEach((parar) => parar?.());
  }, []);

  useEffect(() => {
    const alCambiarHash = () => {
      const id = location.hash.slice(1);
      if (PESTANAS.some((p) => p.id === id)) setActual(id);
    };
    addEventListener('hashchange', alCambiarHash);
    return () => removeEventListener('hashchange', alCambiarHash);
  }, []);

  // Cajón (móvil): Esc lo cierra; al abrir, el foco entra; al cerrar, vuelve al botón.
  const yaAbierto = useRef(false);
  useEffect(() => {
    if (abierto) {
      lateral.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
      const alTeclear = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setAbierto(false);
      };
      addEventListener('keydown', alTeclear);
      yaAbierto.current = true;
      return () => removeEventListener('keydown', alTeclear);
    }
    if (yaAbierto.current) botonMenu.current?.focus();
  }, [abierto]);

  // Si se pasa a escritorio con el cajón abierto, se cierra.
  useEffect(() => {
    const mq = matchMedia('(min-width: 900px)');
    const f = () => mq.matches && setAbierto(false);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);

  function ir(p: Pestana) {
    if (p.id !== actual) {
      history.replaceState(null, '', `#${p.id}`);
      setActual(p.id);
    }
    if (abierto) {
      yaAbierto.current = false; // el foco va al contenido, no al botón de menú
      setAbierto(false);
    }
    requestAnimationFrame(() => contenido.current?.focus());
  }

  const Componente = pestana.Componente;

  return (
    <div className="app">
      <a
        className="saltar"
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          contenido.current?.focus();
        }}
      >
        Ir al contenido
      </a>

      <header className="movil-cabecera" inert={abierto}>
        <button
          ref={botonMenu}
          type="button"
          className="icono-boton"
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="lateral"
          onClick={() => setAbierto(true)}
        >
          <IconoMenu tam={24} />
        </button>
        <Marca />
      </header>

      <aside
        id="lateral"
        ref={lateral}
        className={`lateral${abierto ? ' abierto' : ''}`}
        aria-label="Panel de Beerpong V"
      >
        <div className="lateral-cabeza">
          <Marca />
          <button
            type="button"
            className="icono-boton solo-movil"
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
          >
            <IconoCerrar tam={24} />
          </button>
        </div>

        <nav aria-label="Secciones">
          <ul className="nav">
            {PESTANAS.map((p) => (
              <li key={p.id}>
                <EnlacePestana p={p} activa={p.id === actual} onIr={() => ir(p)} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="lateral-pie">
          <p className="usuario" title={email}>
            <span className="usuario-inicial" aria-hidden="true">
              {email.charAt(0).toUpperCase()}
            </span>
            <span className="usuario-email">{email}</span>
          </p>
          <button type="button" className="boton salir" onClick={onSalir}>
            <IconoSalir />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="velo" hidden={!abierto} onClick={() => setAbierto(false)} />

      <main id="contenido" ref={contenido} tabIndex={-1} className="contenido" inert={abierto}>
        <Componente />
      </main>

      <Avisos />
    </div>
  );
}

function Marca() {
  return (
    <span className="marca-admin">
      <img src="/favicon.svg" width="28" height="28" alt="" />
      <span>Beerpong V</span>
    </span>
  );
}

function EnlacePestana({ p, activa, onIr }: { p: Pestana; activa: boolean; onIr: () => void }) {
  const n = p.useContador?.() ?? null;
  return (
    <a
      href={`#${p.id}`}
      className="nav-enlace"
      aria-current={activa ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        onIr();
      }}
    >
      <p.Icono />
      <span className="nav-texto">{p.etiqueta}</span>
      {n != null && n > 0 && (
        <span className="nav-num">
          <span aria-hidden="true">{n}</span>
          <span className="sr">{p.contadorEtiqueta?.(n) ?? n}</span>
        </span>
      )}
    </a>
  );
}
