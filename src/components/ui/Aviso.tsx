import type { HTMLAttributes, ReactNode } from 'react';

export type TipoAviso = 'info' | 'exito' | 'advertencia' | 'error';

type Props = HTMLAttributes<HTMLDivElement> & {
  tipo?: TipoAviso;
  titulo?: string;
  children: ReactNode;
};

export function Aviso({ tipo = 'info', titulo, children, className = '', ...props }: Props) {
  return (
    <div
      className={`aviso aviso--${tipo}${className ? ` ${className}` : ''}`}
      role={tipo === 'error' ? 'alert' : 'status'}
      {...props}
    >
      {titulo && <strong className="aviso__titulo">{titulo}</strong>}
      <div>{children}</div>
    </div>
  );
}
