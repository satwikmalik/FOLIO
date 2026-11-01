import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Field from '../../components/Field.jsx';
import Notice from '../../components/Notice.jsx';

const EMPTY = { title: '', description: '', tags: '', liveUrl: '', repoUrl: '', imageUrl: '' };

function ProjectForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, tags: (initial.tags || []).join(', ') });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const editing = Boolean(initial._id);
      await api(editing ? `/projects/${initial._id}` : '/projects', {
        method: editing ? 'PUT' : 'POST',
        body: form,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel">
      <Notice type="error">{error}</Notice>
      <Field label="Title" value={form.title} onChange={set('title')} maxLength={80} required />
      <Field as="textarea" label="What it is and what you did" value={form.description} onChange={set('description')} maxLength={600} hint={`${form.description.length}/600`} />
      <Field label="Stack" value={form.tags} onChange={set('tags')} hint="Comma separated, up to 8. e.g. React, Express, MongoDB" />
      <div className="grid2">
        <Field label="Live link" value={form.liveUrl} onChange={set('liveUrl')} placeholder="https://" />
        <Field label="Source link" value={form.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/…" />
      </div>
      <Field label="Screenshot link" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://" hint="Direct link to an image." />
      <div className="actions">
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : initial._id ? 'Save changes' : 'Add project'}</button>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function ProjectsManager() {
  const { refresh } = useAuth();
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api('/projects');
      setProjects(data.projects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function afterChange() {
    setEditing(null);
    await Promise.all([load(), refresh()]);
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await api(`/projects/${p._id}`, { method: 'DELETE' });
      await afterChange();
    } catch (err) {
      setError(err.message);
    }
  }

  async function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= projects.length) return;
    const next = [...projects];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    setProjects(next);
    try {
      const data = await api('/projects/reorder', {
        method: 'PUT',
        body: { projectIds: next.map((p) => p._id) },
      });
      setProjects(data.projects);
    } catch (err) {
      setError(err.message);
      load();
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Projects</h1>
        {!editing && <button className="btn primary" onClick={() => setEditing({})}>Add project</button>}
      </div>

      <Notice type="error">{error}</Notice>
      {editing && <ProjectForm initial={editing} onSaved={afterChange} onCancel={() => setEditing(null)} />}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 && !editing ? (
        <p className="muted">No projects yet. Add one and it appears on your public page straight away.</p>
      ) : (
        <ul className="items">
          {projects.map((p, index) => (
            <li key={p._id} className="item">
              <div>
                <h3>{p.title}</h3>
                {p.tags.length > 0 && <p className="muted">{p.tags.join(', ')}</p>}
              </div>
              <div className="item-actions">
                <button
                  type="button"
                  className="link"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="link"
                  disabled={index === projects.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Down
                </button>
                <button type="button" className="link" onClick={() => setEditing(p)}>Edit</button>
                <button type="button" className="link danger" onClick={() => remove(p)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
