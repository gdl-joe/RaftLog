import { useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd]     = useState('');
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const u = await api.login(email, pwd);
      onLogin(u);
    } catch (ex) {
      setErr(ex.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg">
      <form onSubmit={submit} className="w-full max-w-sm bg-bg-2 border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-water to-water-dark text-white flex items-center justify-center shadow-glow">
            <Icon.Waves size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">RaftLog</h1>
            <p className="text-sm text-text-dim mt-1">Packraft-Tourenbuch</p>
          </div>
        </div>

        <label className="field-label">E-Mail</label>
        <input type="email" required className="field mb-4" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />

        <label className="field-label">Passwort</label>
        <input type="password" required className="field mb-2" value={pwd} onChange={e => setPwd(e.target.value)} autoComplete="current-password" />

        {err && (
          <div className="mt-4 text-sm p-3 bg-danger/10 text-danger border border-danger/30 rounded-lg">
            {err}
          </div>
        )}

        <button className="btn btn-primary w-full mt-5" disabled={busy}>
          {busy ? <span className="spinner" /> : 'Anmelden'}
        </button>
      </form>
    </div>
  );
}
