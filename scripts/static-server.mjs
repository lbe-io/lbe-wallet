import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let filePath = path.join(repoRoot, decodeURIComponent(requestUrl.pathname));

    if (!path.extname(filePath)) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!filePath.startsWith(repoRoot) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.end(fs.readFileSync(filePath));
  } catch (error) {
    res.statusCode = 500;
    res.end(String(error));
  }
});

server.listen(4173, '127.0.0.1', () => {
  console.log('LBE static server running at http://127.0.0.1:4173');
});
