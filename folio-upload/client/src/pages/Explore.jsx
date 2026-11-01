import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Notice from '../components/Notice.jsx';

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const skillParam = searchParams.get('skill') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [q, setQ] = useState(qParam);
  const [skill, setSkill] = useState(skillParam);
  const [sort, setSort] = useState(sortParam);
  const [page, setPage] = useState(pageParam);

  const [data, setData] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sync state if URL changes externally
  useEffect(() => {
    setQ(qParam);
    setSkill(skillParam);
    setSort(sortParam);
    setPage(pageParam);
  }, [qParam, skillParam, sortParam, pageParam]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (skill) params.set('skill', skill);
    if (sort) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    api(`/public?${params.toString()}`)
      .then((res) => {
        if (!ignore) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [q, skill, sort, page]);

  function handleFilterSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams();
    if (q.trim()) next.set('q', q.trim());
    if (skill.trim()) next.set('skill', skill.trim());
    if (sort !== 'newest') next.set('sort', sort);
    next.set('page', '1');
    setSearchParams(next);
  }

  function handleSortChange(e) {
    const val = e.target.value;
    setSort(val);
    const next = new URLSearchParams(searchParams);
    if (val !== 'newest') next.set('sort', val);
    else next.delete('sort');
    next.set('page', '1');
    setSearchParams(next);
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set('page', String(p));
    else next.delete('page');
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="landing" style={{ maxWidth: '820px' }}>
      <header className="page-head">
        <div>
          <h1>Explore portfolios</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>Discover portfolios built by developers and students.</p>
        </div>
        <Link to="/" className="btn">Home</Link>
      </header>

      <form className="inline-form" onSubmit={handleFilterSubmit}>
        <div className="field" style={{ minWidth: '180px', flex: 1 }}>
          <label className="field-label" htmlFor="q">Search by name or username</label>
          <input
            id="q"
            className="input"
            type="search"
            placeholder="e.g. asha"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="field" style={{ minWidth: '150px' }}>
          <label className="field-label" htmlFor="skill">Filter by skill</label>
          <input
            id="skill"
            className="input"
            type="text"
            placeholder="e.g. React"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
        </div>

        <div className="field" style={{ minWidth: '140px' }}>
          <label className="field-label" htmlFor="sort">Sort by</label>
          <select id="sort" className="input" value={sort} onChange={handleSortChange}>
            <option value="newest">Newest first</option>
            <option value="views">Most viewed</option>
          </select>
        </div>

        <button type="submit" className="btn primary">Filter</button>
      </form>

      {error && <Notice type="error">{error}</Notice>}

      {loading ? (
        <p className="muted">Loading portfolios...</p>
      ) : data.users.length === 0 ? (
        <p className="muted">No portfolios match your search. Try adjusting the query or filter.</p>
      ) : (
        <>
          <p className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
            Showing {data.users.length} of {data.total} {data.total === 1 ? 'portfolio' : 'portfolios'}
          </p>

          <ul className="items">
            {data.users.map((u) => (
              <li key={u._id} className="item" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px' }}>
                    <Link to={`/u/${u.username}`}>{u.name || u.username}</Link>
                    <span className="muted" style={{ fontWeight: 400, fontSize: '14px', marginLeft: '8px' }}>
                      @{u.username}
                    </span>
                  </h3>
                  {u.headline && <p className="muted" style={{ margin: '2px 0 6px', fontSize: '15px' }}>{u.headline}</p>}
                  {u.skills && u.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {u.skills.slice(0, 6).map((s) => (
                        <span
                          key={s._id || s.name}
                          style={{
                            fontSize: '13px',
                            background: 'var(--fill)',
                            padding: '2px 6px',
                            border: '1px solid var(--soft)',
                            borderRadius: '2px',
                          }}
                        >
                          {s.name}
                        </span>
                      ))}
                      {u.skills.length > 6 && (
                        <span className="muted" style={{ fontSize: '13px', alignSelf: 'center' }}>
                          +{u.skills.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="item-actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <Link to={`/u/${u.username}`} className="btn">View page</Link>
                  <span className="muted" style={{ fontSize: '13px' }}>{u.views || 0} views</span>
                </div>
              </li>
            ))}
          </ul>

          {data.pages > 1 && (
            <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
              <button
                type="button"
                className="btn"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                Previous
              </button>
              <span className="muted" style={{ fontSize: '14px' }}>
                Page {page} of {data.pages}
              </span>
              <button
                type="button"
                className="btn"
                disabled={page >= data.pages}
                onClick={() => goToPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
