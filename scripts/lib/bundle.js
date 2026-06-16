const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function minify(root, bundlePath, outPath) {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['terser', bundlePath, '-c', '-m', '-o', outPath], {
    stdio: 'inherit',
    shell: true,
  });
}

function buildBundle({ root, sources, bundleFile, outFile }) {
  const distDir = path.join(root, 'public', 'dist');
  const bundlePath = path.join(distDir, bundleFile);
  const outPath = path.join(distDir, outFile);

  ensureDir(distDir);

  for (const file of sources) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing source: ${file}`);
    }
  }

  fs.writeFileSync(bundlePath, sources.map((f) => fs.readFileSync(f, 'utf8')).join('\n'));
  minify(root, bundlePath, outPath);

  const minified = fs.readFileSync(outPath, 'utf8');
  return { bundlePath, outPath, minified };
}

module.exports = { buildBundle, ensureDir };
