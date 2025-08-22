import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const HomePage = () => {
  const navigate = useNavigate();

  // Debug logging
  console.log('HomePage component is rendering');
  
  // Test API call
  React.useEffect(() => {
    (async () => {
      try {
        console.log('HomePage useEffect running');
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('API call successful:', data);
      } catch (error) {
        console.error('API call failed:', error);
      }
    })();
  }, []);

  return (
    <div className="home-container">
      <SiteHeader navVariant="admin-login-only" />

      {/* Main Content */}
      <main className="home-main">
        <h1 className="welcome-title">Welcome to Indo American Fair 2025</h1>
        
        <div className="main-image-container">
          <img 
            src="/Image (4).jpg" 
            alt="Event" 
            className="main-image" 
          />
        </div>

        <div className="action-container" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button 
            className="checkin-button"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
          <button 
            className="checkin-button"
            onClick={() => navigate('/checkin')}
          >
            Check-In
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default HomePage; 