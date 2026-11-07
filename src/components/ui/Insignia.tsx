import type { HTMLAttributes, ReactNode } from 'react';

export type TonoInsignia =
  'neutro' | 'primario' | 'verde' | 'amarillo' | 'rojo' | 'ingreso' | 'gasto';

type Props = HTMLAttributes<HTMLSpanElement> & {
  tono?: TonoInsignia;
  children: ReactNode;
};

export function Insignia({ tono = 'neutro', children, className = '', ...props }: Props) {
  return (
    <span className={`insignia insignia--${tono}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </span>
  );
}
