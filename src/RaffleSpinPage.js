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
        fetch('http://localhost:5000/api/registrations'),
        fetch('http://localhost:5000/api/raffle-winners')
      ]);
      
      if (registrationsResponse.ok && winnersResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        const winnersData = await winnersResponse.json();
        // Get today's date in YYYY-MM-DD format to match database format
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
      const response = await fetch('http://localhost:5000/api/events');
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
    
    // Stop confetti after 10 seconds
    setTimeout(() => {
      setShowConfetti(false);
    }, 10000);
  };

  const saveWinnerToDatabase = async (winner) => {
    try {
      const response = await fetch('http://localhost:5000/api/raffle-winners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_id: winner.id,
          name: winner.name,
          email: winner.email,
          event_name: eventInfo ? eventInfo.name : 'Register for Newsletter and General Events',
          win_date: new Date().toISOString().split('T')[0],
          win_time: new Date().toLocaleTimeString()
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to save winner to database');
      }
    } catch (error) {
      console.error('Error saving winner:', error);
    }
  };

  const spinWheel = () => {
    if (mustSpin || registrations.length === 0) return;

    setMustSpin(true);
    setWinner(null);

    // Generate random prize number
    const newPrizeNumber = Math.floor(Math.random() * registrations.length);
    setPrizeNumber(newPrizeNumber);
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    
    // Get the winning registration
    const winningRegistration = registrations[prizeNumber];
    setWinner(winningRegistration);
    
    saveWinnerToDatabase(winningRegistration);
    
    // Remove the winner from the registrations list for future spins
    const updatedRegistrations = registrations.filter(reg => reg.id !== winningRegistration.id);
    
    // Add the next person from allEligibleRegistrations to maintain 500 participants
    if (allEligibleRegistrations.length > currentEligibleIndex) {
      const nextPerson = allEligibleRegistrations[currentEligibleIndex];
      if (nextPerson && !updatedRegistrations.find(reg => reg.id === nextPerson.id)) {
        updatedRegistrations.push(nextPerson);
        console.log(`Added next person to wheel: ${nextPerson.name} (ID: ${nextPerson.id})`);
        setCurrentEligibleIndex(prevIndex => prevIndex + 1);
      }
    }
    
    setRegistrations(updatedRegistrations);
    
    // Trigger confetti after a short delay
    setTimeout(() => {
      triggerConfetti();
    }, 500);
  };

  const resetWheel = () => {
    setWinner(null);
    setPrizeNumber(0);
  };

  const refreshRegistrations = () => {
    fetchTodayRegistrations();
  };

  const goToWinnersPage = () => {
    navigate('/admin/raffle-winners');
  };

  const goToRegistrationDetails = () => {
    navigate('/registration-details');
  };

  const goToEventDetails = () => {
    navigate('/event-details');
  };

  const logout = () => {
    navigate('/');
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
        <div className="raffle-header-centered">
          <img src="/sai baba.png" alt="Logo" className="raffle-logo" />
          <span className="raffle-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </div>
        
        {/* Red Navigation Bar */}
        <div className="raffle-nav-bar">
          <button
            onClick={goToRegistrationDetails}
            className="raffle-nav-btn"
          >
            Registration Details
          </button>
          <div className="raffle-nav-divider"></div>
          <button
            onClick={goToWinnersPage}
            className="raffle-nav-btn"
          >
            Raffle Winners
          </button>
          <div className="raffle-nav-divider"></div>
          <button
            onClick={goToEventDetails}
            className="raffle-nav-btn"
          >
            Event Details
          </button>
          <div className="raffle-nav-divider"></div>
          <button
            onClick={logout}
            className="raffle-nav-btn"
          >
            Logout
          </button>
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
                  fontWeight: 'bold', 
                  margin: '10px 0' 
                }}>
                  Registration ID: {winner.id}
                </p>
                <p className="winner-message" style={{ 
                  fontSize: '4rem', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  margin: '10px 0' 
                }}>
                  You've won the raffle! 🏆
                </p>
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

        <footer className="event-footer event-footer-dark" style={{ marginTop: '2rem', marginBottom: '-1rem', padding: '16px 24px', color: '#000', fontWeight: 'bold' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.9rem', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>📍</span>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>
                <span>Shirdi Sai Dham Inc, 12 Perrine Road,</span>
                <span>Monmouth Junction NJ 08852</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold', justifyContent: 'center' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>📞</span>
              <div style={{ display: 'flex', flexDirection: 'column', fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>
                <span>609 937 2800 /</span>
                <span>609 937 2806</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: '#000', fontWeight: 'bold', justifyContent: 'center' }}>
              <span style={{ color: '#ff69b4', fontSize: '1.9rem', fontWeight: 'bold' }}>✉️</span>
              <span style={{ fontSize: '1.9rem', color: '#000', fontWeight: 'bold' }}>shirdisaidham1@gmail.com</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'center', color: '#000', fontWeight: 'bold', gap: '2px' }}>
              <span style={{ color: '#000', fontSize: '1.8rem', fontWeight: 'bold' }}>Powered by</span>
              <img src="/PITS-removebg-preview.png" alt="PITS" style={{ height: '12rem', width: '20rem', display: 'block' }} />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default RaffleSpinPage; 