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
    const csvContent = filtered.map(row => [row.registration_id || '',row.name || '',row.email || '',row.phone || '',row.event_name || '',row.win_date || '',row.win_time || ''].join(',')).join('\n');
    const blob = new Blob([headers + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raffle_winners_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
                <div className="winners-stats-section">
                  <div className="winners-count">🏆 Total Winners: {filtered.length}</div>
                  <button onClick={downloadExcel} className="download-excel-button">📊 DOWNLOAD EXCEL FILE</button>
                </div>

                {/* Use the same table container/row classes as Event Details */}
                <div className="events-table-container winners-table-container">
                  <div className="table-header-row">
                    {columns.map(c => (<div className="header-cell" key={c.key}>{c.label}</div>))}
                  </div>

                  <div className="filter-row">
                    <div className="filter-cell"><input name="registration_id" value={filters.registration_id} onChange={handleFilterChange} placeholder="Filter Registration ID" className="filter-input" /></div>
                    <div className="filter-cell"><input name="name" value={filters.name} onChange={handleFilterChange} placeholder="Filter Winner Name" className="filter-input" /></div>
                    <div className="filter-cell"><input name="email" value={filters.email} onChange={handleFilterChange} placeholder="Filter Email" className="filter-input" /></div>
                    <div className="filter-cell"><input name="phone" value={filters.phone} onChange={handleFilterChange} placeholder="Filter Phone" className="filter-input" /></div>
                    <div className="filter-cell"><input name="event_name" value={filters.event_name} onChange={handleFilterChange} placeholder="Filter Event Name" className="filter-input" /></div>
                    <div className="filter-cell"><input name="win_date" value={filters.win_date} onChange={handleFilterChange} placeholder="Filter Win Date" className="filter-input" /></div>
                    <div className="filter-cell"><input name="win_time" value={filters.win_time} onChange={handleFilterChange} placeholder="Filter Win Time" className="filter-input" /></div>
                  </div>

                  <div className="data-table">
                    {filtered.length === 0 ? (
                      <div className="no-data-message"><span className="no-data-icon">🏆</span><p>{winners.length === 0 ? 'No winners yet. Winners will appear here when raffles are conducted.' : 'No winners found matching the filters.'}</p></div>
                    ) : (
                      filtered.map((w, idx) => (
                        <div key={idx} className="event-row winner-row">
                          <div className="data-cell">{w.registration_id || '-'}</div>
                          <div className="data-cell">{w.name || '-'}</div>
                          <div className="data-cell">{w.email || '-'}</div>
                          <div className="data-cell">{w.phone || '-'}</div>
                          <div className="data-cell">{w.event_name || '-'}</div>
                          <div className="data-cell">{w.win_date || (w.won_at ? new Date(w.won_at).toISOString().split('T')[0] : '-')}</div>
                          <div className="data-cell">{w.win_time || (w.won_at ? new Date(w.won_at).toTimeString().slice(0,8) : '-')}</div>
                        </div>
                      ))
                    )}
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
