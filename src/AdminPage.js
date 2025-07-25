import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './AdminPage.css';
import loginLottie from './login-lottie.json';

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
    <div className="admin-bg">
      <div className="admin-aspect">
        <div className="admin-header-centered">
          <img src="/sai baba.png" alt="Logo" className="admin-logo" />
          <span className="admin-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </div>
        
        {/* Action Buttons Toolbar */}
        <div style={{
          width: '100%',
          background: '#8B1C1C',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 0 8px 0',
          padding: '8px 0',
          gap: 0
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '2rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Home
          </button>
        </div>

        <div className="admin-main">
          <div className="admin-login-title">Admin Login</div>
          
          <div className="admin-lottie-container">
            <Lottie 
              animationData={loginLottie} 
              loop={true}
              className="admin-lottie"
            />
          </div>
          
          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="admin-form-row">
              <label htmlFor="username">Email / Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="admin-input"
                placeholder="Enter your username"
              />
            </div>

            <div className="admin-form-row">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="admin-input"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="admin-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="admin-login-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        <footer className="event-footer event-footer-dark" style={{ marginTop: '2rem', marginBottom: '-1rem', padding: '16px 24px', color: '#000', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.9rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>📍</span>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>
                <span>Shirdi Sai Dham Inc, 12 Perrine Road,</span>
                <span>Monmouth Junction NJ 08852</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold', justifyContent: 'center' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>📞</span>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>
                <span>609 937 2800 /</span>
                <span>609 937 2806</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold', justifyContent: 'center' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>✉️</span>
              <span style={{ fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>shirdisaidham1@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center', color: '#000', fontWeight: 'bold', gap: '2px' }}>
              <span style={{ color: '#000', fontSize: '1.8rem', fontWeight: 'bold' }}>Powered by</span>
              <img src="/PITS-removebg-preview.png" alt="PITS" style={{ height: '12rem', width: '20rem', display: 'block' }} />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminPage; 