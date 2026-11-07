import type { HTMLAttributes, ReactNode } from 'react';

type Props = HTMLAttributes<HTMLElement> & {
  titulo?: string;
  children: ReactNode;
};

export function Tarjeta({ titulo, children, className = '', ...props }: Props) {
  return (
    <section className={`tarjeta${className ? ` ${className}` : ''}`} {...props}>
      {titulo && <h2 className="tarjeta__titulo">{titulo}</h2>}
      {children}
    </section>
  );
}
