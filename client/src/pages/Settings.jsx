import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
  const [qrCode, setQrCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      // We don't have a specific status endpoint, but we can check the user object in context
      // For now, we'll just allow triggering the setup
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleSetupMfa = async () => {
    try {
      const res = await axios.post('/api/auth/mfa/setup');
      setQrCode(res.data.qrCodeUrl);
      setMessage('Scan this QR code with your Authenticator app (e.g. Google Authenticator)');
    } catch (err) {
      setError('Failed to setup MFA');
    }
  };

  const handleEnableMfa = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/mfa/enable', { token });
      setMfaEnabled(true);
      setQrCode('');
      setToken('');
      setMessage('MFA Enabled successfully!');
    } catch (err) {
      setError('Invalid token. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
      <div className="card">
        <h2 className="mb-4">Security Settings</h2>
        
        {message && <div className="alert alert-success mb-4">{message}</div>}
        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="mb-6">
          <h3>Multi-Factor Authentication (MFA)</h3>
          <p className="text-sm mt-2 mb-4" style={{ color: '#6b7280' }}>
            Add an extra layer of security to your account by requiring a code from an authenticator app.
          </p>

          {!qrCode && !mfaEnabled && (
            <button className="btn btn-primary" onClick={handleSetupMfa}>
              Enable MFA
            </button>
          )}

          {qrCode && (
            <div className="mt-4">
              <img src={qrCode} alt="MFA QR Code" style={{ display: 'block', margin: '0 auto 1.5rem', width: '200px' }} />
              <form onSubmit={handleEnableMfa}>
                <div className="form-group">
                  <label htmlFor="token">Enter 6-digit code from your app</label>
                  <input
                    id="token"
                    type="text"
                    className="form-control"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="000000"
                    maxLength="6"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  Verify and Enable
                </button>
              </form>
            </div>
          )}

          {mfaEnabled && (
            <div className="alert alert-success">
              ✓ MFA is currently active on your account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
