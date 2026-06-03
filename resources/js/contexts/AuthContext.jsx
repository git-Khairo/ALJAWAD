import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { currentUser: null, role: 'user', isAuthenticated: false };
  });

  // Persist auth state
  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state));
  }, [state]);

  // On mount, if a token exists try to restore session via /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && !state.isAuthenticated) {
      me().catch(() => {
        // Token is stale — clean up silently
        localStorage.removeItem('authToken');
        setState({ currentUser: null, role: 'user', isAuthenticated: false });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const me = async () => {
    const { data } = await api.get('/auth/me');
    setState({
      currentUser: data.user,
      role: data.user?.role ?? 'user',
      isAuthenticated: true,
    });
    return data.user;
  };

  /**
   * Login with email + password.
   * - Calls POST /api/auth/login on success.
   * - Falls back to mock data on network error (no server).
   * - Throws on server-side errors (4xx) so callers can toast them.
   * - Navigation is left to the caller.
   */
  const login = async (email, password, asAdmin = false) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser: data.user,
        role: data.user?.role ?? (asAdmin ? 'admin' : 'user'),
        isAuthenticated: true,
      });
    } catch (err) {
      // Network error (no server) → fall back to mock behaviour for local dev
      if (!err.response) {
        setState({
          currentUser: {
            id: asAdmin ? '7' : '1',
            email,
            name_ar: asAdmin ? 'محمد عبدالرحمن' : 'أحمد محمد العلي',
            name_en: asAdmin ? 'Mohammed Abdulrahman' : 'Ahmed Al-Ali',
            role: asAdmin ? 'admin' : 'user',
          },
          role: asAdmin ? 'admin' : 'user',
          isAuthenticated: true,
        });
        return;
      }
      throw err;
    }
  };

  const register = async (data) => {
    try {
      const { data: res } = await api.post('/auth/register', data);
      localStorage.setItem('authToken', res.token);
      setState({
        currentUser: res.user,
        role: res.user?.role ?? 'user',
        isAuthenticated: true,
      });
    } catch (err) {
      // Network error → fall back to mock
      if (!err.response) {
        setState({
          currentUser: { id: '99', email: data.email, name_ar: data.name, name_en: data.name, role: 'user' },
          role: 'user',
          isAuthenticated: true,
        });
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore errors on logout
    } finally {
      localStorage.removeItem('authToken');
      setState({ currentUser: null, role: 'user', isAuthenticated: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, me }}>
      {children}
    </AuthContext.Provider>
  );
};
