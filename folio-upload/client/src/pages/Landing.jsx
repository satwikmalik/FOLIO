import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return <main className="landing" style={{maxWidth:1000}}>
    <nav className="page-head"><strong style={{fontSize:24}}>Folio.</strong><div className="actions"><Link to="/explore">Explore</Link>{user ? <Link className="btn" to="/dashboard/folios">My workspace</Link> : <><Link to="/login">Log in</Link><Link className="btn primary" to="/register">Get started</Link></>}</div></nav>
    <section style={{padding:'clamp(48px,10vw,112px) 0 64px',maxWidth:760}}>
      <p className="muted" style={{letterSpacing:'.12em',textTransform:'uppercase'}}>Your work. Your story. Your Folio.</p>
      <h1 style={{fontSize:'clamp(42px,7vw,76px)',lineHeight:1.02,margin:'16px 0'}}>One profile.<br/>Many ways to stand out.</h1>
      <p className="lead" style={{maxWidth:620}}>Build multiple focused portfolios from one library of skills and projects. Choose what each CV shows, pick its design, and decide whether it stays private or goes public.</p>
      <div className="actions" style={{marginTop:28}}><Link className="btn primary" to={user ? '/dashboard/folios' : '/register'}>{user ? 'Open my Folios' : 'Create your first Folio'}</Link><Link className="btn" to="/explore">Explore public Folios</Link></div>
    </section>
    <section className="grid2" style={{gap:16}}>
      <article className="panel"><h2>One content library</h2><p className="muted">Add projects and skills once. Reuse them across as many focused CVs as you need.</p></article>
      <article className="panel"><h2>Separate portfolios</h2><p className="muted">Make a frontend CV, a design portfolio, or a general profile. Each Folio has its own content selection and template.</p></article>
      <article className="panel"><h2>You control visibility</h2><p className="muted">Public Folios can appear in Explore. Private Folios are owner-only and are not accessible to other users.</p></article>
    </section>
  </main>;
}
