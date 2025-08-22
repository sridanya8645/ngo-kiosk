import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/header.css';

function SiteHeader({ navVariant }) {
	const navigate = useNavigate();

	const renderNav = () => {
		const go = (path) => () => navigate(path);
		if (navVariant === 'none') {
			return null;
		}
		if (navVariant === 'admin-login-only') {
			return (
				<div className="admin-nav-buttons">
					<button className="admin-button" onClick={go('/admin')}>Admin</button>
				</div>
			);
		}
		if (navVariant === 'admin-only') {
			return (
				<div className="admin-nav-buttons">
					<button className="admin-button" onClick={go('/admin/registrations')}>Registration Details</button>
					<button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
					<button className="admin-button" onClick={go('/admin/raffle-winners')}>Raffle Winners</button>
					<button className="admin-button" onClick={go('/event-details')}>Event Details</button>
					<button className="admin-button" onClick={go('/admin')}>Logout</button>
				</div>
			);
		}
		if (navVariant === 'home-only') {
			return (
				<div className="admin-nav-buttons">
					<button className="admin-button" onClick={go('/')}>Home</button>
				</div>
			);
		}
		// default full nav
		return (
			<div className="admin-nav-buttons">
				<button className="admin-button" onClick={go('/')}>Home</button>
				<button className="admin-button" onClick={go('/checkin')}>Check-In</button>
				<button className="admin-button" onClick={go('/register')}>Register</button>
				<button className="admin-button" onClick={go('/event-details')}>Event Details</button>
				<button className="admin-button" onClick={go('/admin/raffle-spin')}>Raffle Spin</button>
				<button className="admin-button" onClick={go('/admin/raffle-winners')}>Winners</button>
				<button className="admin-button" onClick={go('/admin')}>Admin</button>
			</div>
		);
	};

	return (
		<div className="site-header">
			{/* Top header with logo, title and award badge */}
			<div className="header-content">
				<img src="/web_logo.png" alt="IAF Logo" className="logo-image" />
			</div>

			{/* Navigation bar below header */}
			{navVariant !== 'none' && (
				<div className="admin-bar" style={{ marginTop: 0 }}>
					{renderNav()}
				</div>
			)}
		</div>
	);
}

export default SiteHeader;


