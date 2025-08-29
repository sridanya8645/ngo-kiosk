import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

// Navigation component with all admin page variants

function SiteHeader ({ navVariant }) {
  const [currentEvent, setCurrentEvent] = useState(null);

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
  const navigate = useNavigate();

  const renderNav = () => {
    const go = (path) => () => navigate(path);
    if (navVariant === 'none') {
      return null;
    }
    if (navVariant === 'admin-login-only') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/admin')}>Admin</button>
        </div>
      );
    }
    if (navVariant === 'admin-users') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/event-details')}>Event Details</button>
          <button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
          <button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
          <button className="admin-button" onClick={go('/admin/registrations')}>Registration Details</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'event-details') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/admin-users')}>Manage Users</button>
          <button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
          <button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
          <button className="admin-button" onClick={go('/admin/registrations')}>Registration Details</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'raffle-spin') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/event-details')}>Event Details</button>
          <button className="admin-button" onClick={go('/admin-users')}>Manage Users</button>
          <button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
          <button className="admin-button" onClick={go('/admin/registrations')}>Registration Details</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'raffle-winners') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/event-details')}>Event Details</button>
          <button className="admin-button" onClick={go('/admin-users')}>Manage Users</button>
          <button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
          <button className="admin-button" onClick={go('/admin/registrations')}>Registration Details</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'registration-details') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/event-details')}>Event Details</button>
          <button className="admin-button" onClick={go('/admin-users')}>Manage Users</button>
          <button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
          <button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'admin-registrations') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/event-details')}>Event Details</button>
          <button className="admin-button" onClick={go('/admin-users')}>Manage Users</button>
          <button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
          <button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
          <button className="admin-button" onClick={go('/admin')}>Logout</button>
        </div>
      );
    }
    if (navVariant === 'home-only') {
      return (
        <div className="admin-nav-buttons">
          <button className="admin-button" onClick={go('/')}>Home</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="site-header">
      {/* Top header with logo, title and award badge */}
      <div className="header-content">
        {currentEvent?.header_image ? (
          <img src={currentEvent.header_image} alt="Event Header" className="logo-image" />
        ) : (
          <img src="/web_logo.png" alt="IAF Logo" className="logo-image" />
        )}
      </div>

      {/* Navigation bar below header */}
      {navVariant !== 'none' && (
        <div className="admin-bar" style={{ marginTop: 0 }}>
          {renderNav()}
        </div>
      )}
    </div>
  );
}

export default SiteHeader;


