import { useState } from 'react';
import { api } from '../api.js';
import { Icon } from '../icons.jsx';

export default function ProfileScreen({ user, onLogout, onUpdate, setTheme, theme }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setBusy(true); setMsg('');
    try {
      const payload = { name, email };
      if (pwd) payload.password = pwd;
      const u = await api.updateMe(payload);
      onUpdate(u);
      setMsg('Gespeichert');
      setPwd('');
    } catch (e) {
      setMsg('Fehler: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="page-title">Profil</h1>
      <p className="page-subtitle">Angemeldet als <strong className="text-text">{user.handle}</strong> · {user.role === 'admin' ? 'Administrator' : 'Viewer'}</p>

      <div className="bg-bg-2 border border-border rounded-xl p-5 mb-5">
        <label className="field-label">Name</label>
        <input className="field mb-3" value={name} onChange={e => setName(e.target.value)} />
        <label className="field-label">E-Mail</label>
        <input type="email" className="field mb-3" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="field-label">Neues Passwort (optional)</label>
        <input type="password" className="field mb-3" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Leer lassen, um nicht zu ändern" autoComplete="new-password" />
        {msg && <div className={'text-sm py-2 ' + (msg.startsWith('Fehler') ? 'text-danger' : 'text-success')}>{msg}</div>}
        <button className="btn btn-primary" disabled={busy} onClick={save}>
          {busy ? <span className="spinner" /> : <><Icon.Check size={16} /> Speichern</>}
        </button>
      </div>

      <div className="bg-bg-2 border border-border rounded-xl p-5 mb-5">
        <div className="font-semibold mb-3">Darstellung</div>
        <div className="flex gap-2">
          <button className={'btn ' + (theme === 'dark' ? 'btn-primary' : 'btn-secondary')} onClick={() => setTheme('dark')}>Dark</button>
          <button className={'btn ' + (theme === 'light' ? 'btn-primary' : 'btn-secondary')} onClick={() => setTheme('light')}>Light</button>
        </div>
      </div>

      <button className="btn btn-danger" onClick={onLogout}>
        <Icon.Logout size={16} /> Abmelden
      </button>
    </div>
  );
}
