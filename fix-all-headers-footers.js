const fs = require('fs');
const path = require('path');

// List of all page CSS files
const pageFiles = [
  'src/HomePage.css',
  'src/RegisterPage.css',
  'src/CheckinPage.css',
  'src/AdminPage.css',
  'src/AdminRegistrationsPage.css',
  'src/EventDetailsPage.css',
  'src/RaffleSpinPage.css',
  'src/RaffleWinnersPage.css'
];

// Standard header styling - ALL TEXT BLACK
const standardHeader = `
/* Header - Standard across all pages */
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 15px;
  z-index: 1001;
}

.logo-image {
  height: 50px;
  width: 50px;
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.org-info {
  font-size: 1rem;
  color: #000;
  text-align: center;
  flex: 1;
  margin: 0 20px;
  font-weight: 500;
}

.admin-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-nav-buttons {
  display: flex;
  gap: 10px;
}

.admin-button {
  background: rgba(255, 255, 255, 0.2);
  color: #000;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 5px;
}

.admin-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}
`;

// Standard footer styling - ALL TEXT BLACK and moved up more
const standardFooter = `
/* Footer - Standard across all pages */
.footer-content {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  gap: 20px;
  font-size: 1.9rem;
  color: #000;
  font-weight: bold;
  width: 100%;
  max-width: 100%;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.footer-section {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.footer-section:has(.powered-text) {
  justify-content: flex-end;
}

.footer-icon {
  font-size: 1.5rem;
  color: #000;
}

.footer-text {
  font-size: 1.9rem;
  color: #000;
  font-weight: bold;
  line-height: 1.2;
}

.powered-text {
  font-size: 1.8rem;
  color: #000;
  font-weight: bold;
  margin-right: 8px;
  display: inline-block;
}

.pits-logo {
  height: 25px;
  width: auto;
  object-fit: contain;
}
`;

// Standard footer background for each page
const footerBackgrounds = {
  'src/HomePage.css': '.home-footer',
  'src/RegisterPage.css': '.register-footer',
  'src/CheckinPage.css': '.checkin-footer',
  'src/AdminPage.css': '.admin-footer',
  'src/AdminRegistrationsPage.css': '.admin-registrations-footer',
  'src/EventDetailsPage.css': '.event-details-footer',
  'src/RaffleSpinPage.css': '.raffle-footer',
  'src/RaffleWinnersPage.css': '.raffle-winners-footer'
};

// Standard header background for each page
const headerBackgrounds = {
  'src/HomePage.css': '.home-header',
  'src/RegisterPage.css': '.register-header',
  'src/CheckinPage.css': '.checkin-header',
  'src/AdminPage.css': '.admin-header',
  'src/AdminRegistrationsPage.css': '.admin-registrations-header',
  'src/EventDetailsPage.css': '.event-details-header',
  'src/RaffleSpinPage.css': '.raffle-header',
  'src/RaffleWinnersPage.css': '.raffle-winners-header'
};

console.log('🔧 Fixing header and footer consistency across all pages...');

pageFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Processing: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Get the footer class name for this page
    const footerClass = footerBackgrounds[filePath];
    const headerClass = headerBackgrounds[filePath];

    if (footerClass) {
      // Update footer background to #8B1C1C
      const footerRegex = new RegExp(`(${footerClass.replace('.', '\\.')}\\s*{[^}]*background:\\s*)[^;]+`, 'g');
      content = content.replace(footerRegex, `$1#8B1C1C`);

      // Move footer up by 100px for all pages except admin and register (more aggressive)
      if (filePath !== 'src/AdminPage.css' && filePath !== 'src/RegisterPage.css') {
        const marginTopRegex = new RegExp(`(${footerClass.replace('.', '\\.')}\\s*{[^}]*margin-top:\\s*)[^;]+`, 'g');
        if (content.match(marginTopRegex)) {
          content = content.replace(marginTopRegex, `$1-100px`);
        } else {
          // Add margin-top if it doesn't exist
          const footerBlockRegex = new RegExp(`(${footerClass.replace('.', '\\.')}\\s*{[^}]*)(})`, 'g');
          content = content.replace(footerBlockRegex, `$1  margin-top: -100px;\n$2`);
        }
      }

      // Add standard footer styling if not present
      if (!content.includes('/* Footer - Standard across all pages */')) {
        content += standardFooter;
      }
    }

    if (headerClass) {
      // Add standard header styling if not present
      if (!content.includes('/* Header - Standard across all pages */')) {
        content += standardHeader;
      }
    }

    // Write back the updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('🎉 All pages updated with consistent header and footer styling!'); 