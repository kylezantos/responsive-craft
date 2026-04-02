#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_BREAKPOINTS = [375, 768, 1024, 1440];
const DEFAULT_HEIGHT = 900;
const DEV_BROWSER_TMP = path.join(require('os').homedir(), '.dev-browser', 'tmp');

function parseArgs(args) {
  let url = null;
  let breakpoints = DEFAULT_BREAKPOINTS;
  let isBefore = false;
  let outputDir = './snapshots';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--breakpoints' && args[i + 1]) {
      breakpoints = args[i + 1].split(',').map(w => parseInt(w.trim(), 10)).filter(n => !isNaN(n));
      i++;
    } else if (args[i] === '--before') {
      isBefore = true;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (!url) {
      url = args[i];
    }
  }

  return { url, breakpoints, isBefore, outputDir };
}

function captureScreenshot(url, width, outputName) {
  const script = `
    const page = await browser.newPage();
    await page.setViewportSize({ width: ${width}, height: ${DEFAULT_HEIGHT} });
    await page.goto("${url.replace(/"/g, '\\"')}", { waitUntil: "networkidle" });
    const buf = await page.screenshot({ fullPage: true });
    const savedPath = await saveScreenshot(buf, "${outputName}");
    console.log(savedPath);
  `;

  try {
    const result = execSync(`dev-browser --headless <<'DEVEOF'\n${script}\nDEVEOF`, {
      encoding: 'utf8',
      timeout: 30000,
    }).trim();
    return result.split('\n').pop(); // Last line is the path
  } catch (err) {
    if (err.message && err.message.includes('ENOENT')) {
      console.error('Error: dev-browser is not installed or not in PATH.');
      console.error('Install it to use the snapshot feature.');
      process.exit(1);
    }
    throw err;
  }
}

function generateCompositeHtml(screenshots, breakpoints) {
  const images = screenshots.map((shot, i) => {
    const imgData = fs.readFileSync(shot);
    const base64 = imgData.toString('base64');
    return `
      <div style="flex-shrink:0; text-align:center;">
        <div style="font-size:14px; font-weight:600; margin-bottom:8px; color:#e0e0e0;">
          ${breakpoints[i]}px
        </div>
        <img src="data:image/png;base64,${base64}" style="border:1px solid #333; border-radius:4px;" />
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Snapshots</title>
  <style>
    body { margin:0; padding:24px; background:#0a0a0a; font-family:system-ui,sans-serif; }
    .container { display:flex; gap:24px; overflow-x:auto; padding-bottom:16px; }
  </style>
</head>
<body>
  <div class="container">${images}</div>
</body>
</html>`;
}

function generateComparisonHtml(beforeShots, afterShots, breakpoints) {
  const pairs = breakpoints.map((bp, i) => {
    const beforePath = beforeShots[i];
    const afterPath = afterShots[i];

    if (!beforePath || !afterPath) return '';

    const beforeData = fs.readFileSync(beforePath).toString('base64');
    const afterData = fs.readFileSync(afterPath).toString('base64');

    return `
      <div style="flex-shrink:0; text-align:center;">
        <div style="font-size:14px; font-weight:600; margin-bottom:8px; color:#e0e0e0;">
          ${bp}px
        </div>
        <div style="display:flex; gap:8px;">
          <div>
            <div style="font-size:11px; color:#888; margin-bottom:4px;">BEFORE</div>
            <img src="data:image/png;base64,${beforeData}" style="border:1px solid #555; border-radius:4px; max-width:${bp}px;" />
          </div>
          <div>
            <div style="font-size:11px; color:#888; margin-bottom:4px;">AFTER</div>
            <img src="data:image/png;base64,${afterData}" style="border:1px solid #555; border-radius:4px; max-width:${bp}px;" />
          </div>
        </div>
      </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Responsive Comparison — Before / After</title>
  <style>
    body { margin:0; padding:24px; background:#0a0a0a; font-family:system-ui,sans-serif; }
    h1 { font-size:18px; color:#ccc; margin-bottom:20px; }
    .container { display:flex; gap:32px; overflow-x:auto; padding-bottom:16px; }
  </style>
</head>
<body>
  <h1>Before / After Comparison</h1>
  <div class="container">${pairs}</div>
</body>
</html>`;
}

// Main
const { url, breakpoints, isBefore, outputDir } = parseArgs(process.argv.slice(2));

if (!url) {
  console.log(`
Responsive Snapshot — Capture screenshots at every breakpoint

Usage:
  node snapshot.js <url>                          Capture at default breakpoints
  node snapshot.js <url> --before                 Save as baseline for comparison
  node snapshot.js <url> --breakpoints 320,768    Custom breakpoints
  node snapshot.js <url> --output ./my-shots      Custom output directory

Examples:
  node snapshot.js http://localhost:3000
  node snapshot.js http://localhost:3000 --before
  node snapshot.js http://localhost:3000 --breakpoints 375,768,1024,1440,1920
  `);
  process.exit(0);
}

// Determine output paths
const targetDir = isBefore ? path.join(outputDir, 'before') : outputDir;
fs.mkdirSync(targetDir, { recursive: true });

console.log(`Capturing ${breakpoints.length} breakpoints for ${url}...`);
console.log(`Breakpoints: ${breakpoints.join(', ')}px`);
console.log(`Output: ${path.resolve(targetDir)}\n`);

const screenshots = [];

for (const width of breakpoints) {
  const name = `snapshot-${width}.png`;
  process.stdout.write(`  ${width}px... `);

  try {
    const tmpPath = captureScreenshot(url, width, name);

    // Copy from dev-browser tmp to our output directory
    const destPath = path.join(targetDir, name);
    fs.copyFileSync(tmpPath, destPath);
    screenshots.push(destPath);

    console.log('done');
  } catch (err) {
    console.log(`failed: ${err.message}`);
    screenshots.push(null);
  }
}

const validShots = screenshots.filter(Boolean);

if (validShots.length === 0) {
  console.error('\nNo screenshots captured. Check that the URL is accessible.');
  process.exit(1);
}

// Generate composite HTML
const compositeHtml = generateCompositeHtml(validShots, breakpoints);
const compositeHtmlPath = path.join(targetDir, 'composite.html');
fs.writeFileSync(compositeHtmlPath, compositeHtml);
console.log(`\nComposite: ${compositeHtmlPath}`);

// Generate comparison if before/ exists and we're not in --before mode
if (!isBefore) {
  const beforeDir = path.join(outputDir, 'before');
  if (fs.existsSync(beforeDir)) {
    console.log('\nBefore/ directory found — generating comparison...');

    const beforeShots = breakpoints.map(bp => {
      const p = path.join(beforeDir, `snapshot-${bp}.png`);
      return fs.existsSync(p) ? p : null;
    });

    const matchingBps = breakpoints.filter((bp, i) => beforeShots[i] && screenshots[i]);

    if (matchingBps.length > 0) {
      const comparisonHtml = generateComparisonHtml(
        matchingBps.map(bp => path.join(beforeDir, `snapshot-${bp}.png`)),
        matchingBps.map(bp => path.join(outputDir, `snapshot-${bp}.png`)),
        matchingBps
      );
      const comparisonPath = path.join(outputDir, 'comparison.html');
      fs.writeFileSync(comparisonPath, comparisonHtml);
      console.log(`Comparison: ${comparisonPath}`);
    } else {
      console.log('No matching breakpoints between before and after — skipping comparison.');
    }
  }
}

console.log('\nDone!');
