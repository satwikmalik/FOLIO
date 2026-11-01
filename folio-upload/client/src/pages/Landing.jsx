import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <main className="landing">
      <h1>Folio</h1>
      <p className="lead">Put your projects, skills and contact details on one page, at an address you can put in a CV.</p>

      <div className="actions">
        {user ? (
          <Link className="btn primary" to="/dashboard">Open dashboard</Link>
        ) : (
          <>
            <Link className="btn primary" to="/register">Create your page</Link>
            <Link className="btn" to="/login">Log in</Link>
          </>
        )}
        <Link className="btn" to="/explore">Explore</Link>
      </div>

      <table className="titleblock sample">
        <caption>What your page records</caption>
        <tbody>
          <tr><th>Address</th><td>/u/yourname</td></tr>
          <tr><th>Projects</th><td>Title, write-up, stack, live and source links</td></tr>
          <tr><th>Skills</th><td>Rated learning, comfortable or strong</td></tr>
          <tr><th>Contact</th><td>Form on the page, messages go to your inbox</td></tr>
          <tr><th>Look</th><td>Vellum (light) or Blueprint (dark)</td></tr>
        </tbody>
      </table>
    </main>
  );
}
