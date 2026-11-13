'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBackend } from '@/lib/get-backend';
import { isConfigured } from '@/lib/supabase';
import { useModalBehavior } from './useModalBehavior';

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useModalBehavior(true, onClose);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await getBackend().signIn(email.trim(), password);
      router.push('/admin');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'No se pudo entrar');
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <form
        className="dialog"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <div className="dialog-title" id="login-title">
          Entrar a tu panel
        </div>
        <div className="field">
          <label htmlFor="login-email">Correo</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-pw">Contraseña</label>
          <input
            id="login-pw"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <span className="error-text" role="alert">
          {err}
        </span>
        {!isConfigured && (
          <span className="muted" style={{ fontSize: 14 }}>
            Modo de prueba: lo que cambies se guarda solo en este navegador hasta que conectes Supabase.
          </span>
        )}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>
    </div>
  );
}
