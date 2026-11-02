import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Field from '../components/Field.jsx';
import Notice from '../components/Notice.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard/folios', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>Create your page</h1>
      <Notice type="error">{error}</Notice>
      <form onSubmit={onSubmit}>
        <Field
          label="Username"
          value={form.username}
          onChange={set('username')}
          pattern="[A-Za-z0-9_\-]{3,20}"
          title="3-20 characters: letters, numbers, - or _"
          hint={`Your page will be at /u/${form.username.toLowerCase() || 'username'}`}
          autoComplete="username"
          required
        />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} minLength={8} hint="At least 8 characters." autoComplete="new-password" required />
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link>.</p>
    </main>
  );
}
