import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type VarianteBoton = 'primario' | 'secundario' | 'peligro' | 'fantasma';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton;
  cargando?: boolean;
  children: ReactNode;
};

export function Boton({
  variante = 'primario',
  cargando = false,
  disabled,
  className = '',
  children,
  ...props
}: Props) {
  return (
    <button
      className={`boton boton--${variante}${className ? ` ${className}` : ''}`}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando && <span className="boton__indicador" aria-hidden="true" />}
      {children}
    </button>
  );
}
