// Simulates N players opening the game at the same moment: each downloads the page and the game bundle.
// The game is fully client-side, so this is the only server load a player causes.
// Usage: node scripts/loadtest.mjs http://localhost:4300 1000
import http from 'node:http';

const base = process.argv[2] ?? 'http://localhost:4300';
const users = Number(process.argv[3] ?? 1000);
const agent = new http.Agent({ keepAlive: true, maxSockets: Infinity });

function get(path) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = http.get(base + path, { agent, headers: { 'accept-encoding': 'gzip' } }, (res) => {
      let bytes = 0;
      res.on('data', (c) => { bytes += c.length; });
      res.on('end', () => resolve({ ok: res.statusCode === 200, ms: performance.now() - t0, bytes }));
    });
    req.on('error', () => resolve({ ok: false, ms: performance.now() - t0, bytes: 0 }));
    req.setTimeout(30000, () => { req.destroy(); });
  });
}

const html = await (await fetch(base + '/')).text();
const assets = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => '/' + m[1]);

const t0 = performance.now();
const results = await Promise.all(Array.from({ length: users }, async () => {
  const s = performance.now();
  const parts = [await get('/'), ...(await Promise.all(assets.map(get)))];
  return { ok: parts.every((p) => p.ok), ms: performance.now() - s, bytes: parts.reduce((a, p) => a + p.bytes, 0) };
}));
const total = (performance.now() - t0) / 1000;
const ms = results.map((r) => r.ms).sort((a, b) => a - b);
const pct = (p) => Math.round(ms[Math.min(ms.length - 1, Math.floor(p * ms.length))]);
const ok = results.filter((r) => r.ok).length;
const mb = results.reduce((a, r) => a + r.bytes, 0) / 1e6;
console.log(`${users} simultaneous players · ${ok}/${users} loaded OK · ${total.toFixed(1)} s total`);
console.log(`full load time per player: p50 ${pct(0.5)} ms · p95 ${pct(0.95)} ms · max ${pct(1)} ms`);
console.log(`data served: ${mb.toFixed(0)} MB (${(mb * 1000 / users).toFixed(0)} KB per player, gzip)`);
agent.destroy();
