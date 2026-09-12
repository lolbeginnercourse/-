'use client';

import { FormEvent, useState } from 'react';

export function LoginForm() {
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessKey || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'ログインできませんでした。');
      window.location.assign('/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ログインできませんでした。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginShell">
      <section className="loginCard">
        <div className="brandMark loginBrand">AO</div>
        <p className="eyebrow">PRIVATE OPERATIONS</p>
        <h1>AI Office</h1>
        <p className="loginLead">このオフィスは非公開です。設定したアクセスキーで入室してください。</p>
        <form onSubmit={login} className="loginForm">
          <label htmlFor="office-key">アクセスキー</label>
          <input id="office-key" type="password" autoComplete="current-password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} autoFocus />
          {error ? <p className="loginError">{error}</p> : null}
          <button type="submit" disabled={loading || !accessKey}>{loading ? '確認中' : 'オフィスに入る'}</button>
        </form>
        <p className="loginNote">セッションCookieはHttpOnly / SameSite=Strictで保存されます。</p>
      </section>
    </main>
  );
}
