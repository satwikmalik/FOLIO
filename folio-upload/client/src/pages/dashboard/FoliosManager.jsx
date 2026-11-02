import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import Notice from '../../components/Notice.jsx';

export default function FoliosManager() {
  const [folios, setFolios] = useState([]);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [f, p, s] = await Promise.all([api('/folios'), api('/projects'), api('/skills')]);
      setFolios(f.folios); setProjects(p.projects); setSkills(s.skills);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      await api('/folios', { method: 'POST', body: { title, description, visibility, theme: 'vellum', projects: [], skills: [] } });
      setTitle(''); setDescription(''); setVisibility('private');
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function toggle(folio) {
    const next = folio.visibility === 'public' ? 'private' : 'public';
    try {
      const result = await api(`/folios/${folio._id}`, { method: 'PUT', body: { visibility: next } });
      setFolios((items) => items.map((item) => item._id === folio._id ? result.folio : item));
    } catch (err) { setError(err.message); }
  }

  async function remove(folio) {
    if (!window.confirm(`Delete "${folio.title}"? This won't delete your profile, skills or projects.`)) return;
    try { await api(`/folios/${folio._id}`, { method: 'DELETE' }); await load(); }
    catch (err) { setError(err.message); }
  }

  return (
    <>
      <header className="page-head"><div><h1>My Folios</h1><p className="muted">Create separate CVs for different roles. Each one has its own visibility and content selection.</p></div><Link className="btn" to="/explore">Explore public Folios ↗</Link></header>
      {error && <Notice type="error">{error}</Notice>}
      <section className="panel" style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Create a Folio</h2>
        <form onSubmit={create}>
          <label className="field"><span className="field-label">Folio title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Developer CV" maxLength={80} required /></label>
          <label className="field"><span className="field-label">Short description</span><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A focused portfolio for frontend roles" maxLength={240} /></label>
          <label className="field"><span className="field-label">Visibility</span><select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}><option value="private">Private — only me</option><option value="public">Public — visible in Explore</option></select></label>
          <button className="btn primary" disabled={busy || !title.trim()}>{busy ? 'Creating…' : 'Create Folio'}</button>
        </form>
      </section>
      {loading ? <p className="muted">Loading your Folios…</p> : (
        <div className="items">
          {folios.map((folio) => (
            <article className="item" key={folio._id} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 4px' }}>{folio.title}</h3>
                <p className="muted" style={{ margin: '0 0 8px' }}>/f/{folio.slug} · {folio.views || 0} views</p>
                {folio.description && <p className="muted">{folio.description}</p>}
                <span className={`badge ${folio.visibility === 'public' ? 'success' : ''}`}>{folio.visibility === 'public' ? 'Public · listed in Explore' : 'Private · owner only'}</span>
              </div>
              <div className="item-actions" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Link className="btn" to={`/dashboard/folios/${folio._id}`}>Edit</Link>
                <button className="btn" type="button" onClick={() => toggle(folio)}>{folio.visibility === 'public' ? 'Make private' : 'Make public'}</button>
                {folio.visibility === 'public' && <Link className="btn" to={`/f/${folio.slug}`}>View ↗</Link>}
                {folios.length > 1 && <button className="btn" type="button" onClick={() => remove(folio)}>Delete</button>}
              </div>
            </article>
          ))}
          {!folios.length && <p className="muted">No Folios yet. Create your first one above.</p>}
        </div>
      )}
      <p className="muted" style={{ marginTop: 20 }}>Your skills and projects are stored separately in your account. Each Folio can select its own combination.</p>
    </>
  );
}
