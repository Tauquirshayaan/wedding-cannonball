import Phaser from 'phaser';
import { GROUND_Y } from '../config';
import type { LevelData } from '../levels/types';
import type { Theme } from './Themes';

// Non-colliding wedding décor and 2.5D depth: stage flower arch and pillars, lamps, balloons,
// a bobbing crowd that cheers, twinkling overhead lights and soft shadows.

type Ctx = CanvasRenderingContext2D;
const OL = '#2a1420';

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx, w: number, h: number) => void) {
  if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, w, h);
  if (!t) return key;
  t.context.lineJoin = 'round'; t.context.lineCap = 'round';
  draw(t.context, w, h);
  t.refresh();
  return key;
}
const dot = (c: Ctx, x: number, y: number, r: number, col: string, lw = 0) => {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.stroke(); }
};
const flower = (c: Ctx, x: number, y: number, r: number, col: string) => {
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; dot(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.55, col); }
  dot(c, x, y, r * 0.4, '#f4c430');
};

export function makeDecorTextures(scene: Phaser.Scene) {
  make(scene, 'px_shadow', 64, 20, (c) => {
    const g = c.createRadialGradient(32, 10, 2, 32, 10, 30);
    g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.save(); c.scale(1, 0.33); c.beginPath(); c.arc(32, 30, 30, 0, Math.PI * 2); c.fill(); c.restore();
  });
  make(scene, 'flower_pillar', 50, 220, (c, w, h) => {
    c.fillStyle = '#c9971a'; c.fillRect(w / 2 - 5, 30, 10, h - 40);
    c.fillStyle = '#f4c430'; c.fillRect(8, h - 14, w - 16, 12);
    const cols = ['#e6197e', '#ffffff', '#f7a21b', '#ff7eb6'];
    for (let y = 40, i = 0; y < h - 20; y += 16, i++) flower(c, w / 2 + Math.sin(y / 14) * 9, y, 8, cols[i % cols.length]);
    for (let k = 0; k < 9; k++) flower(c, 12 + (k % 3) * 13, 8 + Math.floor(k / 3) * 11, 7, cols[k % cols.length]);
    c.fillStyle = '#3e9b3a'; c.beginPath(); c.ellipse(8, 30, 9, 4, -0.5, 0, Math.PI * 2); c.ellipse(42, 30, 9, 4, 0.5, 0, Math.PI * 2); c.fill();
  });
  make(scene, 'lamp', 34, 160, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, 22, 2, w / 2, 22, 17);
    g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(1, 'rgba(255,200,90,0.0)');
    c.fillStyle = g; c.fillRect(0, 4, w, 36);
    c.fillStyle = '#2a1420'; c.fillRect(w / 2 - 2, 38, 4, h - 48);
    c.beginPath(); c.moveTo(w / 2 - 12, h - 2); c.lineTo(w / 2, h - 16); c.lineTo(w / 2 + 12, h - 2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(6, 30); c.lineTo(w - 6, 30); c.lineTo(w - 10, 14); c.lineTo(10, 14); c.closePath();
    c.fillStyle = '#f4c430'; c.fill(); c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
  });
  make(scene, 'balloons', 80, 150, (c) => {
    const cols = ['#e6197e', '#f4c430', '#6ad1ff', '#ff7eb6', '#ffffff'];
    const pos = [[40, 30], [20, 48], [60, 46], [32, 64], [52, 66]];
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1;
    for (const [x, y] of pos) { c.beginPath(); c.moveTo(x, y + 16); c.quadraticCurveTo(40 + (x - 40) * 0.3, 110, 40, 148); c.stroke(); }
    pos.forEach(([x, y], i) => {
      c.beginPath(); c.ellipse(x, y, 13, 16, 0, 0, Math.PI * 2); c.fillStyle = cols[i]; c.fill();
      c.lineWidth = 2; c.strokeStyle = OL; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(x - 4, y - 6, 3, 5, -0.4, 0, Math.PI * 2); c.fill();
    });
  });
  // three guest silhouettes for the crowd
  for (let v = 0; v < 3; v++) {
    make(scene, `guest_${v}`, 40, 86, (c) => {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(20, 14, 11, 0, Math.PI * 2); c.fill();
      if (v === 1) { c.beginPath(); c.arc(20, 6, 8, 0, Math.PI * 2); c.fill(); } // bun
      c.beginPath();
      if (v === 2) { c.moveTo(6, 30); c.lineTo(34, 30); c.lineTo(38, 86); c.lineTo(2, 86); } // saree/lehenga
      else { c.moveTo(8, 28); c.lineTo(32, 28); c.lineTo(34, 86); c.lineTo(6, 86); }
      c.closePath(); c.fill();
      // raised arm (cheering)
      c.lineWidth = 6; c.strokeStyle = '#ffffff'; c.beginPath(); c.moveTo(30, 34); c.lineTo(38, 12 + v * 4); c.stroke();
    });
  }
}

function stageArch(scene: Phaser.Scene, w: number, cols: string[]) {
  const W = Math.round(w + 60), H = 240;
  return make(scene, `arch_${W}`, W, H, (c) => {
    // flower-covered arch frame with hanging strings
    const pal = ['#e6197e', '#ffffff', '#f7a21b', '#ff7eb6', '#f4c430'];
    for (let t = 0; t <= 1.0001; t += 0.025) {
      const a = Math.PI * (1 - t);
      const x = W / 2 + Math.cos(a) * (W / 2 - 14);
      const y = H - 10 - Math.sin(a) * (H - 30);
      flower(c, x, y, 9, pal[Math.round(t * 40) % pal.length]);
    }
    for (let x = 40; x < W - 30; x += 26) {
      const top = H - 10 - Math.sin(Math.acos(Math.max(-1, Math.min(1, (x - W / 2) / (W / 2 - 14))))) * (H - 30);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, top + 10); c.lineTo(x, top + 70); c.stroke();
      for (let y = top + 18; y < top + 70; y += 12) dot(c, x, y, 3.5, cols[Math.abs(Math.round(x + y)) % cols.length] ?? '#ffffff');
    }
  });
}

