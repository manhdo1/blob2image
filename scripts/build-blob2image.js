const fs = require('fs');
const path = require('path');
const { buildBundle, ensureDir } = require('./lib/bundle');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src', 'blob2image');

const { outPath, minified } = buildBundle({
  root,
  sources: ['converter.js', 'ui.js', 'entry.js'].map((f) => path.join(src, f)),
  bundleFile: 'blob2image.bundle.js',
  outFile: 'blob2image.min.js',
});

const href = `javascript:${encodeURIComponent(minified)}`;
const publicDir = path.join(root, 'public', 'blob2image');

ensureDir(publicDir);
fs.writeFileSync(path.join(publicDir, 'bookmarklet.href.txt'), href);
fs.writeFileSync(path.join(publicDir, 'install-data.js'), `window.BLOB2IMAGE_HREF=${JSON.stringify(href)};\n`);

console.log(`Built ${outPath} (${minified.length} chars, href ${href.length} chars)`);
