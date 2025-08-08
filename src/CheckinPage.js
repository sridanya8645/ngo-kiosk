import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import "./CheckinPage.css";

export default function CheckinPage() {
  const html5QrCodeRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scanComplete, setScanComplete] = useState(false);
  const [todaysEvent, setTodaysEvent] = useState(null);
  const [newsletterEvent, setNewsletterEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);

  const navigate = useNavigate();
  const isRunning = useRef(false);

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
        
        // Set all events for banner display
        setAllEvents(events);
        

      })
      .catch(error => {
        console.error('Error fetching events:', error);
      });
  }, []);

  useEffect(() => {
    // Single QR scanner initialization
    const initScanner = () => {
      // Clear any existing scanner
      if (html5QrCodeRef.current && isRunning.current) {
        try {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current = null;
            isRunning.current = false;
          }).catch(() => {
            html5QrCodeRef.current = null;
            isRunning.current = false;
          });
        } catch (error) {
          console.log('Error stopping existing scanner:', error);
          html5QrCodeRef.current = null;
          isRunning.current = false;
        }
      }

      // Clear container completely
      const container = document.getElementById("reader-container");
      if (container) {
        container.innerHTML = '';
        // Remove any existing elements
        const existingReaders = container.querySelectorAll('#reader');
        existingReaders.forEach(el => el.remove());
      }

      // Create single reader div
      const readerDiv = document.createElement("div");
      readerDiv.id = "reader";
      readerDiv.style.width = "280px";
      readerDiv.style.height = "280px";
      readerDiv.style.margin = "0 auto";
      readerDiv.style.border = "3px solid #8B1C1C";
      readerDiv.style.borderRadius = "15px";
      readerDiv.style.overflow = "hidden";
      readerDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      
      if (container) {
        container.appendChild(readerDiv);
        console.log('Single QR Scanner container created');
      }

      // Initialize single scanner
      try {
        html5QrCodeRef.current = new Html5Qrcode("reader");
        console.log('Single QR Scanner initialized');
        
        // Start scanner with front camera
        html5QrCodeRef.current
          .start(
            { facingMode: "user" }, // Use front camera
            { 
              fps: 10, 
              qrbox: { width: 280, height: 280 },
              aspectRatio: 1.0
            },
            qrCodeMessage => {
              console.log('QR Code detected:', qrCodeMessage);
              try {
                const data = JSON.parse(qrCodeMessage);
                const registrationId = data.registrationId;
                if (!registrationId) throw new Error("No registrationId in QR code");

                // Call the check-in endpoint
                handleCheckin(registrationId, data.name);
              } catch (e) {
                console.error('QR code parsing error:', e);
                setErrorMsg('Invalid QR code format');
              }
            },
            errorMessage => {
              console.log('Scanner error:', errorMessage);
              // Don't show error for normal scanning process
            }
          )
          .then(() => {
            isRunning.current = true;
            console.log('Single scanner started successfully');
            setErrorMsg(''); // Clear any previous errors
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
    };

    // Call initScanner after a delay
    setTimeout(initScanner, 500);

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
    console.log('Handling check-in for:', registrationId, name);
    
    setScanComplete(true);
    setSuccessMsg("");
    setErrorMsg("");
    
    try {
      const response = await fetch("/api/checkin", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: registrationId
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
                  container.innerHTML = '';
                  // Remove any existing elements
                  const existingReaders = container.querySelectorAll('#reader');
                  existingReaders.forEach(el => el.remove());
                  
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
                  
                  // Reinitialize scanner
                  html5QrCodeRef.current = new Html5Qrcode("reader");
                  html5QrCodeRef.current.start(
                    { facingMode: "user" },
                    { fps: 10, qrbox: { width: 280, height: 280 } },
                    qrCodeMessage => {
                      console.log('QR Code detected:', qrCodeMessage);
                      try {
                        const data = JSON.parse(qrCodeMessage);
                        const registrationId = data.registrationId;
                        if (!registrationId) throw new Error("No registrationId in QR code");
                        handleCheckin(registrationId, data.name);
                      } catch (e) {
                        setErrorMsg('❌ Invalid QR code');
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
        } else if (data.error) {
          setErrorMsg(`❌ ${data.error}`);
        } else {
          setErrorMsg("❌ Check-in failed");
        }
        setScanComplete(false);
      }
    } catch (error) {
      console.error("Check-in error:", error);
      setErrorMsg("❌ Network error. Please try again.");
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
          {allEvents.filter(event => event.banner).length > 0 && (
            <p className="checkin-for-text">
              Checkin for {allEvents.filter(event => event.banner)[0].name}
            </p>
          )}
          
          {/* Event Banner Section - Show only the first event with banner */}
          {allEvents.filter(event => event.banner).length > 0 && (
            <div className="event-section">
              <img 
                src={`${allEvents.filter(event => event.banner)[0].banner}`}
                alt={`${allEvents.filter(event => event.banner)[0].name} Banner`}
                className="event-banner"
                onLoad={() => console.log(`Event banner loaded successfully: ${allEvents.filter(event => event.banner)[0].name} - ${allEvents.filter(event => event.banner)[0].banner}`)}
                onError={(e) => {
                  console.error(`Event banner failed to load: ${allEvents.filter(event => event.banner)[0].name} - ${allEvents.filter(event => event.banner)[0].banner}`);
                  console.error('Error details:', e);
                }}
              />
            </div>
          )}



          {/* QR Scanner Section */}
          <div className="scanner-section">
            <h3 className="scanner-title">Scan QR Code to Check-In</h3>
            <div id="reader-container" className="scanner-container"></div>
            

            
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

            {/* Register Button */}
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
              <p style={{ 
                color: 'red', 
                fontSize: '0.9rem', 
                margin: '0',
                fontWeight: '500'
              }}>
                Register For {allEvents.filter(event => event.banner).length > 0 ? allEvents.filter(event => event.banner)[0].name : 'Events'} if not previously registered
              </p>
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
