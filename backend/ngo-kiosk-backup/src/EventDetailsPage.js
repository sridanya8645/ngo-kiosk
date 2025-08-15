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
    deleted: localStorage.getItem('newsletterEventDeleted') === 'true',
  });

  // Handler for editing newsletter event
  const handleNewsletterEdit = () => {
    console.log('Newsletter edit button clicked');
    setNewsletterEvent({ ...newsletterEvent, editing: true });
  };
  const handleNewsletterDelete = async () => {
    if (window.confirm("Are you sure you want to delete the newsletter event?")) {
      try {
        // Find the newsletter event in the database
        const newsletterEventFromDB = events.find(ev => ev.name === newsletterEvent.name);
        if (newsletterEventFromDB) {
          const res = await fetch(`http://localhost:5000/api/events/${newsletterEventFromDB.id}`, { method: "DELETE" });
          
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          
          const data = await res.json();
          if (data.success) {
            setNewsletterEvent({ ...newsletterEvent, deleted: true });
            setEvents(events.filter(event => event.id !== newsletterEventFromDB.id));
            setMessage("Newsletter event deleted successfully!");
          } else {
            setError(data.error || "Failed to delete newsletter event.");
          }
        } else {
          setNewsletterEvent({ ...newsletterEvent, deleted: true });
          localStorage.setItem('newsletterEventDeleted', 'true');
          setMessage("Newsletter event removed from display.");
        }
      } catch (error) {
        console.error('Error deleting newsletter event:', error);
        setError("Failed to delete newsletter event.");
      }
    }
  };
  const handleNewsletterChange = (e) => {
    const { name, value, files } = e.target;
    setNewsletterEvent({
      ...newsletterEvent,
      [name]: files ? files[0] : value,
    });
  };
  const handleNewsletterSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", newsletterEvent.name);
      formData.append("date", newsletterEvent.date);
      formData.append("time", newsletterEvent.time);
      formData.append("location", newsletterEvent.location);
      if (newsletterEvent.banner) formData.append("banner", newsletterEvent.banner);

      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setNewsletterEvent({ ...newsletterEvent, editing: false });
        setMessage("Newsletter event updated successfully!");
      } else {
        setError(data.error || "Failed to update newsletter event.");
      }
    } catch (error) {
      console.error('Error updating newsletter event:', error);
      setError("Failed to update newsletter event.");
    }
  };
  
  const handleNewsletterCancel = () => setNewsletterEvent({ ...newsletterEvent, editing: false });
  
  const handleRestoreNewsletter = () => {
    setNewsletterEvent({ ...newsletterEvent, deleted: false });
    localStorage.removeItem('newsletterEventDeleted');
    setMessage("Newsletter event restored.");
  };

  // Fetch all events on mount
  useEffect(() => {
    console.log('Fetching events...');
    fetch("http://localhost:5000/api/events")
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Events data received:', data);
        setEvents(data);
        setError(""); // Clear any previous errors
      })
      .catch((error) => {
        console.error('Error fetching events:', error);
        // Don't show error message for initial load, just log it
        console.log('Events will be loaded when backend is available');
      });
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
    console.log('Add Event button clicked!');
    console.log('Current newEvent state:', newEvent);
    setMessage(""); setError("");
    
    // Validate required fields
    if (!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location) {
      console.log('Validation failed - missing fields');
      setError("Please fill in all required fields (Event Name, Date, Time, Location).");
      return;
    }
    
    const formData = new FormData();
    formData.append("name", newEvent.name);
    formData.append("date", newEvent.date);
    formData.append("time", newEvent.time);
    formData.append("location", newEvent.location);
    if (newEvent.banner) formData.append("banner", newEvent.banner);

    try {
      console.log('Making API call to http://localhost:5000/api/events');
      const res = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        body: formData,
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('API response:', data);
      
      if (data.success) {
        setEvents([...events, data.event]);
        setNewEvent({ name: "", date: "", time: "", location: "", banner: null });
        setMessage("Event added successfully!");
        setError(""); // Clear any previous errors
      } else {
        setError(data.error || "Failed to add event. Please try again.");
      }
    } catch (error) {
      console.error('Error adding event:', error);
      setError("Failed to add event. Please check your connection and try again.");
    }
  };

  // Edit event
  const handleEditEvent = async (e) => {
    e.preventDefault();
    console.log('Edit event handler called', editingEvent);
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
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setEvents(events.map(event => event.id === editingEvent.id ? data.event : event));
        setEditingEvent(null);
        setMessage("Event updated successfully!");
      } else {
        setError(data.error || "Failed to update event.");
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError("Failed to update event.");
    }
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    console.log('Delete event handler called for id:', id);
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const res = await fetch(`http://localhost:5000/api/events/${id}`, { method: "DELETE" });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.success) {
          setEvents(events.filter(event => event.id !== id));
          setMessage("Event deleted successfully!");
        } else {
          setError(data.error || "Failed to delete event.");
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        setError("Failed to delete event.");
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Logout handler
  const handleLogout = () => {
    navigate('/');
  };

  // Registration handler
  const handleRegistration = () => {
    navigate('/admin/registrations');
  };

  // Add event row handler
  const handleAddEventRow = async (e) => {
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
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.success) {
        setEvents([...events, data.event]);
        setNewEvent({ name: "", date: "", time: "", location: "", banner: null });
        setMessage("Event added successfully!");
      } else {
        setError(data.error || "Failed to add event.");
      }
    } catch (error) {
      console.error('Error adding event row:', error);
      setError("Failed to add event.");
    }
  };

  // Get banner preview
  const getBannerPreview = (banner) => {
    if (banner && typeof banner === 'string') {
      return banner;
    } else if (banner && banner instanceof File) {
      return URL.createObjectURL(banner);
    }
    return null;
  };

  return (
    <div className="event-details-container">
      {/* Header Section */}
      <header className="event-details-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/sai baba.png" alt="Sai Baba" className="logo-image" />
          </div>
          <div className="org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </div>
        </div>
      </header>

      {/* Admin Bar */}
      <div className="admin-bar">
        <div className="admin-nav-buttons">
          <button 
            onClick={() => navigate('/admin/registrations')}
            className="admin-button"
          >
            Registration Details
          </button>
          <button 
            onClick={() => navigate('/admin/raffle-spin')}
            className="admin-button"
          >
            Raffle Spin
          </button>
          <button 
            onClick={() => navigate('/admin/raffle-winners')}
            className="admin-button"
          >
            Raffle Winners
          </button>
          <button 
            onClick={() => navigate('/event-details')}
            className="admin-button"
          >
            Event Details
          </button>
          <button 
            onClick={handleLogout}
            className="admin-button"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="event-details-main">
        <div className="event-details-content">
          <h1 className="event-details-title">Event Details</h1>
          
          {/* Events Table */}
          <div className="events-table-container">
            <table className="events-table">
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
                {/* Add New Event Row */}
                <tr className="add-event-row">
                  <td>
                    <input
                      type="text"
                      name="name"
                      value={newEvent.name}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Event Name"
                    />
                  </td>
                  <td>
                    <input
                      type="date"
                      name="date"
                      value={newEvent.date}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                    />
                  </td>
                  <td>
                    <select
                      name="time"
                      value={newEvent.time}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                    >
                      <option value="">Select Time</option>
                      <option value="9:00 AM">9:00 AM</option>
                      <option value="9:30 AM">9:30 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="12:30 PM">12:30 PM</option>
                      <option value="1:00 PM">1:00 PM</option>
                      <option value="1:30 PM">1:30 PM</option>
                      <option value="2:00 PM">2:00 PM</option>
                      <option value="2:30 PM">2:30 PM</option>
                      <option value="3:00 PM">3:00 PM</option>
                      <option value="3:30 PM">3:30 PM</option>
                      <option value="4:00 PM">4:00 PM</option>
                      <option value="4:30 PM">4:30 PM</option>
                      <option value="5:00 PM">5:00 PM</option>
                      <option value="5:30 PM">5:30 PM</option>
                      <option value="6:00 PM">6:00 PM</option>
                      <option value="6:30 PM">6:30 PM</option>
                      <option value="7:00 PM">7:00 PM</option>
                      <option value="7:30 PM">7:30 PM</option>
                      <option value="8:00 PM">8:00 PM</option>
                      <option value="8:30 PM">8:30 PM</option>
                      <option value="9:00 PM">9:00 PM</option>
                      <option value="9:30 PM">9:30 PM</option>
                      <option value="10:00 PM">10:00 PM</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      name="location"
                      value={newEvent.location}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Location"
                    />
                  </td>
                  <td>
                    <input
                      type="file"
                      name="banner"
                      onChange={(e) => handleInputChange(e)}
                      className="file-input"
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="banner-input"
                    />
                    <div className="banner-upload-container">
                      <button 
                        type="button"
                        onClick={() => document.getElementById('banner-input').click()}
                        className="choose-file-button"
                      >
                        {newEvent.banner ? 'Change File' : 'Choose File'}
                      </button>
                      {newEvent.banner && (
                        <div className="file-info">
                          <span className="file-name">{newEvent.banner.name}</span>
                          {getBannerPreview(newEvent.banner) && (
                            <img 
                              src={getBannerPreview(newEvent.banner)} 
                              alt="Banner preview" 
                              className="banner-preview"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                  </td>
                  <td>
                    <button 
                      onClick={(e) => handleAddEvent(e)}
                      className="add-event-button"
                      disabled={!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location}
                    >
                      Add Event
                    </button>
                  </td>
                </tr>
                
                {/* Newsletter Event Row */}
                {!newsletterEvent.deleted && (
                  newsletterEvent.editing ? (
                  <tr className="edit-row">
                    <td>
                      <input
                        type="text"
                        name="name"
                        value={newsletterEvent.name}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="date"
                        value={newsletterEvent.date}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <select
                        name="time"
                        value={newsletterEvent.time}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      >
                        <option value="">Select Time</option>
                        <option value="9:00 AM">9:00 AM</option>
                        <option value="9:30 AM">9:30 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="12:30 PM">12:30 PM</option>
                        <option value="1:00 PM">1:00 PM</option>
                        <option value="1:30 PM">1:30 PM</option>
                        <option value="2:00 PM">2:00 PM</option>
                        <option value="2:30 PM">2:30 PM</option>
                        <option value="3:00 PM">3:00 PM</option>
                        <option value="3:30 PM">3:30 PM</option>
                        <option value="4:00 PM">4:00 PM</option>
                        <option value="4:30 PM">4:30 PM</option>
                        <option value="5:00 PM">5:00 PM</option>
                        <option value="5:30 PM">5:30 PM</option>
                        <option value="6:00 PM">6:00 PM</option>
                        <option value="6:30 PM">6:30 PM</option>
                        <option value="7:00 PM">7:00 PM</option>
                        <option value="7:30 PM">7:30 PM</option>
                        <option value="8:00 PM">8:00 PM</option>
                        <option value="8:30 PM">8:30 PM</option>
                        <option value="9:00 PM">9:00 PM</option>
                        <option value="9:30 PM">9:30 PM</option>
                        <option value="10:00 PM">10:00 PM</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="location"
                        value={newsletterEvent.location}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="file"
                        name="banner"
                        onChange={handleNewsletterChange}
                        className="file-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="newsletter-banner-input"
                      />
                      <div className="banner-upload-container">
                        <button 
                          type="button"
                          onClick={() => document.getElementById('newsletter-banner-input').click()}
                          className="choose-file-button"
                        >
                          {newsletterEvent.banner ? 'Change File' : 'Choose File'}
                        </button>
                        {newsletterEvent.banner && (
                          <div className="file-info">
                            <span className="file-name">{newsletterEvent.banner.name}</span>
                            {getBannerPreview(newsletterEvent.banner) && (
                              <img 
                                src={getBannerPreview(newsletterEvent.banner)} 
                                alt="Banner preview" 
                                className="banner-preview"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={handleNewsletterSave}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button 
                          onClick={handleNewsletterCancel}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td>{newsletterEvent.name}</td>
                    <td>{newsletterEvent.date}</td>
                    <td>{newsletterEvent.time}</td>
                    <td>{newsletterEvent.location}</td>
                    <td>
                      {newsletterEvent.banner ? (
                        <img 
                          src={getBannerPreview(newsletterEvent.banner)} 
                          alt="Banner" 
                          className="banner-thumbnail"
                        />
                      ) : (
                        <span className="banner-text">Select banner from local folder for new events)</span>
                      )}
                    </td>
                    <td>
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={handleNewsletterEdit}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={handleNewsletterDelete}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
                )}
                
                {/* Restore Newsletter Event Button */}
                {newsletterEvent.deleted && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      <button 
                        onClick={handleRestoreNewsletter}
                        className="restore-button"
                        style={{ margin: '0 auto' }}
                      >
                        Restore Newsletter Event
                      </button>
                    </td>
                  </tr>
                )}
                
                {/* Dynamic Events from API */}
                {filteredEvents.map(event => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{event.date}</td>
                    <td>{event.time}</td>
                    <td>{event.location}</td>
                    <td>
                      {event.banner ? (
                        <img 
                          src={event.banner} 
                          alt="Banner" 
                          className="banner-thumbnail"
                        />
                      ) : (
                        <span className="banner-text">No banner</span>
                      )}
                    </td>
                    <td>
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => {
                            console.log('Edit button clicked for event:', event);
                            setEditingEvent(event);
                          }}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            console.log('Delete button clicked for event id:', event.id);
                            handleDeleteEvent(event.id);
                          }}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {/* Edit Event Row */}
                {editingEvent && (
                  <tr className="edit-row">
                    <td>
                      <input
                        type="text"
                        name="name"
                        value={editingEvent.name}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        name="date"
                        value={editingEvent.date}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <select
                        name="time"
                        value={editingEvent.time}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      >
                        <option value="">Select Time</option>
                        <option value="9:00 AM">9:00 AM</option>
                        <option value="9:30 AM">9:30 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="12:30 PM">12:30 PM</option>
                        <option value="1:00 PM">1:00 PM</option>
                        <option value="1:30 PM">1:30 PM</option>
                        <option value="2:00 PM">2:00 PM</option>
                        <option value="2:30 PM">2:30 PM</option>
                        <option value="3:00 PM">3:00 PM</option>
                        <option value="3:30 PM">3:30 PM</option>
                        <option value="4:00 PM">4:00 PM</option>
                        <option value="4:30 PM">4:30 PM</option>
                        <option value="5:00 PM">5:00 PM</option>
                        <option value="5:30 PM">5:30 PM</option>
                        <option value="6:00 PM">6:00 PM</option>
                        <option value="6:30 PM">6:30 PM</option>
                        <option value="7:00 PM">7:00 PM</option>
                        <option value="7:30 PM">7:30 PM</option>
                        <option value="8:00 PM">8:00 PM</option>
                        <option value="8:30 PM">8:30 PM</option>
                        <option value="9:00 PM">9:00 PM</option>
                        <option value="9:30 PM">9:30 PM</option>
                        <option value="10:00 PM">10:00 PM</option>
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        name="location"
                        value={editingEvent.location}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </td>
                    <td>
                      <input
                        type="file"
                        name="banner"
                        onChange={(e) => handleInputChange(e, true)}
                        className="file-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="edit-banner-input"
                      />
                      <div className="banner-upload-container">
                        <button 
                          type="button"
                          onClick={() => document.getElementById('edit-banner-input').click()}
                          className="choose-file-button"
                        >
                          {editingEvent.banner ? 'Change File' : 'Choose File'}
                        </button>
                        {editingEvent.banner && (
                          <div className="file-info">
                            <span className="file-name">{editingEvent.banner.name}</span>
                            {getBannerPreview(editingEvent.banner) && (
                              <img 
                                src={getBannerPreview(editingEvent.banner)} 
                                alt="Banner preview" 
                                className="banner-preview"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={(e) => handleEditEvent(e)}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingEvent(null)}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Messages */}
          {message && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {message}
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}
        </div>
      </main>



      {/* Footer */}
      <footer className="event-details-footer">
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

export default EventDetailsPage;
