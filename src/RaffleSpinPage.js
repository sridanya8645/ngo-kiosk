import React, { useState, useEffect } from 'react'; // redeploy trigger: test email functionality
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
        // Fetch today's events (multiple events for the same day)
        const todayRes = await fetch('/api/todays-events', { cache: 'no-store' });
        const todayEvents = await todayRes.json();
        
        let currentSelectedEvent = selectedEvent;
        
        if (todayEvents && todayEvents.length > 0) {
          setEvents(todayEvents);
          // Auto-select the first event if only one event
          if (todayEvents.length === 1) {
            setSelectedEvent(todayEvents[0]);
            setEventInfo(todayEvents[0]);
            currentSelectedEvent = todayEvents[0];
          }
        }

        // Fetch eligible users (checked in TODAY), winners, and events
        const [eligibleRes, winnersRes, eventsRes] = await Promise.all([
          fetch(`/api/raffle/eligible-users${currentSelectedEvent ? `?eventId=${currentSelectedEvent.event_id}` : ''}`, { cache: 'no-store' }),
          fetch('/api/raffle-winners', { cache: 'no-store' }),
          fetch('/api/events', { cache: 'no-store' }),
        ]);
        const [eligibleUsersData, winnersData, eventsData] = await Promise.all([
          eligibleRes.json(), winnersRes.json(), eventsRes.json(),
        ]);

        console.log('Eligible users (checked in today):', eligibleUsersData);
        console.log('Winners:', winnersData);
        console.log('All events:', eventsData);
        console.log('Today\'s events:', todayEvents);
        console.log('Current date:', new Date().toISOString().split('T')[0]);

        // Fallback: if no today's events, use all events
        if (!todayEvents || todayEvents.length === 0) {
          // Sort events and compute local date helpers
          const normalize = (d) => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); };
          const sorted = [...eventsData].sort((a,b) => normalize(a.date) - normalize(b.date));
          setEvents(sorted);

          // Auto-select today's event (no dropdown). If endpoint returns null, compute fallback using [date, end_date]
          let selected = null;
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
            _start: parseLocalYMD(e.start_datetime),
            _end: parseLocalYMD(e.end_datetime) || parseLocalYMD(e.start_datetime),
          }));
          const inRange = withDates.find(e => e._start && e._end && e._start.getTime() <= today.getTime() && today.getTime() <= e._end.getTime());
          selected = inRange || null;
          setSelectedEvent(selected);
          setEventInfo(selected);
        }

        // Filter out already won users
        const availableUsers = eligibleUsersData.filter(user =>
          !winnersData.some(winner => winner.registration_id === user.id),
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
    
    // Fetch fresh data for the selected event
    const fetchEventSpecificData = async () => {
      try {
        const [eligibleRes, winnersRes] = await Promise.all([
          fetch(`/api/raffle/eligible-users?eventId=${selectedEvent.event_id}`, { cache: 'no-store' }),
          fetch('/api/raffle-winners', { cache: 'no-store' }),
        ]);
        
        const [eligibleUsers, winners] = await Promise.all([
          eligibleRes.json(),
          winnersRes.json(),
        ]);
        
        // Filter out already won users
        const availableUsers = eligibleUsers.filter(user =>
          !winners.some(winner => winner.registration_id === user.id),
        );
        
        setEligibleUsers(availableUsers);
        setRegistrations(availableUsers);
        console.log(`Wheel updated for event ${selectedEvent.name} with ${availableUsers.length} available users`);
      } catch (error) {
        console.error('Error fetching event-specific data:', error);
      }
    };
    
    fetchEventSpecificData();
  }, [selectedEvent]);

  // useEffect to update wheel data when eligible users change
  useEffect(() => {
    // Show ALL users who checked in today - no sampling restrictions
    let wheelData = eligibleUsers;
    if (eligibleUsers.length > 0) {
      wheelData = eligibleUsers.map((user, index) => ({
        ...user,
        _segmentSize: 1,
        _startIndex: index,
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
          prize: 'Raffle Prize',
        }),
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

  const handleSpinClick = () => {
    if (eligibleUsers.length === 0) {
      alert('No eligible users to spin!');
      return;
    }
    
    // Don't select winner yet - just start spinning
    const randomIndex = Math.floor(Math.random() * registrations.length);
    setPrizeNumber(randomIndex);
    setMustSpin(true);
    // Don't set winner here - it will be set in handleStopSpinning
  };

  const handleStopSpinning = () => {
    setMustSpin(false);

    // Select winner from ALL eligible users, not just wheel segments
    const randomWinnerIndex = Math.floor(Math.random() * eligibleUsers.length);
    const actualWinner = eligibleUsers[randomWinnerIndex];
    
    if (actualWinner) {
      setWinner(actualWinner);
      triggerConfetti();

      // Persist winner to backend
      fetch('/api/raffle-winners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: actualWinner.id }),
      })
        .then(() => {
          // Remove winner from eligible users
          setEligibleUsers(prev => prev.filter(u => u.id !== actualWinner.id));
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
        fetch(`/api/raffle/eligible-users${selectedEvent ? `?eventId=${selectedEvent.event_id}` : ''}`),
        fetch('/api/raffle-winners'),
      ]);

      const [eligibleUsers, winners] = await Promise.all([
        eligibleResponse.json(),
        winnersResponse.json(),
      ]);

      // Filter out already won users
      const availableUsers = eligibleUsers.filter(user =>
        !winners.some(winner => winner.registration_id === user.id),
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
        <SiteHeader navVariant="raffle-spin" />

        <div className="raffle-main">
          {/* Title */}
          <h1 className="raffle-title">
            {selectedEvent ? `Spin the Wheel for ${selectedEvent.name}` : 'Spin the Wheel to Reveal the Winner!'}
          </h1>

          {/* Event Selection Dropdown */}
          {events.length > 1 && (
            <div className="event-selection-container" style={{
              margin: '20px 0',
              textAlign: 'center'
            }}>
              <label htmlFor="event-select" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333',
                fontSize: '1.1rem'
              }}>Select Event:</label>
              <select
                id="event-select"
                value={selectedEvent ? selectedEvent.event_id : ''}
                onChange={(e) => {
                  const event = events.find(ev => ev.event_id === parseInt(e.target.value));
                  setSelectedEvent(event);
                  setEventInfo(event);
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: '2px solid #8B1C1C',
                  fontSize: '1.1rem',
                  minWidth: '300px',
                  backgroundColor: '#fff',
                  color: '#333'
                }}
              >
                <option value="">-- Select an Event --</option>
                {events.map(event => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.name} ({new Date(event.start_datetime).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Show message if no event selected */}
          {!selectedEvent && events.length > 1 && (
            <div style={{
              textAlign: 'center',
              margin: '20px 0',
              padding: '20px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '10px',
              color: '#856404',
              fontSize: '1.1rem'
            }}>
              <p>Please select an event to continue with the raffle.</p>
            </div>
          )}

          {/* Show message if no events available */}
          {(!selectedEvent && events.length <= 1) && (
            <div style={{
              textAlign: 'center',
              margin: '20px 0',
              padding: '20px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '10px',
              color: '#721c24',
              fontSize: '1.1rem'
            }}>
              <p>No events available for today.</p>
            </div>
          )}

          {/* Event Info and Date - show only after selection */}
          {selectedEvent && (
            <div className="event-info-box">
              <h3>{selectedEvent ? selectedEvent.name : 'No Event Selected'}</h3>
              <p><em>{selectedEvent ? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No date available'}</em></p>
              <p>Total Checked-in: {registrations.length} participants</p>
            </div>
          )}

          {/* Eligible Participants Count Card */}
          {selectedEvent && eligibleUsers.length > 0 && (
            <div className="eligible-count-card" style={{
              margin: '10px auto 20px',
              width: '300px',
              maxWidth: '90%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: '8px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #4CAF50, #45a049)',
              border: '2px solid #2E7D32',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              color: 'white',
              fontWeight: 'bold',
            }}>
              <span style={{ fontSize: '1rem' }}>🎯 Eligible Participants:</span>
              <span style={{ fontSize: '1.2rem', color: '#FFD700' }}>{eligibleUsers.length}</span>
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
                    textColor: '#000',
                  },
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
              boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                margin: '0 0 6px 0',
                color: '#FFD700',
                fontWeight: 'bold',
              }}>🎉 WINNER! 🎉</h3>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                margin: '3px 0',
                color: '#FFFFFF',
              }}>{winner.name}</p>
              <p style={{
                fontSize: '0.9rem',
                color: '#FFD700',
                margin: '1px 0',
                fontWeight: '700',
              }}>ID: {winner.id}</p>
            </div>
          )}

          {/* Spin button */}
          <div className="spin-button-wrapper">
            <button
              onClick={handleSpinClick}
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

// Redeploy trigger - spin wheel optimizations for 3000+ participants
// Final deployment attempt - all features implemented
