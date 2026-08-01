const fs = require('fs');

const content = fs.readFileSync('src/app/masyarakat/data-desa/analisis/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('Checking lines 2093-2099:');
for (let i = 2093; i <= 2099; i++) {
  if (lines[i-1]) {
    const hex = Buffer.from(lines[i-1]).toString('hex');
    console.log(`\nLine ${i}:`);
    console.log(`  HEX: ${hex}`);
    console.log(`  Text: [${lines[i-1]}]`);
    console.log(`  Length: ${lines[i-1].length}`);
  }
}
