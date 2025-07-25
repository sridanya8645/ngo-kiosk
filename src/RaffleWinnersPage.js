import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EventDetailsPage.css";

const columns = [
  { key: "registration_id", label: "Registration ID" },
  { key: "name", label: "Name" },
  { key: "event_name", label: "Event" },
  { key: "win_date", label: "Date" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "win_time", label: "Won At" },
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
    fetch("http://localhost:5000/api/raffle-winners")
      .then(res => res.json())
      .then(data => {
        setWinners(data);
        setLoading(false);
      })
      .catch(() => {
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
    <div className="event-bg">
      <div className="event-aspect">
        <header className="event-header event-header-centered">
          <img src="/sai baba.png" alt="Sai Logo" className="event-logo" />
          <span className="event-org-info">
            A 501 (C) 3 non profit Organization | Tax Exempt Tax Id - 91-2190340 | All donations are tax exempt
          </span>
        </header>
        
        {/* Red Navigation Bar */}
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
            onClick={() => navigate('/registration-details')}
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
            Registration Details
          </button>
          <div style={{ width: '2px', height: '30px', background: 'white', margin: '0 10px' }}></div>
          <button
            onClick={() => navigate('/raffle-spin')}
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
            onClick={() => navigate('/event-details')}
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
        </div>

        <main className="event-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', flex: 1, width: '100%' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#8B1C1C', marginBottom: 32, marginTop: 32 }}>Raffle Winners</h1>
          
          {loading ? (
            <div>Loading winners...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : winners.length === 0 ? (
            <div style={{ color: '#8B1C1C', fontWeight: 'bold', fontSize: '2rem' }}>No winners yet.</div>
          ) : (
            <>
              {/* Stats and Download Section */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                width: '100%',
                maxWidth: '100%',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '2.5rem', color: '#8B1C1C', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  🏆 Total Winners: {filtered.length}
                </div>
                <button 
                  onClick={downloadExcel}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  📊 DOWNLOAD EXCEL FILE
                </button>
              </div>

              <div style={{ width: '100%', margin: '0 auto', maxHeight: 500, overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #8B1C1C' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                    <tr style={{ background: '#8B1C1C', color: 'white', fontSize: '2.5rem' }}>
                      {columns.map((col) => (
                        <th key={col.key} style={{ padding: 12, border: '1px solid #8B1C1C', textAlign: 'left' }}>{col.label}</th>
                      ))}
                    </tr>
                    <tr style={{ background: '#f8f9fa' }}>
                      {columns.map((col) => (
                        <th key={col.key} style={{ padding: 8, border: '1px solid #ddd' }}>
                          <input
                            name={col.key}
                            value={filters[col.key] || ""}
                            onChange={handleFilterChange}
                            placeholder={`Filter ${col.label}`}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '1.8rem'
                            }}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} style={{ textAlign: "center", color: "#222", fontWeight: 500, fontSize: '2rem', padding: '20px' }}>
                          No winners found matching the filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map(w => (
                        <tr key={w.id} style={{ borderBottom: '1px solid #eee', fontSize: '2.2rem' }}>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.registration_id}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.name}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.event_name}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.win_date}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.email}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.phone}</td>
                          <td style={{ padding: 10, border: '1px solid #8B1C1C', wordBreak: 'break-word', whiteSpace: 'normal' }}>{w.win_date}, {w.win_time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
        
        {/* Centered Logout Button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 0 0', width: '100%' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#8B1C1C',
              color: 'white',
              fontSize: '3.5rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 12,
              padding: '12px 48px',
              cursor: 'pointer',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#6B0F0F';
              e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#8B1C1C';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }}
          >
            Logout
          </button>
        </div>
        
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