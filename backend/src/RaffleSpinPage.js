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
    fetchTodayRegistrations();
    fetchEventInfo();
  }, []);

  const fetchTodayRegistrations = async () => {
    try {
      const [registrationsResponse, winnersResponse] = await Promise.all([
              fetch('https://ngo-kiosk-app.azurewebsites.net/api/registrations'),
      fetch('https://ngo-kiosk-app.azurewebsites.net/api/raffle-winners')
      ]);
      
      if (registrationsResponse.ok && winnersResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        const winnersData = await winnersResponse.json();
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        console.log('Today\'s date in YYYY-MM-DD format:', today);
        
        // Get today's winners registration IDs
        const todayWinnersIds = winnersData
          .filter(winner => winner.win_date === today)
          .map(winner => winner.registration_id);
        
        // Filter for checked-in registrations from today that haven't won today
        const eligibleRegistrations = registrationsData.filter(reg => 
          reg.checked_in === 1 && 
          reg.checkin_date === today &&
          !todayWinnersIds.includes(reg.id)
        );
        
        // Store all eligible registrations for future use
        setAllEligibleRegistrations(eligibleRegistrations);
        
        // Reset the current eligible index
        setCurrentEligibleIndex(500);
        
        // Limit to first 500 participants for better wheel display
        const limitedRegistrations = eligibleRegistrations.slice(0, 500);
        
        console.log(`Found ${eligibleRegistrations.length} eligible participants for today's raffle`);
        console.log(`Limited to ${limitedRegistrations.length} participants for wheel display`);
        console.log(`Total registrations: ${registrationsData.length}`);
        console.log(`Checked-in registrations: ${registrationsData.filter(reg => reg.checked_in === 1).length}`);
        console.log(`Today's check-ins: ${registrationsData.filter(reg => reg.checkin_date === today).length}`);
        console.log(`Excluded ${todayWinnersIds.length} previous winners from today`);
        console.log(`Today's date: ${today}`);
        console.log(`Sample registration:`, registrationsData[0]);
        console.log(`Sample checkin_date:`, registrationsData[0]?.checkin_date);
        console.log(`Date comparison test:`, registrationsData[0]?.checkin_date === today);
        
        setRegistrations(limitedRegistrations);
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const fetchEventInfo = async () => {
    try {
      const response = await fetch('https://ngo-kiosk-app.azurewebsites.net/api/events');
      if (response.ok) {
        const events = await response.json();
        const newsletterEvent = events.find(ev => ev.name === "Register for Newsletter and General Events");
        setEventInfo(newsletterEvent);
      }
    } catch (error) {
      console.error('Error fetching event info:', error);
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const saveWinnerToDatabase = async (winner) => {
    try {
      console.log('Saving winner to database:', winner);
      
      const winnerData = {
        registration_id: winner.id,
        name: winner.name,
        email: winner.email,
        phone: winner.phone,
        event_name: winner.event_name || 'Register for Newsletter and General Events',
        win_date: new Date().toISOString().split('T')[0],
        win_time: new Date().toLocaleTimeString()
      };
      
      console.log('Winner data being sent:', winnerData);
      
      const response = await fetch('https://ngo-kiosk-app.azurewebsites.net/api/raffle-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(winnerData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Winner saved to database successfully:', result);
        // Refresh registrations to update the list
        fetchTodayRegistrations();
      } else {
        const errorData = await response.json();
        console.error('Failed to save winner to database:', errorData);
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
    const selectedWinner = registrations[prizeNumber];
    setWinner(selectedWinner);
    
    // Save winner to database
    saveWinnerToDatabase(selectedWinner);
    
    // Trigger confetti
    triggerConfetti();
    
    // Remove winner from the list for next spin
    const updatedRegistrations = registrations.filter((_, index) => index !== prizeNumber);
    setRegistrations(updatedRegistrations);
    
    // Update all eligible registrations
    const updatedAllEligible = allEligibleRegistrations.filter(reg => reg.id !== selectedWinner.id);
    setAllEligibleRegistrations(updatedAllEligible);
  };

  const resetWheel = () => {
    setWinner(null);
    fetchTodayRegistrations();
  };

  const refreshRegistrations = () => {
    fetchTodayRegistrations();
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
          numberOfPieces={300}
          colors={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FF69B4', '#00CED1', '#FFD700', '#FF4500']}
          gravity={0.3}
          wind={0.05}
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
          <div className="raffle-welcome-msg">Spin the Wheel to Reveal the Winner!</div>
          
          {eventInfo && (
            <div className="raffle-event-info">
              Date: {new Date().toLocaleDateString()} - Event Name: {eventInfo.name} - Eligible Participants: {registrations.length}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '40px', marginTop: '20px', position: 'relative' }}>
            {/* Winner announcement on the left */}
            {winner && (
              <div className="winner-announcement" style={{ 
                marginTop: '200px', 
                minWidth: '400px',
                maxWidth: '400px',
                height: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                background: '#8B1C1C',
                border: '3px solid #fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <h3 style={{ 
                  fontSize: '4rem', 
                  margin: '0 0 20px 0', 
                  color: '#8B1C1C', 
                  fontWeight: 'bold' 
                }}>
                  🎉 Congratulations! 🎉
                </h3>
                <p className="winner-name" style={{ 
                  fontSize: '4rem', 
                  fontWeight: 'bold', 
                  margin: '10px 0', 
                  color: '#FFEAA7' 
                }}>
                  Winner: {winner.name}
                </p>
                <p className="winner-id" style={{ 
                  fontSize: '4rem', 
                  color: '#FFD700', 
                  margin: '5px 0' 
                }}>
                  ID: {winner.id}
                </p>
                <button
                  onClick={resetWheel}
                  style={{
                    marginTop: '20px',
                    padding: '15px 30px',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    backgroundColor: '#FFD700',
                    color: '#8B1C1C',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Spin Again
                </button>
              </div>
            )}

            {/* Wheel in the center with buttons positioned at right corner */}
            <div style={{ position: 'relative' }}>
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
              
              {/* Buttons positioned at right corner of wheel */}
              <div className="raffle-buttons" style={{ 
                position: 'absolute', 
                bottom: '20px', 
                right: '-120px', 
                flexDirection: 'row', 
                gap: '50px',
                zIndex: 10
              }}>
                <button
                  onClick={spinWheel}
                  disabled={mustSpin || registrations.length === 0}
                  className="raffle-button primary"
                  style={{ fontSize: '3rem', fontWeight: 'bold' }}
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
