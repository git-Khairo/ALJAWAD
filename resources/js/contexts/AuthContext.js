import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : { currentUser: null, role: 'user', isAuthenticated: false };
  });

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(state));
  }, [state]);

  const login = (email, _password, asAdmin = false) => {
    setState({
      currentUser: {
        id: asAdmin ? '7' : '1',
        email,
        name_ar: asAdmin ? 'محمد عبدالرحمن' : 'أحمد محمد العلي',
        name_en: asAdmin ? 'Mohammed Abdulrahman' : 'Ahmed Al-Ali',
      },
      role: asAdmin ? 'admin' : 'user',
      isAuthenticated: true,
    });
  };

  const register = (data) => {
    setState({
      currentUser: { id: '99', email: data.email, name_ar: data.name, name_en: data.name },
      role: 'user',
      isAuthenticated: true,
    });
  };

  const logout = () => {
    setState({ currentUser: null, role: 'user', isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
