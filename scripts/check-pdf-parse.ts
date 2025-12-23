const pdfLib = require("pdf-parse");
console.log("Export type:", typeof pdfLib);
console.log("Keys:", Object.keys(pdfLib));

if (typeof pdfLib === 'function') {
    console.log("It is a function (standard behavior).");
} else if (pdfLib.default && typeof pdfLib.default === 'function') {
    console.log("It has a default export function.");
} else {
    console.log("It is an object.");
}
