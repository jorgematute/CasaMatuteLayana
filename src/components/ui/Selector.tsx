import type { ReactNode, SelectHTMLAttributes } from 'react';

export type OpcionSelector = { valor: string; etiqueta: string };

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> & {
  id: string;
  etiqueta: string;
  opciones: OpcionSelector[];
  marcador?: string;
  ayuda?: ReactNode;
  error?: string;
};

export function Selector({
  id,
  etiqueta,
  opciones,
  marcador,
  ayuda,
  error,
  className = '',
  ...props
}: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <select
        className={`campo__control campo__control--selector${className ? ` ${className}` : ''}`}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {marcador && <option value="">{marcador}</option>}
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {ayuda && (
        <span className="campo__ayuda" id={idAyuda}>
          {ayuda}
        </span>
      )}
      {error && (
        <span className="campo__error" id={idError} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
