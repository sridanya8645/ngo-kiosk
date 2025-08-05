import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './HomePage';
import CheckinPage from './CheckinPage';
import RegisterPage from './RegisterPage';
import AdminPage from './AdminPage';
import EventDetailsPage from './EventDetailsPage';
import RaffleSpinPage from './RaffleSpinPage';
import RaffleWinnersPage from './RaffleWinnersPage';
import AdminRegistrationsPage from './AdminRegistrationsPage';

function App() {
  useEffect(() => {
    // Request full screen on app load
    const requestFullScreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    };

    // Try to enter full screen after a short delay
    setTimeout(requestFullScreen, 1000);

    // Add full screen button to header
    const addFullScreenButton = () => {
      const header = document.querySelector('.header-content');
      if (header && !document.querySelector('.fullscreen-btn')) {
        const fullScreenBtn = document.createElement('button');
        fullScreenBtn.className = 'fullscreen-btn';
        fullScreenBtn.innerHTML = '⛶';
        fullScreenBtn.style.cssText = `
          position: absolute;
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          background: #8B1C1C;
          color: white;
          border: none;
          border-radius: 5px;
          padding: 8px 12px;
          font-size: 16px;
          cursor: pointer;
          z-index: 1000;
        `;
        fullScreenBtn.onclick = requestFullScreen;
        header.appendChild(fullScreenBtn);
      }
    };

    // Add full screen button after components load
    setTimeout(addFullScreenButton, 2000);

    // Monitor full screen state and re-enter if needed (but don't block interaction)
    const checkFullScreen = () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        setTimeout(requestFullScreen, 500);
      }
    };

    // Check full screen state every 5 seconds (less aggressive)
    const fullScreenInterval = setInterval(checkFullScreen, 5000);

    // Cleanup
    return () => {
      clearInterval(fullScreenInterval);
    };
  }, []);

  return (
    <Router>
      <div className="App fullscreen-persistent">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/event-details" element={<EventDetailsPage />} />
          <Route path="/admin/raffle-spin" element={<RaffleSpinPage />} />
          <Route path="/admin/raffle-winners" element={<RaffleWinnersPage />} />
          <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
