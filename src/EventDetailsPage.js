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
    footer_location: "",
    footer_phone: "",
    footer_email: "",
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
    footer_location: "",
    footer_phone: "",
    footer_email: "",
    volunteer_enabled: false,
    welcome_text: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeColumnIndex, setResizeColumnIndex] = useState(null);



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
    const { name, value, type, files, checked } = e.target;
    
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
    } else if (type === 'radio') {
      // Handle radio button for volunteer_enabled
      const boolValue = value === 'true';
      if (isEditing) {
        setEditingEvent(prev => ({
          ...prev,
          [name]: boolValue
        }));
      } else {
        setNewEvent(prev => ({
          ...prev,
          [name]: boolValue
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

      formData.append('footer_location', newEvent.footer_location || '');
      formData.append('footer_phone', newEvent.footer_phone || '');
      formData.append('footer_email', newEvent.footer_email || '');
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
          footer_location: "",
          footer_phone: "",
          footer_email: "",
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

      formData.append('footer_location', editingEvent.footer_location || '');
      formData.append('footer_phone', editingEvent.footer_phone || '');
      formData.append('footer_email', editingEvent.footer_email || '');
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

  // Column resizing functions
  const handleResizeStart = (e, columnIndex) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStartX(e.clientX);
    setResizeColumnIndex(columnIndex);
    
    // Add resizing class to header cell
    const headerCell = e.target.closest('.header-cell');
    if (headerCell) {
      headerCell.classList.add('resizing');
    }
  };

  const handleResizeMove = (e) => {
    if (!isResizing || resizeColumnIndex === null) return;

    const deltaX = e.clientX - resizeStartX;
    const currentWidth = columnWidths[resizeColumnIndex] || 0;
    const newWidth = Math.max(100, currentWidth + deltaX); // Minimum width of 100px

    setColumnWidths(prev => ({
      ...prev,
      [resizeColumnIndex]: newWidth
    }));

    // Update CSS variable for the entire column
    document.documentElement.style.setProperty(`--col-${resizeColumnIndex}-width`, `${newWidth}px`);

    setResizeStartX(e.clientX);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeColumnIndex(null);
    
    // Remove resizing class from all header cells
    document.querySelectorAll('.header-cell').forEach(cell => {
      cell.classList.remove('resizing');
    });
  };

  // Add event listeners for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, resizeStartX, resizeColumnIndex, columnWidths]);



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
                <div 
                  className="header-cell col-0" 
                  data-label="Event ID"
                  onMouseDown={(e) => handleResizeStart(e, 0)}
                >
                  Event ID
                </div>
                               <div 
                  className="header-cell col-1" 
                  data-label="Event Name"
                  onMouseDown={(e) => handleResizeStart(e, 1)}
                >
                  Event Name
                </div>
                               <div 
                  className="header-cell col-2" 
                  data-label="Start Date & Time"
                  onMouseDown={(e) => handleResizeStart(e, 2)}
                >
                  Start Date & Time
                </div>
                <div 
                  className="header-cell col-3" 
                  data-label="End Date & Time"
                  onMouseDown={(e) => handleResizeStart(e, 3)}
                >
                  End Date & Time
                </div>
                <div 
                  className="header-cell col-4" 
                  data-label="Location"
                  onMouseDown={(e) => handleResizeStart(e, 4)}
                >
                  Location
                </div>
                <div 
                  className="header-cell col-5" 
                  data-label="Raffle Tickets"
                  onMouseDown={(e) => handleResizeStart(e, 5)}
                >
                  Raffle Tickets
                </div>
                <div 
                  className="header-cell col-6" 
                  data-label="Banner"
                  onMouseDown={(e) => handleResizeStart(e, 6)}
                >
                  Banner
                </div>
                <div 
                  className="header-cell col-7" 
                  data-label="Header Image"
                  onMouseDown={(e) => handleResizeStart(e, 7)}
                >
                  Header Image
                </div>
                <div 
                  className="header-cell col-8" 
                  data-label="Footer Location"
                  onMouseDown={(e) => handleResizeStart(e, 8)}
                >
                  Footer Location
                </div>
                <div 
                  className="header-cell col-9" 
                  data-label="Footer Phone"
                  onMouseDown={(e) => handleResizeStart(e, 9)}
                >
                  Footer Phone
                </div>
                <div 
                  className="header-cell col-10" 
                  data-label="Footer Email"
                  onMouseDown={(e) => handleResizeStart(e, 10)}
                >
                  Footer Email
                </div>
                <div 
                  className="header-cell col-11" 
                  data-label="Volunteer"
                  onMouseDown={(e) => handleResizeStart(e, 11)}
                >
                  Volunteer
                </div>
                <div 
                  className="header-cell col-12" 
                  data-label="Welcome Text"
                  onMouseDown={(e) => handleResizeStart(e, 12)}
                >
                  Welcome Text
                </div>
                <div 
                  className="header-cell col-13" 
                  data-label="Created"
                  onMouseDown={(e) => handleResizeStart(e, 13)}
                >
                  Created
                </div>
                <div 
                  className="header-cell col-14" 
                  data-label="Modified"
                  onMouseDown={(e) => handleResizeStart(e, 14)}
                >
                  Modified
                </div>
                <div 
                  className="header-cell col-15" 
                  data-label="Actions"
                  onMouseDown={(e) => handleResizeStart(e, 15)}
                >
                  Actions
                </div>
             </div>

                         {/* Filter Row */}
             <div className="filter-row">
               <div className="filter-cell col-0">
                 <input
                   name="event_id"
                   value={filters.event_id || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Event ID"
                   className="filter-input"
                 />
               </div>
                             <div className="filter-cell col-1">
                 <input
                   name="name"
                   value={filters.name || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Event Name"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-2">
                 <input
                   name="start_datetime"
                   value={filters.start_datetime || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Start Date & Time"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-3">
                 <input
                   name="end_datetime"
                   value={filters.end_datetime || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter End Date & Time"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-4">
                 <input
                   name="location"
                   value={filters.location || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Location"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-5">
                 <input
                   name="raffle_tickets"
                   value={filters.raffle_tickets || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Raffle Tickets"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-6">
                 <input
                   name="banner"
                   value={filters.banner || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Banner"
                   className="filter-input"
                 />
               </div>
                              <div className="filter-cell col-7">
                  <input
                    name="header_image"
                    value={filters.header_image || ''}
                    onChange={handleFilterChange}
                    placeholder="Filter Header Image"
                    className="filter-input"
                  />
                </div>

               <div className="filter-cell col-8">
                 <input
                   name="footer_location"
                   value={filters.footer_location || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Footer Location"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-9">
                 <input
                   name="footer_phone"
                   value={filters.footer_phone || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Footer Phone"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-10">
                 <input
                   name="footer_email"
                   value={filters.footer_email || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Footer Email"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-11">
                 <input
                   name="volunteer_enabled"
                   value={filters.volunteer_enabled || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Volunteer"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-12">
                 <input
                   name="welcome_text"
                   value={filters.welcome_text || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Welcome"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-13">
                 <input
                   name="created_at"
                   value={filters.created_at || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Created"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-14">
                 <input
                   name="modified_at"
                   value={filters.modified_at || ''}
                   onChange={handleFilterChange}
                   placeholder="Filter Modified"
                   className="filter-input"
                 />
               </div>
               <div className="filter-cell col-15">
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
                 <div className="data-cell col-0">
                   <span className="new-event-label">NEW</span>
                 </div>
                 <div className="data-cell col-1">
                   <input
                     type="text"
                     name="name"
                     value={newEvent.name}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     placeholder="Event Name"
                   />
                 </div>
                                 <div className="data-cell col-2">
                   <input
                     type="datetime-local"
                     name="start_datetime"
                     value={newEvent.start_datetime}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                   />
                 </div>
                 <div className="data-cell col-3">
                   <input
                     type="datetime-local"
                     name="end_datetime"
                     value={newEvent.end_datetime}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                   />
                 </div>
                 <div className="data-cell col-4">
                   <input
                     type="text"
                     name="location"
                     value={newEvent.location}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     placeholder="Location"
                   />
                 </div>
                                  <div className="data-cell col-5">
                    <input
                      type="number"
                      name="raffle_tickets"
                      value={newEvent.raffle_tickets}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Raffle Tickets"
                    />
                  </div>
                  <div className="data-cell col-6">
                    <input
                      type="file"
                      name="banner"
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      accept="image/*"
                    />
                  </div>
                                    <div className="data-cell col-7">
                     <input
                       type="file"
                       name="header_image"
                       onChange={(e) => handleInputChange(e)}
                       className="table-input"
                       accept="image/*"
                     />
                   </div>

                  <div className="data-cell col-8">
                    <input
                      type="text"
                      name="footer_location"
                      value={newEvent.footer_location}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Footer Location"
                    />
                  </div>
                  <div className="data-cell col-9">
                    <input
                      type="text"
                      name="footer_phone"
                      value={newEvent.footer_phone}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Footer Phone"
                    />
                  </div>
                  <div className="data-cell col-10">
                    <input
                      type="email"
                      name="footer_email"
                      value={newEvent.footer_email}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Footer Email"
                    />
                  </div>
                  <div className="data-cell col-11">
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
                  <div className="data-cell col-12">
                    <textarea
                      name="welcome_text"
                      value={newEvent.welcome_text}
                      onChange={(e) => handleInputChange(e)}
                      className="table-input"
                      placeholder="Welcome Text"
                      rows="2"
                    />
                  </div>
                  <div className="data-cell col-13">
                    <span className="auto-label">Auto</span>
                  </div>
                  <div className="data-cell col-14">
                    <span className="auto-label">Auto</span>
                  </div>
                  <div className="data-cell col-15">
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
                   <div className="data-cell col-0" data-label="Event ID">{event.event_id}</div>
                   <div className="data-cell col-1" data-label="Event Name">{event.name}</div>
                   <div className="data-cell col-2" data-label="Start Date & Time">{formatDateTime(event.start_datetime)}</div>
                   <div className="data-cell col-3" data-label="End Date & Time">{formatDateTime(event.end_datetime)}</div>
                   <div className="data-cell col-4" data-label="Location">{event.location}</div>
                   <div className="data-cell col-5" data-label="Raffle Tickets">{event.raffle_tickets}</div>
                                     <div className="data-cell col-6" data-label="Banner">
                     {event.banner ? (
                       <img src={event.banner} alt="Banner" className="banner-thumbnail" />
                     ) : (
                       <span className="no-banner">No Banner</span>
                     )}
                   </div>
                   <div className="data-cell col-7" data-label="Header Image">
                     {event.header_image ? (
                       <img src={event.header_image} alt="Header" className="header-thumbnail" />
                     ) : (
                       <span className="no-header">No Header Image</span>
                     )}
                   </div>

                   <div className="data-cell col-8" data-label="Footer Location">
                     {event.footer_location || 'Not set'}
                   </div>
                   <div className="data-cell col-9" data-label="Footer Phone">
                     {event.footer_phone || 'Not set'}
                   </div>
                   <div className="data-cell col-10" data-label="Footer Email">
                     {event.footer_email || 'Not set'}
                   </div>
                   <div className="data-cell col-11" data-label="Volunteer">
                     <span className={`volunteer-status ${event.volunteer_enabled ? 'enabled' : 'disabled'}`}>
                       {event.volunteer_enabled ? 'Yes' : 'No'}
                     </span>
                   </div>
                   <div className="data-cell col-12" data-label="Welcome Text">
                     <div className="content-preview">
                       {event.welcome_text ? event.welcome_text.substring(0, 50) + '...' : 'No text'}
                     </div>
                   </div>
                   <div className="data-cell col-13" data-label="Created">
                     {event.created_by_name ? `${event.created_by_name} - ${formatDateTime(event.created_at)}` : formatDateTime(event.created_at)}
                   </div>
                   <div className="data-cell col-14" data-label="Modified">
                     {event.modified_by_name ? `${event.modified_by_name} - ${formatDateTime(event.modified_at)}` : formatDateTime(event.modified_at)}
                   </div>
                   <div className="data-cell col-15" data-label="Actions">
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
                    <div className="data-cell col-0">{editingEvent.event_id}</div>
                    <div className="data-cell col-1">
                      <input
                        type="text"
                        name="name"
                        value={editingEvent.name}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                                       <div className="data-cell col-2">
                      <input
                        type="datetime-local"
                        name="start_datetime"
                        value={formatDateTimeForInput(editingEvent.start_datetime)}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell col-3">
                      <input
                        type="datetime-local"
                        name="end_datetime"
                        value={formatDateTimeForInput(editingEvent.end_datetime)}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell col-4">
                      <input
                        type="text"
                        name="location"
                        value={editingEvent.location}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell col-5">
                      <input
                        type="number"
                        name="raffle_tickets"
                        value={editingEvent.raffle_tickets || 0}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    </div>
                    <div className="data-cell col-6">
                      <input
                        type="file"
                        name="banner"
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        accept="image/*"
                      />
                    </div>
                                        <div className="data-cell col-7">
                       <input
                         type="file"
                         name="header_image"
                         onChange={(e) => handleInputChange(e, true)}
                         className="table-input"
                         accept="image/*"
                       />
                     </div>

                    <div className="data-cell col-8">
                      <input
                        type="text"
                        name="footer_location"
                        value={editingEvent.footer_location || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Location"
                      />
                    </div>
                    <div className="data-cell col-9">
                      <input
                        type="text"
                        name="footer_phone"
                        value={editingEvent.footer_phone || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Phone"
                      />
                    </div>
                    <div className="data-cell col-10">
                      <input
                        type="email"
                        name="footer_email"
                        value={editingEvent.footer_email || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Email"
                      />
                    </div>
                    <div className="data-cell col-11">
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
                    <div className="data-cell col-12">
                      <textarea
                        name="welcome_text"
                        value={editingEvent.welcome_text || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Welcome Text"
                        rows="2"
                      />
                    </div>
                    <div className="data-cell col-13">{formatDateTime(editingEvent.created_at)}</div>
                    <div className="data-cell col-14">{formatDateTime(editingEvent.modified_at)}</div>
                    <div className="data-cell col-15">
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

