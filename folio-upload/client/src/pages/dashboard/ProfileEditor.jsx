import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Field from '../../components/Field.jsx';
import Notice from '../../components/Notice.jsx';

const THEMES = [
  { id: 'vellum', label: 'Vellum', note: 'Light', bg: '#f0f4f2', ink: '#1c2b39' },
  { id: 'blueprint', label: 'Blueprint', note: 'Dark', bg: '#0f2e4d', ink: '#e6f0fa' },
];

export default function ProfileEditor() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || '',
    headline: user.headline || '',
    location: user.location || '',
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
    theme: user.theme || 'vellum',
    links: {
      github: user.links?.github || '',
      linkedin: user.links?.linkedin || '',
      twitter: user.links?.twitter || '',
      website: user.links?.website || '',
    },
  });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setLink = (key) => (e) => setForm((f) => ({ ...f, links: { ...f.links, [key]: e.target.value } }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: '', text: '' });
    try {
      const data = await api('/profile', { method: 'PUT', body: form });
      setUser(data.user);
      setStatus({ type: 'info', text: 'Profile saved.' });
    } catch (err) {
      setStatus({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Profile</h1>
        <a href={`/u/${user.username}`} target="_blank" rel="noreferrer">/u/{user.username}</a>
      </div>

      <Notice type={status.type || 'info'}>{status.text}</Notice>

      <form onSubmit={onSubmit}>
        <div className="grid2">
          <Field label="Name" value={form.name} onChange={set('name')} maxLength={60} />
          <Field label="Headline" value={form.headline} onChange={set('headline')} maxLength={100} hint="One line, e.g. Full-stack developer, 3rd year CSE" />
        </div>
        <Field label="Location" value={form.location} onChange={set('location')} maxLength={60} />
        <Field as="textarea" label="Bio" value={form.bio} onChange={set('bio')} maxLength={600} hint={`${form.bio.length}/600`} />
        <Field label="Photo link" value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://" hint="Direct link to an image. Shown as a square." />

        <div className="grid2">
          <Field label="GitHub" value={form.links.github} onChange={setLink('github')} placeholder="https://github.com/…" />
          <Field label="LinkedIn" value={form.links.linkedin} onChange={setLink('linkedin')} placeholder="https://linkedin.com/in/…" />
          <Field label="Twitter / X" value={form.links.twitter} onChange={setLink('twitter')} placeholder="https://x.com/…" />
          <Field label="Website" value={form.links.website} onChange={setLink('website')} placeholder="https://" />
        </div>

        <fieldset className="themes">
          <legend className="field-label">Look of your public page</legend>
          {THEMES.map((t) => (
            <label key={t.id} className="theme-opt">
              <input type="radio" name="theme" value={t.id} checked={form.theme === t.id} onChange={set('theme')} />
              <span className="swatch" style={{ background: t.bg, borderColor: t.ink }}>
                <i style={{ background: t.ink }} />
              </span>
              <span>{t.label} <span className="muted">({t.note})</span></span>
            </label>
          ))}
        </fieldset>

        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </>
  );
}
