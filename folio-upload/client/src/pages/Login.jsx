import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';
import Notice from '../components/Notice.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>Log in</h1>
      <Notice type="error">{error}</Notice>
      <form onSubmit={onSubmit}>
        <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} autoComplete="current-password" required />
        <button className="btn primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="muted">No account yet? <Link to="/register">Create one</Link>.</p>
    </main>
  );
}
