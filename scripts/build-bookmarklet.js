const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const sources = ['converter.js', 'ui.js', 'bookmarklet.js'].map((f) => path.join(root, 'src', f));
const bundlePath = path.join(root, 'bookmarklet.bundle.js');
const outPath = path.join(root, 'bookmarklet.min.js');

fs.writeFileSync(bundlePath, sources.map((f) => fs.readFileSync(f, 'utf8')).join('\n'));

execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['terser', bundlePath, '-c', '-m', '-o', outPath], {
  stdio: 'inherit',
  shell: true,
});

const minified = fs.readFileSync(outPath, 'utf8');
const href = `javascript:${encodeURIComponent(minified)}`;

fs.writeFileSync(path.join(root, 'bookmarklet.href.txt'), href);
fs.writeFileSync(path.join(root, 'src', 'install-data.js'), `window.BLOB2IMAGE_HREF=${JSON.stringify(href)};\n`);

console.log(`Built ${outPath} (${minified.length} chars, href ${href.length} chars)`);
