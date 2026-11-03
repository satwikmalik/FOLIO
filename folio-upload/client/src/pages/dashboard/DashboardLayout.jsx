import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, stats, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('folio_sidebar_collapsed') === 'yes');
  const toggle = () => setCollapsed(value => { localStorage.setItem('folio_sidebar_collapsed', value ? 'no' : 'yes'); return !value; });
  return (
    <div className="shell" style={{gridTemplateColumns: collapsed ? "52px minmax(0, 1fr)" : undefined}}>
      <aside className="rail" style={{padding: collapsed ? "20px 8px" : undefined, overflow: "hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>{!collapsed && <div className="brand">Folio</div>}<button type="button" onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{border:"1px solid var(--soft)",background:"transparent",color:"inherit",cursor:"pointer",padding:"4px 8px",fontSize:18}}>◫</button></div>
        <nav style={{display:collapsed?"none":undefined}}>
          <NavLink to="folios">My Folios</NavLink>
          <a href="/explore">Explore</a>
          <NavLink to="profile">Profile</NavLink>
          <NavLink to="projects"><span>Projects</span><span className="muted-count">{stats.projects}</span></NavLink>
          <NavLink to="skills"><span>Skills</span><span className="muted-count">{stats.skills}</span></NavLink>
          <NavLink to="inbox">
            <span>Inbox</span>
            {stats.unread > 0 && <span className="badge" aria-label={`${stats.unread} unread`}>{stats.unread}</span>}
          </NavLink>
          <NavLink to="account">Account</NavLink>
        </nav>
        <div className="rail-foot" style={{display:collapsed?"none":undefined}}>
          <a href="/dashboard/folios" target="_blank" rel="noreferrer">View your page</a>
          <span className="muted">{user.views} {user.views === 1 ? 'view' : 'views'}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
