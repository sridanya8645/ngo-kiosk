import React, { useEffect, useState } from "react";
import "./EventDetailsPage.css";
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { useNavigate } from "react-router-dom";

function EventDetailsPage() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    date: "",
    time: "",
    end_date: "",
    end_time: "",
    location: "",
    raffle: "",
    actions: ""
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    end_date: "",
    end_time: "",
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
          const res = await fetch(`/api/events/${newsletterEventFromDB.id}`, { method: "DELETE" });
          
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

      const res = await fetch("/api/events", {
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
  


  // Fetch all events on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('Fetching events...');
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('Events data received:', data);
        setEvents(data);
        setError("");
      } catch (error) {
        console.error('Error fetching events:', error);
        console.log('Events will be loaded when backend is available');
      }
    })();
  }, []);

  // Filtered events
  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes((filters.name||'').toLowerCase()) &&
    (event.date||'').toString().includes(filters.date||'') &&
    (event.time||'').toString().includes(filters.time||'') &&
    (event.end_date||'').toString().includes(filters.end_date||'') &&
    (event.end_time||'').toString().includes(filters.end_time||'') &&
    (event.location||'').toLowerCase().includes((filters.location||'').toLowerCase())
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
    if (newEvent.end_date) formData.append("end_date", newEvent.end_date);
    if (newEvent.end_time) formData.append("end_time", newEvent.end_time);
    formData.append("location", newEvent.location);
    if (newEvent.banner) formData.append("banner", newEvent.banner);

    try {
      console.log('Making API call to /api/events');
      const res = await fetch("/api/events", {
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
        setNewEvent({ name: "", date: "", time: "", end_date: "", end_time: "", location: "", banner: null });
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
    if (editingEvent.end_date) formData.append("end_date", editingEvent.end_date);
    if (editingEvent.end_time) formData.append("end_time", editingEvent.end_time);
    formData.append("location", editingEvent.location);
    if (editingEvent.banner) formData.append("banner", editingEvent.banner);

    try {
      const res = await fetch(`/api/events/${editingEvent.id}`, {
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
        const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
        
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
      const res = await fetch("/api/events", {
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

  // Normalize any stored banner value to a proper URL
  const resolveBannerUrl = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      // Extract src if an entire <img ...> HTML string was stored
      const imgMatch = value.match(/<img[^>]*src=['"]([^'"]+)['"][^>]*>/i);
      if (imgMatch && imgMatch[1]) {
        value = imgMatch[1];
      }
      if (value.startsWith('http') || value.startsWith('data:')) return value;
      return value.startsWith('/') ? value : '/' + value;
    }
    if (value instanceof File) {
      return URL.createObjectURL(value);
    }
    return null;
  };

  return (
    <div className="event-details-container">
      <SiteHeader navVariant="admin-only" />

      {/* Main Content */}
      <main className="event-details-main">
        <div className="event-details-content">
          <h1 className="event-details-title">Event Details</h1>
          
          {/* Events Table */}
          <div className="events-table-container">
            {/* Table Header */}
            <div className="table-header-row">
              <div className="header-cell">Event Name</div>
              <div className="header-cell">Date</div>
              <div className="header-cell">Time</div>
              <div className="header-cell">End Date</div>
              <div className="header-cell">End Time</div>
              <div className="header-cell">Location</div>
              <div className="header-cell">Raffle Tickets</div>
              <div className="header-cell">Actions</div>
            </div>

            {/* Filter Row */}
            <div className="filter-row">
              <div className="filter-cell">
                <input
                  name="name"
                  value={filters.name || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Event Name"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="date"
                  value={filters.date || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Date"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="time"
                  value={filters.time || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Time"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="end_date"
                  value={filters.end_date || ''}
                  onChange={handleFilterChange}
                  placeholder="End Date"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="end_time"
                  value={filters.end_time || ''}
                  onChange={handleFilterChange}
                  placeholder="End Time"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="location"
                  value={filters.location || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Location"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="raffle"
                  value={filters.raffle || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Raffle"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="actions"
                  value={filters.actions || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Actions"
                  className="filter-input"
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="data-table">
              {/* Add New Event Row */}
              <div className="event-row add-event-row">
                <div className="data-cell">
                  <input
                    type="text"
                    name="name"
                    value={newEvent.name}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Event Name"
                  />
                </div>
                <div className="data-cell">
                  <input
                    type="date"
                    name="date"
                    value={newEvent.date}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                  />
                </div>
                <div className="data-cell">
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
                </div>
                <div className="data-cell">
                  <input
                    type="date"
                    name="end_date"
                    value={newEvent.end_date}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                  />
                </div>
                <div className="data-cell">
                  <select
                    name="end_time"
                    value={newEvent.end_time}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                  >
                    <option value="">End Time</option>
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
                </div>
                <div className="data-cell">
                  <input
                    type="text"
                    name="location"
                    value={newEvent.location}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Location"
                  />
                </div>
                <div className="data-cell">
                  <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                </div>
                <div className="data-cell">
                  <button 
                    onClick={(e) => handleAddEvent(e)}
                    className="add-event-button"
                    disabled={!newEvent.name || !newEvent.date || !newEvent.time || !newEvent.location}
                  >
                    Add Event
                  </button>
                </div>
              </div>
                
                {/* Newsletter Event Row */}
                {!newsletterEvent.deleted && (
                  newsletterEvent.editing ? (
                  <div className="event-row edit-row">
                    <div className="data-cell">
                      <input
                        type="text"
                        name="name"
                        value={newsletterEvent.name}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <input
                        type="date"
                        name="date"
                        value={newsletterEvent.date}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
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
                    </div>
                    <div className="data-cell">
                      <input
                        type="text"
                        name="location"
                        value={newsletterEvent.location}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </div>
                                         <div className="data-cell">
                       <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                     </div>
                    <div className="data-cell">
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
                    </div>
                  </div>
                ) : (
                  <div className="event-row">
                    <div className="data-cell">{newsletterEvent.name}</div>
                    <div className="data-cell">{newsletterEvent.date}</div>
                    <div className="data-cell">{newsletterEvent.time}</div>
                    <div className="data-cell">{newsletterEvent.location}</div>
                    <div className="data-cell">
                      {newsletterEvent.banner ? (
                        <img 
                          src={getBannerPreview(newsletterEvent.banner)} 
                          alt="Banner" 
                          className="banner-thumbnail"
                        />
                      ) : (
                        <span className="banner-text">Select banner from local folder for new events)</span>
                      )}
                    </div>
                    <div className="data-cell">
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </div>
                    <div className="data-cell">
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
                    </div>
                  </div>
                )
                )}
                

                
                {/* Dynamic Events from API */}
                {filteredEvents.map(event => (
                  <div key={event.id} className="event-row">
                    <div className="data-cell">{event.name}</div>
                    <div className="data-cell">{event.date}</div>
                    <div className="data-cell">{event.time}</div>
                    <div className="data-cell">{event.end_date || '-'}</div>
                    <div className="data-cell">{event.end_time || '-'}</div>
                    <div className="data-cell">{event.location}</div>
                    <div className="data-cell">
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </div>
                    <div className="data-cell">
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
                    </div>
                  </div>
                ))}
                
                {/* Edit Event Row */}
                {editingEvent && (
                  <div className="event-row edit-row">
                    <div className="data-cell">
                      <input
                        type="text"
                        name="name"
                        value={editingEvent.name}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <input
                        type="date"
                        name="date"
                        value={editingEvent.date}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
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
                    </div>
                    <div className="data-cell">
                      <input
                        type="date"
                        name="end_date"
                        value={editingEvent.end_date || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <select
                        name="end_time"
                        value={editingEvent.end_time || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      >
                        <option value="">End Time</option>
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
                    </div>
                    <div className="data-cell">
                      <input
                        type="text"
                        name="location"
                        value={editingEvent.location}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <span className="raffle-text">Register your details to win $200 raffle ticket</span>
                    </div>
                    <div className="data-cell">
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
                    </div>
                  </div>
                )}
              </div>
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



      <SiteFooter />
    </div>
  );
}

export default EventDetailsPage;

