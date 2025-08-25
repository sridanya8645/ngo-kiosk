import React, { useEffect, useState } from "react";
import "./EventDetailsPage.css";
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { useNavigate } from "react-router-dom";

function EventDetailsPage() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    event_id: "",
    name: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    raffle_tickets: "",
    created_at: "",
    modified_at: "",
    actions: ""
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    raffle_tickets: "",
    banner: null,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Add state for pseudo-newsletter event
  const [newsletterEvent, setNewsletterEvent] = useState({
    name: 'Register for Temple Newsletter and for General Events',
    start_datetime: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 16),
    end_datetime: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 16),
    location: '-',
    raffle_tickets: 0,
    banner: null,
    editing: false,
    deleted: localStorage.getItem('newsletterEventDeleted') === 'true',
  });

  // Format datetime for display
  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError("Failed to fetch events.");
      }
    };
    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = events.filter(event => {
    return (
      (filters.event_id === "" || event.event_id?.toString().includes(filters.event_id)) &&
      (filters.name === "" || event.name?.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.start_datetime === "" || formatDateTime(event.start_datetime)?.toLowerCase().includes(filters.start_datetime.toLowerCase())) &&
      (filters.end_datetime === "" || formatDateTime(event.end_datetime)?.toLowerCase().includes(filters.end_datetime.toLowerCase())) &&
      (filters.location === "" || event.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.raffle_tickets === "" || event.raffle_tickets?.toString().includes(filters.raffle_tickets)) &&
      (filters.created_at === "" || formatDateTime(event.created_at)?.toLowerCase().includes(filters.created_at.toLowerCase())) &&
      (filters.modified_at === "" || formatDateTime(event.modified_at)?.toLowerCase().includes(filters.modified_at.toLowerCase()))
    );
  });

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes
  const handleInputChange = (e, isEditing = false) => {
    const { name, value } = e.target;
    if (isEditing) {
      setEditingEvent(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewEvent(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle newsletter event changes
  const handleNewsletterChange = (e) => {
    const { name, value } = e.target;
    setNewsletterEvent(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add new event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newEvent.name);
      formData.append('start_datetime', newEvent.start_datetime);
      formData.append('end_datetime', newEvent.end_datetime);
      formData.append('location', newEvent.location);
      formData.append('raffle_tickets', newEvent.raffle_tickets || 0);
      formData.append('created_by', 1); // Default admin user

      const res = await fetch('/api/events', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(prev => [data.event, ...prev]);
        setNewEvent({
          name: "",
          start_datetime: "",
          end_datetime: "",
          location: "",
          raffle_tickets: "",
          banner: null,
        });
        setMessage("Event added successfully!");
        setError("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add event.");
      }
    } catch (error) {
      console.error('Error adding event:', error);
      setError("Failed to add event.");
    }
  };

  // Edit event
  const handleEditEvent = async () => {
    try {
      const formData = new FormData();
      formData.append('name', editingEvent.name);
      formData.append('start_datetime', editingEvent.start_datetime);
      formData.append('end_datetime', editingEvent.end_datetime);
      formData.append('location', editingEvent.location);
      formData.append('raffle_tickets', editingEvent.raffle_tickets || 0);
      formData.append('modified_by', 1); // Default admin user

      const res = await fetch(`/api/events/${editingEvent.event_id}`, {
        method: 'PUT',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(prev => prev.map(event => 
          event.event_id === editingEvent.event_id ? data.event : event
        ));
        setEditingEvent(null);
        setMessage("Event updated successfully!");
        setError("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update event.");
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError("Failed to update event.");
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setEvents(prev => prev.filter(event => event.event_id !== eventId));
        setMessage("Event deleted successfully!");
        setError("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete event.");
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError("Failed to delete event.");
    }
  };

  // Update newsletter event
  const handleUpdateNewsletter = async () => {
    try {
      setNewsletterEvent(prev => ({ ...prev, editing: false }));
      setMessage("Newsletter event updated successfully!");
      setError("");
    } catch (error) {
      console.error('Error updating newsletter event:', error);
      setError("Failed to update newsletter event.");
    }
  };

  return (
    <div className="event-details-container">
      <SiteHeader navVariant="event-details" />

      {/* Main Content */}
      <main className="event-details-main">
        <div className="event-details-content">
          <h1 className="event-details-title">Event Details</h1>
          
          {/* Events Table */}
          <div className="events-table-container">
            {/* Table Header */}
            <div className="table-header-row">
              <div className="header-cell">Event ID</div>
              <div className="header-cell">Event Name</div>
              <div className="header-cell">Start Date & Time</div>
              <div className="header-cell">End Date & Time</div>
              <div className="header-cell">Location</div>
              <div className="header-cell">Raffle Tickets</div>
              <div className="header-cell">Created</div>
              <div className="header-cell">Modified</div>
              <div className="header-cell">Actions</div>
            </div>

            {/* Filter Row */}
            <div className="filter-row">
              <div className="filter-cell">
                <input
                  name="event_id"
                  value={filters.event_id || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Event ID"
                  className="filter-input"
                />
              </div>
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
                  name="start_datetime"
                  value={filters.start_datetime || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Start Date & Time"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="end_datetime"
                  value={filters.end_datetime || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter End Date & Time"
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
                  name="raffle_tickets"
                  value={filters.raffle_tickets || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Raffle Tickets"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="created_at"
                  value={filters.created_at || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Created"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="modified_at"
                  value={filters.modified_at || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Modified"
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
                  <span className="new-event-label">NEW</span>
                </div>
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
                    type="datetime-local"
                    name="start_datetime"
                    value={newEvent.start_datetime}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                  />
                </div>
                <div className="data-cell">
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={newEvent.end_datetime}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                  />
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
                  <input
                    type="number"
                    name="raffle_tickets"
                    value={newEvent.raffle_tickets}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Raffle Tickets"
                  />
                </div>
                <div className="data-cell">
                  <span className="auto-label">Auto</span>
                </div>
                <div className="data-cell">
                  <span className="auto-label">Auto</span>
                </div>
                <div className="data-cell">
                  <button 
                    onClick={(e) => handleAddEvent(e)}
                    className="add-event-button"
                    disabled={!newEvent.name || !newEvent.start_datetime || !newEvent.location}
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
                      <span className="newsletter-label">NEWSLETTER</span>
                    </div>
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
                        type="datetime-local"
                        name="start_datetime"
                        value={newsletterEvent.start_datetime}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <input
                        type="datetime-local"
                        name="end_datetime"
                        value={newsletterEvent.end_datetime}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
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
                      <input
                        type="number"
                        name="raffle_tickets"
                        value={newsletterEvent.raffle_tickets}
                        onChange={handleNewsletterChange}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell">
                      <span className="auto-label">Auto</span>
                    </div>
                    <div className="data-cell">
                      <span className="auto-label">Auto</span>
                    </div>
                    <div className="data-cell">
                      <div className="action-buttons">
                        <button 
                          onClick={handleUpdateNewsletter}
                          className="save-button"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setNewsletterEvent(prev => ({ ...prev, editing: false }))}
                          className="cancel-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="event-row">
                    <div className="data-cell">
                      <span className="newsletter-label">NEWSLETTER</span>
                    </div>
                    <div className="data-cell">{newsletterEvent.name}</div>
                    <div className="data-cell">{formatDateTime(newsletterEvent.start_datetime)}</div>
                    <div className="data-cell">{formatDateTime(newsletterEvent.end_datetime)}</div>
                    <div className="data-cell">{newsletterEvent.location}</div>
                    <div className="data-cell">{newsletterEvent.raffle_tickets}</div>
                    <div className="data-cell">
                      <span className="auto-label">Auto</span>
                    </div>
                    <div className="data-cell">
                      <span className="auto-label">Auto</span>
                    </div>
                    <div className="data-cell">
                      <div className="action-buttons">
                        <button 
                          onClick={() => setNewsletterEvent(prev => ({ ...prev, editing: true }))}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setNewsletterEvent(prev => ({ ...prev, deleted: true }));
                            localStorage.setItem('newsletterEventDeleted', 'true');
                          }}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Regular Events */}
              {filteredEvents.map((event) => (
                <div key={event.event_id} className="event-row">
                  <div className="data-cell">{event.event_id}</div>
                  <div className="data-cell">{event.name}</div>
                  <div className="data-cell">{formatDateTime(event.start_datetime)}</div>
                  <div className="data-cell">{formatDateTime(event.end_datetime)}</div>
                  <div className="data-cell">{event.location}</div>
                  <div className="data-cell">{event.raffle_tickets}</div>
                  <div className="data-cell">
                    {event.created_by_name ? `${event.created_by_name} - ${formatDateTime(event.created_at)}` : formatDateTime(event.created_at)}
                  </div>
                  <div className="data-cell">
                    {event.modified_by_name ? `${event.modified_by_name} - ${formatDateTime(event.modified_at)}` : formatDateTime(event.modified_at)}
                  </div>
                  <div className="data-cell">
                    <div className="action-buttons">
                      <button 
                        onClick={() => setEditingEvent(event)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.event_id)}
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
                  <div className="data-cell">{editingEvent.event_id}</div>
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
                      type="datetime-local"
                      name="start_datetime"
                      value={editingEvent.start_datetime ? editingEvent.start_datetime.slice(0, 16) : ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="table-input"
                    />
                  </div>
                  <div className="data-cell">
                    <input
                      type="datetime-local"
                      name="end_datetime"
                      value={editingEvent.end_datetime ? editingEvent.end_datetime.slice(0, 16) : ''}
                      onChange={(e) => handleInputChange(e, true)}
                      className="table-input"
                    />
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
                    <input
                      type="number"
                      name="raffle_tickets"
                      value={editingEvent.raffle_tickets || 0}
                      onChange={(e) => handleInputChange(e, true)}
                      className="table-input"
                    />
                  </div>
                  <div className="data-cell">{formatDateTime(editingEvent.created_at)}</div>
                  <div className="data-cell">{formatDateTime(editingEvent.modified_at)}</div>
                  <div className="data-cell">
                    <div className="action-buttons">
                      <button 
                        onClick={handleEditEvent}
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
            <div className="message success">
              {message}
              <button onClick={() => setMessage("")} className="close-button">×</button>
            </div>
          )}
          {error && (
            <div className="message error">
              {error}
              <button onClick={() => setError("")} className="close-button">×</button>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default EventDetailsPage;

