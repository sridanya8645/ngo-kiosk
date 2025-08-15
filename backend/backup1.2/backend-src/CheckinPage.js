import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./CheckinPage.css";

export default function CheckinPage() {
  const html5QrCodeRef = useRef(null);
  // Removed unused checkedIn state
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [todaysEvent, setTodaysEvent] = useState(null);
  const [newsletterEvent, setNewsletterEvent] = useState(null);
  const navigate = useNavigate();
  const isRunning = useRef(false);

  useEffect(() => {
    // Debug: Test image loading
    const testImage = new Image();
    testImage.onload = () => console.log('Test image loaded successfully');
    testImage.onerror = () => console.error('Test image failed to load');
    testImage.src = '/sai-baba.png';
    console.log('Testing image path:', '/sai-baba.png');
    
    fetch("http://localhost:5000/api/todays-event")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(events => {
        console.log('Today\'s events data received:', events);
        if (Array.isArray(events) && events.length > 0) {
          setTodaysEvent(events[0]);
        }
      })
      .catch((error) => {
        console.error('Error fetching today\'s events:', error);
        // Don't show error to user, just log it
      });
    // Fetch all events to find the newsletter/general event (always show it)
    fetch("http://localhost:5000/api/events")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(events => {
        console.log('All events data received:', events);
        const newsletterEvent = events.find(ev => ev.name === "Register for Newsletter and General Events");
        setNewsletterEvent(newsletterEvent);
      })
      .catch((error) => {
        console.error('Error fetching all events:', error);
        // Don't show error to user, just log it
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
    readerDiv.style.width = "400px";
    readerDiv.style.height = "400px";
    readerDiv.style.margin = "0 auto";
    readerDiv.style.overflow = "hidden";
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
    };
  }, []);

  const handleCheckin = useCallback(async (registrationId, name) => {
    if (scanComplete) return; // Prevent multiple scans
    
    setScanComplete(true);
    setSuccessMsg("");
    setErrorMsg("");
    
    try {
      const response = await fetch("http://localhost:5000/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ registrationId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccessMsg(`Successfully checked in ${data.name}!`);
        
        // Restart scanner after 3 seconds
        setTimeout(() => {
          setScanComplete(false);
          setSuccessMsg("");
          if (html5QrCodeRef.current && !isRunning.current) {
            html5QrCodeRef.current.start(
              { facingMode: "environment" },
              { fps: 10, qrbox: { width: 600, height: 600 } },
              qrCodeMessage => {
                console.log('QR Code detected:', qrCodeMessage);
                try {
                  const data = JSON.parse(qrCodeMessage);
                  const registrationId = data.registrationId;
                  if (!registrationId) throw new Error("No registrationId in QR code");
                  handleCheckin(registrationId, data.name);
                } catch (e) {
                  setErrorMsg('Invalid QR code');
                }
              },
              errorMessage => {
                console.log('Scanner error:', errorMessage);
              }
            ).then(() => {
              isRunning.current = true;
            }).catch((error) => {
              console.log('Scanner failed to restart:', error);
            });
          }
        }, 3000);
      } else {
        setErrorMsg(data.error || "Check-in failed");
        setScanComplete(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setErrorMsg("Network error. Please try again.");
      setScanComplete(false);
    }
  }, [scanComplete]);

  return (
    <div className="checkin-container">
      {/* Header Section */}
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
                // Try fallback path
                e.target.src = process.env.PUBLIC_URL + '/sai-baba.png';
              }}
            />
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
            onClick={() => navigate('/')}
            className="admin-button"
          >
            Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="checkin-main">
        <div className="checkin-content">
          <h1 className="checkin-title">Check-In</h1>
          
          {/* Today's Event Section */}
          {todaysEvent && (
            <div className="event-section">
              <h2 className="event-title">Checkin {todaysEvent.name}</h2>
              {todaysEvent.banner && (
                <div className="event-banner">
                  <img 
                    src={`http://localhost:5000${todaysEvent.banner}`} 
                    alt="Event Banner" 
                    className="event-banner-img" 
                    onLoad={() => console.log('Event banner loaded successfully')}
                    onError={(e) => console.error('Event banner failed to load:', e.target.src)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Newsletter Event Section */}
          {newsletterEvent && (
            <div className="newsletter-section">
              <h3 className="newsletter-title">Checkin Register for Newsletter and General Events</h3>
              {newsletterEvent.banner && (
                <div className="newsletter-banner">
                  <img 
                    src={`http://localhost:5000${newsletterEvent.banner}`} 
                    alt="Newsletter Banner" 
                    className="newsletter-banner-img" 
                    onLoad={() => console.log('Newsletter banner loaded successfully')}
                    onError={(e) => console.error('Newsletter banner failed to load:', e.target.src)}
                  />
                </div>
              )}
            </div>
          )}

          {/* QR Scanner Section */}
          <div className="scanner-section">
            <h3 className="scanner-title">Scan QR Code to Check-In</h3>
            <div id="reader-container" className="scanner-container"></div>
            
            {/* Status Messages */}
            {successMsg && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {successMsg}
              </div>
            )}
            
            {errorMsg && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {errorMsg}
              </div>
            )}

            {/* Register Button */}
            <div className="checkin-actions">
              <button 
                onClick={() => navigate('/register')}
                className="register-button"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="checkin-footer">
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
  );
}