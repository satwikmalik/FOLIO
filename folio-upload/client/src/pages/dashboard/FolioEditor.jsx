import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import Notice from '../../components/Notice.jsx';

export default function FolioEditor() {
  const { id } = useParams();
  const [folio, setFolio] = useState(null);
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api(`/folios/${id}`), api('/projects'), api('/skills')]).then(([f, p, s]) => {
      setFolio(f.folio); setProjects(p.projects); setSkills(s.skills);
      setSelectedProjects(f.folio.projects || []); setSelectedSkills(f.folio.skills || []);
    }).catch((err) => setError(err.message));
  }, [id]);

  async function save(e) {
    e.preventDefault(); setBusy(true); setError(''); setStatus('');
    try {
      const data = await api(`/folios/${id}`, { method: 'PUT', body: {
        title: folio.title, description: folio.description, slug: folio.slug,
        visibility: folio.visibility, theme: folio.theme,
        projects: selectedProjects, skills: selectedSkills,
      }});
      setFolio(data.folio); setStatus('Folio saved.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  const toggle = (value, setter) => (checked) => setter((current) => checked ? [...current, value] : current.filter((id) => id !== value));

  if (!folio) return <><Link to="/dashboard/folios">← My Folios</Link><p className="muted">{error || 'Loading Folio…'}</p></>;
  return <>
    <header className="page-head"><div><Link to="/dashboard/folios">← My Folios</Link><h1 style={{ marginTop: 8 }}>Edit Folio</h1></div>{folio.visibility === 'public' && <Link className="btn" to={`/f/${folio.slug}`}>View public Folio ↗</Link>}</header>
    {error && <Notice type="error">{error}</Notice>}{status && <Notice type="info">{status}</Notice>}
    <form onSubmit={save}>
      <label className="field"><span className="field-label">Title</span><input className="input" value={folio.title} maxLength={80} onChange={(e) => setFolio({ ...folio, title: e.target.value })} required /></label>
      <label className="field"><span className="field-label">URL slug</span><input className="input" value={folio.slug} onChange={(e) => setFolio({ ...folio, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></label>
      <label className="field"><span className="field-label">Description</span><textarea className="input" value={folio.description || ''} maxLength={240} onChange={(e) => setFolio({ ...folio, description: e.target.value })} /></label>
      <label className="field"><span className="field-label">Visibility</span><select className="input" value={folio.visibility} onChange={(e) => setFolio({ ...folio, visibility: e.target.value })}><option value="private">Private — only me</option><option value="public">Public — visible in Explore</option></select></label>
      <label className="field"><span className="field-label">Template</span><select className="input" value={folio.theme} onChange={(e) => setFolio({ ...folio, theme: e.target.value })}>{['vellum','blueprint','minimal','atelier','editorial','terminal'].map((t) => <option key={t} value={t}>{t[0].toUpperCase()+t.slice(1)}</option>)}</select></label>
      <section style={{ margin: '24px 0' }}><h2>Choose projects for this Folio</h2>{projects.length ? projects.map((p) => <label key={p._id} className="choice-row"><input type="checkbox" checked={selectedProjects.includes(p._id)} onChange={(e) => toggle(p._id, setSelectedProjects)(e.target.checked)} /> {p.title}</label>) : <p className="muted">Add projects in your <Link to="/dashboard/projects">project library</Link> first.</p>}</section>
      <section style={{ margin: '24px 0' }}><h2>Choose skills for this Folio</h2>{skills.length ? skills.map((s) => <label key={s._id} className="choice-row"><input type="checkbox" checked={selectedSkills.includes(s._id)} onChange={(e) => toggle(s._id, setSelectedSkills)(e.target.checked)} /> {s.name}</label>) : <p className="muted">Add skills in your <Link to="/dashboard/skills">skills library</Link> first.</p>}</section>
      <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save Folio'}</button>
    </form>
  </>;
}
