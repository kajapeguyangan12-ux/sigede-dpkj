const fs = require('fs');

const content = fs.readFileSync('src/app/masyarakat/data-desa/analisis/page.tsx', 'utf8');
const lines = content.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;
let inFunction = false;
let functionStart = 0;

lines.forEach((line, i) => {
  if (line.includes('export default function')) {
    inFunction = true;
    functionStart = i + 1;
    console.log(`Function starts at line ${i + 1}`);
  }
  
  if (inFunction) {
    for (let char of line) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
    }
    
    // Report every 100 lines or when count goes negative
    if (i > functionStart && (i % 100 === 0 || braceCount < 0 || parenCount < 0 || bracketCount < 0)) {
      console.log(`Line ${i + 1}: { = ${braceCount}, ( = ${parenCount}, [ = ${bracketCount}`);
    }
  }
});

console.log(`\nFinal counts:`);
console.log(`Braces { }: ${braceCount}`);
console.log(`Parens ( ): ${parenCount}`);
console.log(`Brackets [ ]: ${bracketCount}`);

if (braceCount !== 0) {
  console.log(`\n⚠️  MISMATCH! Missing ${braceCount > 0 ? braceCount + ' closing' : Math.abs(braceCount) + ' opening'} brace(s)`);
}
