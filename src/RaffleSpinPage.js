import React, { useState, useEffect } from 'react'; // redeploy trigger: after git cleanup
import { useNavigate } from 'react-router-dom';
import { Wheel } from 'react-custom-roulette';
import Confetti from 'react-confetti';
import './RaffleSpinPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const RaffleSpinPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [winner, setWinner] = useState(null);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);

  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [events, setEvents] = useState([]);
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
    (async () => {
      try {
        // Fetch eligible users (checked in TODAY), winners, events, and today's event
        const [eligibleRes, winnersRes, eventsRes, todayRes] = await Promise.all([
          fetch('/api/raffle/eligible-users', { cache: 'no-store' }),
          fetch('/api/raffle-winners', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
          fetch('/api/todays-event', { cache: 'no-store' })
        ]);
        const [eligibleUsersData, winnersData, eventsData, todayEvent] = await Promise.all([
          eligibleRes.json(), winnersRes.json(), eventsRes.json(), todayRes.json()
        ]);

        console.log('Eligible users (checked in today):', eligibleUsersData);
        console.log('Winners:', winnersData);
        console.log('All events:', eventsData);
        console.log("Today's event:", todayEvent);

        // Sort events and compute local date helpers
        const normalize = (d) => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); };
        const sorted = [...eventsData].sort((a,b) => normalize(a.date) - normalize(b.date));
        setEvents(sorted);

        // Auto-select today's event (no dropdown). If endpoint returns null, compute fallback using [date, end_date]
        let selected = (todayEvent && todayEvent.id) ? todayEvent : null;
        if (!selected) {
          const parseLocalYMD = (val) => {
            if (!val) return null;
            try {
              const str = typeof val === 'string' ? val.split('T')[0] : new Date(val).toISOString().split('T')[0];
              const [y, m, d] = str.split('-').map(Number);
              return new Date(y, m - 1, d);
            } catch { return null; }
          };
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const withDates = sorted.map(e => ({
            ...e,
            _start: parseLocalYMD(e.date),
            _end: parseLocalYMD(e.end_date) || parseLocalYMD(e.date)
          }));
          const inRange = withDates.find(e => e._start && e._end && e._start.getTime() <= today.getTime() && today.getTime() <= e._end.getTime());
          selected = inRange || null;
        }
        setSelectedEvent(selected);

        // Filter out already won users
        const availableUsers = eligibleUsersData.filter(user => 
          !winnersData.some(winner => winner.registration_id === user.id)
        );
        console.log('Available users for wheel:', availableUsers);
        setEligibleUsers(availableUsers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();
  }, []);

  // Recompute registrations when event changes
  useEffect(() => {
    if (!selectedEvent) {
      setRegistrations([]);
      return;
    }
    const filtered = eligibleUsers.filter(u => Number(u.event_id) === Number(selectedEvent.id));
    
    // Show ALL users who checked in today - no sampling restrictions
    let wheelData = filtered;
    if (filtered.length > 0) {
      wheelData = filtered.map((user, index) => ({
        ...user,
        _segmentSize: 1,
        _startIndex: index
      }));
    }
    
    setRegistrations(wheelData);
  }, [selectedEvent, eligibleUsers]);

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
    
    // Select directly from the wheel - no count restrictions
    const randomIndex = Math.floor(Math.random() * registrations.length);
    setPrizeNumber(randomIndex);
    setMustSpin(true);
    // Store the winner
    setWinner(registrations[randomIndex]);
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    
    // If we already have a winner stored (for both large and small datasets)
    if (winner) {
      triggerConfetti();
      
      // Persist winner to backend
      fetch('/api/raffle-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: winner.id })
      })
      .then(() => {
        // Remove winner from eligible users
        setEligibleUsers(prev => prev.filter(u => u.id !== winner.id));
        setWinner(null);
      })
      .catch(err => console.error('Failed to save winner:', err));
    } else {
      // Fallback for small datasets without stored winner
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
        <SiteHeader navVariant="admin-only" />

        <div className="raffle-main">
          {/* Title */}
          <h1 className="raffle-title">Spin the Wheel to Reveal the Winner!</h1>

          {/* Event selector removed: auto-select today's event */}

          {/* Event Info and Date - show only after selection */}
          {selectedEvent && (
            <div className="event-info-card">
              <div className="event-name">
                {selectedEvent.name}
              </div>
              <div className="event-date">
                {(() => {
                  const datePart = typeof selectedEvent.date === 'string' ? selectedEvent.date.split('T')[0] : new Date(selectedEvent.date).toISOString().split('T')[0];
                  const dt = new Date(`${datePart}T00:00:00`);
                  return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                })()}                
              </div>
              <div className="registration-count">
                Total Checked-in: {registrations.length} participants
              </div>
            </div>
          )}

          {/* Wheel */}
          <div className="wheel-container">
            {selectedEvent && registrations.length > 0 && (
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
                    backgroundColor: generateColors(registrations.length)[index],
                    textColor: '#000'
                  }
                }))}
                onStopSpinning={handleStopSpinning}
                textDistance={registrations.length > 1000 ? 85 : registrations.length > 500 ? 80 : 75}
                perpendicularText={false}
                fontSize={registrations.length > 2000 ? 4 : registrations.length > 1000 ? 5 : registrations.length > 500 ? 6 : 8}
                radiusLineWidth={1}
                radiusLineColor="#fff"
                outerBorderWidth={6}
                innerBorderWidth={6}
                innerBorderColor="#fff"
                outerBorderColor="#fff"
                textColors={['#000']}
              />
            )}
          </div>

          {!selectedEvent && (
            <div className="no-registrations"><p>No event found for today. Ensure today is within the event start and end dates.</p></div>
          )}

          {/* Compact winner card below the wheel */}
          {winner && (
            <div className="winner-announcement" style={{
              margin: '10px auto 5px',
              width: '280px',
              maxWidth: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '10px',
              padding: '10px 12px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #8B0000, #2F4F4F)',
              border: '3px solid #FFD700',
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                margin: '0 0 6px 0',
                color: '#FFD700',
                fontWeight: 'bold'
              }}>🎉 WINNER! 🎉</h3>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                margin: '3px 0',
                color: '#FFFFFF'
              }}>{winner.name}</p>
              <p style={{
                fontSize: '0.9rem',
                color: '#FFD700',
                margin: '1px 0',
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

          {selectedEvent && registrations.length === 0 && (
            <div className="no-registrations">
              <p>No checked-in registrations found for today. Please check in some participants first.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <SiteFooter />
      </div>
    </div>
  );
  };
  
export default RaffleSpinPage;