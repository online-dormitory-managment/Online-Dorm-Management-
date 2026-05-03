
import fs from 'fs';

const content = fs.readFileSync('c:/OnlineDormManagement/client/src/pages/PlacementRequestSimple.jsx', 'utf8');

let braces = 0;
let parens = 0;
let curlies = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curlies++;
    if (char === '}') curlies--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') braces++;
    if (char === ']') braces--;
}

console.log(`Curlies: ${curlies}`);
console.log(`Parens: ${parens}`);
console.log(`Braces: ${braces}`);
