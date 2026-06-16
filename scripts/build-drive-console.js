const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const sources = [
  path.join(root, 'node_modules', 'jspdf', 'dist', 'jspdf.umd.min.js'),
  path.join(root, 'src', 'drive', 'app.js'),
  path.join(root, 'src', 'drive', 'entry.js'),
];

const bundlePath = path.join(root, 'drive-console.bundle.js');
const outPath = path.join(root, 'drive-console.min.js');

for (const file of sources) {
  if (!fs.existsSync(file)) {
    console.error(`Missing: ${file}`);
    process.exit(1);
  }
}

fs.writeFileSync(bundlePath, sources.map((f) => fs.readFileSync(f, 'utf8')).join('\n'));

execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['terser', bundlePath, '-c', '-m', '-o', outPath], {
  stdio: 'inherit',
  shell: true,
});

const size = fs.readFileSync(outPath, 'utf8').length;
console.log(`Built ${outPath} (${size} chars)`);
