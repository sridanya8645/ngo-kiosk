import React, { useEffect, useState } from "react";
import "./EventDetailsPage.css";
import { useNavigate } from "react-router-dom";

function EventDetailsPage() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    banner: null,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Add state for pseudo-newsletter event
  const [newsletterEvent, setNewsletterEvent] = useState({
    name: 'Register for Temple Newsletter and for General Events',
    date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    time: '-',
    location: '-',
    banner: null,
    editing: false,
    deleted: false,
  });

  // Handler for editing newsletter event
  const handleNewsletterEdit = () => setNewsletterEvent({ ...newsletterEvent, editing: true });
  const handleNewsletterDelete = () => setNewsletterEvent({ ...newsletterEvent, deleted: true });
  const handleNewsletterChange = (e) => {
    const { name, value, files } = e.target;
    setNewsletterEvent({
      ...newsletterEvent,
      [name]: files ? files[0] : value,
    });
  };
  const handleNewsletterSave = () => setNewsletterEvent({ ...newsletterEvent, editing: false });
  const handleNewsletterCancel = () => setNewsletterEvent({ ...newsletterEvent, editing: false });

  // Fetch all events on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then(res => res.json())
      .then(data => setEvents(data));
  }, []);

  // Filtered events
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(filters.name.toLowerCase()) &&
    event.date.includes(filters.date) &&
    event.time.includes(filters.time) &&
    event.location.toLowerCase().includes(filters.location.toLowerCase())
  );

  // Handle add/edit form changes
  const handleInputChange = (e, isEdit = false) => {
    const { name, value, files } = e.target;
    if (isEdit) {
      setEditingEvent({ ...editingEvent, [name]: files ? files[0] : value });
    } else {
      setNewEvent({ ...newEvent, [name]: files ? files[0] : value });
    }
  };

  // Add new event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    const formData = new FormData();
    formData.append("name", newEvent.name);
    formData.append("date", newEvent.date);
    formData.append("time", newEvent.time);
    formData.append("location", newEvent.location);
    if (newEvent.banner) formData.append("banner", newEvent.banner);

    try {
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEvents([...events, data.event]);
        setNewEvent({ name: "", date: "", time: "", location: "", banner: null });
        setMessage("Event added successfully!");
      } else {
        setError(data.error || "Failed to add event.");
      }
    } catch {
      setError("Failed to add event.");
    }
  };

  // Edit event
  const handleEditEvent = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");
    const formData = new FormData();
    formData.append("name", editingEvent.name);
    formData.append("date", editingEvent.date);
    formData.append("time", editingEvent.time);
    formData.append("location", editingEvent.location);
    if (editingEvent.banner) formData.append("banner", editingEvent.banner);

    try {
      const res = await fetch(`http://localhost:5000/api/events/${editingEvent.id}`, {
        method: "PUT",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setEvents(events.map(ev => ev.id === editingEvent.id ? data.event : ev));
        setEditingEvent(null);
        setMessage("Event updated successfully!");
      } else {
        setError(data.error || "Failed to update event.");
      }
    } catch {
      setError("Failed to update event.");
    }
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    const res = await fetch(`http://localhost:5000/api/events/${id}`, { method: "DELETE" });
    if (res.ok) setEvents(events.filter(ev => ev.id !== id));
  };

  // Filter change
  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    // Redirect to admin login page
    navigate("/admin");
  };

  const handleRegistration = () => {
    // Navigate to admin registrations page
    navigate('/admin/registrations');
  };

  const handleAddEventRow = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newEvent.name);
    formData.append("date", newEvent.date);
    formData.append("time", newEvent.time);
    formData.append("location", newEvent.location);
    if (newEvent.banner) formData.append("banner", newEvent.banner);

    const res = await fetch("http://localhost:5000/api/events", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.success) {
      setEvents([...events, data.event]);
      setNewEvent({ name: "", date: "", time: "", location: "", banner: null });
    }
  };

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Helper to get preview URL for File or string
  const getBannerPreview = (banner) => {
    if (!banner) return null;
    if (typeof banner === 'string') return banner;
    if (banner instanceof File) return URL.createObjectURL(banner);
    return null;
  };

  return (
    <div className="event-bg">
      <div className="event-aspect">
        <header className="event-header event-header-centered">
          <img src="/sai baba.png" alt="Sai Logo" className="event-logo" />
          <span className="event-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </header>
        {/* Red Navigation Bar */}
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
            onClick={() => navigate('/admin/registrations')}
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
            Registration Details
          </button>
          <div style={{ width: '2px', height: '30px', background: 'white', margin: '0 10px' }}></div>
          <button
            onClick={() => navigate('/admin/raffle-spin')}
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
            Raffle Spin
          </button>
          <div style={{ width: '2px', height: '30px', background: 'white', margin: '0 10px' }}></div>
          <button
            onClick={() => navigate('/admin/raffle-winners')}
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
            Raffle Winners
          </button>
        </div>
        <main className="event-main">
          <h2 className="event-title">Event Details</h2>
          {message && <div style={{ color: "green", fontWeight: "bold", margin: "10px 0" }}>{message}</div>}
          {error && <div style={{ color: "red", fontWeight: "bold", margin: "10px 0" }}>{error}</div>}
          <div className="event-table-container">
            <table className="event-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Banner</th>
                  <th>Raffle Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* New Event Row */}
                <tr>
                  <td>
                    <input
                      name="name"
                      placeholder="Event Name"
                      value={newEvent.name}
                      onChange={handleInputChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      name="date"
                      type="date"
                      value={newEvent.date}
                      onChange={handleInputChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      name="time"
                      type="time"
                      value={newEvent.time}
                      onChange={handleInputChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      name="location"
                      placeholder="Location"
                      value={newEvent.location}
                      onChange={handleInputChange}
                      required
                    />
                  </td>
                  <td>
                    <input
                      name="banner"
                      type="file"
                      accept="image/*"
                      onChange={handleInputChange}
                    />
                    {newEvent.banner && (
                      <img src={getBannerPreview(newEvent.banner)} alt="banner preview" width={60} style={{ marginTop: 4 }} />
                    )}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#b85c00', fontSize: '1.5rem' }}>
                    Register your details to win $200 raffle ticket
                  </td>
                  <td>
                    <button className="event-add-btn" onClick={handleAddEventRow}>Add Event</button>
                  </td>
                </tr>
                {/* Only render real events from the database */}
                {events.map(ev => (
                  editingEvent && editingEvent.id === ev.id ? (
                    <tr key={ev.id}>
                      <td>
                        <input
                          value={editingEvent.name}
                          onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={editingEvent.date}
                          onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          value={editingEvent.time}
                          onChange={e => setEditingEvent({ ...editingEvent, time: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          value={editingEvent.location}
                          onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="file"
                          name="banner"
                          onChange={e => setEditingEvent({ ...editingEvent, banner: e.target.files[0] })}
                        />
                        {editingEvent.banner && (
                          <img src={getBannerPreview(editingEvent.banner)} alt="banner preview" width={60} style={{ marginTop: 4 }} />
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#b85c00', fontSize: '1.5rem' }}>Register your details to win $200 raffle ticket</td>
                      <td>
                        <button onClick={handleEditEvent}>Save</button>
                        <button onClick={() => setEditingEvent(null)}>Cancel</button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={ev.id}>
                      <td>{ev.name}</td>
                      <td>{ev.date}</td>
                      <td>{ev.time}</td>
                      <td>{ev.location}</td>
                      <td>{ev.banner && <img src={`http://localhost:5000${ev.banner}`} alt="banner" width={60} />}</td>
                      <td style={{ fontWeight: 'bold', color: '#b85c00', fontSize: '1.5rem' }}>Register your details to win $200 raffle ticket</td>
                      <td>
                        <button onClick={() => setEditingEvent(ev)}>Edit</button>
                        <button onClick={() => handleDeleteEvent(ev.id)}>Delete</button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
          <button className="event-logout-btn" onClick={handleLogout}>Logout</button>
        </main>
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

export default EventDetailsPage;
