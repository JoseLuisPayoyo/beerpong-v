// La isla del panel (/admin): decide qué se ve según la sesión.
//   sin sesión → acceso · sesión sin permiso → «Sin acceso» (y se cierra) · admin → el panel
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, mensajeError } from './supabase';
import Shell from './Shell';
import { IconoAlerta, IconoCandado, IconoRecargar } from './iconos';

type Fase =
  | { t: 'arrancando' }
  | { t: 'fuera' }
  | { t: 'comprobando' }
  | { t: 'dentro'; email: string }
  | { t: 'sinAcceso'; email: string }
  | { t: 'error'; mensaje: string };

export default function Panel() {
  const [sesion, setSesion] = useState<Session | null | undefined>(undefined);
  const [fase, setFase] = useState<Fase>({ t: 'arrancando' });
  const [intento, setIntento] = useState(0);
  // cambia al saberse la sesión, al entrar o salir y al cambiar de usuario (no al renovar el token)
  const quien = sesion === undefined ? '?' : (sesion?.user.id ?? '-');

  useEffect(() => {
    if (!supabase) return;
    // INITIAL_SESSION llega enseguida con la sesión guardada (o null).
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSesion(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // ¿Es admin? Se pregunta a la propia base de datos (es_admin()), la misma
  // función que usan las políticas de RLS. Solo cuando cambia el usuario (no a
  // cada renovación del token).
  useEffect(() => {
    if (!supabase || sesion === undefined) return;
    if (!sesion) {
      setFase((f) => (f.t === 'sinAcceso' ? f : { t: 'fuera' }));
      return;
    }
    const email = sesion.user.email ?? '';
    let vigente = true;
    setFase({ t: 'comprobando' });
    supabase.rpc('es_admin').then(({ data, error }) => {
      if (!vigente) return;
      if (error) {
        setFase({ t: 'error', mensaje: mensajeError(error, 'La comprobación de acceso') });
      } else if (data === true) {
        setFase({ t: 'dentro', email });
      } else {
        setFase({ t: 'sinAcceso', email });
        void supabase!.auth.signOut({ scope: 'local' });
      }
    });
    return () => {
      vigente = false;
    };
  }, [quien, intento]);

  if (!supabase) {
    return (
      <Tarjeta titulo="Panel sin configurar" icono={<IconoAlerta tam={26} />}>
        <p>Faltan PUBLIC_SUPABASE_URL o PUBLIC_SUPABASE_PUBLISHABLE_KEY en el entorno de este despliegue.</p>
      </Tarjeta>
    );
  }

  switch (fase.t) {
    case 'arrancando':
    case 'comprobando':
      return <Cargando />;
    case 'fuera':
      return <Acceso />;
    case 'sinAcceso':
      return (
        <Tarjeta titulo="Sin acceso" icono={<IconoCandado tam={26} />}>
          <p>
            La cuenta <strong>{fase.email}</strong> no tiene permiso para entrar en el panel. Se ha cerrado la sesión.
          </p>
          <button type="button" className="boton primario ancho" onClick={() => setFase({ t: 'fuera' })}>
            Entrar con otra cuenta
          </button>
        </Tarjeta>
      );
    case 'error':
      return (
        <Tarjeta titulo="No se ha podido entrar" icono={<IconoAlerta tam={26} />}>
          <p role="alert">{fase.mensaje}</p>
          <button type="button" className="boton primario ancho" onClick={() => setIntento((n) => n + 1)}>
            <IconoRecargar />
            <span>Reintentar</span>
          </button>
          <button type="button" className="boton ancho" onClick={() => void supabase!.auth.signOut({ scope: 'local' })}>
            Cerrar sesión
          </button>
        </Tarjeta>
      );
    case 'dentro':
      return <Shell email={fase.email} onSalir={() => void supabase!.auth.signOut({ scope: 'local' })} />;
  }
}

function Acceso() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => emailRef.current?.focus(), []);

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError('');
    const { error } = await supabase!.auth.signInWithPassword({ email: email.trim(), password: clave });
    setEnviando(false);
    if (!error) return; // onAuthStateChange se encarga del resto
    const codigo = (error as { code?: string }).code;
    if (codigo === 'invalid_credentials') setError('Email o contraseña incorrectos.');
    else if (error.status === 429) setError('Demasiados intentos. Espera un poco y vuelve a probar.');
    else setError(mensajeError(error, 'El acceso'));
  }

  return (
    <Tarjeta titulo="Panel de Beerpong V" marca>
      <form className="acceso" onSubmit={entrar}>
        <label className="campo-admin">
          <span>Email</span>
          <input
            ref={emailRef}
            type="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="campo-admin">
          <span>Contraseña</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </label>
        <p className="acceso-error" role="alert">
          {error}
        </p>
        <button type="submit" className="boton primario ancho" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Tarjeta>
  );
}

function Tarjeta({
  titulo,
  icono,
  marca,
  children,
}: {
  titulo: string;
  icono?: ReactNode;
  marca?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="portal">
      <div className="tarjeta">
        {marca ? (
          <img className="tarjeta-marca" src="/favicon.svg" width="48" height="48" alt="" />
        ) : (
          icono && <span className="tarjeta-icono">{icono}</span>
        )}
        <h1 className="tarjeta-titulo">{titulo}</h1>
        {children}
      </div>
    </main>
  );
}

function Cargando() {
  return (
    <main className="portal" aria-busy="true">
      <p className="cargando" role="status">
        <span className="girar" aria-hidden="true" />
        Cargando el panel…
      </p>
    </main>
  );
}
