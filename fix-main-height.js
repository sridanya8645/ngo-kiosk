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
    
    // Fix main content height to give more space for footer
    content = content.replace(
      /max-height:\s*calc\(100vh\s*-\s*[0-9]+px\)/g,
      'max-height: calc(100vh - 120px)'
    );
    
    // Also fix padding if it's too small
    content = content.replace(
      /padding:\s*[0-9]+px;/g,
      'padding: 20px;'
    );
    
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed main height in ${file}`);
  }
});

console.log('🎉 All main content height fixes applied!'); 