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
    volunteer: 'No',
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
        // Fetch today's events (multiple events for the same day)
        const te = await fetch('/api/todays-events', { cache: 'no-store' });
        if (te.ok) {
          const events = await te.json();
          if (events && events.length > 0) {
            setEvents(events);
            // Auto-select the first event if only one event
            if (events.length === 1) {
              setSelectedEvent(events[0]);
            }
          }
        }

        // Fallback: fetch all events if today's events endpoint fails
        if (events.length === 0) {
          const res = await fetch('/api/events', { cache: 'no-store' });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const allEvents = await res.json();

          // Helper to parse YYYY-MM-DD from string or date-like without timezone shifts
          const parseLocalYMD = (val) => {
            if (!val) return null;
            try {
              const str = typeof val === 'string' ? val.split('T')[0] : new Date(val).toISOString().split('T')[0];
              const [y, m, d] = str.split('-').map(Number);
              return new Date(y, m - 1, d);
            } catch (_) { return null; }
          };

          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          const withDates = (allEvents || []).map(e => ({
            ...e,
            _start: parseLocalYMD(e.start_datetime),
            _end: parseLocalYMD(e.end_datetime) || parseLocalYMD(e.start_datetime),
          }));

          const sorted = withDates.sort((a,b) => (a._start?.getTime?.() || 0) - (b._start?.getTime?.() || 0));
          const isTodayInRange = (e) => e._start && e._end && e._start.getTime() <= today.getTime() && today.getTime() <= e._end.getTime();
          const todaysEvents = sorted.filter(isTodayInRange);
          
          if (todaysEvents.length > 0) {
            setEvents(todaysEvents);
            if (todaysEvents.length === 1) {
              setSelectedEvent(todaysEvents[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching events in MobileRegister:', error);
      }
    })();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Check if event is selected (required when multiple events or no events)
    if (!selectedEvent || !selectedEvent.event_id) {
      if (events.length > 1) {
        newErrors.event = 'Please select an event to continue';
      } else {
        newErrors.event = 'Event not available for today';
      }
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
      const eventId = selectedEvent?.event_id || null;
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
          interested_to_volunteer: formData.volunteer === 'Yes',
        }),
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
                if (ev && ev.event_id) setSelectedEvent(ev);
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
      opacity: '1 !important',
    }}>
      <div className="success-icon">✅</div>
      <h2 className="success-title">Registration Successful!</h2>
      <div style={{
        background: '#d4edda',
        border: '1px solid #c3e6cb',
        borderRadius: '8px',
        padding: '15px',
        margin: '15px 0',
        color: '#155724',
      }}>
        <p className="success-message" style={{ margin: 0, color: '#155724' }}>
          Thanks for registering for {selectedEvent?.name || 'the event'}. You will receive an email with your QR code for check-in shortly.
        </p>
      </div>
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

          {/* Event Selection Dropdown */}
          {events.length > 1 && (
            <div className="event-selection-container" style={{
              margin: '15px 0',
              textAlign: 'center'
            }}>
              <label htmlFor="event-select" style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#333'
              }}>Select Event:</label>
              <select
                id="event-select"
                value={selectedEvent ? selectedEvent.event_id : ''}
                onChange={(e) => {
                  const event = events.find(ev => ev.event_id === parseInt(e.target.value));
                  setSelectedEvent(event);
                }}
                style={{
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  fontSize: '1rem',
                  minWidth: '250px',
                  backgroundColor: '#fff'
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
              margin: '15px 0',
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              color: '#856404'
            }}>
              <p>Please select an event to continue with registration.</p>
            </div>
          )}

          {/* Show message if no events available */}
          {(!selectedEvent && events.length <= 1) && (
            <div style={{
              textAlign: 'center',
              margin: '15px 0',
              padding: '15px',
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '8px',
              color: '#721c24'
            }}>
              <p>No events available for today.</p>
            </div>
          )}

          {/* Raffle text directly below title */}
          {selectedEvent && (
            <div style={{
              textAlign: 'center',
              margin: '6px 0 10px 0',
              color: '#8B1C1C',
              fontSize: '1rem',
              fontWeight: '600',
            }}>
              {selectedEvent?.raffle_tickets || 'Register and get a chance to win $200 Raffle ticket!!'}
            </div>
          )}

          {/* Form third - only show if not submitted and event is selected */}
          {!submitSuccess && selectedEvent && (
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

                {/* Volunteer question - only show if enabled for the event */}
                {selectedEvent?.volunteer_enabled && (
                  <div className="form-group">
                    <label className="form-label">Interested in volunteering?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="volunteer"
                          value="Yes"
                          checked={formData.volunteer === 'Yes'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-text">Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="volunteer"
                          value="No"
                          checked={formData.volunteer === 'No'}
                          onChange={handleInputChange}
                        />
                        <span className="radio-text">No</span>
                      </label>
                    </div>
                  </div>
                )}

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
              <SuccessMessage />
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default MobileRegister;
