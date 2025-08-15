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
    fetch("https://ngo-kiosk-app.azurewebsites.net/api/events")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(events => {
        console.log('Events data received in RegisterPage:', events);
        const newsletterEvent = events.find(ev => ev.name === "Register for Newsletter and General Events");
        setNewsletterEvent(newsletterEvent);
      })
      .catch((error) => {
        console.error('Error fetching events in RegisterPage:', error);
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
      // Use the newsletter event ID if available
      let eventId = newsletterEvent ? newsletterEvent.id : null;
      console.log('Initial eventId:', eventId);
      
      if (!eventId) {
        console.log('No newsletter event found, using first available event');
        // If no newsletter event found, use the first event available
        const eventsResponse = await fetch('https://ngo-kiosk-app.azurewebsites.net/api/events');
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          if (events.length > 0) {
            eventId = events[0].id;
            console.log('Using first event with ID:', eventId);
          } else {
            console.error('No events found');
            setErrors({ submit: 'No events available for registration.' });
            return;
          }
        } else {
          console.error('Failed to fetch events');
          setErrors({ submit: 'Failed to fetch events. Please try again.' });
          return;
        }
      }

      // Now register the user
      const requestBody = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        eventId: eventId,
        interested_to_volunteer: formData.volunteer
      };
      console.log('Sending registration request:', requestBody);
      
      const response = await fetch('https://ngo-kiosk-app.azurewebsites.net/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Registration response status:', response.status);
      console.log('Registration response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Registration response data:', responseData);
        setSubmitSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        const errorData = await response.json();
        console.error('Registration error:', errorData);
        setErrors({ submit: errorData.error || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success message component
  const SuccessMessage = () => (
    <div className="success-message-container">
      <div className="success-icon">✅</div>
      <h2 className="success-title">Registration Successful!</h2>
      <p className="success-message">
        Thank you for registering with Shirdi Sai Dham. You will receive an email with your QR code for check-in shortly.
      </p>
      <p className="redirect-message">Redirecting to home page...</p>
    </div>
  );

  return (
    <div className="register-container">
      {/* Header Section */}
      <header className="register-header">
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



      {/* Main Content */}
      <main className="register-main">
        <div className="register-form-container">
          <div className="lottie-container">
            <Lottie animationData={registerLottie} style={{ width: 200, height: 200 }} />
          </div>
          <h1 className="register-title">
            Register for {newsletterEvent ? newsletterEvent.name : 'Newsletter and General Events'}
          </h1>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="Enter your phone number"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="volunteer" className="form-label">Interested in Volunteering?</label>
              <select
                id="volunteer"
                name="volunteer"
                value={formData.volunteer}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="cancel-button"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
          
          {/* Show success message below the form */}
          {submitSuccess && <SuccessMessage />}
        </div>
      </main>

      {/* Footer */}
      <footer className="register-footer">
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
};

export default RegisterPage; 