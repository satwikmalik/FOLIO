import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Notice from '../../components/Notice.jsx';

const PAGE_SIZE = 10;
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export default function Inbox() {
  const { refresh } = useAuth();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api(`/messages?limit=${PAGE_SIZE}&skip=0`);
      setMessages(data.messages);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    setError('');
    try {
      const data = await api(`/messages?limit=${PAGE_SIZE}&skip=${messages.length}`);
      setMessages((prev) => [...prev, ...data.messages]);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function markRead(id) {
    setError('');
    try {
      await api(`/messages/${id}/read`, { method: 'PATCH' });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, read: true } : m)));
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeMessage(id) {
    if (!window.confirm('Delete this message?')) return;
    setError('');
    try {
      await api(`/messages/${id}`, { method: 'DELETE' });
      setMessages((prev) => prev.filter((m) => m._id !== id));
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="page-head"><h1>Inbox</h1></div>
      <Notice type="error">{error}</Notice>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : messages.length === 0 ? (
        <p className="muted">No messages yet. Visitors can write to you from the contact form on your public page.</p>
      ) : (
        <>
          <ul className="items">
            {messages.map((m) => (
              <li key={m._id} className={`msg ${m.read ? '' : 'unread'}`}>
                <div className="msg-head">
                  <strong>{m.senderName}</strong>
                  <a href={`mailto:${m.senderEmail}`}>{m.senderEmail}</a>
                  <span className="muted">{fmt(m.createdAt)}</span>
                </div>
                <p className="prose">{m.body}</p>
                <div className="item-actions">
                  {!m.read && <button type="button" className="link" onClick={() => markRead(m._id)}>Mark as read</button>}
                  <button type="button" className="link danger" onClick={() => removeMessage(m._id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="actions" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="btn"
                disabled={loadingMore}
                onClick={loadMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
