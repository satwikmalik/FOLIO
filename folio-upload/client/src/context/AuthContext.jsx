import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ projects: 0, skills: 0, unread: 0 });
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const refresh = useCallback(async () => {
    try {
      const data = await api('/profile');
      setUser(data.user);
      setStats(data.stats);
    } catch { /* a 401 is handled by the folio:unauthorized listener below */ }
  }, []);

  useEffect(() => {
    if (tokenStore.get()) refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    const clear = () => { tokenStore.clear(); setUser(null); };
    window.addEventListener('folio:unauthorized', clear);
    return () => window.removeEventListener('folio:unauthorized', clear);
  }, []);

  const authenticate = async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    tokenStore.set(data.token);
    setUser(data.user);
    await refresh();
  };

  const value = {
    user, stats, loading, refresh, setUser,
    login: (email, password) => authenticate('/login', { email, password }),
    register: (username, email, password) => authenticate('/register', { username, email, password }),
    logout: () => { tokenStore.clear(); setUser(null); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
