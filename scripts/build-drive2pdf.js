const path = require('path');
const { buildBundle } = require('./lib/bundle');

const root = path.join(__dirname, '..');

const { outPath, minified } = buildBundle({
  root,
  sources: [
    path.join(root, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js'),
    path.join(root, 'src', 'drive2pdf', 'app.js'),
    path.join(root, 'src', 'drive2pdf', 'entry.js'),
  ],
  bundleFile: 'drive2pdf.bundle.js',
  outFile: 'drive2pdf.min.js',
});

console.log(`Built ${outPath} (${minified.length} chars)`);
