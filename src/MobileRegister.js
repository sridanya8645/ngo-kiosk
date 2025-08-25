import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MobileRegister.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const MobileRegister = () => {
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
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Monitor submitSuccess state changes
  useEffect(() => {
    console.log('🔄 submitSuccess state changed to:', submitSuccess);
  }, [submitSuccess]);

  useEffect(() => {
    (async () => {
      try {
        // Helper to parse YYYY-MM-DD from string or date-like without timezone shifts
        const parseLocalYMD = (val) => {
          if (!val) return null;
          try {
            const str = typeof val === 'string' ? val.split('T')[0] : new Date(val).toISOString().split('T')[0];
            const [y, m, d] = str.split('-').map(Number);
            return new Date(y, m - 1, d);
          } catch (_) { return null; }
        };

        // Try dedicated endpoint first (considers end_date on backend) and prevent caching
        const te = await fetch('/api/todays-event', { cache: 'no-store' });
        if (te.ok) {
          const ev = await te.json();
          if (ev && ev.id) {
            setSelectedEvent(ev);
          }
        }

        // Always fetch full list to keep data fresh and have fallback
        const res = await fetch('/api/events', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const events = await res.json();

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const withDates = (events || []).map(e => ({
          ...e,
          _start: parseLocalYMD(e.start_datetime),
          _end: parseLocalYMD(e.end_datetime) || parseLocalYMD(e.start_datetime),
        }));

        const sorted = withDates.sort((a,b) => (a._start?.getTime?.()||0) - (b._start?.getTime?.()||0));
        const isTodayInRange = (e) => e._start && e._end && e._start.getTime() <= today.getTime() && today.getTime() <= e._end.getTime();
        let todays = sorted.find(isTodayInRange) || null;
        if (!todays) {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const key = (v) => (typeof v === 'string' ? v.split('T')[0] : new Date(v).toISOString().split('T')[0]);
          todays = sorted.find(e => key(e.start_datetime) === todayStr || key(e.end_datetime || e.start_datetime) === todayStr) || null;
        }

        setEvents(sorted);
        // If dedicated endpoint didn't return, pick from computed
        setSelectedEvent(prev => prev && prev.id ? prev : todays);
      } catch (error) {
        console.error('Error fetching events in MobileRegister:', error);
      }
    })();
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
    if (!selectedEvent || !selectedEvent.id) {
      newErrors.event = 'Event not available for today';
    }
    
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
      
      // Use the auto-selected event for today
      let eventId = selectedEvent?.id || null;
      if (!eventId) {
        console.error('No events found');
        setErrors({ submit: 'No events available for registration.' });
        return;
      }

      const response = await fetch('/api/mobile-register', {
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
          console.log('✅ Registration successful! Showing message and resetting form for next person');
          setSubmitSuccess(true);
          setTimeout(async () => {
            setSubmitSuccess(false);
            setFormData({ name: '', phone: '', email: '', volunteer: 'No' });
            try {
              const r = await fetch('/api/todays-event');
              if (r.ok) {
                const ev = await r.json();
                if (ev && ev.id) setSelectedEvent(ev);
              }
            } catch (_) {}
          }, 3000);
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

  const handleCancel = () => {
    // Reset form data instead of navigating to home
    setFormData({ name: '', phone: '', email: '', volunteer: 'No' });
    setErrors({});
    setIsSubmitting(false);
    setSubmitSuccess(false);
  };

  // Success message component
  const SuccessMessage = () => (
    <div className="mobile-registration-success" style={{
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
        Thanks for registering for Indo American Fair 2025. You will receive an email with your QR code for check-in shortly.
      </p>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Redirecting to check-in page in 3 seconds...</p>
    </div>
  );

  return (
    <div className="mobile-register-container">
      <SiteHeader navVariant="none" />

      {/* Main Content */}
      <main className="mobile-register-main">
        <div className="mobile-register-form-container">
          {/* Heading first */}
          <h1 className="mobile-register-title" style={{ color: '#000' }}>
            {selectedEvent ? `Register for ${selectedEvent.name}` : 'Register'}
          </h1>
          
          {/* Raffle text directly below title */}
          <div style={{ 
            textAlign: 'center', 
            margin: '6px 0 10px 0',
            color: '#8B1C1C',
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Register and get a chance to win $200 Raffle ticket!!
          </div>
          
          {/* Form third - only show if not submitted */}
          {!submitSuccess && (
            <>
              <form onSubmit={handleSubmit} className="mobile-register-form">
                {/* Event is auto-selected for today; selector removed */}
                {errors.event && <span className="error-message">{errors.event}</span>}
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

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
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
              <div className="success-message">
                <h2>Registration Successful!</h2>
                <p>Thank you for registering for {selectedEvent?.name || 'the event'}.</p>
                <p>You will receive a confirmation email with your QR code shortly.</p>
                <p>Please scan the QR code at the kiosk during check-in.</p>
              </div>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default MobileRegister;
