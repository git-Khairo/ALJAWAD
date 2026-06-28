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
  /**
   * Login with an identifier (email for staff, phone for clients) + password.
   * Throws on error; a 409 with `needs_claim` means the caller should route to
   * the claim flow. After success the caller decides where to navigate.
   */
  const login = async (identifier, password) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login', { identifier, password });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser:     data.user,
        role:            data.user?.roles?.[0] ?? 'user',
        isAuthenticated: true,
      });
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Register a new account (phone is the identity, email optional).
   * Throws on error; a 409 with `needs_claim` means route to the claim flow.
   */
  const register = async ({ name, phone, email, password, password_confirmation }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name,
        phone,
        email:                 email || undefined,
        password,
        password_confirmation,
      });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser:     data.user,
        role:            data.user?.roles?.[0] ?? 'user',
        isAuthenticated: true,
      });
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  /**
   * Request a one-time claim/reset code for a phone number.
   * Returns { message, sent_via }. Throws (404) if no account for that phone.
   */
  const requestCode = async (phone) => {
    const { data } = await api.post('/auth/request-code', { phone });
    return data;
  };

  /**
   * Claim an account / reset a password with a one-time code, then log in.
   */
  const claim = async ({ phone, code, password, password_confirmation }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/claim', { phone, code, password, password_confirmation });
      localStorage.setItem('authToken', data.token);
      setState({
        currentUser:     data.user,
        role:            data.user?.roles?.[0] ?? 'user',
        isAuthenticated: true,
      });
      return data.user;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    // Clear the local session FIRST so the UI logs out instantly, regardless
    // of whether (or how slowly) the server responds.
    const token = localStorage.getItem('authToken');
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth');
    setState({ currentUser: null, role: 'user', isAuthenticated: false });

    // Best-effort server-side token revoke in the background. We pass the token
    // explicitly (it's already removed from storage) and swallow any error so
    // a failed/slow request can never block the logout.
    if (token) {
      api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } })
        .catch(() => {});
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
      requestCode,
      claim,
      logout,
      me,
      changePassword,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
