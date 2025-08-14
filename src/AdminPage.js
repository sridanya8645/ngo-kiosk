import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './AdminPage.css';
import loginLottie from './login-lottie.json';
import { IS_IAF } from './orgToggle';

const AdminPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    // Hardcoded credentials check
    if (formData.username === 'admin' && formData.password === 'password123') {
      // Login successful, navigate to Event Details page
      navigate('/event-details');
    } else {
      setError('Invalid username or password. Use: admin / password123');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="admin-container" data-build-tag="iaf-redeploy-005" style={IS_IAF ? { background: 'linear-gradient(180deg, #9375AD 0%, #BC29C9 100%)' } : undefined}>
      {/* Header Section */}
      {!IS_IAF && (
        <header className="admin-header">
          <div className="header-content">
            <div className="logo-section">
              <img src="/sai-baba.png" alt="Sai Baba" className="logo-image" />
            </div>
            <div className="org-info">
              A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
            </div>
          </div>
        </header>
      )}



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
        </div>
      </main>

      {/* Footer */}
      <footer className="admin-footer" style={IS_IAF ? { background: 'transparent' } : undefined}>
        {IS_IAF ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" />
          </div>
        ) : (
          <div className="footer-content">
            <div className="footer-section">
              <span className="footer-icon">📍</span>
              <div className="footer-text">
                <div>Shirdi Sai Dham Inc, 12 Perrine Road,</div>
                <div>Monmouth Junction NJ 08852</div>
              </div>
            </div>
            <div className="footer-section">
              <span className="footer-icon">📞</span>
              <div className="footer-text">
                <div>609 937 2800 /</div>
                <div>609 937 2806</div>
              </div>
            </div>
            <div className="footer-section">
              <span className="footer-icon">✉️</span>
              <span className="footer-text">shirdisaidham1@gmail.com</span>
            </div>
            <div className="footer-section">
              <span className="powered-text">Powered by</span>
              <img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" />
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default AdminPage; 