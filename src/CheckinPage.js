import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./CheckinPage.css";

export default function CheckinPage() {
  const html5QrCodeRef = useRef(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [todaysEvent, setTodaysEvent] = useState(null);
  const [newsletterEvent, setNewsletterEvent] = useState(null);
  const navigate = useNavigate();
  const isRunning = useRef(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/todays-event")
      .then(res => res.json())
      .then(events => {
        if (Array.isArray(events) && events.length > 0) {
          setTodaysEvent(events[0]);
        }
      });
    // Fetch all events to find the newsletter/general event (always show it)
    fetch("http://localhost:5000/api/events")
      .then(res => res.json())
      .then(events => {
        const newsletterEvent = events.find(ev => ev.name === "Register for Newsletter and General Events");
        setNewsletterEvent(newsletterEvent);
      });
  }, []);

  useEffect(() => {
    // Remove any existing #reader element
    const oldReader = document.getElementById("reader");
    if (oldReader && oldReader.parentNode) {
      oldReader.parentNode.removeChild(oldReader);
    }

    // Create a new #reader element
    const readerDiv = document.createElement("div");
    readerDiv.id = "reader";
    readerDiv.style.width = "600px";
    readerDiv.style.height = "600px";
    const container = document.getElementById("reader-container");
    if (container) {
      container.appendChild(readerDiv);
    }

    html5QrCodeRef.current = new Html5Qrcode("reader");
    html5QrCodeRef.current
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 600, height: 600 } },
        qrCodeMessage => {
          console.log('QR Code detected:', qrCodeMessage); // Simple debug log
          try {
            const data = JSON.parse(qrCodeMessage);
            const registrationId = data.registrationId;
            if (!registrationId) throw new Error("No registrationId in QR code");

            // Call the check-in endpoint
            handleCheckin(registrationId, data.name);
          } catch (e) {
            setCheckedIn(false);
            setErrorMsg('Invalid QR code');
          }
        },
        errorMessage => {
          console.log('Scanner error:', errorMessage); // Log scanner errors
        }
      )
      .then(() => {
        isRunning.current = true;
        console.log('Scanner started successfully'); // Debug log
      })
      .catch((error) => {
        isRunning.current = false;
        console.log('Scanner failed to start:', error); // Debug log
      });

    return () => {
      if (html5QrCodeRef.current && isRunning.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            if (html5QrCodeRef.current && typeof html5QrCodeRef.current.clear === "function") {
              html5QrCodeRef.current.clear().catch(() => {});
            }
            isRunning.current = false;
            html5QrCodeRef.current = null;
          }).catch(() => {
            isRunning.current = false;
            html5QrCodeRef.current = null;
          });
        } catch (error) {
          console.log('Error stopping scanner:', error);
          isRunning.current = false;
          html5QrCodeRef.current = null;
        }
      }
      // Remove the #reader element on unmount
      const reader = document.getElementById("reader");
      if (reader && reader.parentNode) {
        reader.parentNode.removeChild(reader);
      }
    };
    // eslint-disable-next-line
  }, [navigate]);



  const handleCheckin = async (registrationId, name) => {
    if (checkedIn || scanComplete) return; // Prevent double check-in
    setScanComplete(true); // Mark scan as complete
    // Stop the QR scanner
    if (html5QrCodeRef.current && isRunning.current) {
      try { 
        await html5QrCodeRef.current.stop(); 
        isRunning.current = false;
      } catch (e) {
        console.log('Error stopping scanner during checkin:', e);
        isRunning.current = false;
      }
    }
    try {
      const response = await fetch(`http://localhost:5000/api/registrations/${registrationId}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      setSuccessMsg("");
      setErrorMsg("");
      if (data.success) {
        setCheckedIn(true);
        setSuccessMsg('You have successfully checked in!');
        // Redirect to home page after 5 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      } else if (data.error === 'Already scanned') {
        setCheckedIn(false);
        setErrorMsg('QR code already scanned.');
        // Redirect to home page after 5 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      } else {
        setCheckedIn(false);
        setErrorMsg(data.error || 'Check-in failed.');
        // Redirect to home page after 5 seconds
        setTimeout(() => {
          navigate('/');
        }, 5000);
      }
    } catch (err) {
      setCheckedIn(false);
      setSuccessMsg("");
      setErrorMsg('Error connecting to server.');
      // Redirect to home page after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);
    }
  };

  return (
    <div className="checkin-bg">
      <div className="checkin-aspect">
        <div className="checkin-header-centered">
          <img src="/sai baba.png" alt="Logo" className="checkin-logo" />
          <span className="event-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </div>
        {/* Action Buttons Toolbar */}
        <div style={{
          width: '100%',
          background: '#8B1C1C',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 0 8px 0',
          padding: '8px 0',
          gap: 0
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '2rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Home
          </button>
        </div>


        <div className="checkin-main">
          {todaysEvent && (
            <>
              <div className="checkin-welcome-msg">Welcome to {todaysEvent.name}</div>
            </>
          )}
          
          <div className="checkin-title" style={{ color: '#8B1C1C' }}>Check-in for Newsletter and General Events</div>
          <div className="checkin-title" style={{ color: '#8B1C1C' }}>Scan your QR code here</div>
          
          <div className="checkin-qr-scanner">
            <div id="reader-container"></div>
          </div>
          
          {/* Success/Error Messages */}
          {scanComplete && checkedIn && successMsg && !errorMsg && (
            <div style={{ 
              color: "green", 
              fontWeight: "bold", 
              fontSize: "3rem", 
              marginTop: "20px",
              textAlign: "center"
            }}>
              {successMsg}
            </div>
          )}
          {scanComplete && !checkedIn && errorMsg && (
            <div style={{ 
              color: "red", 
              fontWeight: "bold", 
              fontSize: "3rem", 
              marginTop: "20px",
              textAlign: "center"
            }}>
              {errorMsg}
            </div>
          )}
          
          {/* Registration Message in Red Box */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '30px',
            padding: '20px',
            background: '#8B1C1C',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '3px solid #6B0F0F'
          }}>
            <div style={{ 
              fontSize: '2rem', 
               
              color: 'white', 
              marginBottom: '20px' 
            }}>
              If not registered previously, register and check-in
            </div>
          </div>
          
          {/* Register Button Separately */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '20px'
          }}>
            <button 
              onClick={() => navigate('/register')}
              style={{
                background: '#8B1C1C',
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '3rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#6B0F0F';
                e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#8B1C1C';
                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
              }}
            >
              Register
            </button>
          </div>


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
}