import { useState } from 'react';
import { api } from '../api/client.js';
import Field from './Field.jsx';
import Notice from './Notice.jsx';

export default function ContactForm({ username, ownerName }) {
  const [form, setForm] = useState({ senderName: '', senderEmail: '', body: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/public/${username}/contact`, { method: 'POST', body: form });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <Notice>Message sent. {ownerName} will see it in their inbox.</Notice>;

  return (
    <form onSubmit={onSubmit} className="contact-form">
      <Notice type="error">{error}</Notice>
      <div className="grid2">
        <Field label="Your name" value={form.senderName} onChange={set('senderName')} maxLength={80} required />
        <Field label="Your email" type="email" value={form.senderEmail} onChange={set('senderEmail')} required />
      </div>
      <Field as="textarea" label="Message" value={form.body} onChange={set('body')} maxLength={2000} required />
      <button className="btn primary" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
    </form>
  );
}
