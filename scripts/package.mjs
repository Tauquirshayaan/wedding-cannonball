// Zips each portal build into release/ for upload.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const builds = ['web', 'poki', 'crazygames', 'youtube', 'single'];
rmSync('release', { recursive: true, force: true });
mkdirSync('release');
const size = (dir) => readdirSync(dir, { recursive: true }).reduce((a, f) => {
  const p = join(dir, String(f)); const s = statSync(p); return a + (s.isFile() ? s.size : 0);
}, 0);
for (const b of builds) {
  const dir = join('dist', b);
  if (!existsSync(dir)) continue;
  execSync(`cd ${dir} && zip -qr ../../release/human-cannonball-${b}.zip .`);
  console.log(`${b.padEnd(11)} ${(size(dir) / 1024).toFixed(0).padStart(6)} KB  -> release/human-cannonball-${b}.zip`);
}
