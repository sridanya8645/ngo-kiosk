import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const HomePage = () => {
  const navigate = useNavigate();
  const [currentEvent, setCurrentEvent] = useState(null);

  // Fetch current event data
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      try {
        const response = await fetch('/api/todays-event');
        if (response.ok) {
          const event = await response.json();
          setCurrentEvent(event);
        }
      } catch (error) {
        console.error('Error fetching current event:', error);
      }
    };

    fetchCurrentEvent();
  }, []);

  return (
    <div className="home-container">
      <SiteHeader navVariant="admin-login-only" />

      {/* Main Content */}
      <main className="home-main">
        <h1 className="welcome-title">
          {currentEvent?.welcome_text || 'Welcome to Indo American Fair 2025'}
        </h1>
        
        <div className="main-image-container">
          <img 
            src={currentEvent?.banner || "/Image (4).jpg"} 
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