import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./CheckinPage.css";
import { IS_IAF } from "./orgToggle";

export default function CheckinPage() {
  const html5QrCodeRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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
    
    fetch("/api/todays-event")
      .then(res => res.json())
      .then(data => {
        console.log('Today\'s event data:', data);
        if (data && data.banner) {
          console.log('Banner path:', data.banner);
          // Test banner image loading
          const bannerImage = new Image();
          bannerImage.onload = () => console.log('Banner image loaded successfully');
          bannerImage.onerror = () => console.error('Banner image failed to load:', data.banner);
          bannerImage.src = data.banner;
        }
        setTodaysEvent(data);
      })
      .catch(error => {
        console.error('Error fetching today\'s event:', error);
      });

    // Fetch all events for banners and newsletter
    fetch("/api/events")
      .then(res => res.json())
      .then(events => {
        console.log('All events data:', events);
        // Determine today's or next event using normalized dates
        const normalize = (d) => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); };
        const todayTs = normalize(new Date());
        const sorted = [...events].sort((a,b) => normalize(a.date) - normalize(b.date));
        const todays = sorted.find(e => normalize(e.date) === todayTs);
        const next = sorted.find(e => normalize(e.date) > todayTs);
        const chosen = todays || next || null; // do not auto-select; keep null by default
        setEvents(sorted);
        // If an eventId is passed via querystring, select it
        try {
          const params = new URLSearchParams(window.location.search);
          const idParam = params.get('eventId');
          if (idParam) {
            const id = Number(idParam);
            const ev = sorted.find(e => Number(e.id) === id) || null;
            if (ev) {
              setSelectedEvent(ev);
            }
          } else {
            setSelectedEvent(null);
          }
        } catch (_) {
          setSelectedEvent(null);
        }
      })
      .catch(error => {
        console.error('Error fetching events:', error);
      });
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
        readerDiv.style.width = '280px';
        readerDiv.style.height = '280px';
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
              { fps: 10, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0 },
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
              }
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
    setSuccessMsg("");
    setErrorMsg("");
    
    try {
      const eventIdToSend = selectedEvent?.id || null;
      console.log('Sending eventId in check-in request:', eventIdToSend);
      const response = await fetch("/api/checkin", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId,
          eventId: eventIdToSend
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMsg(`✅ Successfully scanned! ${data.name} is now checked in.`);
        
        // Restart scanner after 3 seconds
        setTimeout(() => {
          setScanComplete(false);
          setSuccessMsg("");
          
          // Properly stop existing scanner before restarting
          if (html5QrCodeRef.current && isRunning.current) {
            try {
              html5QrCodeRef.current.stop().then(() => {
                isRunning.current = false;
                // Clear container and reinitialize
                const container = document.getElementById("reader-container");
                if (container) {
                  // Remove all existing content
                  container.innerHTML = '';
                  
                  // Remove any existing elements with reader ID
                  const existingReaders = document.querySelectorAll('#reader');
                  existingReaders.forEach(el => el.remove());
                  
                  // Also remove any Html5Qrcode instances
                  const existingScanners = document.querySelectorAll('[data-testid="qr-reader"]');
                  existingScanners.forEach(el => el.remove());
                  
                  const readerDiv = document.createElement("div");
                  readerDiv.id = "reader";
                  readerDiv.style.width = "280px";
                  readerDiv.style.height = "280px";
                  readerDiv.style.margin = "0 auto";
                  readerDiv.style.border = "3px solid #8B1C1C";
                  readerDiv.style.borderRadius = "15px";
                  readerDiv.style.overflow = "hidden";
                  readerDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                  container.appendChild(readerDiv);
                  
                                     // Reinitialize scanner (guard)
                  if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode("reader");
                  }
                  html5QrCodeRef.current.start(
                    { facingMode: "user" },
                    { fps: 10, qrbox: { width: 280, height: 280 } },
                    qrCodeMessage => {
                      if (isProcessingScan.current) { return; }
                      isProcessingScan.current = true;
                      console.log('QR Code detected:', qrCodeMessage);
                      try {
                        const data = JSON.parse(qrCodeMessage);
                        const registrationId = data.registrationId;
                        if (!registrationId) throw new Error("No registrationId in QR code");
                        handleCheckin(registrationId, data.name);
                      } catch (e) {
                        setErrorMsg('❌ Invalid QR code');
                        isProcessingScan.current = false;
                      }
                    },
                    errorMessage => {
                      console.log('Scanner error:', errorMessage);
                    }
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
        if (data.message && (data.message.includes("already checked in") || data.message.includes("already been scanned"))) {
          setErrorMsg(`❌ QR already scanned! This registration has already been checked in.`);
        } else if (data.error && data.error.includes('QR not valid for selected event')) {
          const extra = data.eventName ? ` This QR belongs to ${data.eventName}.` : '';
          setErrorMsg(`❌ QR not valid for the selected event.${extra}`);
        } else if (data.error) {
          setErrorMsg(`❌ ${data.error}`);
        } else {
          setErrorMsg("❌ Check-in failed");
        }
        setScanComplete(false);
          isProcessingScan.current = false;
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setErrorMsg("❌ Network error. Please try again.");
      setScanComplete(false);
        isProcessingScan.current = false;
    }
  }, [scanComplete, selectedEvent]);



  return (
    <div className="checkin-container" style={IS_IAF ? { background: 'linear-gradient(180deg, #9375AD 0%, #BC29C9 100%)' } : undefined}>
      {/* Header Section */}
      {!IS_IAF && (
        <header className="checkin-header">
          <div className="header-content">
            <div className="logo-section">
              <img 
                src="/sai-baba.png" 
                alt="Sai Baba" 
                className="logo-image" 
                onLoad={() => console.log('Logo loaded successfully')}
                onError={(e) => {
                  console.error('Logo failed to load:', e.target.src);
                  e.target.src = process.env.PUBLIC_URL + '/sai-baba.png';
                }}
              />
            </div>
            <div className="org-info">
              A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
            </div>
          </div>
        </header>
      )}

      {/* Navigation Bar */}
      <div className="admin-bar" style={IS_IAF ? { background: '#000' } : undefined}>
        <div className="admin-nav-buttons">
          <button 
            onClick={() => navigate('/')}
            className="admin-button"
            style={IS_IAF ? { background: '#000', color: '#fff', border: '1px solid #fff' } : undefined}
          >
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="checkin-main">
        <div className="checkin-content">
          <h1 className="checkin-title">Check-In</h1>
          <div className="form-group" style={{ maxWidth: '420px', margin: '0 auto 8px' }}>
            <label htmlFor="event" className="form-label">Select Event *</label>
            <select
              id="event"
              name="event"
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                const ev = events.find(evt => Number(evt.id) === id) || null;
                setSelectedEvent(ev);
              }}
              className="form-select"
            >
              <option value="" disabled>Select an event</option>
              {events.map(ev => {
                const datePart = typeof ev.date === 'string' ? ev.date.split('T')[0] : new Date(ev.date).toISOString().split('T')[0];
                const timePart = ev.time && ev.time.length >= 5 ? ev.time : '00:00:00';
                const dt = new Date(`${datePart}T${timePart}`);
                const dateStr = dt.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                const timeStr = ev.time ? dt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                }) : '';
                return (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({dateStr}{timeStr ? ` at ${timeStr}` : ''})
                  </option>
                );
              })}
            </select>
          </div>
          {selectedEvent && (
            <p className="checkin-for-text">Checkin for {selectedEvent.name}</p>
          )}
          
          {/* Event Banner Section - Show only the first event with banner */}
          {selectedEvent && selectedEvent.banner && (
            <div className="event-section">
              <img 
                src={`${selectedEvent.banner}`}
                alt={`${selectedEvent.name} Banner`}
                className="event-banner-img"
                style={{ maxWidth: '100%', width: '450px', height: 'auto', maxHeight: '300px', borderRadius: '12px', objectFit: 'contain' }}
              />
            </div>
          )}



          {/* QR Scanner Section - only show when an event is selected */}
          <div className="scanner-section" style={{ display: selectedEvent ? 'block' : 'none' }}>
            <h3 className="scanner-title" style={IS_IAF ? { color: '#000' } : undefined}>Scan QR Code to Check-In</h3>
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
              marginTop: '10px'
            }}>
              {selectedEvent && (
                <p style={{ 
                  color: 'red', 
                  fontSize: '0.95rem', 
                  margin: '0',
                  fontWeight: '600'
                }}>
                  Register for {selectedEvent.name} if not previously registered, then scan the QR code received via email.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="checkin-footer" style={IS_IAF ? { background: 'transparent' } : undefined}>
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
}
