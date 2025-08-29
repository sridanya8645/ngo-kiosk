import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminRegistrationsPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const columns = [
  { key: 'id', label: 'Registration ID' },
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'event_name', label: 'Event Name' },
  { key: 'event_date', label: 'Event Date' },
  { key: 'checked_in', label: 'Checked In' },
  { key: 'checkin_date', label: 'Checkin Date' },
  { key: 'interested_to_volunteer', label: 'Volunteer?' },
];

function AdminRegistrationsPage () {
  const [registrations, setRegistrations] = useState([]);
  const [filters, setFilters] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    event_name: '',
    event_date: '',
    checked_in: '',
    checkin_date: '',
    interested_to_volunteer: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/registrations');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('Registrations data:', data);
        const normalized = data.map(r => ({
          ...r,
          interested_to_volunteer: (r.interested_to_volunteer === 1 || r.interested_to_volunteer === true || r.interested_to_volunteer === '1') ? 'Yes' : (r.interested_to_volunteer === 'Yes' ? 'Yes' : 'No'),
        }));
        setRegistrations(normalized);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      }
    })();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteAllRegistrations = async () => {
    if (window.confirm('Are you sure you want to delete ALL registrations? This action cannot be undone and will remove all registration data.')) {
      try {
        const response = await fetch('/api/registrations', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const result = await response.json();
          setRegistrations([]);
          alert(result.message || 'All registrations deleted successfully!');
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to delete registrations. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting registrations:', error);
        alert('Failed to delete registrations. Please try again.');
      }
    }
  };

  const filtered = registrations.filter((row) =>
    columns.every((col) => {
      if (col.key === 'checked_in') {
        if (!filters.checked_in || filters.checked_in === 'all') return true;
        if (filters.checked_in === 'yes') return row.checked_in === 1;
        if (filters.checked_in === 'no') return row.checked_in === 0;
        return true;
      }
      if (col.key === 'interested_to_volunteer') {
        if (!filters.interested_to_volunteer || filters.interested_to_volunteer === 'all') return true;
        if (filters.interested_to_volunteer === 'yes') return row.interested_to_volunteer === 'Yes';
        if (filters.interested_to_volunteer === 'no') return row.interested_to_volunteer === 'No';
        return true;
      }
      if (!filters[col.key]) return true;
      return row[col.key]?.toString().toLowerCase().includes(filters[col.key].toLowerCase());
    })
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const downloadExcel = () => {
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filtered.map(row => [
      row.id || '',
      row.name || '',
      row.email || '',
      row.phone || '',
      row.event_name || '',
      formatDate(row.event_date) || '',
      row.checked_in ? 'Yes' : 'No',
      formatDateTime(row.checkin_date) || '',
      row.interested_to_volunteer || ''
    ].join(',')).join('\n');
    
    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-registrations-bg">
      <div className="admin-registrations-aspect">
        <SiteHeader navVariant="admin-registrations" />
        
        <div className="admin-registrations-container">
          <div className="admin-registrations-main">
            <div className="admin-registrations-content">
              <h1 className="admin-registrations-title">Registration Details</h1>
              
              {/* Stats and Download Section */}
              <div className="registrations-stats-section">
                <div className="registrations-count">
                  Total Registrations: {registrations.length} | Filtered: {filtered.length}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={downloadExcel}
                    className="download-excel-button"
                  >
                    📊 Download Excel
                  </button>
                  <button 
                    onClick={handleDeleteAllRegistrations}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#c82333'}
                    onMouseOut={(e) => e.target.style.background = '#dc3545'}
                  >
                    🗑️ Delete All
                  </button>
                </div>
              </div>

              <div className="registrations-table-container">
                {/* Table Header */}
                <div className="table-header-row">
                  {columns.map((col) => (
                    <div key={col.key} className="header-cell">
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Filter Row */}
                <div className="filter-row">
                  {columns.map((col) => (
                    <div key={col.key} className="filter-cell">
                      {col.key === 'checked_in' ? (
                        <select
                          name={col.key}
                          value={filters[col.key]}
                          onChange={handleFilterChange}
                          className="filter-input"
                        >
                          <option value="all">All</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      ) : col.key === 'interested_to_volunteer' ? (
                        <select
                          name={col.key}
                          value={filters[col.key]}
                          onChange={handleFilterChange}
                          className="filter-input"
                        >
                          <option value="all">All</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          name={col.key}
                          value={filters[col.key]}
                          onChange={handleFilterChange}
                          placeholder={`Filter ${col.label}`}
                          className="filter-input"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Data Table */}
                <div className="data-table">
                  {filtered.length === 0 ? (
                    <div className="no-data-message">
                      No registrations found matching the filters.
                    </div>
                  ) : (
                    filtered.map((registration) => (
                      <div key={registration.id} className="data-row">
                        <div className="data-cell">{registration.id}</div>
                        <div className="data-cell">{registration.name}</div>
                        <div className="data-cell">{registration.email}</div>
                        <div className="data-cell">{registration.phone}</div>
                        <div className="data-cell">{registration.event_name}</div>
                        <div className="data-cell">{formatDate(registration.event_date)}</div>
                        <div className="data-cell">
                          <span className={`status-badge ${registration.checked_in ? 'checked-in' : 'not-checked-in'}`}>
                            {registration.checked_in ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="data-cell">{formatDateTime(registration.checkin_date)}</div>
                        <div className="data-cell">
                          <span className={`volunteer-badge ${registration.interested_to_volunteer === 'Yes' ? 'volunteer-yes' : 'volunteer-no'}`}>
                            {registration.interested_to_volunteer}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <SiteFooter />
      </div>
    </div>
  );
}

export default AdminRegistrationsPage;
