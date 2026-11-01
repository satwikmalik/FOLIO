import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Notice from '../../components/Notice.jsx';

export const LEVELS = [
  { id: 'learning', label: 'Learning' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'strong', label: 'Strong' },
];

export default function SkillsManager() {
  const { refresh } = useAuth();
  const [skills, setSkills] = useState([]);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('comfortable');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setSkills((await api('/skills')).skills);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function run(action) {
    setError('');
    try {
      await action();
      await Promise.all([load(), refresh()]);
    } catch (err) {
      setError(err.message);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api('/skills', { method: 'POST', body: { name, level } });
      setName('');
    });
  };

  return (
    <>
      <div className="page-head"><h1>Skills</h1></div>
      <Notice type="error">{error}</Notice>

      <form onSubmit={add} className="inline-form">
        <label className="field">
          <span className="field-label">Skill</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
        </label>
        <label className="field">
          <span className="field-label">Level</span>
          <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
        <button className="btn primary">Add skill</button>
      </form>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : skills.length === 0 ? (
        <p className="muted">No skills yet. Add the ones you would want an employer to see.</p>
      ) : (
        <ul className="items">
          {skills.map((s) => (
            <li key={s._id} className="item">
              <h3>{s.name}</h3>
              <div className="item-actions">
                <select
                  className="input compact"
                  value={s.level}
                  aria-label={`Level for ${s.name}`}
                  onChange={(e) => run(() => api(`/skills/${s._id}`, { method: 'PUT', body: { level: e.target.value } }))}
                >
                  {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                <button className="link danger" onClick={() => run(() => api(`/skills/${s._id}`, { method: 'DELETE' }))}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
