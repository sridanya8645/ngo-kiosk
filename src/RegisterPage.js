import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    interested_to_volunteer: 'No',
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
        console.error('Error fetching events in RegisterPage:', error);
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
    
    // Validate event selection
    if (events.length > 1 && (!selectedEvent || !selectedEvent.event_id)) {
      newErrors.event = 'Please select an event';
    } else if (events.length === 0) {
      newErrors.event = 'No events available for today';
    } else if (!selectedEvent || !selectedEvent.event_id) {
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
      const eventId = selectedEvent?.event_id || null;
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
          interested_to_volunteer: formData.interested_to_volunteer === 'Yes',
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
            setFormData({ name: '', phone: '', email: '', interested_to_volunteer: 'No' });
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
          Thanks for registering for {selectedEvent?.name || 'the event'}. You have successfully registered and checked in!
        </p>
      </div>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>Redirecting to check-in page in 3 seconds...</p>
    </div>
  );

  // Event change handler
  const handleEventChange = (e) => {
    const eventId = Number(e.target.value);
    const ev = events.find(evt => Number(evt.event_id) === eventId) || null;
    setSelectedEvent(ev);
    if (errors.event) {
      setErrors(prev => ({ ...prev, event: '' }));
    }
  };

  const formatEventDisplay = (ev) => {
    try {
      const datePart = typeof ev.date === 'string' ? ev.date.split('T')[0] : new Date(ev.date).toISOString().split('T')[0];
      const timePart = ev.time && ev.time.length >= 5 ? ev.time : '00:00:00';
      const dateTime = new Date(`${datePart}T${timePart}`);
      const dateStr = dateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = ev.time ? dateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) : '';
      return `${ev.name} (${dateStr}${timeStr ? ` at ${timeStr}` : ''})`;
    } catch (e) {
      return `${ev.name} (${new Date(ev.date).toLocaleDateString('en-US')})`;
    }
  };

  return (
    <div className="register-container">
      <SiteHeader navVariant="home-only" />

      {/* Main Content - Animation and raffle text after title - new deployment trigger */}
      <main className="register-main">
        <div className="register-form-container">
          {/* Heading first */}
          <h1 className="register-title" style={{ color: '#000' }}>
            {selectedEvent ? `Register for ${selectedEvent.name}` : 'Register'}
          </h1>

          {/* Animation and Raffle Text after title */}
          <div className="animation-raffle-section">
            {/* Raffle text */}
            <div className="raffle-text">
              {selectedEvent?.raffle_tickets || 'Register and get a chance to win $200 Raffle ticket!!'}
            </div>

            {/* Lottie Animation */}
            <div className="animation-container">
              <lottie-player
                src="/visa card.json"
                background="transparent"
                speed="1"
                style={{ width: '200px', height: '200px', margin: '0 auto' }}
                loop
                autoplay
              ></lottie-player>
            </div>
          </div>

          {/* Form third - only show if not submitted */}
          {!submitSuccess && (
            <>
              <form onSubmit={handleSubmit} className="register-form">
                {/* Event Selection Dropdown - show only if multiple events */}
                {events.length > 1 && (
                  <div className="form-group">
                    <label htmlFor="event-select" className="form-label">Select Event *</label>
                    <select
                      id="event-select"
                      value={selectedEvent?.event_id || ''}
                      onChange={handleEventChange}
                      className={`form-input ${errors.event ? 'error' : ''}`}
                      required
                    >
                      <option value="">-- Select an event --</option>
                      {events.map((event) => (
                        <option key={event.event_id} value={event.event_id}>
                          {event.name} ({new Date(event.start_datetime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })})
                        </option>
                      ))}
                    </select>
                    {errors.event && <span className="error-message">{errors.event}</span>}
                  </div>
                )}
                
                {/* Show error if no events available */}
                {events.length === 0 && (
                  <div className="form-group">
                    <span className="error-message">No events available for today. Please check back later.</span>
                  </div>
                )}
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

                {/* Volunteer field - only show if event has volunteer enabled */}
                {selectedEvent?.volunteer_enabled && (
                  <div className="form-group">
                    <label className="form-label">Interested in volunteering?</label>
                    <div className="radio-group">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="interested_to_volunteer"
                          value="Yes"
                          checked={formData.interested_to_volunteer === 'Yes'}
                          onChange={handleInputChange}
                        />
                        <span>Yes</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="interested_to_volunteer"
                          value="No"
                          checked={formData.interested_to_volunteer === 'No'}
                          onChange={handleInputChange}
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
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

export default RegisterPage;
