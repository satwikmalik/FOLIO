import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import './templates.css';

const LABELS = { vellum:'Vellum', blueprint:'Blueprint', minimal:'Minimal', atelier:'Atelier', editorial:'Editorial', terminal:'Terminal' };
export default function FolioPage() {
  const { slug } = useParams();
  const [folio, setFolio] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setFolio(null); setError('');
    api(`/public/folios/${slug}`).then((data) => { if (active) setFolio(data.folio); })
      .catch((err) => { if (active) setError(err.status === 404 ? 'This Folio is private or does not exist.' : err.message); });
    return () => { active = false; };
  }, [slug]);
  if (error) return <main className="auth"><h1>Folio unavailable</h1><p className="muted">{error}</p><Link to="/explore">Explore public Folios</Link></main>;
  if (!folio) return <main className="auth"><p className="muted">Loading Folio…</p></main>;
  const owner = folio.user || {};
  const links = Object.entries(owner.links || {}).filter(([, url]) => url);
  return <div className="page" data-theme={folio.theme || 'vellum'}>
    <article className="sheet">
      <header className="sheet-head">
        {owner.avatarUrl && <img className="avatar" src={owner.avatarUrl} alt="" />}
        <div style={{flex:1}}><h1>{owner.name || owner.username}</h1><p className="headline">{folio.title}</p>
          {owner.headline && <p className="muted">{owner.headline}</p>}
          {links.length > 0 && <nav className="sheet-links">{links.map(([key,url]) => <a key={key} href={url} target="_blank" rel="noreferrer">{key}</a>)}</nav>}
        </div>
        <button className="btn download-cv-btn" onClick={() => window.print()}>Download CV</button>
      </header>
      {folio.description && <section><p className="prose">{folio.description}</p></section>}
      {owner.bio && <section><p className="prose">{owner.bio}</p></section>}
      {folio.projects?.length > 0 && <section><h2>Selected Projects</h2><ul className="projects">{folio.projects.map(p => <li className="project" key={p._id}><div><h3>{p.title}</h3>{p.description && <p className="prose">{p.description}</p>}{p.imageUrl && <img src={p.imageUrl} alt={p.title} loading="lazy" />}</div><div>{p.tags?.length > 0 && <ul className="tags">{p.tags.map(t => <li key={t}>{t}</li>)}</ul>}<div className="project-links">{p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Live</a>}{p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer">Source</a>}</div></div></li>)}</ul></section>}
      {folio.skills?.length > 0 && <section><h2>Selected Skills</h2><ul className="skills">{folio.skills.map(s => <li key={s._id}><span>{s.name}</span><small>{s.level}</small></li>)}</ul></section>}
      {(owner.location || links.length) && <section><h2>About</h2>{owner.location && <p className="muted">{owner.location}</p>}</section>}
      <table className="titleblock"><tbody><tr><th>Folio</th><td>{folio.title}</td></tr><tr><th>Template</th><td>{LABELS[folio.theme] || 'Vellum'}</td></tr><tr><th>Views</th><td>{folio.views || 0}</td></tr></tbody></table>
    </article><p className="credit">Made with <Link to="/">Folio</Link></p>
  </div>;
}
