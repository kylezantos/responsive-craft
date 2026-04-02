#!/usr/bin/env node

const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPTS_DIR = __dirname;
const PREVIEW_HTML = path.join(SCRIPTS_DIR, 'preview.html');
const SERVE_SCRIPT = path.join(SCRIPTS_DIR, 'serve-static.js');

function parseArgs(args) {
  let target = null;
  let breakpoints = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--breakpoints' && args[i + 1]) {
      breakpoints = args[i + 1];
      i++;
    } else if (!target) {
      target = args[i];
    }
  }

  return { target, breakpoints };
}

function isUrl(str) {
  return /^https?:\/\//i.test(str);
}

function openInBrowser(url) {
  const cmd = process.platform === 'darwin' ? 'open'
    : process.platform === 'win32' ? 'start'
    : 'xdg-open';
  // Use execFile with array args to prevent shell injection
  execFile(cmd, [url], (err) => {
    if (err) console.error(`Could not open browser: ${err.message}`);
  });
}

function buildPreviewUrl(targetUrl, breakpoints) {
  const params = new URLSearchParams();
  params.set('url', targetUrl);
  if (breakpoints) params.set('breakpoints', breakpoints);
  return `file://${PREVIEW_HTML}?${params.toString()}`;
}

function startStaticServerAndPreview(filePath, breakpoints) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Path does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  // Determine the directory to serve
  const stat = fs.statSync(resolvedPath);
  const serveDir = stat.isDirectory() ? resolvedPath : path.dirname(resolvedPath);
  const fileName = stat.isDirectory() ? 'index.html' : path.basename(resolvedPath);

  console.log(`Starting static server for ${serveDir}...`);

  const server = spawn('node', [SERVE_SCRIPT, serveDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';

  server.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);

    // Wait for the port announcement
    const match = output.match(/SERVING_PORT:(\d+)/);
    if (match) {
      const port = match[1];
      const targetUrl = `http://localhost:${port}/${fileName}`;

      // Build preview URL — serve preview.html via the same server would cause
      // cross-origin issues, so we open it as a file:// URL
      const previewUrl = buildPreviewUrl(targetUrl, breakpoints);
      console.log(`\nOpening responsive preview for ${targetUrl}`);
      openInBrowser(previewUrl);
    }
  });

  server.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`Static server exited with code ${code}`);
    }
  });

  // Clean up on exit
  process.on('SIGINT', () => {
    server.kill();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.kill();
    process.exit(0);
  });
}

// Main
const { target, breakpoints } = parseArgs(process.argv.slice(2));

if (!target) {
  console.log(`
Responsive Preview — See all breakpoints at once

Usage:
  node preview.js <url>              Preview a running dev server
  node preview.js <path>             Preview a static HTML file
  node preview.js <url> --breakpoints 320,768,1920

Examples:
  node preview.js http://localhost:3000
  node preview.js ./index.html
  node preview.js http://localhost:5173 --breakpoints 375,768,1024,1440,1920
  `);
  process.exit(0);
}

if (isUrl(target)) {
  const previewUrl = buildPreviewUrl(target, breakpoints);
  console.log(`Opening responsive preview for ${target}`);
  openInBrowser(previewUrl);
} else {
  startStaticServerAndPreview(target, breakpoints);
}
