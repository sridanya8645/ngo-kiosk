import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RaffleWinnersPage.css';
import SiteHeader from './components/SiteHeader';
import SiteFooter from './components/SiteFooter';

const columns = [
  { key: 'registration_id', label: 'Registration ID' },
  { key: 'name', label: 'Winner Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'event_name', label: 'Event Name' },
  { key: 'win_date', label: 'Win Date' },
  { key: 'win_time', label: 'Win Time' },
];

export default function RaffleWinnersPage () {
  const [winners, setWinners] = useState([]);
  const [filters, setFilters] = useState({
    registration_id: '',
    name: '',
    email: '',
    phone: '',
    event_name: '',
    win_date: '',
    win_time: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/raffle-winners');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setWinners(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('RaffleWinnersPage: Error fetching raffle winners:', error);
        setError('Failed to load winners.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const filtered = winners.filter((row) =>
    columns.every((col) => {
      const v = filters[col.key];
      if (!v) return true;
      return (row[col.key] ?? '').toString().toLowerCase().includes(v.toLowerCase());
    }),
  );

  const downloadExcel = () => {
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filtered.map(row => [
      row.registration_id || '',
      row.name || '',
      row.email || '',
      row.phone || '',
      row.event_name || '',
      row.win_date || '',
      row.win_time || ''
    ].join(',')).join('\n');
    
    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raffle_winners_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="raffle-winners-bg">
      <div className="raffle-winners-aspect">
        <SiteHeader navVariant="raffle-winners" />

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
                <div className="registrations-stats-section">
                  <div className="registrations-count">
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
                <div className="registrations-table-container">
                  <div className="data-table">
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
                        placeholder="Filter Registration ID"
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-cell">
                      <input
                        name="name"
                        value={filters.name}
                        onChange={handleFilterChange}
                        placeholder="Filter Winner Name"
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
                        placeholder="Filter Phone"
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-cell">
                      <input
                        name="event_name"
                        value={filters.event_name}
                        onChange={handleFilterChange}
                        placeholder="Filter Event Name"
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-cell">
                      <input
                        name="win_date"
                        value={filters.win_date}
                        onChange={handleFilterChange}
                        placeholder="Filter Win Date"
                        className="filter-input"
                      />
                    </div>
                    <div className="filter-cell">
                      <input
                        name="win_time"
                        value={filters.win_time}
                        onChange={handleFilterChange}
                        placeholder="Filter Win Time"
                        className="filter-input"
                      />
                    </div>
                  </div>

                  {/* Data Rows */}
                  {filtered.map((winner) => (
                    <div key={winner.id} className="data-row">
                      <div className="data-cell">{winner.registration_id}</div>
                      <div className="data-cell">{winner.name}</div>
                      <div className="data-cell">{winner.email}</div>
                      <div className="data-cell">{winner.phone}</div>
                      <div className="data-cell">{winner.event_name}</div>
                      <div className="data-cell">{winner.win_date}</div>
                      <div className="data-cell">{winner.win_time}</div>
                    </div>
                  ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
