// Minimal production server for self-hosting the web build.
// Files are read and compressed (brotli + gzip) once at start-up and served from memory,
// with long-lived caching for hashed assets and security headers on every response.
// Usage: node scripts/serve.mjs [dist/web] [port]
import http from 'node:http';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import zlib from 'node:zlib';

const root = process.argv[2] ?? 'dist/web';
const port = Number(process.argv[3] ?? 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const files = new Map();
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    const body = readFileSync(p);
    const type = TYPES[extname(p)] ?? 'application/octet-stream';
    const text = /text|javascript|json|svg/.test(type);
    files.set('/' + relative(root, p).split('\\').join('/'), {
      type, raw: body,
      br: text ? zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }) : null,
      gz: text ? zlib.gzipSync(body, { level: 9 }) : null,
      immutable: p.includes('/assets/'),
    });
  }
})(root);

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let path;
  try { path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
  if (path.endsWith('/')) path += 'index.html';
  const f = files.get(path); // only files that exist in the build can be served: no path traversal
  if (!f) { res.writeHead(404, SECURITY); return res.end('Not found'); }
  const ae = String(req.headers['accept-encoding'] ?? '');
  const [body, enc] = f.br && /\bbr\b/.test(ae) ? [f.br, 'br'] : f.gz && /gzip/.test(ae) ? [f.gz, 'gzip'] : [f.raw, null];
  res.writeHead(200, {
    ...SECURITY,
    'Content-Type': f.type,
    'Content-Length': body.length,
    'Cache-Control': f.immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    Vary: 'Accept-Encoding',
    ...(enc ? { 'Content-Encoding': enc } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port} (${files.size} files, pre-compressed)`));
