import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function DashboardLayout() {
  const { user, stats, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">Folio</div>
        <nav>
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
        <div className="rail-foot">
          <a href="/dashboard/folios" target="_blank" rel="noreferrer">View your page</a>
          <span className="muted">{user.views} {user.views === 1 ? 'view' : 'views'}</span>
          <button className="link" onClick={logout}>Log out</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
