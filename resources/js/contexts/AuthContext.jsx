import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { currentUser: null, role: 'user', isAuthenticated: false };
  });
  const [authLoading, setAuthLoading] = useState(false);

  // Persist auth state on every change
  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state));
  }, [state]);

  // On mount, if a token exists try to restore session via /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
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
      role:        data.user?.roles?.[0] ?? 'user',
      isAuthenticated: true,
    });
    return data.user;
  };

  /**
   * Login with email + password.
   * Throws on any error so the caller can display a toast.
   * After success, the caller is responsible for navigation.
   */
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser:     data.user,
        role:            data.user?.role ?? 'user',
        isAuthenticated: true,
      });
      return data.user;  // caller uses user.role to decide where to navigate
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Register a new user account.
   * Throws on any error so the caller can display a toast.
   */
  const register = async ({ name, email, phone, password, password_confirmation }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        phone:                 phone || undefined,
        password,
        password_confirmation,
      });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser:     data.user,
        role:            data.user?.role ?? 'user',
        isAuthenticated: true,
      });
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore server errors on logout
    } finally {
      localStorage.removeItem('authToken');
      setState({ currentUser: null, role: 'user', isAuthenticated: false });
    }
  };

  /**
   * Change the authenticated user's password.
   */
  const changePassword = async (currentPassword, newPassword) => {
    await api.put('/auth/change-password', {
      current_password:      currentPassword,
      password:              newPassword,
      password_confirmation: newPassword,
    });
  };

  /**
   * Update the authenticated user's profile (name, phone).
   */
  const updateProfile = async (data) => {
    const { data: res } = await api.put('/auth/update-profile', data);
    setState(prev => ({ ...prev, currentUser: res.user }));
    return res.user;
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      authLoading,
      login,
      register,
      logout,
      me,
      changePassword,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
