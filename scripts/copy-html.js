const fs = require('fs');
const path = require('path');

// HTML source lives in src/renderer/**, compiled JS goes to dist/renderer/renderer/**
// Copy HTML files alongside their compiled JS counterparts
const SRC = path.join(__dirname, '../src/renderer');
const DIST = path.join(__dirname, '../dist/renderer/renderer');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else if (['.html', '.css', '.png', '.svg', '.ico'].includes(path.extname(entry.name))) {
      fs.copyFileSync(s, d);
      console.log(`  Copied: ${path.relative(path.join(__dirname, '..'), d)}`);
    }
  }
}

copyDir(SRC, DIST);
console.log('✓ HTML assets copied');
