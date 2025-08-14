import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RaffleWinnersPage.css";
import { IS_IAF } from "./orgToggle";

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
    email: "",
    phone: "",
    event_name: "",
    win_date: "",
    win_time: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch("/api/raffle-winners")
      .then(res => { if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`); return res.json(); })
      .then(data => { setWinners(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((error) => { console.error('RaffleWinnersPage: Error fetching raffle winners:', error); setError("Failed to load winners."); setLoading(false); });
  }, []);

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const filtered = winners.filter((row) =>
    columns.every((col) => {
      const v = filters[col.key];
      if (!v) return true;
      return (row[col.key] ?? '').toString().toLowerCase().includes(v.toLowerCase());
    })
  );

  const downloadExcel = () => {
    const headers = columns.map(col => col.label).join(',');
    const csvContent = filtered.map(row => [row.registration_id||'',row.name||'',row.email||'',row.phone||'',row.event_name||'',row.win_date||'',row.win_time||''].join(',')).join('\n');
    const blob = new Blob([headers+'\n'+csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `raffle_winners_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="raffle-winners-bg" style={IS_IAF ? { background: 'linear-gradient(180deg, #CAA3EB 0%, #A566AA 100%)' } : undefined}>
      <div className="raffle-winners-aspect">
        {/* Header Section */}
        {!IS_IAF && (
          <header className="raffle-winners-header">
            <div className="header-content">
              <div className="logo-section"><img src="/sai-baba.png" alt="Sai Baba" className="logo-image" /></div>
              <div className="org-info">A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt</div>
            </div>
          </header>
        )}

        {/* Admin Bar */}
        <div className="admin-bar" style={IS_IAF ? { background: '#000' } : undefined}>
          <div className="admin-nav-buttons">
            <button onClick={() => navigate('/admin/registrations')} className="admin-button" style={IS_IAF ? { background:'#000', color:'#fff', border:'1px solid #fff' } : undefined}>Registration Details</button>
            <button onClick={() => navigate('/admin/raffle-spin')} className="admin-button" style={IS_IAF ? { background:'#000', color:'#fff', border:'1px solid #fff' } : undefined}>Raffle Spin</button>
            <button onClick={() => navigate('/admin/raffle-winners')} className="admin-button" style={IS_IAF ? { background:'#000', color:'#fff', border:'1px solid #fff' } : undefined}>Raffle Winners</button>
            <button onClick={() => navigate('/event-details')} className="admin-button" style={IS_IAF ? { background:'#000', color:'#fff', border:'1px solid #fff' } : undefined}>Event Details</button>
            <button onClick={() => navigate('/admin')} className="admin-button" style={IS_IAF ? { background:'#000', color:'#fff', border:'1px solid #fff' } : undefined}>Logout</button>
          </div>
        </div>

        {/* Main Content */}
        <main className="admin-registrations-main">
          <div className="admin-registrations-content">
            <h1 className="admin-registrations-title" style={IS_IAF ? { color: '#000' } : undefined}>Raffle Winners</h1>

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
                      <div className="no-data-message"><span className="no-data-icon">🏆</span><p>{winners.length === 0 ? "No winners yet. Winners will appear here when raffles are conducted." : "No winners found matching the filters."}</p></div>
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

        {/* Footer */}
        <footer className="raffle-winners-footer" style={IS_IAF ? { background: 'transparent' } : undefined}>
          {IS_IAF ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" />
            </div>
          ) : (
            <div className="footer-content">
              <div className="footer-section"><span className="footer-icon">📍</span><div className="footer-text"><div>Shirdi Sai Dham Inc, 12 Perrine Road,</div><div>Monmouth Junction NJ 08852</div></div></div>
              <div className="footer-section"><span className="footer-icon">📞</span><div className="footer-text"><div>609 937 2800 /</div><div>609 937 2806</div></div></div>
              <div className="footer-section"><span className="footer-icon">✉️</span><span className="footer-text">shirdisaidham1@gmail.com</span></div>
              <div className="footer-section"><span className="powered-text">Powered by</span><img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" /></div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
} 
