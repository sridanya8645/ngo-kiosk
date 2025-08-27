import React, { useEffect } from 'react'; // Manual deployment trigger - updated
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './HomePage';
import CheckinPage from './CheckinPage';
import RegisterPage from './RegisterPage';
import MobileRegister from './MobileRegister';
import AdminPage from './AdminPage';
import EventDetailsPage from './EventDetailsPage';
import RaffleSpinPage from './RaffleSpinPage';
import RaffleWinnersPage from './RaffleWinnersPage';
import AdminRegistrationsPage from './AdminRegistrationsPage';
import AdminUsersPage from './AdminUsersPage';

function App() {
  useEffect(() => {
    // Check if we're in a private/incognito window
    const isPrivateWindow = () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return false; // Not private
      } catch (e) {
        return true; // Private window
      }
    };

    // Request full screen on app load (only once)
    const requestFullScreen = () => {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
      } else if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    };

    // Try to enter full screen after a short delay (only once)
    setTimeout(requestFullScreen, 1000);

    // removed fullscreen icon injection

    // Check if we're in a private window and show message if not
    if (!isPrivateWindow()) {
      console.log('App is running in a regular window. For best experience, open in a private/incognito window.');
      
      // Show a subtle notification to open in private window
      const showPrivateWindowMessage = () => {
        const message = document.createElement('div');
        message.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(139, 28, 28, 0.9);
          color: white;
          padding: 10px 15px;
          border-radius: 5px;
          font-size: 14px;
          z-index: 10000;
          max-width: 300px;
          text-align: center;
        `;
        message.innerHTML = '💡 For best experience, open in a private/incognito window and allow full screen';
        document.body.appendChild(message);
        
        // Remove message after 5 seconds
        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 5000);
      };
      
      setTimeout(showPrivateWindowMessage, 3000);
    }

    // Removed aggressive full screen monitoring to prevent blocking form input
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/mobile-register" element={<MobileRegister />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/event-details" element={<EventDetailsPage />} />
            <Route path="/admin/raffle-spin" element={<RaffleSpinPage />} />
            <Route path="/admin/raffle-winners" element={<RaffleWinnersPage />} />
            <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
            <Route path="/admin-users" element={<AdminUsersPage />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;