import React, { useState, useEffect } from 'react';
import '../styles/footer.css';

function SiteFooter() {
	const [currentEvent, setCurrentEvent] = useState(null);

	useEffect(() => {
		const fetchCurrentEvent = async () => {
			try {
				const response = await fetch('/api/todays-event');
				if (response.ok) {
					const event = await response.json();
					setCurrentEvent(event);
				}
			} catch (error) {
				console.error('Error fetching current event:', error);
			}
		};

		fetchCurrentEvent();
	}, []);

	// Use event-specific footer info if available, otherwise use defaults
	const footerLocation = currentEvent?.footer_location || 'Mercer County Park';
	const footerLocationDetails = currentEvent?.footer_location ? '' : '1638 Old Trenton Rd, West Windsor Township, NJ 08550';
	const footerPhone = currentEvent?.footer_phone || '609-937-2806 | 609-937-2800';
	const footerEmail = currentEvent?.footer_email || 'Indoamericanfair2016@gmail.com';

	return (
		<footer className="global-footer" style={{ background: 'transparent' }}>
			<div className="footer-content">
				<div className="footer-section">
					<span className="footer-icon">📍</span>
					<div className="footer-text">
						<div>{footerLocation}</div>
						{footerLocationDetails && <div>{footerLocationDetails}</div>}
					</div>
				</div>
				<div className="footer-section">
					<span className="footer-icon">📞</span>
					<div className="footer-text">
						<div>{footerPhone}</div>
					</div>
				</div>
				<div className="footer-section">
					<span className="footer-icon">✉️</span>
					<span className="footer-text">{footerEmail}</span>
				</div>
				<div className="footer-section">
					<span className="powered-text">Powered by</span>
					<img src="/PITS-removebg-preview.png" alt="Princeton IT Services" className="pits-logo" />
				</div>
			</div>
		</footer>
	);
}

export default SiteFooter;


