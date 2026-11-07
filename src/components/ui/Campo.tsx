import type { InputHTMLAttributes, ReactNode } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  id: string;
  etiqueta: string;
  ayuda?: ReactNode;
  error?: string;
};

export function Campo({ id, etiqueta, ayuda, error, className = '', ...props }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="campo">
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input
        className={`campo__control${className ? ` ${className}` : ''}`}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={[idAyuda, idError].filter(Boolean).join(' ') || undefined}
        {...props}
      />
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
