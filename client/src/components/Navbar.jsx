import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">TodoApp</Link>
      <div>
        {user ? (
          <button onClick={handleLogout} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={16} /> Logout
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" className="btn btn-outline" style={{ textDecoration: 'none' }}>Login</Link>
            <Link to="/register" className="btn btn-primary" style={{ textDecoration: 'none' }}>Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
