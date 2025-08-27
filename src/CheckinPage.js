import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import './CheckinPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

export default function CheckinPage () {
  const html5QrCodeRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scanComplete, setScanComplete] = useState(false);
  const [todaysEvent, setTodaysEvent] = useState(null);
  const [newsletterEvent, setNewsletterEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const navigate = useNavigate();
  const isRunning = useRef(false);
  const isProcessingScan = useRef(false);

  useEffect(() => {
    // Debug: Test image loading
    const testImage = new Image();
    testImage.onload = () => console.log('Test image loaded successfully');
    testImage.onerror = () => console.error('Test image failed to load');
    testImage.src = '/sai-baba.png';
    console.log('Testing image path:', '/sai-baba.png');

    (async () => {
      try {
        // Fetch today's events (multiple events for the same day)
        const res = await fetch('/api/todays-events');
        if (res.ok) {
          const events = await res.json();
          console.log('Today\'s events data:', events);
          if (events && events.length > 0) {
            setEvents(events);
            // Auto-select the first event if only one event
            if (events.length === 1) {
              setSelectedEvent(events[0]);
              setTodaysEvent(events[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching today\'s events:', err);
      }

      // Fallback: fetch all events if today's events endpoint fails
      if (events.length === 0) {
        try {
          const res2 = await fetch('/api/events');
          if (res2.ok) {
            const evs = await res2.json();
            console.log('All events data:', evs);
            const getDateKey = (val) => {
              if (!val) return '';
              if (typeof val === 'string') return val.split('T')[0];
              try { return new Date(val).toISOString().split('T')[0]; } catch { return ''; }
            };
            const normalize = (d) => { try { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); } catch { return 0; } };
            const sorted = [...evs].sort((a,b) => normalize(a.start_datetime) - normalize(b.start_datetime));
            const todayKey = new Date().toLocaleDateString('en-CA');
            const todays = sorted.find(e => getDateKey(e.start_datetime) === todayKey) || null;
            setEvents(sorted);
            setSelectedEvent(todays || sorted[0] || null);
            setTodaysEvent(todays || sorted[0] || null);
          }
        } catch (err) {
          console.error('Error fetching events:', err);
        }
      }
    })();
  }, []);

  useEffect(() => {
    // Initialize or teardown scanner based on event selection
    const stopScanner = async () => {
      if (html5QrCodeRef.current && isRunning.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (_) {}
        try {
          if (html5QrCodeRef.current && typeof html5QrCodeRef.current.clear === 'function') {
            await html5QrCodeRef.current.clear();
          }
        } catch (_) {}
        isRunning.current = false;
        html5QrCodeRef.current = null;
      }
      const container = document.getElementById('reader-container');
      if (container) container.innerHTML = '';
      const existingReaders = document.querySelectorAll('#reader');
      existingReaders.forEach(el => el.remove());
      const existingScanners = document.querySelectorAll('[data-testid="qr-reader"]');
      existingScanners.forEach(el => el.remove());
    };

    if (!selectedEvent) {
      // No event selected: ensure scanner is stopped and hidden
      stopScanner();
      return;
    }

    // Event selected: start scanner
    const initScanner = () => {
      // Clear any existing scanner
      stopScanner().then(() => {
        const container = document.getElementById('reader-container');
        if (!container) return;
        // Create reader div
        const readerDiv = document.createElement('div');
        readerDiv.id = 'reader';
        readerDiv.style.width = '400px';
        readerDiv.style.height = '400px';
        readerDiv.style.margin = '0 auto';
        readerDiv.style.border = '3px solid #8B1C1C';
        readerDiv.style.borderRadius = '15px';
        readerDiv.style.overflow = 'hidden';
        readerDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        container.appendChild(readerDiv);

        try {
          if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode('reader');
          }
          html5QrCodeRef.current
            .start(
              { facingMode: 'user' },
              { fps: 10, qrbox: { width: 400, height: 400 }, aspectRatio: 1.0 },
              qrCodeMessage => {
                if (isProcessingScan.current) return;
                isProcessingScan.current = true;
                try {
                  const data = JSON.parse(qrCodeMessage);
                  const registrationId = data.registrationId;
                  if (!registrationId) throw new Error('No registrationId in QR code');
                  handleCheckin(registrationId, data.name);
                } catch (e) {
                  setErrorMsg('Invalid QR code format');
                  isProcessingScan.current = false;
                }
              },
              errorMessage => {
                console.log('Scanner error:', errorMessage);
              },
            )
            .then(() => {
              isRunning.current = true;
              setErrorMsg('');
            })
            .catch((error) => {
              isRunning.current = false;
              console.error('Scanner failed to start:', error);
              setErrorMsg('Failed to start camera. Please check permissions.');
            });
        } catch (error) {
          console.error('QR Scanner initialization error:', error);
          setErrorMsg('Camera initialization failed');
        }
      });
    };

    const timer = setTimeout(initScanner, 300);
    return () => clearTimeout(timer);
  }, [selectedEvent]);

  const handleCheckin = useCallback(async (registrationId, name) => {
    console.log('Handling check-in for:', registrationId, name);

    setScanComplete(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const eventIdToSend = selectedEvent?.event_id || null;
      console.log('Sending eventId in check-in request:', eventIdToSend);
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          eventId: eventIdToSend,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.alreadyCheckedIn) {
          setSuccessMsg(`👋 Welcome back, ${data.name}! You have already scanned.`);
        } else {
          setSuccessMsg(`✅ Successfully scanned! ${data.name} is now checked in.`);
        }

        // Restart scanner after 3 seconds
        setTimeout(() => {
          setScanComplete(false);
          setSuccessMsg('');

          // Properly stop existing scanner before restarting
          if (html5QrCodeRef.current && isRunning.current) {
            try {
              html5QrCodeRef.current.stop().then(() => {
                isRunning.current = false;
                // Clear container and reinitialize
                const container = document.getElementById('reader-container');
                if (container) {
                  // Remove all existing content
                  container.innerHTML = '';

                  // Remove any existing elements with reader ID
                  const existingReaders = document.querySelectorAll('#reader');
                  existingReaders.forEach(el => el.remove());

                  // Also remove any Html5Qrcode instances
                  const existingScanners = document.querySelectorAll('[data-testid="qr-reader"]');
                  existingScanners.forEach(el => el.remove());

                  const readerDiv = document.createElement('div');
                  readerDiv.id = 'reader';
                  readerDiv.style.width = '400px';
                  readerDiv.style.height = '400px';
                  readerDiv.style.margin = '0 auto';
                  readerDiv.style.border = '3px solid #8B1C1C';
                  readerDiv.style.borderRadius = '15px';
                  readerDiv.style.overflow = 'hidden';
                  readerDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  container.appendChild(readerDiv);

                  // Reinitialize scanner (guard)
                  if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode('reader');
                  }
                  html5QrCodeRef.current.start(
                    { facingMode: 'user' },
                    { fps: 10, qrbox: { width: 400, height: 400 } },
                    qrCodeMessage => {
                      if (isProcessingScan.current) { return; }
                      isProcessingScan.current = true;
                      console.log('QR Code detected:', qrCodeMessage);
                      try {
                        const data = JSON.parse(qrCodeMessage);
                        const registrationId = data.registrationId;
                        if (!registrationId) throw new Error('No registrationId in QR code');
                        handleCheckin(registrationId, data.name);
                      } catch (e) {
                        setErrorMsg('❌ Invalid QR code');
                        isProcessingScan.current = false;
                      }
                    },
                    errorMessage => {
                      console.log('Scanner error:', errorMessage);
                    },
                  ).then(() => {
                    isRunning.current = true;
                    isProcessingScan.current = false;
                  }).catch((error) => {
                    console.log('Scanner failed to restart:', error);
                  });
                }
              }).catch(() => {
                isRunning.current = false;
              });
            } catch (error) {
              console.log('Error stopping scanner:', error);
              isRunning.current = false;
            }
          }
        }, 3000);
      } else {
        console.log('Check-in failed:', data);
        if (data.message && (data.message.includes('already checked in') || data.message.includes('already been scanned'))) {
          setSuccessMsg(data.message); // Show the "Welcome back" message as success
          setErrorMsg('');
        } else if (data.error && data.error.includes('QR not valid for selected event')) {
          const extra = data.eventName ? ` This QR belongs to ${data.eventName}.` : '';
          setErrorMsg(`❌ QR not valid for the selected event.${extra}`);
        } else if (data.error) {
          setErrorMsg(`❌ ${data.error}`);
        } else {
          setErrorMsg('❌ Check-in failed');
        }
        setScanComplete(false);
        isProcessingScan.current = false;
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setErrorMsg('❌ Network error. Please try again.');
      setScanComplete(false);
      isProcessingScan.current = false;
    }
  }, [scanComplete, selectedEvent]);


  return (
    <div className="checkin-container">
      <SiteHeader navVariant="home-only" />

      {/* Navigation provided by SiteHeader */}

      {/* Main Content */}
      <main className="checkin-main">
        <div className="checkin-content">
          {/* Use event title as main heading */}
          <h1 className="checkin-for-text checkin-for-title">
            {selectedEvent ? `Check-in for ${selectedEvent.name}` : 'Check-in'}
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
                  setTodaysEvent(event);
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
              <p>Please select an event to continue with check-in.</p>
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

          {/* Banner removed on check-in page per request */}

          {/* QR Scanner Section - only show when an event is selected */}
          <div className="scanner-section" style={{ display: selectedEvent ? 'block' : 'none' }}>
            <h3 className="scanner-title">Scan QR Code to Check-In</h3>
            <div id="reader-container" className="scanner-container" />


            {/* Status Messages */}
            {successMsg && (
              <div className="success-message">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="error-message">
                {errorMsg}
              </div>
            )}

            {/* Register Button */
            }
            <div className="checkin-actions">
              <button
                onClick={() => navigate('/register')}
                className="register-button"
              >
                Register
              </button>
            </div>
            <div style={{
              textAlign: 'center',
              marginTop: '10px',
            }}>
              {selectedEvent && (
                <p style={{
                  color: 'red',
                  fontSize: '0.95rem',
                  margin: '0',
                  fontWeight: '600',
                }}>
                  Register for {selectedEvent.name} if not previously registered, then scan the QR code received via email.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
