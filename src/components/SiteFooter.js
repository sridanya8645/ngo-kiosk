import React from 'react';
import '../styles/footer.css';

function SiteFooter() {
	return (
		<footer className="global-footer">
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
	);
}

export default SiteFooter;


