import type { ReactNode } from 'react';

type Props = {
  titulo: string;
  children?: ReactNode;
  accion?: ReactNode;
};

export function EstadoVacio({ titulo, children, accion }: Props) {
  return (
    <div className="estado-vacio">
      <h3>{titulo}</h3>
      {children && <p>{children}</p>}
      {accion}
    </div>
  );
}
