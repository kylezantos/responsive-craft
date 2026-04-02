#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.webm': 'video/webm',
};

const LIVE_RELOAD_SCRIPT = `
<script>
(function() {
  var source = new EventSource('/__reload');
  source.onmessage = function() { location.reload(); };
  source.onerror = function() { source.close(); };
})();
</script>
`;

const rootDir = path.resolve(process.argv[2] || '.');
let startPort = parseInt(process.argv[3], 10) || 8787;

if (!fs.existsSync(rootDir)) {
  console.error(`Error: Directory does not exist: ${rootDir}`);
  process.exit(1);
}

// Track SSE clients for live reload
const reloadClients = [];

// Watch for file changes
let debounceTimer;
fs.watch(rootDir, { recursive: true }, () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    reloadClients.forEach(res => {
      try { res.write('data: reload\n\n'); } catch {
        // Remove dead client on write failure
        const idx = reloadClients.indexOf(res);
        if (idx !== -1) reloadClients.splice(idx, 1);
      }
    });
  }, 150);
});

function serve(port) {
  const server = http.createServer((req, res) => {
    // SSE endpoint for live reload
    if (req.url === '/__reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('data: connected\n\n');
      reloadClients.push(res);
      req.on('close', () => {
        const idx = reloadClients.indexOf(res);
        if (idx !== -1) reloadClients.splice(idx, 1);
      });
      return;
    }

    let filePath = path.resolve(rootDir, decodeURIComponent(req.url).replace(/^\/+/, ''));

    // Default to index.html for directory requests
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // Prevent path traversal — canonicalize both paths before comparing
    const canonicalRoot = path.resolve(rootDir) + path.sep;
    const canonicalFile = path.resolve(filePath);
    if (!canonicalFile.startsWith(canonicalRoot) && canonicalFile !== path.resolve(rootDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`404 Not Found: ${req.url}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      // Inject live reload script into HTML files
      if (ext === '.html') {
        let html = data.toString();
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
        } else {
          html += LIVE_RELOAD_SCRIPT;
        }
        res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
        res.end(html);
      } else {
        res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
        res.end(data);
      }
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      serve(port + 1);
    } else {
      console.error(`Server error: ${err.message}`);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    // Output the port on its own line so the launcher can parse it
    console.log(`SERVING_PORT:${port}`);
    console.log(`Serving ${rootDir} at http://localhost:${port}`);
    console.log('Live reload enabled — file changes trigger browser refresh');
  });
}

serve(startPort);
