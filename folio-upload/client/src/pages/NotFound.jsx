import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="auth">
      <h1>Page not found</h1>
      <p className="muted">Check the address, or go back to the <Link to="/">start page</Link>.</p>
    </main>
  );
}
