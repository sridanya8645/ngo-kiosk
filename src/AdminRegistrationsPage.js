import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminRegistrationsPage.css";
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const columns = [
  { key: "name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone Number" },
  { key: "event_name", label: "Event Name" },
  { key: "event_date", label: "Event Date" },
  { key: "checked_in", label: "Checked In" },
  { key: "checkin_date", label: "Checkin Date" },
  { key: "interested_to_volunteer", label: "Volunteer?" },
];

function AdminRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone: "",
    event_name: "",
    event_date: "",
    checked_in: "",
    checkin_date: "",
    interested_to_volunteer: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/registrations");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log('Registrations data:', data);
        const normalized = data.map(r => ({
          ...r,
          interested_to_volunteer: (r.interested_to_volunteer === 1 || r.interested_to_volunteer === true || r.interested_to_volunteer === '1') ? 'Yes' : (r.interested_to_volunteer === 'Yes' ? 'Yes' : 'No')
        }));
        setRegistrations(normalized);
      } catch (error) {
        console.error('Error fetching registrations:', error);
      }
    })();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filtered = registrations.filter((row) =>
    columns.every((col) => {
      if (col.key === "checked_in") {
        if (!filters.checked_in || filters.checked_in === "all") return true;
        if (filters.checked_in === "yes") return row.checked_in === 1;
        if (filters.checked_in === "no") return row.checked_in === 0;
        return true;
      }
      if (col.key === "interested_to_volunteer") {
        if (!filters.interested_to_volunteer || filters.interested_to_volunteer === "all") return true;
        if (filters.interested_to_volunteer === "yes") return row.interested_to_volunteer === "Yes";
        if (filters.interested_to_volunteer === "no") return row.interested_to_volunteer === "No";
        return true;
      }
      if (!filters[col.key]) return true;
      return row[col.key]?.toString().toLowerCase().includes(filters[col.key].toLowerCase());
    })
  );

  const handleLogout = () => {
    navigate("/admin");
  };

  const downloadExcel = () => {
    // Create CSV content
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filtered.map(row => {
      return [
        row.name || '',
        row.email || '',
        row.phone || '',
        row.event_name || '',
        row.event_date || '',
        row.checked_in ? 'Yes' : 'No',
        row.checkin_date || '',
        row.interested_to_volunteer || 'No'
      ].join(',');
    }).join('\n');
    
    const fullCsv = headers + '\n' + csvContent;
    
    // Create and download file
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-registrations-bg">
      <div className="admin-registrations-aspect">
        <SiteHeader navVariant="admin-only" />

      {/* Admin nav handled by SiteHeader */}

      {/* Main Content */}
      <main className="admin-registrations-main">
        <div className="admin-registrations-content">
          <h1 className="admin-registrations-title">Registration Details</h1>
          
          {/* Stats and Download Section */}
          <div className="registrations-stats-section">
            <div className="registrations-count">
              📋 Total Registrations: {filtered.length}
            </div>
            <button 
              onClick={downloadExcel}
              className="download-excel-button"
            >
              📊 DOWNLOAD EXCEL FILE
            </button>
          </div>

                    {/* Registrations Table */}
          <div className="registrations-table-container">
            {/* Table Header */}
            <div className="table-header-row">
              <div className="header-cell">Full Name</div>
              <div className="header-cell">Email</div>
              <div className="header-cell">Phone Number</div>
              <div className="header-cell">Event Name</div>
              <div className="header-cell">Event Date</div>
              <div className="header-cell">Checked In</div>
              <div className="header-cell">Checkin Date</div>
              <div className="header-cell">Volunteer?</div>
            </div>

            {/* Filter Row */}
            <div className="filter-row">
              <div className="filter-cell">
                <input
                  name="name"
                  value={filters.name}
                  onChange={handleFilterChange}
                  placeholder="Filter Full"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="email"
                  value={filters.email}
                  onChange={handleFilterChange}
                  placeholder="Filter Email"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="phone"
                  value={filters.phone}
                  onChange={handleFilterChange}
                  placeholder="Filter Phon"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="event_name"
                  value={filters.event_name}
                  onChange={handleFilterChange}
                  placeholder="Filter Eve"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <input
                  name="event_date"
                  value={filters.event_date}
                  onChange={handleFilterChange}
                  placeholder="Filter Ever"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <select
                  name="checked_in"
                  value={filters.checked_in}
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
                  name="checkin_date"
                  value={filters.checkin_date}
                  onChange={handleFilterChange}
                  placeholder="Filter Checkin Date"
                  className="filter-input"
                />
              </div>
              <div className="filter-cell">
                <select
                  name="interested_to_volunteer"
                  value={filters.interested_to_volunteer}
                  onChange={handleFilterChange}
                  className="filter-input"
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="data-table">
              {filtered.length === 0 ? (
                <div className="no-data-message">
                  <span className="no-data-icon">📋</span>
                  <p>No registrations found matching the filters.</p>
                </div>
              ) : (
                filtered.map((registration, index) => (
                  <div key={index} className="registration-row">
                    <div className="data-cell">{registration.name || '-'}</div>
                    <div className="data-cell">{registration.email || '-'}</div>
                    <div className="data-cell">{registration.phone || '-'}</div>
                    <div className="data-cell">{registration.event_name || '-'}</div>
                    <div className="data-cell">{registration.event_date || '-'}</div>
                    <div className="data-cell">
                      <span className={`status-badge ${registration.checked_in ? 'checked-in' : 'not-checked'}`}>
                        {registration.checked_in ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="data-cell">{registration.checkin_date || '-'}</div>
                    <div className="data-cell">
                      <span className={`volunteer-badge ${registration.interested_to_volunteer === 'Yes' ? 'interested' : 'not-interested'}`}>
                        {registration.interested_to_volunteer || 'No'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>



      <SiteFooter />
      </div>
    </div>
  );
}

export default AdminRegistrationsPage; 
