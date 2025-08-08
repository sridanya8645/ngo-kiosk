import React, { useState, useEffect } from 'react';
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
  const [todaysEvent, setTodaysEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
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
      
      // Set all events
      setAllEvents(events);
      
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

  const fetchEventInfo = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const events = await response.json();
        const today = new Date().toISOString().split('T')[0];
        const todaysEvent = events.find(event => event.date === today);
        setTodaysEvent(todaysEvent);
      }
    } catch (error) {
      console.error('Error fetching event info:', error);
    }
  };

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
          {/* Main heading centered at top */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            marginTop: '20px'
          }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: '#8B1C1C',
              margin: '0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
            }}>
              Spin the Wheel to Reveal the Winner!
            </h1>
          </div>
          
          {/* Event Info and Date */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            border: '2px solid #8B1C1C'
          }}>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#8B1C1C',
              marginBottom: '10px'
            }}>
              {allEvents.filter(event => event.banner).length > 0 ? allEvents.filter(event => event.banner)[0].name : 'Temple Newsletter and General Events'}
            </div>
            <div style={{
              fontSize: '1.2rem',
              color: '#8B1C1C',
              fontWeight: '600'
            }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginTop: '20px', position: 'relative' }}>
            {/* Winner announcement centered */}
            {winner && (
              <div className="winner-announcement" style={{ 
                marginBottom: '30px',
                minWidth: '500px',
                maxWidth: '500px',
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '20px',
                padding: '30px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #8B0000, #2F4F4F)',
                border: '5px solid #FFD700',
                boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
                animation: 'winnerGlow 2s ease-in-out infinite alternate'
              }}>
                <h3 style={{ 
                  fontSize: '3.5rem', 
                  margin: '0 0 30px 0', 
                  color: '#FFD700', 
                  fontWeight: 'bold',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                  🎉 WINNER! 🎉
                </h3>
                <p className="winner-name" style={{ 
                  fontSize: '3rem', 
                  fontWeight: 'bold', 
                  margin: '15px 0', 
                  color: '#FFFFFF',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                }}>
                  {winner.name}
                </p>
                <p className="winner-id" style={{ 
                  fontSize: '2.5rem', 
                  color: '#FFD700', 
                  margin: '10px 0',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                  ID: {winner.id}
                </p>

                <button
                  onClick={resetWheel}
                  style={{
                    marginTop: '30px',
                    padding: '20px 40px',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    backgroundColor: '#FFD700',
                    color: '#8B0000',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                  }}
                >
                  Spin Again
                </button>
              </div>
            )}

            {/* Wheel centered */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              
              {/* Spin button centered below wheel */}
              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button
                  onClick={spinWheel}
                  disabled={mustSpin || registrations.length === 0}
                  className="raffle-button primary"
                  style={{ 
                    fontSize: '3rem', 
                    fontWeight: 'bold',
                    padding: '20px 40px',
                    backgroundColor: '#8B1C1C',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
                  }}
                >
                  Spin
                </button>
              </div>
            </div>
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