export interface DecorHandle { cheer(): void; shadows: { img: Phaser.GameObjects.Image; follow?: () => { x: number; y: number } | null }[]; }

export function decorateLevel(scene: Phaser.Scene, L: LevelData, theme: Theme): DecorHandle {
  makeDecorTextures(scene);
  const s = L.stage;
  const lights = theme.lights.length ? theme.lights : ['#ffffff'];

  // stage: flower arch behind the backdrop, flower pillars on both sides, glowing lamps
  scene.add.image(s.x + s.w / 2 - 10, s.y + 6, stageArch(scene, s.w, lights)).setOrigin(0.5, 1).setDepth(5).setAlpha(0.95);
  scene.add.image(s.x + 6, s.y + 2, 'flower_pillar').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(s.x + s.w - 40, s.y + 2, 'flower_pillar').setOrigin(0.5, 1).setDepth(5);
  const glow = scene.add.image(s.x + s.w / 2, s.y - 120, 'px_glow').setDepth(4).setDisplaySize(s.w + 200, 300).setAlpha(0.18).setTint(0xffe2a0);
  scene.tweens.add({ targets: glow, alpha: 0.32, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

  // standing lamps along the path, balloons by the cannon and the stage
  for (let x = L.cannon.x + 260; x < s.x - 120; x += 520) scene.add.image(x, GROUND_Y + 2, 'lamp').setOrigin(0.5, 1).setDepth(3).setAlpha(0.9);
  for (const bx of [L.cannon.x - 70, s.x - 50, s.x + s.w + 30]) {
    const b = scene.add.image(bx, GROUND_Y + 4, 'balloons').setOrigin(0.5, 1).setDepth(3);
    scene.tweens.add({ targets: b, angle: { from: -3, to: 3 }, duration: 1800 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  // twinkling overhead light strings (two phases alternating)
  const strings: Phaser.GameObjects.Graphics[] = [];
  for (let phase = 0; phase < 2; phase++) {
    const g = scene.add.graphics().setDepth(1).setScrollFactor(0.95, 1);
    for (let x0 = -200; x0 < L.width + 400; x0 += 320) {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, x = x0 + t * 320, y = 40 + Math.sin(t * Math.PI) * 46;
        if ((i + phase) % 2) continue;
        const col = Phaser.Display.Color.HexStringToColor(lights[(((i + Math.floor(x0 / 320)) % lights.length) + lights.length) % lights.length]).color;
        g.fillStyle(col, 0.22); g.fillCircle(x, y, 9);
        g.fillStyle(col, 1); g.fillCircle(x, y, 3.5);
      }
    }
    strings.push(g);
  }
  const wire = scene.add.graphics().setDepth(1).setScrollFactor(0.95, 1);
  wire.lineStyle(1.5, 0x2a1420, 0.6);
  for (let x0 = -200; x0 < L.width + 400; x0 += 320) {
    wire.beginPath();
    for (let i = 0; i <= 16; i++) { const t = i / 16; const x = x0 + t * 320, y = 40 + Math.sin(t * Math.PI) * 46; if (i) wire.lineTo(x, y); else wire.moveTo(x, y); }
    wire.strokePath();
  }
  scene.tweens.add({ targets: strings[0], alpha: { from: 1, to: 0.35 }, duration: 600, yoyo: true, repeat: -1 });
  scene.tweens.add({ targets: strings[1], alpha: { from: 0.35, to: 1 }, duration: 600, yoyo: true, repeat: -1 });

  // crowd behind the play area (slight parallax), bobbing to the music
  const crowd: Phaser.GameObjects.Image[] = [];
  // crowd colour: the venue's far colour lifted towards white so silhouettes read against the background
  const fc = Phaser.Display.Color.HexStringToColor(theme.farColor);
  const tint = Phaser.Display.Color.GetColor(Math.round(fc.red + (255 - fc.red) * 0.35), Math.round(fc.green + (255 - fc.green) * 0.3), Math.round(fc.blue + (255 - fc.blue) * 0.35));
  for (let x = L.cannon.x + 200; x < s.x + s.w + 200; x += 70 + Math.random() * 60) {
    const gimg = scene.add.image(x, GROUND_Y + 8, `guest_${Math.floor(Math.random() * 3)}`).setOrigin(0.5, 1)
      .setScrollFactor(0.9, 1).setDepth(0.5).setTint(tint).setAlpha(0.9).setScale(0.75 + Math.random() * 0.25).setFlipX(Math.random() < 0.5);
    scene.tweens.add({ targets: gimg, y: GROUND_Y + 2, duration: 380 + Math.random() * 200, yoyo: true, repeat: -1, delay: Math.random() * 400, ease: 'Sine.inOut' });
    crowd.push(gimg);
  }

  return {
    cheer() {
      crowd.forEach((c, i) => scene.tweens.add({ targets: c, y: GROUND_Y - 30, duration: 180, yoyo: true, repeat: 2, delay: i * 25, ease: 'Quad.out' }));
    },
    shadows: [],
  };
}

/** Soft ground shadow that follows a body: smaller and fainter the higher it is. */
export function addShadow(scene: Phaser.Scene, width: number, depth = 2.6) {
  return scene.add.image(0, GROUND_Y + 1, 'px_shadow').setDepth(depth).setDisplaySize(width, width * 0.3).setAlpha(0.5);
}
