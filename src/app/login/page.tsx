'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const validPassword = password.trim().length > 0;

    setEmailError(validEmail ? '' : 'Escribe un correo válido.');
    setPasswordError(validPassword ? '' : 'La contraseña es obligatoria.');
    setAuthError('');

    if (!validEmail || !validPassword) return;

    setIsSubmitting(true);
    try {
      // TODO: migrar a Supabase Auth cuando se active el backend remoto.
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setAuthError(result.error ?? 'Correo o contraseña incorrectos');
        return;
      }
      router.push('/');
    } catch {
      setAuthError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <header className="login-header">
        <Link className="brand" href="/" aria-label="Casa Matute Layana, inicio">
          Casa <span>Matute</span>
        </Link>
        <span className="login-header-note">PRESUPUESTO DEL HOGAR</span>
      </header>

      <section className="login-layout" aria-labelledby="login-title">
        <div className="login-intro">
          <div className="eyebrow">Un lugar para tus cuentas</div>
          <h1 id="login-title">Tu casa,<br />en equilibrio.</h1>
          <p>Organiza el presupuesto de casa con claridad y empieza cada mes con un plan compartido.</p>
          <div className="login-stamp" aria-hidden="true">
            <span className="login-stamp-mark">CM</span>
            <span className="login-stamp-line" />
            <span className="mono">CASA / MATUTE / LAYANA</span>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-panel-heading">
            <span className="login-indicator" aria-hidden="true" />
            <span className="mono">ACCESO A TU ESPACIO</span>
          </div>
          <h2>Qué bueno verte.</h2>
          <p className="login-subtitle">Ingresa tus datos para continuar.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="email">Correo electrónico</label>
              <input
                autoComplete="email"
                id="email"
                name="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError('');
                  setAuthError('');
                }}
                placeholder="tu@correo.com"
                type="email"
                value={email}
                aria-invalid={Boolean(emailError)}
                aria-describedby={emailError ? 'email-error' : undefined}
              />
              {emailError && <p className="login-field-error" id="email-error">{emailError}</p>}
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError('');
                  setAuthError('');
                }}
                placeholder="Tu contraseña"
                type="password"
                value={password}
                aria-invalid={Boolean(passwordError)}
                aria-describedby={passwordError ? 'password-error' : undefined}
              />
              {passwordError && <p className="login-field-error" id="password-error">{passwordError}</p>}
            </div>

            <div className="login-forgot-row">
              <a href="#" onClick={(event) => event.preventDefault()}>Olvidé mi contraseña</a>
            </div>

            {authError && <p className="login-auth-error" role="alert">{authError}</p>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="login-panel-foot"><span>CASA MATUTE LAYANA</span><span>01 / 01</span></div>
        </div>
      </section>

      <footer className="login-footer">
        <span>Hecho para cuidar lo que importa.</span>
        <span className="mono">CM / 2026</span>
      </footer>
    </main>
  );
}