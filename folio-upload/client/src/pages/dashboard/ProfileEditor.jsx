import { useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Field from '../../components/Field.jsx';
import Notice from '../../components/Notice.jsx';

const TEMPLATES = [
  { id: 'vellum', label: 'Vellum', note: 'Warm, technical classic', bg: '#f0f4f2', ink: '#1c2b39', style: 'Classic' },
  { id: 'blueprint', label: 'Blueprint', note: 'Dark, architectural', bg: '#0f2e4d', ink: '#e6f0fa', style: 'Dark' },
  { id: 'minimal', label: 'Minimal', note: 'Clean, quiet and focused', bg: '#ffffff', ink: '#202124', style: 'Clean' },
  { id: 'atelier', label: 'Atelier', note: 'Expressive creative portfolio', bg: '#f6eee4', ink: '#382b24', style: 'Creative' },
  { id: 'editorial', label: 'Editorial', note: 'Refined, magazine-inspired', bg: '#f5f0e8', ink: '#29251f', style: 'Elegant' },
  { id: 'terminal', label: 'Terminal', note: 'Developer / monospace look', bg: '#101713', ink: '#b8f7c2', style: 'Developer' },
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
        <div className="profile-head-actions">
          <a href={`/u/${user.username}?preview=1`} target="_blank" rel="noreferrer" className="btn">View CV</a>
          <a href={`/u/${user.username}`} target="_blank" rel="noreferrer">Public page ↗</a>
        </div>
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

        <fieldset className="themes template-picker">
          <legend className="field-label">Portfolio template</legend>
          <p className="muted template-help">Choose a look for your public portfolio and CV. Your profile content stays the same.</p>
          <div className="template-grid">
            {TEMPLATES.map((t) => (
              <label key={t.id} className={`template-opt ${form.theme === t.id ? 'selected' : ''}`}>
                <input type="radio" name="theme" value={t.id} checked={form.theme === t.id} onChange={set('theme')} />
                <span className={`template-swatch template-swatch-${t.id}`} style={{ background: t.bg, color: t.ink }}>
                  <i /><i /><i />
                  <b>{t.style}</b>
                </span>
                <span className="template-copy"><strong>{t.label}</strong><small>{t.note}</small></span>
                {form.theme === t.id && <span className="template-selected">Selected</span>}
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile & template'}</button>
      </form>
    </>
  );
}
