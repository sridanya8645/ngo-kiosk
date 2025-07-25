import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import './RegisterPage.css';
import registerLottie from './register-lottie.json';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    volunteer: 'No'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [newsletterEvent, setNewsletterEvent] = useState(null);

  useEffect(() => {
    // Fetch the newsletter/general event (same as CheckinPage)
    fetch("http://localhost:5000/api/events")
      .then(res => res.json())
      .then(events => {
        const newsletterEvent = events.find(ev => ev.name === "Register for Newsletter and General Events");
        setNewsletterEvent(newsletterEvent);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, ensure we have the newsletter event or create it
      let eventId = newsletterEvent ? newsletterEvent.id : null;
      
      if (!eventId) {
        // Create the newsletter event if it doesn't exist
        const eventResponse = await fetch('http://localhost:5000/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Register for Newsletter and General Events',
            date: '2024-12-15',
            time: 'All Day',
            location: 'Shirdi Sai Dham Inc, 12 Perrine Road, Monmouth Junction NJ 08852'
          }),
        });
        
        if (eventResponse.ok) {
          const eventData = await eventResponse.json();
          eventId = eventData.event.id;
        }
      }

      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          event_id: eventId,
          interested_to_volunteer: formData.volunteer
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/checkin');
        }, 8000); // Increased to 8 seconds so users can see the success message
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-bg">
      <div className="register-aspect">
        <div className="register-header-centered">
          <img src="/sai baba.png" alt="Logo" className="register-logo" />
          <span className="register-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </div>
        
        {/* Red Navigation Bar - same as CheckinPage */}
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
            onClick={() => navigate('/checkin')}
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
            Check-in
          </button>
        </div>

        {/* Newsletter/General Event Section (dynamic) - same as CheckinPage */}
        {newsletterEvent && (
          <div style={{ margin: '24px 0', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '3rem', color: '#8B1C1C', marginBottom: 24 }}>Register for Newsletter and General Events</div>
            {newsletterEvent.banner && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 32px auto' }}>
                <img src={`http://localhost:5000${newsletterEvent.banner}`} alt="Newsletter Banner" style={{ maxWidth: 500, borderRadius: 18, display: 'block', margin: '0 auto' }} />
              </div>
            )}
          </div>
        )}

        <div className="register-main">
          <div className="register-subtitle">Register Your Details To Win $200 Raffle Tickets</div>
          
          {submitSuccess ? (
            <div className="register-success">
              <div className="success-icon">✅</div>
              <h2>Registration Successful!</h2>
              <p>You have successfully registered for our newsletter and events!</p>
              <p>You will receive a confirmation email shortly with your unique QR code.</p>
              <p>Please check your email and bring the QR code for check-in.</p>
              <div className="success-details">
                <p><strong>Event:</strong> {newsletterEvent ? newsletterEvent.name : 'Register for Newsletter and General Events'}</p>
                <p><strong>Email:</strong> {formData.email}</p>
              </div>
              <button 
                onClick={() => navigate('/checkin')}
                className="success-button"
              >
                Go to Check-in
              </button>
            </div>
          ) : (
            <div className="register-form-container">
              <div className="register-lottie-container">
                <Lottie 
                  animationData={registerLottie} 
                  loop={true}
                  className="register-lottie"
                />
              </div>
              
              <form onSubmit={handleSubmit} className="register-simple-form">
                <div className="form-field">
                  <label htmlFor="name">Full Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="phone">Phone Number:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="Enter your phone number"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>

                <div className="form-field">
                  <label htmlFor="email">Email Address:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter your email address"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-field volunteer-field">
                  <label>Interested to volunteer?</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="volunteer"
                        value="Yes"
                        checked={formData.volunteer === 'Yes'}
                        onChange={handleInputChange}
                      />
                      <span className="radio-custom"></span>
                      Yes
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="volunteer"
                        value="No"
                        checked={formData.volunteer === 'No'}
                        onChange={handleInputChange}
                      />
                      <span className="radio-custom"></span>
                      No
                    </label>
                  </div>
                </div>

                {errors.submit && (
                  <div className="error-banner">
                    {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  className="register-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </button>
              </form>
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

export default RegisterPage; 