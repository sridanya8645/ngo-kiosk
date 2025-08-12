import React, { useState, useEffect } from 'react'; // redeploy trigger: minor comment change
import { useNavigate } from 'react-router-dom';
import { Wheel } from 'react-custom-roulette';
import Confetti from 'react-confetti';
import './RaffleSpinPage.css';

const RaffleSpinPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [winner, setWinner] = useState(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [allEligibleRegistrations, setAllEligibleRegistrations] = useState([]);
  const [currentEligibleIndex, setCurrentEligibleIndex] = useState(500);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  // Function to generate 500 different colors
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = (i * 137.508) % 360; // Golden angle approximation for better distribution
      const saturation = 70 + (i % 15); // 70-85% saturation for more vibrant colors
      const lightness = 60 + (i % 20); // 60-80% lightness for better contrast
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  };

  useEffect(() => {
    // Fetch eligible users (checked in TODAY) and winners
    Promise.all([
      fetch('/api/raffle/eligible-users'),
      fetch('/api/raffle-winners'),
      fetch('/api/events')
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(([eligibleUsers, winners, events]) => {
      console.log('Eligible users (checked in today):', eligibleUsers);
      console.log('Winners:', winners);
      console.log('All events:', events);
      
      // Choose today's or next event
      const normalize = (d) => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); };
      const todayTs = normalize(new Date());
      const sorted = [...events].sort((a,b) => normalize(a.date) - normalize(b.date));
      const todays = sorted.find(e => normalize(e.date) === todayTs);
      const next = sorted.find(e => normalize(e.date) > todayTs);
      const chosen = todays || next || sorted[0] || null;
      setSelectedEvent(chosen);
      
      // Filter out already won users
      const availableUsers = eligibleUsers.filter(user => 
        !winners.some(winner => winner.registration_id === user.id)
      );
      
      console.log('Available users for wheel:', availableUsers);
      setEligibleUsers(availableUsers);
      setRegistrations(availableUsers); // Set registrations for the wheel
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }, []);

  // Removed unused fetchEventInfo with undefined setter to satisfy linter

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 8000); // Extended confetti duration
  };

  const saveWinner = async (winner) => {
    try {
      const response = await fetch('/api/raffle-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: winner.id,
          prize: 'Raffle Prize'
        })
      });
      
      if (response.ok) {
        console.log('Winner saved successfully');
        // Remove winner from the wheel immediately
        setEligibleUsers(prevUsers => prevUsers.filter(user => user.id !== winner.id));
        setWinner(null);
        setMustSpin(false);
      } else {
        console.error('Failed to save winner');
      }
    } catch (error) {
      console.error('Error saving winner:', error);
    }
  };

  const spinWheel = () => {
    if (registrations.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * registrations.length);
    setPrizeNumber(randomIndex);
    setMustSpin(true);
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    const selected = registrations[prizeNumber];
    if (selected) {
      setWinner(selected);
      triggerConfetti();

      // Persist winner to backend, then remove from wheel
      fetch('/api/raffle-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: selected.id })
      })
      .then(() => {
        // Remove winner from the wheel list so they can't win again
        setRegistrations(prev => prev.filter(u => u.id !== selected.id));
      })
      .catch(err => console.error('Failed to save winner:', err));
    }
  };

  const resetWheel = () => {
    setWinner(null);
    // Refresh the data
    window.location.reload();
  };

  const refreshRegistrations = async () => {
    try {
      // Fetch updated eligible users and winners
      const [eligibleResponse, winnersResponse] = await Promise.all([
        fetch('/api/raffle/eligible-users'),
        fetch('/api/raffle-winners')
      ]);
      
      const [eligibleUsers, winners] = await Promise.all([
        eligibleResponse.json(),
        winnersResponse.json()
      ]);
      
      // Filter out already won users
      const availableUsers = eligibleUsers.filter(user => 
        !winners.some(winner => winner.registration_id === user.id)
      );
      
      setEligibleUsers(availableUsers);
      setRegistrations(availableUsers); // Update registrations for the wheel
      console.log('Wheel refreshed with', availableUsers.length, 'available users');
    } catch (error) {
      console.error('Error refreshing registrations:', error);
    }
  };

  const goToWinnersPage = () => {
    navigate('/admin/raffle-winners');
  };

  const goToRegistrationDetails = () => {
    navigate('/admin/registrations');
  };

  const goToEventDetails = () => {
    navigate('/event-details');
  };

  const logout = () => {
    navigate('/admin');
  };

  return (
    <div className="raffle-bg">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={true}
          numberOfPieces={500}
          colors={['#8B0000', '#2F4F4F', '#191970', '#4B0082', '#800000', '#556B2F', '#2E8B57', '#8B4513', '#A0522D', '#6B8E23', '#B8860B', '#CD853F']}
          gravity={0.2}
          wind={0.1}
          tweenDuration={8000}
        />
      )}
      <div className="raffle-aspect">
        <header className="raffle-header">
          <div className="header-content">
            <div className="logo-section">
              <img src="/sai-baba.png" alt="Sai Baba" className="logo-image" />
            </div>
            <div className="org-info">
              A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
            </div>
          </div>
        </header>
        
        {/* Navigation Bar */}
        <div className="admin-bar">
          <div className="admin-nav-buttons">
            <button
              onClick={goToRegistrationDetails}
              className="admin-button"
            >
              Registration Details
            </button>
            <button
              onClick={() => navigate('/admin/raffle-spin')}
              className="admin-button"
            >
              Raffle Spin
            </button>
            <button
              onClick={goToWinnersPage}
              className="admin-button"
            >
              Raffle Winners
            </button>
            <button
              onClick={goToEventDetails}
              className="admin-button"
            >
              Event Details
            </button>
            <button
              onClick={logout}
              className="admin-button"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="raffle-main">
          {/* Title */}
          <h1 className="raffle-title">Spin the Wheel to Reveal the Winner!</h1>

          {/* Event Info and Date */}
          <div className="event-info-card">
            <div className="event-name">
              {selectedEvent?.name || 'Temple Newsletter and General Events'}
            </div>
            <div className="event-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>

          {/* Wheel */}
          <div className="wheel-container">
            {registrations.length > 0 && (
              <Wheel
                mustStartSpinning={mustSpin}
                prizeNumber={prizeNumber}
                data={registrations.map((reg, index) => ({
                  option: reg.name ? (() => {
                    const nameParts = reg.name.split(' ');
                    const firstName = nameParts[0] || '';
                    const lastNameInitial = nameParts.length > 1 ? nameParts[1][0] : '';
                    return `${firstName} ${lastNameInitial}.`;
                  })() : `ID: ${reg.id}`,
                  style: { 
                    backgroundColor: generateColors(500)[index],
                    textColor: '#000'
                  }
                }))}
                onStopSpinning={handleStopSpinning}
                textDistance={70}
                perpendicularText={false}
                fontSize={6}
                radiusLineWidth={1}
                radiusLineColor="#fff"
                outerBorderWidth={4}
                innerBorderWidth={4}
                innerBorderColor="#fff"
                outerBorderColor="#fff"
                textColors={['#000']}
              />
            )}
          </div>

          {/* Compact winner card below the wheel */}
          {winner && (
            <div className="winner-announcement" style={{
              margin: '16px auto 8px',
              width: '320px',
              maxWidth: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '12px',
              padding: '14px 16px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #8B0000, #2F4F4F)',
              border: '3px solid #FFD700',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
            }}>
              <h3 style={{
                fontSize: '1.6rem',
                margin: '0 0 8px 0',
                color: '#FFD700',
                fontWeight: 'bold'
              }}>🎉 WINNER! 🎉</h3>
              <p style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                margin: '4px 0',
                color: '#FFFFFF'
              }}>{winner.name}</p>
              <p style={{
                fontSize: '1.1rem',
                color: '#FFD700',
                margin: '2px 0',
                fontWeight: '700'
              }}>ID: {winner.id}</p>
            </div>
          )}

          {/* Spin button */}
          <div className="spin-button-wrapper">
            <button
              onClick={spinWheel}
              disabled={mustSpin || registrations.length === 0}
              className="raffle-button primary"
            >
              Spin
            </button>
          </div>

          {registrations.length === 0 && (
            <div className="no-registrations">
              <p>No checked-in registrations found for today. Please check in some participants first.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="raffle-footer">
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
        </footer>
      </div>
    </div>
  );
  };
  
export default RaffleSpinPage;