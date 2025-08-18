import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  // Debug logging
  console.log('HomePage component is rendering');
  
  // Test API call
  React.useEffect(() => {
    console.log('HomePage useEffect running');
    fetch('/api/events')
      .then(response => response.json())
      .then(data => {
        console.log('API call successful:', data);
      })
      .catch(error => {
        console.error('API call failed:', error);
      });
  }, []);

  return (
    <div className="home-container">
      {/* Navigation */}
      <div className="admin-bar">
        <button 
          onClick={() => navigate('/admin')}
          className="admin-button"
        >
          Admin
        </button>
      </div>

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

        <div className="action-container">
          <button 
            className="checkin-button"
            onClick={() => navigate('/checkin')}
          >
            Check - In
          </button>
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="home-footer">
        <div className="footer-content center">
          <span className="powered-text">Powered by</span>
          <img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" />
        </div>
      </footer>
    </div>
  );
};

export default HomePage; 