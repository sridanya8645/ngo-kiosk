import React from 'react';
import '../styles/footer.css';

function SiteFooter() {
	return (
		<footer className="global-footer" style={{ background: 'transparent' }}>
			<div className="footer-content">
				<div className="footer-section">
					<span className="footer-icon">📍</span>
					<div className="footer-text">
						<div>Mercer County Park</div>
						<div>1638 Old Trenton Rd, West Windsor Township, NJ 08550</div>
					</div>
				</div>
				<div className="footer-section">
					<span className="footer-icon">📞</span>
					<div className="footer-text">
						<div>609-937-2806 | 609-937-2800</div>
					</div>
				</div>
				<div className="footer-section">
					<span className="footer-icon">✉️</span>
					<span className="footer-text">Indoamericanfair2016@gmail.com</span>
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


