import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mfaRequired) {
        const res = await axios.post('/api/auth/mfa/verify', { userId: tempUserId, token: mfaToken });
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        const res = await axios.post('/api/auth/login', { email, password });
        if (res.data.mfaRequired) {
          setMfaRequired(true);
          setTempUserId(res.data.userId);
        } else {
          login(res.data.token, res.data.user);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '4rem' }}>
      <div className="card">
        <h2 className="text-center mb-6">{mfaRequired ? 'MFA Verification' : 'Login'}</h2>
        {error && <div className="alert alert-error mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!mfaRequired ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="mfaToken">Authenticator Code</label>
              <input
                id="mfaToken"
                type="text"
                className="form-control"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                placeholder="000000"
                maxLength="6"
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {mfaRequired ? 'Verify & Login' : 'Login'}
          </button>
        </form>
        <div style={{ margin: '1.5rem 0', textAlign: 'center', borderTop: '1px solid var(--border-color)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--card-bg)', padding: '0 10px', fontSize: '0.875rem', color: '#6b7280' }}>or</span>
        </div>
        <a href="http://localhost:5000/api/auth/google" className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Continue with Google
        </a>
        <p className="text-center mt-4" style={{ fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
