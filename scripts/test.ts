import fs from 'node:fs/promises';
import pdf from 'pdf-parse';

const dataBuffer = await fs.readFile('./contract.pdf');

const { text, numpages, info } = await pdf(dataBuffer);

// `text`   → full document text
// `numpages` → page count
// `info`  → metadata (author, creation date, etc.)

console.log(`Pages: ${numpages}`);
console.log(`Author: ${info.Author}`);
console.log(text.slice(0, 200)); // preview first 200 chars