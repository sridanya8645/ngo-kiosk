import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RaffleWinnersPage.css";

const columns = [
  { key: "registration_id", label: "Registration ID" },
  { key: "name", label: "Winner Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "event_name", label: "Event Name" },
  { key: "win_date", label: "Win Date" },
  { key: "win_time", label: "Win Time" },
];

export default function RaffleWinnersPage() {
  const [winners, setWinners] = useState([]);
  const [filters, setFilters] = useState({
    registration_id: "",
    name: "",
    event_name: "",
    win_date: "",
    email: "",
    phone: "",
    win_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    console.log('RaffleWinnersPage: Starting to fetch raffle winners...');
    setLoading(true);
    setError('');
    
    fetch("https://ngo-kiosk-app.azurewebsites.net/api/raffle-winners")
      .then(res => {
        console.log('RaffleWinnersPage: Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('RaffleWinnersPage: Data received:', data);
        console.log('RaffleWinnersPage: Data type:', typeof data);
        console.log('RaffleWinnersPage: Is array:', Array.isArray(data));
        
        // For testing - if no data, show test data to verify table structure
        if (Array.isArray(data) && data.length === 0) {
          console.log('RaffleWinnersPage: No data found, showing empty table structure');
        }
        
        setWinners(Array.isArray(data) ? data : []);
        setLoading(false);
        setError('');
      })
      .catch((error) => {
        console.error('RaffleWinnersPage: Error fetching raffle winners:', error);
        setError("Failed to load winners.");
        setLoading(false);
      });
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filtered = winners.filter((row) =>
    columns.every((col) => {
      if (!filters[col.key]) return true;
      return row[col.key]?.toString().toLowerCase().includes(filters[col.key].toLowerCase());
    })
  );

  const downloadExcel = () => {
    // Create CSV content
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filtered.map(row => {
      return [
        row.registration_id || '',
        row.name || '',
        row.event_name || '',
        row.win_date || '',
        row.email || '',
        row.phone || '',
        `${row.win_date} ${row.win_time}` || ''
      ].join(',');
    }).join('\n');
    
    const fullCsv = headers + '\n' + csvContent;
    
    // Create and download file
    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `raffle_winners_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="raffle-winners-bg">
      <div className="raffle-winners-aspect">
      {/* Header Section */}
      <header className="raffle-winners-header">
        <div className="header-content">
          <div className="logo-section">
            <img src="/sai-baba.png" alt="Sai Baba" className="logo-image" />
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
            onClick={() => navigate('/admin')}
            className="admin-button"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="admin-registrations-main">
        <div className="admin-registrations-content">
          <h1 className="admin-registrations-title">Raffle Winners</h1>
          

          
          {loading ? (
            <div className="loading-message">Loading winners...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <>
              {/* Stats and Download Section */}
              <div className="winners-stats-section">
                <div className="winners-count">
                  🏆 Total Winners: {filtered.length}
                </div>
                <button 
                  onClick={downloadExcel}
                  className="download-excel-button"
                >
                  📊 DOWNLOAD EXCEL FILE
                </button>
              </div>

              {/* Winners Table */}
              <div className="winners-table-container">
                {/* Table Header */}
                <div className="table-header-row">
                  <div className="header-cell">Registration ID</div>
                  <div className="header-cell">Winner Name</div>
                  <div className="header-cell">Email</div>
                  <div className="header-cell">Phone</div>
                  <div className="header-cell">Event Name</div>
                  <div className="header-cell">Win Date</div>
                  <div className="header-cell">Win Time</div>
                </div>
                
                {/* Filter Row */}
                <div className="filter-row">
                  <div className="filter-cell">
                    <input
                      name="registration_id"
                      value={filters.registration_id}
                      onChange={handleFilterChange}
                      placeholder="Filter Reg"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="name"
                      value={filters.name}
                      onChange={handleFilterChange}
                      placeholder="Filter Win"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="email"
                      value={filters.email}
                      onChange={handleFilterChange}
                      placeholder="Filter Em"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="phone"
                      value={filters.phone}
                      onChange={handleFilterChange}
                      placeholder="Filter Ph"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="event_name"
                      value={filters.event_name}
                      onChange={handleFilterChange}
                      placeholder="Filter Ev"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="win_date"
                      value={filters.win_date}
                      onChange={handleFilterChange}
                      placeholder="Filter Wi"
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-cell">
                    <input
                      name="win_time"
                      value={filters.win_time}
                      onChange={handleFilterChange}
                      placeholder="Filter Ti"
                      className="filter-input"
                    />
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="data-table">
                  {filtered.length === 0 ? (
                    <div className="no-data-message">
                      <span className="no-data-icon">🏆</span>
                      <p>{winners.length === 0 ? "No winners yet. Winners will appear here when raffles are conducted." : "No winners found matching the filters."}</p>
                    </div>
                  ) : (
                    filtered.map((winner, index) => (
                      <div key={index} className="winner-row">
                        <div className="data-cell">{winner.registration_id || '-'}</div>
                        <div className="data-cell">{winner.name || '-'}</div>
                        <div className="data-cell">{winner.email || '-'}</div>
                        <div className="data-cell">{winner.phone || '-'}</div>
                        <div className="data-cell">{winner.event_name || '-'}</div>
                        <div className="data-cell">{winner.win_date || '-'}</div>
                        <div className="data-cell">{winner.win_time || '-'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
        


      {/* Footer */}
      <footer className="raffle-winners-footer">
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
    </div>
  );
} 
