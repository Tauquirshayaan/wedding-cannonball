// Captures store screenshots (1280x720) and an itch.io cover (630x500) from a running build.
// Usage: npm run build && npx vite preview --port 4173 &  node scripts/screenshots.cjs http://localhost:4173
const { chromium } = require('playwright');
const fs = require('fs');
const url = process.argv[2] || 'http://localhost:4173';
const out = 'marketing';
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(url);
  await p.waitForFunction(() => window.__hcGame && window.__hcGame.scene.isActive('Title'));
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/01-title.png` });
  await p.screenshot({ path: `${out}/cover-630x500.png`, clip: { x: 325, y: 110, width: 630, height: 500 } });
  const shots = [[1, 36, 0.6], [3, 32, 0.62], [5, 30, 0.7], [6, 35, 0.55], [9, 30, 0.75], [10, 40, 0.6]];
  let i = 2;
  for (const [lvl, ang, pw] of shots) {
    await p.evaluate((l) => { const g = window.__hcGame; for (const k of ['Result','Title','LevelSelect']) if (g.scene.isActive(k)) g.scene.stop(k); g.scene.start('Game', { levelId: l }); }, lvl);
    await p.waitForTimeout(400);
    await p.keyboard.press('Space');
    await p.waitForTimeout(900);
    await p.evaluate(([a, w]) => window.__hcScene.testLaunch(a, w), [ang, pw]);
    await p.waitForTimeout(1300);
    await p.screenshot({ path: `${out}/0${i++}-level${lvl}.png` });
  }
  await b.close();
  console.log('saved to', out);
})();
