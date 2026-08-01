const fs = require('fs');

const content = fs.readFileSync('src/app/masyarakat/data-desa/analisis/page.tsx', 'utf8');
const lines = content.split('\n');

// Find showAgeGroupDetail conditional block
let foundLine = -1;
lines.forEach((line, i) => {
  if (line.includes('showAgeGroupDetail && selectedAgeGroup')) {
    foundLine = i;
    console.log(`Found at line ${i + 1}: ${line.trim()}`);
  }
});

if (foundLine === -1) {
  console.log('Not found');
  process.exit(1);
}

// Count braces from that point
let braceCount = 0;
let parenCount = 0;
let startCounting = false;

for (let i = foundLine; i < lines.length; i++) {
  const line = lines[i];
  
  for (let char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
  }
  
  // Report interesting points
  if (i === foundLine) {
    console.log(`Line ${i + 1}: START { = ${braceCount}, ( = ${parenCount}`);
  } else if (braceCount === 0 && parenCount === 0 && i > foundLine) {
    console.log(`Line ${i + 1}: BALANCED { = ${braceCount}, ( = ${parenCount}`);
    console.log(`  Content: ${line.trim()}`);
    break;
  } else if ((i - foundLine) % 50 === 0) {
    console.log(`Line ${i + 1}: { = ${braceCount}, ( = ${parenCount}`);
  }
}

console.log(`\nFinal: { = ${braceCount}, ( = ${parenCount}`);
