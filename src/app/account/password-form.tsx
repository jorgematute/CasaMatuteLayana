'use client';

import { useState, type FormEvent } from 'react';

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'No se pudo cambiar la contraseña.');
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Tu contraseña se cambió correctamente.');
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="password-form" onSubmit={handleSubmit}>
      <div className="login-field">
        <label htmlFor="current-password">Contraseña actual</label>
        <input
          autoComplete="current-password"
          id="current-password"
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          type="password"
          value={currentPassword}
        />
      </div>
      <div className="login-field">
        <label htmlFor="new-password">Nueva contraseña</label>
        <input
          autoComplete="new-password"
          id="new-password"
          minLength={12}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          type="password"
          value={newPassword}
        />
        <p className="password-hint">Usa al menos 12 caracteres.</p>
      </div>
      <div className="login-field">
        <label htmlFor="confirm-password">Confirma la nueva contraseña</label>
        <input
          autoComplete="new-password"
          id="confirm-password"
          minLength={12}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>
      {error && <p className="login-auth-error" role="alert">{error}</p>}
      {success && <p className="password-success" role="status">{success}</p>}
      <button className="login-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
        {!isSubmitting && <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}
