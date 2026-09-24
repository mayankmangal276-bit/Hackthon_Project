import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const C = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem('user') || 'null')
  );

  const login = async (email, password) => {
    const d = await api.login({
      email,
      password
    });

    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(d.user));

    setUser(d.user);

    return d.user;
  };

  const demoLogin = async (role) => {
    const d = await api.demo(role);

    localStorage.setItem('token', d.token);
    localStorage.setItem('user', JSON.stringify(d.user));

    setUser(d.user);

    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <C.Provider
      value={{
        user,
        login,
        demoLogin,
        logout
      }}
    >
      {children}
    </C.Provider>
  );
}

export const useAuth = () => useContext(C);
