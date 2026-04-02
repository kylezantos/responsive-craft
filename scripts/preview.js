#!/usr/bin/env node

const { execFile, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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
  execFile(cmd, [url], (err) => {
    if (err) console.error(`Could not open browser: ${err.message}`);
  });
}

function buildPreviewUrl(port, targetUrl, breakpoints) {
  const params = new URLSearchParams();
  params.set('url', targetUrl);
  if (breakpoints) params.set('breakpoints', breakpoints);
  return `http://localhost:${port}/_responsive-preview.html?${params.toString()}`;
}

function startServer(serveDir, onReady) {
  // Copy preview.html into the serve directory so it's served over HTTP
  const previewDest = path.join(serveDir, '_responsive-preview.html');
  fs.copyFileSync(PREVIEW_HTML, previewDest);

  const server = spawn('node', [SERVE_SCRIPT, serveDir], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  let ready = false;

  const startupTimeout = setTimeout(() => {
    if (!ready) {
      console.error('Server failed to start within 10 seconds.');
      server.kill();
      try { fs.unlinkSync(previewDest); } catch {}
      process.exit(1);
    }
  }, 10000);

  server.stdout.on('data', (data) => {
    const text = data.toString();
    output += text;
    process.stdout.write(text);

    if (!ready) {
      const match = output.match(/SERVING_PORT:(\d+)/);
      if (match) {
        ready = true;
        clearTimeout(startupTimeout);
        onReady(parseInt(match[1], 10));
      }
    }
  });

  server.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  server.on('close', (code) => {
    clearTimeout(startupTimeout);
    try { fs.unlinkSync(previewDest); } catch {}
    if (code !== 0 && !ready) {
      console.error(`Server exited with code ${code}`);
    }
  });

  function cleanup() {
    server.kill();
    try { fs.unlinkSync(previewDest); } catch {}
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return server;
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
  // Dev server already running — serve preview.html from a temp directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'responsive-preview-'));
  console.log(`Launching responsive preview for ${target}...\n`);

  // Clean up temp dir on exit
  const origCleanup = process.listeners('SIGINT');
  process.on('exit', () => {
    try { fs.rmSync(tmpDir, { recursive: true }); } catch {}
  });

  startServer(tmpDir, (port) => {
    const previewUrl = buildPreviewUrl(port, target, breakpoints);
    console.log(`\nPreview: ${previewUrl}\n`);
    openInBrowser(previewUrl);
  });
} else {
  // Static file — serve the target directory with preview.html alongside it
  const resolvedPath = path.resolve(target);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Path does not exist: ${resolvedPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);
  const serveDir = stat.isDirectory() ? resolvedPath : path.dirname(resolvedPath);
  const fileName = stat.isDirectory() ? 'index.html' : path.basename(resolvedPath);

  console.log(`Launching responsive preview for ${resolvedPath}...\n`);

  startServer(serveDir, (port) => {
    const targetUrl = `http://localhost:${port}/${fileName}`;
    const previewUrl = buildPreviewUrl(port, targetUrl, breakpoints);
    console.log(`\nPreview: ${previewUrl}\n`);
    openInBrowser(previewUrl);
  });
}
