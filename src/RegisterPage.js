import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';

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
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Monitor submitSuccess state changes
  useEffect(() => {
    console.log('🔄 submitSuccess state changed to:', submitSuccess);
  }, [submitSuccess]);

  useEffect(() => {
    // Fetch all events (same as CheckinPage)
    fetch("/api/events")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(events => {
        console.log('Events data received in RegisterPage:', events);
        const normalize = (d) => { const dt = new Date(d); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); };
        const todayTs = normalize(new Date());
        const sorted = [...events].sort((a,b) => normalize(a.date) - normalize(b.date));
        const todays = sorted.find(e => normalize(e.date) === todayTs);
        const next = sorted.find(e => normalize(e.date) > todayTs);
        const chosen = todays || next || sorted[0] || null;
        setSelectedEvent(chosen);
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
    return Object.keys(newErrors).length === 0; // true when valid
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Form submission started');
    console.log('📝 Form data:', formData);
    
    // Validate form and block submit when invalid
    const isValid = validateForm();
    if (!isValid) {
      console.log('❌ Validation errors – submission blocked');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🌐 Sending registration request...');
      
      // Choose the selectedEvent determined on mount
      let eventId = selectedEvent?.id || null;
      if (!eventId) {
        console.error('No events found');
        setErrors({ submit: 'No events available for registration.' });
        return;
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          eventId: eventId,
          interested_to_volunteer: formData.volunteer === 'Yes'
        })
      });

      console.log('📡 Registration response status:', response.status);
      console.log('📡 Registration response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('📡 Registration response data:', responseData);
        
        if (responseData.success) {
          console.log('✅ Registration successful! Setting submitSuccess to true');
          setSubmitSuccess(true);
          console.log('✅ submitSuccess state should now be true');
          setTimeout(() => {
            console.log('🔄 Redirecting to home page...');
            navigate('/');
          }, 5000);
        } else {
          console.error('❌ Registration failed:', responseData.message);
          setErrors({ submit: responseData.message || 'Registration failed. Please try again.' });
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Registration error:', errorData);
        setErrors({ submit: errorData.message || 'Registration failed. Please try again.' });
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      console.log('🏁 Form submission finished');
      setIsSubmitting(false);
    }
  };

  // Success message component
  const SuccessMessage = () => (
    <div className="registration-success" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid #28a745',
      borderRadius: '15px',
      padding: '20px',
      textAlign: 'center',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      maxWidth: '90%',
      width: '400px',
      display: 'block !important',
      visibility: 'visible !important',
      opacity: '1 !important'
    }}>
      <div className="success-icon">✅</div>
      <h2 className="success-title">Registration Successful!</h2>
      <p className="success-message">
        Thank you for registering with Shirdi Sai Dham. You will receive an email with your QR code for check-in shortly.
      </p>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Redirecting to home page in 5 seconds...</p>
    </div>
  );

  // Get the event name to display
  const getEventName = () => selectedEvent?.name || 'Newsletter and General Events';

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
          {/* Heading first */}
          <h1 className="register-title">
            Register for {getEventName()}
          </h1>
          
          {/* Raffle text directly below title */}
          <div style={{ 
            textAlign: 'center', 
            margin: '8px 0 12px 0',
            color: '#8B1C1C',
            fontSize: '1.3rem',
            fontWeight: 'bold'
          }}>
            Register and get a chance to win $200 Raffle ticket!!
          </div>
          
          {/* Form third - only show if not submitted */}
          {!submitSuccess && (
            <>
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
                    required
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
                    pattern="^(\+1[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$"
                    title="Enter a valid US phone number (e.g., 555-123-4567)"
                    required
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
                    required
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
            </>
          )}
          
          {/* Show success message when submitted */}
          {submitSuccess && (
            <>
              {console.log('🎉 Success message should be rendering!')}
              <SuccessMessage />
            </>
          )}
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
