import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

function SiteHeader() {
	const navigate = useNavigate();

	return (
		<div className="site-header">
			{/* Top header with logo, title and award badge */}
			<div className="header-content" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
				<div className="logo-section">
					<img src="/web_logo.png" alt="IAF Logo" className="logo-image" />
					<div className="header-title">Indo American Fair 2025</div>
				</div>
				<div className="header-right">
					<img src="/header_award.png" alt="Award" className="award-image" />
				</div>
			</div>

			{/* Navigation bar below header */}
			<div className="admin-bar" style={{ marginTop: 0 }}>
				<div className="admin-nav-buttons">
					<button className="admin-button" onClick={() => navigate('/')}>Home</button>
					<button className="admin-button" onClick={() => navigate('/checkin')}>Check-In</button>
					<button className="admin-button" onClick={() => navigate('/register')}>Register</button>
					<button className="admin-button" onClick={() => navigate('/event-details')}>Event Details</button>
					<button className="admin-button" onClick={() => navigate('/admin/raffle-spin')}>Raffle Spin</button>
					<button className="admin-button" onClick={() => navigate('/admin/raffle-winners')}>Winners</button>
					<button className="admin-button" onClick={() => navigate('/admin')}>Admin</button>
				</div>
			</div>
		</div>
	);
}

export default SiteHeader;


