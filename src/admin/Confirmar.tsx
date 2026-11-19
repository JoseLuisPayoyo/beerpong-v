// Confirmación propia dentro de la página (no el confirm() del navegador).
// Usa <dialog> modal: atrapa el foco, Esc cancela y el resto queda inerte.
import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  abierto: boolean;
  titulo: string;
  children?: ReactNode;
  confirmar: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export default function Confirmar({ abierto, titulo, children, confirmar, peligro, onConfirmar, onCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      // el foco empieza en «Cancelar»: lo seguro
      cancelar.current?.focus();
    } else if (!abierto && d.open) {
      d.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby="dialogo-titulo"
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      onClick={(e) => {
        // pulsar fuera de la caja (en el velo) cancela
        if (e.target === ref.current) onCancelar();
      }}
    >
      <div className="dialogo-caja">
        <h2 id="dialogo-titulo" className="dialogo-titulo">
          {titulo}
        </h2>
        {children}
        <div className="dialogo-botones">
          <button ref={cancelar} type="button" className="boton" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="button" className={`boton ${peligro ? 'peligro' : 'primario'}`} onClick={onConfirmar}>
            {confirmar}
          </button>
        </div>
      </div>
    </dialog>
  );
}
