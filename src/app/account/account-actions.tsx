'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AccountActions() {
  const [error, setError] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError('');

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error ?? 'No se pudo cerrar sesión.');
        setIsSigningOut(false);
        return;
      }

      window.location.replace('/login');
    } catch {
      setError('No se pudo conectar. Intenta de nuevo.');
      setIsSigningOut(false);
    }
  }

  return (
    <div className="account-actions">
      <Link href="/account">Mi cuenta</Link>
      <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
        {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
      </button>
      {error && <span className="account-actions-error" role="alert">{error}</span>}
    </div>
  );
}
