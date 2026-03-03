const fs = require('fs');

// Grüner Dama-Stein als Base64 SVG
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4ade80" />
      <stop offset="50%" stop-color="#22c55e" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="200" fill="url(#grad)" stroke="#166534" stroke-width="8"/>
  <circle cx="156" cy="156" r="50" fill="white" opacity="0.3"/>
  <circle cx="356" cy="356" r="30" fill="white" opacity="0.2"/>
</svg>`;

fs.writeFileSync('app/icon.svg', svgContent);
console.log('✅ icon.svg erstellt');

// Für PNGs brauchst du ein Tool wie sharp
console.log('Für PNGs: npm install sharp und dann konvertieren');