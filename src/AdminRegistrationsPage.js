import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminRegistrationsPage.css";

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
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/registrations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRegistrations(data);
        } else {
          setRegistrations([]);
        }
      })
      .catch(() => setRegistrations([]));
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
      if (!filters[col.key]) return true;
      return row[col.key]?.toString().toLowerCase().includes(filters[col.key].toLowerCase());
    })
  );

  const handleDeleteAllRegistrations = async () => {
    if (!window.confirm("Are you sure you want to delete all registrations? This action cannot be undone.")) return;
    try {
      const res = await fetch("http://localhost:5000/api/registrations", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setRegistrations([]);
        alert("All registrations deleted.");
      } else {
        alert("Failed to delete registrations.");
      }
    } catch {
      alert("Error deleting registrations.");
    }
  };

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
        row.checkin_date || ''
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
    <div className="adminreg-bg">
      <div className="adminreg-aspect">
        <header className="adminreg-header-centered">
          <img src="/sai baba.png" alt="Logo" className="adminreg-logo" />
          <span className="event-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </header>
        {/* Action Buttons Toolbar */}
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
            onClick={() => navigate('/admin/event-details')}
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
            Event Details
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
        <div className="adminreg-main-content">
          <h1 className="adminreg-title">Registration Details</h1>
          
          {/* Download Section */}
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '2px solid #28a745'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '3rem', color: '#333', fontWeight: 'bold' }}>
                📋 Total Registrations: {filtered.length}
              </div>
              <button 
                onClick={downloadExcel}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '15px 25px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
              >
                📊 DOWNLOAD EXCEL FILE
              </button>
            </div>
          </div>
          
          <div className="adminreg-table-container">
            <table className="adminreg-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
                <tr>
                  {columns.map((col) => (
                    col.key === "checked_in" ? (
                      <th key={col.key}>
                        <select
                          name="checked_in"
                          value={filters.checked_in}
                          onChange={handleFilterChange}
                          className="adminreg-filter-input"
                        >
                          <option value="all">All</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </th>
                    ) : (
                      <th key={col.key}>
                        <input
                          name={col.key}
                          value={filters[col.key] || ""}
                          onChange={handleFilterChange}
                          placeholder={`Filter ${col.label}`}
                          className="adminreg-filter-input"
                        />
                      </th>
                    )
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ textAlign: "center", color: "#222", fontWeight: 500 }}>
                      No registrations found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.email}</td>
                      <td>{row.phone}</td>
                      <td>{row.event_name}</td>
                      <td>{row.event_date}</td>
                      <td>{row.checked_in ? "Yes" : "No"}</td>
                      <td>{row.checkin_date || "Not checked in"}</td>
                      <td>{row.interested_to_volunteer || "No"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <button className="adminreg-logout-btn" onClick={handleLogout}>Logout</button>
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

export default AdminRegistrationsPage; 