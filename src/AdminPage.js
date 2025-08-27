import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './AdminPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import loginLottie from './login-lottie.json';

const AdminPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState('login'); // 'login' | 'email-mfa' | 'totp-mfa' | 'totp-enroll'
  const [userId, setUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [enrollSecret, setEnrollSecret] = useState('');
  const [enrollLabel, setEnrollLabel] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username.trim(), password: formData.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }
      const data = await res.json();
      if (data.mfa === 'totp') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch (_) {}
        setStage('totp-mfa');
      } else if (data.mfa === 'totp-enroll') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch (_) {}
        setEnrollSecret(data.manualSecret || '');
        setEnrollLabel(data.label || 'NGO Kiosk:Indoamericanexpo@gmail.com');
        setStage('totp-enroll');
      } else if (data.mfa === 'email') {
        setUserId(data.userId);
        try { localStorage.setItem('adminUserId', String(data.userId)); } catch (_) {}
        setStage('email-mfa');
      } else {
        // Fallback: require MFA anyway
        setError('Unexpected response. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailMfa = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the code from your email'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/verify-mfa', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code: mfaCode.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid or expired code');
      }
      navigate('/admin-users');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the 6-digit code from your Authenticator app'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/mfa/totp/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: mfaCode.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid code');
      }
      navigate('/admin-users');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyTotpEnroll = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) { setError('Enter the 6-digit code from your Authenticator app'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/mfa/totp/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: mfaCode.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Invalid code');
      }
      // Enrollment complete, now prompt for normal TOTP login
      setMfaCode('');
      setStage('totp-mfa');
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-container">
      <SiteHeader navVariant="home-only" />

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-login-container">
          <h1 className="admin-login-title">Admin Login</h1>

          <div className="admin-lottie-container">
            <Lottie
              animationData={loginLottie}
              loop={true}
              className="admin-lottie"
            />
          </div>

          {stage === 'login' && (
            <form onSubmit={handleSubmit} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter password"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          )}

          {stage !== 'login' && stage !== 'totp-enroll' && (
            <form onSubmit={stage === 'totp-mfa' ? handleVerifyTotp : handleVerifyEmailMfa} className="admin-login-form">
              <div className="form-group">
                <label className="form-label">{stage === 'totp-mfa' ? 'Enter 6-digit authenticator code' : 'Enter 6-digit authenticator code'}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="form-input"
                  placeholder={stage === 'totp-mfa' ? '123456' : 'Enter code'}
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setStage('login'); setMfaCode(''); setError(''); }}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {stage === 'totp-enroll' && (
            <form onSubmit={handleVerifyTotpEnroll} className="admin-login-form">
              <div className="form-group">
                <label className="form-label">Add this account to your Authenticator app</label>
                <div className="info-box" style={{ wordBreak: 'break-all' }}>
                  <div><strong>Account:</strong> {enrollLabel || 'NGO Kiosk:admin'}</div>
                  <div><strong>Manual Secret:</strong> {enrollSecret}</div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Enter 6-digit authenticator code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  className="form-input"
                  placeholder="123456"
                />
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">❌</span>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setStage('login'); setMfaCode(''); setError(''); setEnrollSecret(''); setEnrollLabel(''); }}
                  className="cancel-button"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default AdminPage;
