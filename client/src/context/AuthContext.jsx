import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') || localStorage.getItem('token');
    const storedUser = urlParams.get('user') || localStorage.getItem('user');
    
    if (token && storedUser) {
      const parsedUser = typeof storedUser === 'string' && storedUser.startsWith('{') 
        ? JSON.parse(storedUser) 
        : storedUser;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(parsedUser));
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Clean up URL
      if (urlParams.get('token')) {
        window.history.replaceState({}, document.title, "/");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const register = async (email, password) => {
    const res = await axios.post('/api/auth/register', { email, password });
    const { token, user } = res.data;
    login(token, user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
