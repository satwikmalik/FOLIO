import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import ContactForm from '../components/ContactForm.jsx';

const LEVELS = { learning: 1, comfortable: 2, strong: 3 };
const LEVEL_LABEL = { learning: 'Learning', comfortable: 'Comfortable', strong: 'Strong' };
const THEME_LABEL = { vellum: 'Vellum', blueprint: 'Blueprint' };
const LINK_LABEL = { github: 'GitHub', linkedin: 'LinkedIn', twitter: 'Twitter / X', website: 'Website' };

function Level({ level }) {
  return (
    <span className="level">
      <small>{LEVEL_LABEL[level]}</small>
      {[1, 2, 3].map((n) => <i key={n} className={n <= LEVELS[level] ? 'on' : ''} />)}
    </span>
  );
}

export default function Portfolio() {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const preview = searchParams.get('preview');

  useEffect(() => {
    let cancelled = false;
    setUser(null);
    setError('');
    const path = preview ? `/public/${username}?preview=${preview}` : `/public/${username}`;
    api(path)
      .then((d) => !cancelled && setUser(d.user))
      .catch((err) => !cancelled && setError(err.status === 404 ? 'notfound' : err.message));
    return () => { cancelled = true; };
  }, [username, preview]);

  useEffect(() => {
    if (user) document.title = `${user.name || user.username} | Folio`;
    return () => { document.title = 'Folio'; };
  }, [user]);

  if (error === 'notfound') {
    return (
      <main className="auth">
        <h1>No page at /u/{username}</h1>
        <p className="muted">That username is not registered. <Link to="/register">Claim it</Link>.</p>
      </main>
    );
  }
  if (error) return <main className="auth"><p className="notice error">{error}</p></main>;
  if (!user) return <main className="auth"><p className="muted">Loading…</p></main>;

  const links = Object.entries(user.links || {}).filter(([, v]) => v);
  const since = new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  const empty = user.projects.length === 0 && user.skills.length === 0;

  return (
    <div className="page" data-theme={user.theme}>
      <article className="sheet">
        <header className="sheet-head">
          {user.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" />}
          <div style={{ flex: 1 }}>
            <h1>{user.name || user.username}</h1>
            {user.headline && <p className="headline">{user.headline}</p>}
            {links.length > 0 && (
              <nav className="sheet-links" aria-label="Profiles">
                {links.map(([key, href]) => (
                  <a key={key} href={href} target="_blank" rel="noreferrer">{LINK_LABEL[key]}</a>
                ))}
              </nav>
            )}
          </div>
          <button type="button" className="btn download-cv-btn" onClick={() => window.print()}>
            Download CV
          </button>
        </header>

        {user.bio && <section><p className="prose">{user.bio}</p></section>}

        {user.projects.length > 0 && (
          <section>
            <h2>Projects</h2>
            <ul className="projects">
              {user.projects.map((p) => (
                <li key={p._id} className="project">
                  <div>
                    <h3>{p.title}</h3>
                    {p.description && <p className="prose">{p.description}</p>}
                    {p.imageUrl && <img src={p.imageUrl} alt={`Screenshot of ${p.title}`} loading="lazy" />}
                  </div>
                  <div>
                    {p.tags.length > 0 && <ul className="tags">{p.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                    {(p.liveUrl || p.repoUrl) && (
                      <div className="project-links">
                        {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer">Live</a>}
                        {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer">Source</a>}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {user.skills.length > 0 && (
          <section>
            <h2>Skills</h2>
            <ul className="skills">
              {user.skills.map((s) => <li key={s._id}><span>{s.name}</span><Level level={s.level} /></li>)}
            </ul>
          </section>
        )}

        {empty && <section><p className="muted">Nothing here yet.</p></section>}

        <section className="contact-section">
          <h2>Contact</h2>
          <ContactForm username={user.username} ownerName={user.name || user.username} />
        </section>

        <table className="titleblock">
          <tbody>
            <tr><th>Owner</th><td>{user.name || user.username}</td></tr>
            {user.headline && <tr><th>Role</th><td>{user.headline}</td></tr>}
            {user.location && <tr><th>Based in</th><td>{user.location}</td></tr>}
            <tr><th>Views</th><td>{user.views}</td></tr>
            <tr><th>Look</th><td>{THEME_LABEL[user.theme]}</td></tr>
            <tr><th>On Folio</th><td>Since {since}</td></tr>
          </tbody>
        </table>
      </article>
      <p className="credit">Made with <Link to="/">Folio</Link></p>
    </div>
  );
}
