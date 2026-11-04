// Fills in your details and builds the hostable legal pages (public/privacy.html, public/terms.html,
// public/credits.html), which are copied into every build. Run once before publishing:
//   node scripts/legal.mjs --name "Cenova Games" --email "support@example.com" --city "Mumbai"
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const vals = { DEVELOPER_NAME: arg('--name'), SUPPORT_EMAIL: arg('--email'), CITY: arg('--city') };
const missing = Object.entries(vals).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.log('Usage: node scripts/legal.mjs --name "Your Studio" --email "you@example.com" --city "Your City"');
  console.log('Missing:', missing.join(', '));
  process.exit(1);
}
const fill = (s) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] ?? `{{${k}}}`);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');

function md2html(md) {
  const out = [];
  let list = false, table = false;
  for (const line of md.split('\n')) {
    if (/^\|/.test(line)) {
      if (/^\|\s*-/.test(line)) continue;
      const cells = line.split('|').slice(1, -1).map((c) => inline(c.trim()));
      if (!table) { out.push('<table><tr>' + cells.map((c) => `<th>${c}</th>`).join('') + '</tr>'); table = true; }
      else out.push('<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>');
      continue;
    }
    if (table) { out.push('</table>'); table = false; }
    if (/^- /.test(line)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { out.push('</ul>'); list = false; }
    const h = line.match(/^(#{1,3}) (.*)/);
    if (h) out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`);
    else if (line.trim()) out.push(`<p>${inline(line)}</p>`);
  }
  if (list) out.push('</ul>');
  if (table) out.push('</table>');
  return out.join('\n');
}

const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--bg:#fffaf0;--fg:#2a1420;--accent:#7a1c2e;--muted:#6b5a60;--line:#ead9c4}
@media (prefers-color-scheme:dark){:root{--bg:#120c20;--fg:#f4ecdf;--accent:#f4c430;--muted:#bfb0b6;--line:#3a2f4a}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:32px 16px 64px}
h1{color:var(--accent);font-size:1.7rem;line-height:1.25}h2{margin-top:2rem;font-size:1.2rem}
table{border-collapse:collapse;width:100%;margin:1rem 0;font-size:.95rem}th,td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
code{background:var(--line);padding:1px 5px;border-radius:4px;font-size:.9em}
footer{margin-top:3rem;color:var(--muted);font-size:.9rem}
</style></head><body><main>${body}<footer>Wedding Cannon: Shaadi Chaos · ${esc(vals.DEVELOPER_NAME)} · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a> · <a href="credits.html">Credits</a></footer></main></body></html>
`;

mkdirSync('public', { recursive: true });
for (const [src, out, title] of [['legal/PRIVACY_POLICY.md', 'public/privacy.html', 'Privacy Policy'], ['legal/TERMS_OF_USE.md', 'public/terms.html', 'Terms of Use'], ['legal/THIRD_PARTY_NOTICES.md', 'public/credits.html', 'Credits & Licences']]) {
  const md = fill(readFileSync(src, 'utf8'));
  writeFileSync(out, page(`${title} · Wedding Cannon: Shaadi Chaos`, md2html(md)));
  console.log('wrote', out);
}
// also fill the in-game About screen details
writeFileSync('src/data/publisher.json', JSON.stringify({ developer: vals.DEVELOPER_NAME, email: vals.SUPPORT_EMAIL }, null, 2) + '\n');
console.log('wrote src/data/publisher.json (shown on the in-game About screen)');
