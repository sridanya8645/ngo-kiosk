const fs = require('fs');

const cssFiles = [
  'src/RegisterPage.css',
  'src/CheckinPage.css', 
  'src/AdminRegistrationsPage.css',
  'src/AdminPage.css',
  'src/EventDetailsPage.css',
  'src/RaffleSpinPage.css',
  'src/RaffleWinnersPage.css'
];

cssFiles.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace all margin-top: -100px with margin-top: 0
    content = content.replace(/margin-top:\s*-100px/g, 'margin-top: 0');
    
    // Add position and z-index to footer-content
    content = content.replace(
      /\.footer-content\s*{[^}]*}/g,
      (match) => {
        if (!match.includes('position:')) {
          return match.replace('}', '  position: relative;\n  z-index: 10;\n}');
        }
        return match;
      }
    );
    
    // Fix main content height to give more space for footer
    content = content.replace(
      /max-height:\s*calc\(100vh\s*-\s*[0-9]+px\)/g,
      'max-height: calc(100vh - 200px)'
    );
    
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed footer in ${file}`);
  }
});

console.log('🎉 All footer fixes applied!'); 