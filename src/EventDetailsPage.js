import React, { useEffect, useState } from 'react';
import './EventDetailsPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';
import { useNavigate } from 'react-router-dom';

function EventDetailsPage () {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    event_id: '',
    name: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    raffle_tickets: '',
    volunteer_enabled: '',
    banner: '',
    header_image: '',
    footer_location: '',
    footer_phone: '',
    footer_email: '',
    welcome_text: '',
    created_at: '',
    modified_at: '',
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
    raffle_tickets: '',
    banner: null,
    header_image: null,
    footer_location: '',
    footer_phone: '',
    footer_email: '',
    volunteer_enabled: false,
    welcome_text: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeColumnIndex, setResizeColumnIndex] = useState(null);

  // Define columns for the table
  const columns = [
    { key: 'event_id', label: 'Event ID' },
    { key: 'name', label: 'Event Name' },
    { key: 'start_datetime', label: 'Start Date' },
    { key: 'end_datetime', label: 'End Date' },
    { key: 'location', label: 'Location' },
    { key: 'raffle_tickets', label: 'Raffle Text' },
    { key: 'volunteer_enabled', label: 'Volunteer Enabled' },
    { key: 'banner', label: 'Banner' },
    { key: 'header_image', label: 'Header Image' },
    { key: 'footer_location', label: 'Footer Location' },
    { key: 'footer_phone', label: 'Footer Phone' },
    { key: 'footer_email', label: 'Footer Email' },
    { key: 'welcome_text', label: 'Welcome Text' },
    { key: 'created_at', label: 'Created' },
    { key: 'modified_at', label: 'Modified' },
    { key: 'actions', label: 'Actions' },
  ];

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
      hour12: true,
      timeZone: 'America/New_York', // Use EST timezone
    });
  };

  // Format datetime for input fields (YYYY-MM-DDTHH:MM) - Convert to EST
  const formatDateTimeForInput = (datetime) => {
    if (!datetime) return '';
    const date = new Date(datetime);
    
    // Convert to EST timezone
    const estDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    
    const year = estDate.getFullYear();
    const month = String(estDate.getMonth() + 1).padStart(2, '0');
    const day = String(estDate.getDate()).padStart(2, '0');
    const hours = String(estDate.getHours()).padStart(2, '0');
    const minutes = String(estDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to fetch events.');
      }
    };
    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = events.filter(event => {
    return (
      (filters.event_id === '' || event.event_id?.toString().includes(filters.event_id)) &&
      (filters.name === '' || event.name?.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.start_datetime === '' || formatDateTime(event.start_datetime).toLowerCase().includes(filters.start_datetime.toLowerCase())) &&
      (filters.end_datetime === '' || formatDateTime(event.end_datetime).toLowerCase().includes(filters.end_datetime.toLowerCase())) &&
      (filters.location === '' || event.location?.toLowerCase().includes(filters.location.toLowerCase())) &&
      (filters.raffle_tickets === '' || event.raffle_tickets?.toLowerCase().includes(filters.raffle_tickets.toLowerCase())) &&
      (filters.volunteer_enabled === '' || filters.volunteer_enabled === 'all' || 
       (filters.volunteer_enabled === 'yes' && event.volunteer_enabled) ||
       (filters.volunteer_enabled === 'no' && !event.volunteer_enabled)) &&
      (filters.banner === '' || (event.banner && event.banner.toLowerCase().includes(filters.banner.toLowerCase()))) &&
      (filters.header_image === '' || (event.header_image && event.header_image.toLowerCase().includes(filters.header_image.toLowerCase()))) &&
      (filters.footer_location === '' || (event.footer_location && event.footer_location.toLowerCase().includes(filters.footer_location.toLowerCase()))) &&
      (filters.footer_phone === '' || (event.footer_phone && event.footer_phone.toLowerCase().includes(filters.footer_phone.toLowerCase()))) &&
      (filters.footer_email === '' || (event.footer_email && event.footer_email.toLowerCase().includes(filters.footer_email.toLowerCase()))) &&
      (filters.welcome_text === '' || (event.welcome_text && event.welcome_text.toLowerCase().includes(filters.welcome_text.toLowerCase()))) &&
      (filters.created_at === '' || formatDateTime(event.created_at).toLowerCase().includes(filters.created_at.toLowerCase())) &&
      (filters.modified_at === '' || formatDateTime(event.modified_at).toLowerCase().includes(filters.modified_at.toLowerCase()))
    );
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const downloadExcel = () => {
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filteredEvents.map(event => [
      event.event_id || '',
      event.name || '',
      formatDateTime(event.start_datetime) || '',
      formatDateTime(event.end_datetime) || '',
      event.location || '',
      event.raffle_tickets || '',
      event.volunteer_enabled ? 'Yes' : 'No',
      event.banner || '',
      event.header_image || '',
      event.footer_location || '',
      event.footer_phone || '',
      event.footer_email || '',
      event.welcome_text || '',
      formatDateTime(event.created_at) || '',
      formatDateTime(event.modified_at) || '',
      'Actions'
    ].join(',')).join('\n');
    
    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle input changes
  const handleInputChange = (e, isEditing = false) => {
    const { name, value, type, files, checked } = e.target;

    if (type === 'file') {
      const file = files[0];
      if (isEditing) {
        setEditingEvent(prev => ({
          ...prev,
          [name]: file,
        }));
      } else {
        setNewEvent(prev => ({
          ...prev,
          [name]: file,
        }));
      }
    } else if (type === 'radio') {
      // Handle radio button for volunteer_enabled
      const boolValue = value === 'true';
      if (isEditing) {
        setEditingEvent(prev => ({
          ...prev,
          [name]: boolValue,
        }));
      } else {
        setNewEvent(prev => ({
          ...prev,
          [name]: boolValue,
        }));
      }
    } else {
      if (isEditing) {
        setEditingEvent(prev => ({
          ...prev,
          [name]: value,
        }));
      } else {
        setNewEvent(prev => ({
          ...prev,
          [name]: value,
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
      formData.append('raffle_tickets', newEvent.raffle_tickets || '');

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
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(prev => [data.event, ...prev]);
        setNewEvent({
          name: '',
          start_datetime: '',
          end_datetime: '',
          location: '',
          raffle_tickets: '',
          banner: null,
          header_image: null,
          footer_location: '',
          footer_phone: '',
          footer_email: '',
          volunteer_enabled: false,
          welcome_text: '',
        });
        setMessage('Event added successfully!');
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add event.');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      setError('Failed to add event.');
    }
  };

  // Edit event
  const handleEditEvent = async () => {
    if (!editingEvent) {
      setError('No event selected for editing.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', editingEvent.name);
      formData.append('start_datetime', editingEvent.start_datetime);
      formData.append('end_datetime', editingEvent.end_datetime);
      formData.append('location', editingEvent.location);
      formData.append('raffle_tickets', editingEvent.raffle_tickets || '');

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
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setEvents(prev => prev.map(event =>
          event.event_id === editingEvent.event_id ? data.event : event,
        ));
        setEditingEvent(null);
        setMessage('Event updated successfully!');
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update event.');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event.');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEvents(prev => prev.filter(event => event.event_id !== eventId));
        setMessage('Event deleted successfully!');
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete event.');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event.');
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
      [resizeColumnIndex]: newWidth,
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

  // Debug datetime-local inputs
  useEffect(() => {
    const datetimeInputs = document.querySelectorAll('input[type="datetime-local"]');
    console.log('Found datetime-local inputs:', datetimeInputs.length);
    datetimeInputs.forEach((input, index) => {
      console.log(`Input ${index}:`, input);
      console.log(`Input ${index} type:`, input.type);
      console.log(`Input ${index} value:`, input.value);
      console.log(`Input ${index} placeholder:`, input.placeholder);
    });
  }, [events, editingEvent, newEvent]);


  return (
    <div className="event-details-container">
      <SiteHeader navVariant="event-details" />

      {/* Main Content - Force refresh deployment */}
      <main className="event-details-main">
        <div className="event-details-content">
          <h1 className="event-details-title">Event Details</h1>

          {/* Stats and Download Section */}
          <div className="events-stats-section">
            <div className="events-count">
              📋 Total Events: {filteredEvents.length}
            </div>
            <button
              onClick={downloadExcel}
              className="download-excel-button"
            >
              📊 DOWNLOAD EXCEL FILE
            </button>
          </div>

          {/* Events Table */}
          <div className="registrations-table-container">
            {/* Table Header */}
            <div className="table-header-row">
              <div className="header-cell">Event ID</div>
              <div className="header-cell">Event Name</div>
              <div className="header-cell">Start Date</div>
              <div className="header-cell">End Date</div>
              <div className="header-cell">Location</div>
              <div className="header-cell">Raffle Text</div>
              <div className="header-cell">Volunteer Enabled</div>
              <div className="header-cell">Banner</div>
              <div className="header-cell">Header Image</div>
              <div className="header-cell">Footer Location</div>
              <div className="header-cell">Footer Phone</div>
              <div className="header-cell">Footer Email</div>
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
                  value={filters.event_id}
                  onChange={handleFilterChange}
                  placeholder="Filter Event ID"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Filter Event Name"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="start_datetime"
                  value={filters.start_datetime}
                  onChange={handleFilterChange}
                  placeholder="Filter Start Date"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="end_datetime"
                  value={filters.end_datetime}
                  onChange={handleFilterChange}
                  placeholder="Filter End Date"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="Filter Location"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="raffle_tickets"
                  value={filters.raffle_tickets}
                  onChange={handleFilterChange}
                  placeholder="Filter Raffle Text"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <select
                  name="volunteer_enabled"
                  value={filters.volunteer_enabled}
                  onChange={handleFilterChange}
                  className="filter-input"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="filter-cell">
                <input
                  name="banner"
                  value={filters.banner}
                  onChange={handleFilterChange}
                  placeholder="Filter Banner"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="header_image"
                  value={filters.header_image}
                  onChange={handleFilterChange}
                  placeholder="Filter Header Image"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="footer_location"
                  value={filters.footer_location}
                  onChange={handleFilterChange}
                  placeholder="Filter Footer Location"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="footer_phone"
                  value={filters.footer_phone}
                  onChange={handleFilterChange}
                  placeholder="Filter Footer Phone"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="footer_email"
                  value={filters.footer_email}
                  onChange={handleFilterChange}
                  placeholder="Filter Footer Email"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="welcome_text"
                  value={filters.welcome_text}
                  onChange={handleFilterChange}
                  placeholder="Filter Welcome Text"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="created_at"
                  value={filters.created_at}
                  onChange={handleFilterChange}
                  placeholder="Filter Created"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="modified_at"
                  value={filters.modified_at}
                  onChange={handleFilterChange}
                  placeholder="Filter Modified"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  placeholder="Filter Actions"
                  className="filter-input"
                  disabled
                />
              </div>
            </div>

            {/* Data Table */}
            <div className="registrations-table-container">
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
                     placeholder="Select start date & time"
                   />
                 </div>
                 <div className="data-cell">
                   <input
                     type="datetime-local"
                     name="end_datetime"
                     value={newEvent.end_datetime}
                     onChange={(e) => handleInputChange(e)}
                     className="table-input"
                     placeholder="Select end date & time"
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
                    type="text"
                    name="raffle_tickets"
                    value={newEvent.raffle_tickets}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Raffle Tickets"
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
                  <input
                    type="text"
                    name="footer_location"
                    value={newEvent.footer_location}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Footer Location"
                  />
                </div>
                <div className="data-cell">
                  <input
                    type="text"
                    name="footer_phone"
                    value={newEvent.footer_phone}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Footer Phone"
                  />
                </div>
                <div className="data-cell">
                  <input
                    type="email"
                    name="footer_email"
                    value={newEvent.footer_email}
                    onChange={(e) => handleInputChange(e)}
                    className="table-input"
                    placeholder="Footer Email"
                  />
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
                <div key={event.event_id} className={`event-row ${editingEvent && editingEvent.event_id === event.event_id ? 'edit-row' : ''}`}>
                  <div className="data-cell">{event.event_id}</div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editingEvent.name}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    ) : (
                      event.name
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="datetime-local"
                        name="start_datetime"
                        value={formatDateTimeForInput(editingEvent.start_datetime)}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    ) : (
                      formatDateTime(event.start_datetime)
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="datetime-local"
                        name="end_datetime"
                        value={formatDateTimeForInput(editingEvent.end_datetime)}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    ) : (
                      formatDateTime(event.end_datetime)
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="text"
                        name="location"
                        value={editingEvent.location}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                      />
                    ) : (
                      event.location
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="text"
                        name="raffle_tickets"
                        value={editingEvent.raffle_tickets || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Raffle Tickets"
                      />
                    ) : (
                      event.raffle_tickets
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <div>
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
                    ) : (
                      <span className={`volunteer-status ${event.volunteer_enabled ? 'enabled' : 'disabled'}`}>
                        {event.volunteer_enabled ? 'Yes' : 'No'}
                      </span>
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="file"
                        name="banner"
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        accept="image/*"
                      />
                    ) : (
                      event.banner || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="file"
                        name="header_image"
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        accept="image/*"
                      />
                    ) : (
                      event.header_image || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="text"
                        name="footer_location"
                        value={editingEvent.footer_location || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Location"
                      />
                    ) : (
                      event.footer_location || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="text"
                        name="footer_phone"
                        value={editingEvent.footer_phone || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Phone"
                      />
                    ) : (
                      event.footer_phone || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <input
                        type="email"
                        name="footer_email"
                        value={editingEvent.footer_email || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Footer Email"
                      />
                    ) : (
                      event.footer_email || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {editingEvent && editingEvent.event_id === event.event_id ? (
                      <textarea
                        name="welcome_text"
                        value={editingEvent.welcome_text || ''}
                        onChange={(e) => handleInputChange(e, true)}
                        className="table-input"
                        placeholder="Welcome Text"
                        rows="2"
                      />
                    ) : (
                      event.welcome_text || '-'
                    )}
                  </div>
                  <div className="data-cell">
                    {event.created_by_name ? `${event.created_by_name} - ${formatDateTime(event.created_at)}` : formatDateTime(event.created_at)}
                  </div>
                  <div className="data-cell">
                    {event.modified_by_name ? `${event.modified_by_name} - ${formatDateTime(event.modified_at)}` : formatDateTime(event.modified_at)}
                  </div>
                  <div className="data-cell">
                    <div className="action-buttons">
                      {editingEvent && editingEvent.event_id === event.event_id ? (
                        <>
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
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
                             ))}
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className="message success">
              {message}
              <button onClick={() => setMessage('')} className="close-button">×</button>
            </div>
          )}
          {error && (
            <div className="message error">
              {error}
              <button onClick={() => setError('')} className="close-button">×</button>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default EventDetailsPage;

