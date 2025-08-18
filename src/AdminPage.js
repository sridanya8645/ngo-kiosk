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
    <div className="admin-container">
      <SiteHeader />



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

      <SiteFooter />
    </div>
  );
};

export default AdminPage; 