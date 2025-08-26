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
    banner: "",
    header_image: "",
    footer_content: "",
    volunteer_enabled: "",
    welcome_text: "",
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
    header_image: null,
    footer_content: "",
    volunteer_enabled: false,
    welcome_text: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();



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

  // Format datetime for input fields (YYYY-MM-DDTHH:MM)
  const formatDateTimeForInput = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (isEditing) {
        setEditingEvent(prev => ({
          ...prev,
          [name]: file
        }));
      } else {
        setNewEvent(prev => ({
          ...prev,
          [name]: file
        }));
      }
    } else {
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
    }
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
      formData.append('footer_content', newEvent.footer_content || '');
      formData.append('volunteer_enabled', newEvent.volunteer_enabled);
      formData.append('welcome_text', newEvent.welcome_text || '');
      formData.append('created_by', 1); // Default admin user

      // Add banner file if selected
      if (newEvent.banner) {
        formData.append('banner', newEvent.banner);
      }

      // Add header image file if selected
      if (newEvent.header_image) {
        formData.append('header_image', newEvent.header_image);
      }

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
          header_image: null,
          footer_content: "",
          volunteer_enabled: false,
          welcome_text: "",
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
      formData.append('footer_content', editingEvent.footer_content || '');
      formData.append('volunteer_enabled', editingEvent.volunteer_enabled);
      formData.append('welcome_text', editingEvent.welcome_text || '');
      formData.append('modified_by', 1); // Default admin user

      // Add banner file if selected
      if (editingEvent.banner) {
        formData.append('banner', editingEvent.banner);
      }

      // Add header image file if selected
      if (editingEvent.header_image) {
        formData.append('header_image', editingEvent.header_image);
      }

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
                             <div className="header-cell">Banner</div>
               <div className="header-cell">Header Image</div>
               <div className="header-cell">Footer Content</div>
              <div className="header-cell">Volunteer</div>
              <div className="header-cell">Welcome Text</div>
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
                  name="banner"
                  value={filters.banner || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Banner"
                  className="filter-input"
                />
              </div>
                             <div className="filter-cell">
                 <input
                   name="header_image"
                   value={filters.header_image || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Header Image"
                   className="filter-input"
                 />
               </div>
              <div className="filter-cell">
                <input
                  name="footer_content"
                  value={filters.footer_content || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Footer"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="volunteer_enabled"
                  value={filters.volunteer_enabled || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Volunteer"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="welcome_text"
                  value={filters.welcome_text || ''}
                  onChange={handleFilterChange}
                  placeholder="Filter Welcome"
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
                   <input
                     type="file"
                     name="banner"
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     accept="image/*"
                   />
                 </div>
                                   <div className="data-cell">
                    <input
                      type="file"
                      name="header_image"
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      accept="image/*"
                    />
                  </div>
                 <div className="data-cell">
                   <textarea
                     name="footer_content"
                     value={newEvent.footer_content}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     placeholder="Footer Content"
                     rows="2"
                   />
                 </div>
                 <div className="data-cell">
                   <label>
                     <input
                       type="radio"
                       name="volunteer_enabled"
                       value="true"
                       checked={newEvent.volunteer_enabled === true}
                       onChange={(e) => handleInputChange(e)}
                     /> Yes
                   </label>
                   <label>
                     <input
                       type="radio"
                       name="volunteer_enabled"
                       value="false"
                       checked={newEvent.volunteer_enabled === false}
                       onChange={(e) => handleInputChange(e)}
                     /> No
                   </label>
                 </div>
                 <div className="data-cell">
                   <textarea
                     name="welcome_text"
                     value={newEvent.welcome_text}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     placeholder="Welcome Text"
                     rows="2"
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
                    {event.banner ? (
                      <img src={event.banner} alt="Banner" className="banner-thumbnail" />
                    ) : (
                      <span className="no-banner">No Banner</span>
                    )}
                  </div>
                                     <div className="data-cell">
                     {event.header_image ? (
                       <img src={event.header_image} alt="Header" className="header-thumbnail" />
                     ) : (
                       <span className="no-header">No Header Image</span>
                     )}
                   </div>
                  <div className="data-cell">
                    <div className="content-preview">
                      {event.footer_content ? event.footer_content.substring(0, 50) + '...' : 'No content'}
                    </div>
                  </div>
                  <div className="data-cell">
                    <span className={`volunteer-status ${event.volunteer_enabled ? 'enabled' : 'disabled'}`}>
                      {event.volunteer_enabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="data-cell">
                    <div className="content-preview">
                      {event.welcome_text ? event.welcome_text.substring(0, 50) + '...' : 'No text'}
                    </div>
                  </div>
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
                       value={formatDateTimeForInput(editingEvent.start_datetime)}
                       onChange={(e) => handleInputChange(e, true)}
                       className="table-input"
                     />
                   </div>
                   <div className="data-cell">
                     <input
                       type="datetime-local"
                       name="end_datetime"
                       value={formatDateTimeForInput(editingEvent.end_datetime)}
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
                   <div className="data-cell">
                     <input
                       type="file"
                       name="banner"
                       onChange={(e) => handleInputChange(e, true)}
                       className="table-input"
                       accept="image/*"
                     />
                   </div>
                                       <div className="data-cell">
                      <input
                        type="file"
                        name="header_image"
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        accept="image/*"
                      />
                    </div>
                   <div className="data-cell">
                     <textarea
                       name="footer_content"
                       value={editingEvent.footer_content || ''}
                       onChange={(e) => handleInputChange(e, true)}
                       className="table-input"
                       placeholder="Footer Content"
                       rows="2"
                     />
                   </div>
                   <div className="data-cell">
                     <label>
                       <input
                         type="radio"
                         name="volunteer_enabled"
                         value="true"
                         checked={editingEvent.volunteer_enabled === true}
                         onChange={(e) => handleInputChange(e, true)}
                       /> Yes
                     </label>
                     <label>
                       <input
                         type="radio"
                         name="volunteer_enabled"
                         value="false"
                         checked={editingEvent.volunteer_enabled === false}
                         onChange={(e) => handleInputChange(e, true)}
                       /> No
                     </label>
                   </div>
                   <div className="data-cell">
                     <textarea
                       name="welcome_text"
                       value={editingEvent.welcome_text || ''}
                       onChange={(e) => handleInputChange(e, true)}
                       className="table-input"
                       placeholder="Welcome Text"
                       rows="2"
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

