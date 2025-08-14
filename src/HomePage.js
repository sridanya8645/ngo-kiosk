import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { IS_IAF } from './orgToggle';

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
    <div className="home-container" data-build-tag="iaf-redeploy-002" style={IS_IAF ? { background: 'linear-gradient(180deg, #CAA3EB 0%, #A566AA 100%)' } : undefined}>
      {/* Header Section */}
      {!IS_IAF && (
        <header className="home-header">
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

      {/* Admin Bar */}
      <div className="admin-bar" style={IS_IAF ? { background: '#000' } : undefined}>
        <button 
          onClick={() => navigate('/admin')}
          className="admin-button"
          style={IS_IAF ? { background: '#000', color: '#fff', border: '1px solid #fff' } : undefined}
        >
          Admin
        </button>
      </div>

      {/* Main Content */}
      <main className="home-main">
        <h1 className="welcome-title" style={IS_IAF ? { color: '#000' } : undefined}>{IS_IAF ? 'Welcome to Indo American Fair 2025' : 'Welcome to Shirdi Sai Dham'}</h1>
        
        <div className="main-image-container">
          <img 
            src={IS_IAF ? '/Image (4).jpg' : '/81tJnr3gLaL._AC_UF1000,1000_QL80_.jpg'} 
            alt={IS_IAF ? 'Indo American Fair Banner' : 'Shirdi Sai Baba'} 
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

      {/* Footer */}
      <footer className="home-footer" style={IS_IAF ? { background: 'transparent' } : undefined}>
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

export default HomePage; 