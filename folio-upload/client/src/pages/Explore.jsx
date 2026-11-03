import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import Notice from '../components/Notice.jsx';
import { demoFolios } from '../data/demoFolios.js';

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [skill, setSkill] = useState(params.get('skill') || '');
  const [folios, setFolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    const query = new URLSearchParams(params);
    api(`/public/folios?${query.toString()}`).then((data) => { if(active) setFolios(data.folios); })
      .catch((err) => { if(active) setError(err.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [params]);
  function submit(e) { e.preventDefault(); const next = new URLSearchParams(); if(q.trim()) next.set('q',q.trim()); if(skill.trim()) next.set('skill',skill.trim()); setParams(next); }
  const filteredDemos = demoFolios.filter(f => (!params.get('q') || [f.title,f.description,f.user.name].join(' ').toLowerCase().includes(params.get('q').toLowerCase())) && (!params.get('skill') || f.skills.some(s => s.name.toLowerCase().includes(params.get('skill').toLowerCase()))));
  return <main className="landing" style={{maxWidth:900}}>
    <header className="page-head"><div><h1>Explore Folios</h1><p className="muted">Discover public portfolios shared by the community.</p></div><Link className="btn" to="/">Home</Link></header>
    <form className="inline-form" onSubmit={submit}>
      <label className="field" style={{flex:1,minWidth:180}}><span className="field-label">Search Folios or creators</span><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Frontend developer, Satwik…" /></label>
      <label className="field" style={{flex:1,minWidth:150}}><span className="field-label">Filter by skill</span><input className="input" value={skill} onChange={e=>setSkill(e.target.value)} placeholder="React, Python…" /></label>
      <button className="btn primary">Search</button>
    </form>
    {error && <Notice type="error">{error}</Notice>}
    {filteredDemos.length > 0 && <section style={{margin:'24px 0 32px'}}><h2 style={{fontSize:18,marginBottom:10}}>Explore example portfolios <span className="muted" style={{fontSize:13,fontWeight:400}}>· Fictional demo content</span></h2><ul className="items">{filteredDemos.map(f => <li className="item" key={f._id}><div><h3>{f.title}</h3><p className="muted">{f.description}</p><small className="muted">{f.theme} layout · {f.skills.map(s=>s.name).join(' · ')}</small></div><Link className="btn" to={'/demo/'+f.slug}>View demo ↗</Link></li>)}</ul></section>}
    <h2 style={{fontSize:18,marginBottom:12}}>Community Folios</h2>
    {loading ? <p className="muted">Loading public Folios…</p> : folios.length ? <ul className="items">{folios.map(f => <li className="item" key={f._id}><div style={{flex:1}}><h3 style={{margin:'0 0 4px'}}>{f.title}</h3><p className="muted" style={{margin:'0 0 6px'}}>by {f.user?.name || f.user?.username} · {f.views || 0} views</p>{f.description && <p className="muted">{f.description}</p>}<div className="tags">{(f.skills || []).slice(0,6).map(s=><span key={s._id}>{s.name}</span>)}</div></div><Link className="btn" to={`/f/${f.slug}`}>View Folio ↗</Link></li>)}</ul> : <p className="muted">No public Folios found. Private Folios never appear here.</p>}
  </main>;
}
