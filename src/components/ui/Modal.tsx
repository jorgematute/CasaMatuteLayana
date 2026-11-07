'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Boton } from '@/components/ui/Boton';

type Props = {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
};

export function Modal({ abierto, titulo, onCerrar, children }: Props) {
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;

    const elementoAnterior = document.activeElement;
    dialogoRef.current?.focus();
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCerrar();
    };

    document.addEventListener('keydown', cerrarConEscape);
    return () => {
      document.removeEventListener('keydown', cerrarConEscape);
      if (elementoAnterior instanceof HTMLElement) elementoAnterior.focus();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="modal__fondo"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar();
      }}
    >
      <div
        aria-labelledby="modal-titulo"
        aria-modal="true"
        className="modal"
        ref={dialogoRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="modal__encabezado">
          <h2 id="modal-titulo">{titulo}</h2>
          <Boton aria-label="Cerrar ventana" onClick={onCerrar} type="button" variante="fantasma">
            Cerrar
          </Boton>
        </header>
        <div className="modal__contenido">{children}</div>
      </div>
    </div>
  );
}
