import Phaser from 'phaser';

// All art is drawn in code with Canvas 2D: flat shapes, 3 px dark outlines, night-wedding palette.
// Nothing is downloaded, so the game loads instantly and every asset is original.

type Ctx = CanvasRenderingContext2D;
type Draw = (ctx: Ctx, w: number, h: number) => void;

const OL = '#2a1420';
const P = {
  marigold: '#f7a21b',
  marigoldDark: '#d9800b',
  rani: '#e6197e',
  raniDark: '#b0105e',
  maroon: '#7a1c2e',
  maroonDark: '#5a1020',
  gold: '#f4c430',
  goldDark: '#c9971a',
  leaf: '#3e9b3a',
  leafDark: '#2c7429',
  cream: '#fff3d6',
  skin: '#c88550',
  skinDark: '#a86a3a',
  white: '#ffffff',
  black: '#1b1b22',
};

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, Math.ceil(w), Math.ceil(h));
  if (!t) return;
  const ctx = t.context;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, w, h);
  t.refresh();
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function fillStroke(ctx: Ctx, fill: string, lw = 3, stroke = OL) {
  ctx.fillStyle = fill;
  ctx.fill();
  if (lw > 0) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string, lw = 3) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  fillStroke(ctx, fill, lw);
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, lw = 3, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  fillStroke(ctx, fill, lw);
}

function marigoldBall(ctx: Ctx, x: number, y: number, r: number, color = P.marigold) {
  circle(ctx, x, y, r, color, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function garlandLine(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, sag: number, r = 5) {
  const n = Math.max(4, Math.floor(Math.hypot(x2 - x1, y2 - y1) / (r * 1.6)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(t * Math.PI) * sag;
    marigoldBall(ctx, x, y, r, i % 2 ? P.marigold : P.gold);
  }
}

// ---------- faces ----------
type Face = 'calm' | 'scared' | 'dizzy' | 'happy';
function face(ctx: Ctx, cx: number, cy: number, s: number, kind: Face, mustache = false) {
  ctx.lineWidth = 2.2 * s;
  ctx.strokeStyle = OL;
  const ex = 6 * s;
  const ey = cy - 2 * s;
  if (kind === 'dizzy') {
    for (const dx of [-ex, ex]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx - 3.5 * s, ey - 3.5 * s);
      ctx.lineTo(cx + dx + 3.5 * s, ey + 3.5 * s);
      ctx.moveTo(cx + dx + 3.5 * s, ey - 3.5 * s);
      ctx.lineTo(cx + dx - 3.5 * s, ey + 3.5 * s);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - 6 * s, cy + 8 * s);
    ctx.quadraticCurveTo(cx - 3 * s, cy + 5 * s, cx, cy + 8 * s);
    ctx.quadraticCurveTo(cx + 3 * s, cy + 11 * s, cx + 6 * s, cy + 8 * s);
    ctx.stroke();
  } else {
    const big = kind === 'scared';
    for (const dx of [-ex, ex]) {
      ellipse(ctx, cx + dx, ey, (big ? 4.8 : 4) * s, (big ? 5.6 : 4.4) * s, P.white, 1.8 * s);
      circle(ctx, cx + dx + (big ? 0 : 0.8 * s), ey + (big ? 0 : 0.6 * s), (big ? 1.6 : 2.2) * s, P.black, 0);
    }
    // brows
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    if (big) {
      ctx.moveTo(cx - ex - 4 * s, ey - 8 * s);
      ctx.lineTo(cx - ex + 3 * s, ey - 10 * s);
      ctx.moveTo(cx + ex + 4 * s, ey - 8 * s);
      ctx.lineTo(cx + ex - 3 * s, ey - 10 * s);
    } else {
      ctx.moveTo(cx - ex - 3.5 * s, ey - 7 * s);
      ctx.lineTo(cx - ex + 3.5 * s, ey - 7.5 * s);
      ctx.moveTo(cx + ex + 3.5 * s, ey - 7 * s);
      ctx.lineTo(cx + ex - 3.5 * s, ey - 7.5 * s);
    }
    ctx.stroke();
    if (kind === 'scared') {
      ellipse(ctx, cx, cy + 8 * s, 3.4 * s, 4.4 * s, P.maroonDark, 1.8 * s);
    } else if (kind === 'happy') {
      ctx.beginPath();
      ctx.arc(cx, cy + 4 * s, 5.5 * s, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.closePath();
      fillStroke(ctx, P.maroonDark, 1.8 * s);
    } else {
      ctx.beginPath();
      ctx.arc(cx, cy + 4 * s, 4.5 * s, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
  }
  if (mustache) {
    ctx.fillStyle = OL;
    ctx.beginPath();
    ctx.ellipse(cx - 3.2 * s, cy + 4 * s, 4 * s, 1.8 * s, -0.25, 0, Math.PI * 2);
    ctx.ellipse(cx + 3.2 * s, cy + 4 * s, 4 * s, 1.8 * s, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function luckyHead(kind: Face): Draw {
  return (ctx) => {
    const cx = 23, cy = 24;
    // ears
    circle(ctx, cx - 16, cy + 1, 4, P.skin, 2.5);
    circle(ctx, cx + 16, cy + 1, 4, P.skin, 2.5);
    circle(ctx, cx, cy, 17, P.skin, 3);
    // hair fringe
    ctx.beginPath();
    ctx.arc(cx, cy, 17, Math.PI * 1.08, Math.PI * 1.92);
    ctx.quadraticCurveTo(cx + 4, cy - 9, cx - 2, cy - 12);
    ctx.quadraticCurveTo(cx - 8, cy - 8, cx - 15.5, cy - 6);
    ctx.closePath();
    fillStroke(ctx, P.black, 2);
    // cheeks
    ctx.fillStyle = 'rgba(230,25,126,0.25)';
    circle(ctx, cx - 10, cy + 6, 3, 'rgba(230,25,126,0.25)', 0);
    circle(ctx, cx + 10, cy + 6, 3, 'rgba(230,25,126,0.25)', 0);
    face(ctx, cx, cy + 2, 1, kind, true);
  };
}

// ---------- people ----------
function photographer(frame: 0 | 1 | 2): Draw {
  return (ctx) => {
    const cx = 24;
    const kind: Face = frame === 2 ? 'dizzy' : 'calm';
    // legs
    const spread = frame === 0 ? 6 : 2;
    rr(ctx, cx - 9 - spread, 64, 9, 32, 3); fillStroke(ctx, '#8a7350');
    rr(ctx, cx + spread, 64, 9, 32, 3); fillStroke(ctx, '#8a7350');
    ellipse(ctx, cx - 6 - spread, 95, 7, 3.5, P.black, 2);
    ellipse(ctx, cx + 6 + spread, 95, 7, 3.5, P.black, 2);
    // body (vest)
    rr(ctx, cx - 15, 36, 30, 34, 7); fillStroke(ctx, '#3a4a5c');
    rr(ctx, cx - 8, 38, 16, 30, 3); fillStroke(ctx, '#d8d2c0', 2);
    // camera + arms
    rr(ctx, cx - 4, 42, 24, 16, 3); fillStroke(ctx, P.black);
    circle(ctx, cx + 22, 50, 6, '#555', 2.5);
    circle(ctx, cx + 22, 50, 3, '#9fd7ff', 0);
    rr(ctx, cx + 2, 36, 7, 5, 1); fillStroke(ctx, '#333', 1.5);
    circle(ctx, cx - 6, 52, 4.5, P.skin, 2);
    circle(ctx, cx + 14, 59, 4.5, P.skin, 2);
    // head
    circle(ctx, cx, 20, 15, '#d39a66', 3);
    face(ctx, cx, 21, 0.9, kind);
    // cap
    ctx.beginPath();
    ctx.arc(cx, 16, 15, Math.PI, Math.PI * 2);
    ctx.closePath();
    fillStroke(ctx, '#2f6db5', 2.5);
    rr(ctx, cx - 2, 11, 24, 6, 3); fillStroke(ctx, '#2f6db5', 2.5);
  };
}

function aunty(frame: 0 | 1 | 2): Draw {
  return (ctx) => {
    const cx = 28;
    const kind: Face = frame === 2 ? 'dizzy' : 'happy';
    // saree body
    ctx.beginPath();
    ctx.moveTo(cx - 14, 40);
    ctx.lineTo(cx + 14, 40);
    ctx.lineTo(cx + 20, 98);
    ctx.lineTo(cx - 20, 98);
    ctx.closePath();
    fillStroke(ctx, P.rani);
    // gold border + drape
    ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 19, 94); ctx.lineTo(cx + 19, 94); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 12, 42); ctx.lineTo(cx + 18, 84); ctx.stroke();
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    // arms
    const up = frame === 0;
    ctx.lineWidth = 7; ctx.strokeStyle = P.skin;
    ctx.beginPath();
    ctx.moveTo(cx - 12, 46); ctx.lineTo(cx - 24, up ? 30 : 52); ctx.lineTo(cx - 22, up ? 16 : 40);
    ctx.moveTo(cx + 12, 46); ctx.lineTo(cx + 24, up ? 50 : 32); ctx.lineTo(cx + 26, up ? 36 : 18);
    ctx.stroke();
    circle(ctx, cx - 22, up ? 16 : 40, 4, P.skin, 2);
    circle(ctx, cx + 26, up ? 36 : 18, 4, P.skin, 2);
    // bangles
    ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 25, up ? 24 : 46); ctx.lineTo(cx - 20, up ? 24 : 46); ctx.stroke();
    // head + bun
    circle(ctx, cx + 1, 9, 9, P.black, 2.5);
    circle(ctx, cx, 24, 14, P.skin, 3);
    ctx.beginPath(); ctx.arc(cx, 22, 14, Math.PI * 1.05, Math.PI * 1.95); ctx.closePath(); fillStroke(ctx, P.black, 2);
    face(ctx, cx, 25, 0.85, kind);
    circle(ctx, cx - 14, 30, 3, P.gold, 1.5);
    circle(ctx, cx + 14, 30, 3, P.gold, 1.5);
  };
}

function uncle(frame: 0 | 1 | 2): Draw {
  return (ctx) => {
    const cx = 28;
    const kind: Face = frame === 2 ? 'dizzy' : 'happy';
    // legs
    rr(ctx, cx - 13, 74, 11, 24, 3); fillStroke(ctx, P.cream);
    rr(ctx, cx + 2, 74, 11, 24, 3); fillStroke(ctx, P.cream);
    // sherwani with belly
    ctx.beginPath();
    ctx.moveTo(cx - 14, 38);
    ctx.quadraticCurveTo(cx - 26, 62, cx - 16, 82);
    ctx.lineTo(cx + 16, 82);
    ctx.quadraticCurveTo(cx + 28, 60, cx + 14, 38);
    ctx.closePath();
    fillStroke(ctx, P.gold);
    ctx.strokeStyle = P.maroon; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, 40); ctx.lineTo(cx, 80); ctx.stroke();
    for (let y = 46; y < 80; y += 8) circle(ctx, cx + 4, y, 1.8, P.maroon, 0);
    // arms (light-bulb dance)
    const a = frame === 0;
    ctx.lineWidth = 8; ctx.strokeStyle = P.goldDark;
    ctx.beginPath();
    ctx.moveTo(cx - 12, 44); ctx.lineTo(cx - 24, a ? 28 : 40); ctx.lineTo(cx - 20, a ? 10 : 24);
    ctx.moveTo(cx + 12, 44); ctx.lineTo(cx + 24, a ? 40 : 28); ctx.lineTo(cx + 22, a ? 24 : 10);
    ctx.stroke();
    circle(ctx, cx - 20, a ? 10 : 24, 4.5, P.skin, 2);
    circle(ctx, cx + 22, a ? 24 : 10, 4.5, P.skin, 2);
    // head (bald-ish with side hair)
    circle(ctx, cx, 24, 15, P.skinDark, 3);
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.arc(cx - 13, 22, 4, 0, Math.PI * 2); ctx.arc(cx + 13, 22, 4, 0, Math.PI * 2); ctx.fill();
    face(ctx, cx, 25, 0.9, kind, true);
  };
}

// ---------- props ----------
function dhol(ctx: Ctx) {
  const cx = 46, cy = 40;
  // drum heads
  ellipse(ctx, cx - 34, cy, 10, 30, P.cream);
  ellipse(ctx, cx + 34, cy, 10, 30, P.cream);
  // barrel
  ctx.beginPath();
  ctx.moveTo(cx - 34, cy - 30);
  ctx.quadraticCurveTo(cx, cy - 42, cx + 34, cy - 30);
  ctx.lineTo(cx + 34, cy + 30);
  ctx.quadraticCurveTo(cx, cy + 42, cx - 34, cy + 30);
  ctx.closePath();
  fillStroke(ctx, P.rani);
  // rope zig-zag
  ctx.strokeStyle = P.gold; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const x = cx - 30 + i * 7.5;
    const y = i % 2 ? cy + 30 : cy - 30;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = P.marigold; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(cx - 32, cy - 28); ctx.quadraticCurveTo(cx, cy - 39, cx + 32, cy - 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - 32, cy + 28); ctx.quadraticCurveTo(cx, cy + 39, cx + 32, cy + 28); ctx.stroke();
  ellipse(ctx, cx + 34, cy, 10, 30, P.cream);
  ellipse(ctx, cx + 34, cy, 5, 16, 'rgba(0,0,0,0.12)', 0);
}

function cannonBarrel(ctx: Ctx) {
  // pivot is at (26, 30); muzzle points right
  ctx.beginPath();
  ctx.moveTo(10, 14);
  ctx.lineTo(118, 6);
  ctx.lineTo(118, 54);
  ctx.lineTo(10, 46);
  ctx.quadraticCurveTo(0, 30, 10, 14);
  ctx.closePath();
  fillStroke(ctx, '#4a3b6b');
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(14, 16, 100, 8);
  for (const x of [34, 70]) {
    rr(ctx, x, 9, 9, 42, 2); fillStroke(ctx, P.gold, 2.5);
  }
  rr(ctx, 112, 0, 18, 60, 5); fillStroke(ctx, P.gold);
  ellipse(ctx, 130, 30, 5, 22, P.black, 2);
  // garland
  garlandLine(ctx, 40, 10, 76, 8, 18, 4);
}

function cannonBase(ctx: Ctx) {
  rr(ctx, 8, 10, 104, 34, 8); fillStroke(ctx, '#8b4a24');
  ctx.strokeStyle = '#6a3518'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(14, 26); ctx.lineTo(106, 26); ctx.stroke();
  for (const x of [32, 88]) {
    circle(ctx, x, 46, 22, '#6a3518');
    circle(ctx, x, 46, 15, P.gold, 2.5);
    ctx.strokeStyle = OL; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 15, 46 - Math.sin(a) * 15);
      ctx.lineTo(x + Math.cos(a) * 15, 46 + Math.sin(a) * 15);
      ctx.stroke();
    }
    circle(ctx, x, 46, 5, P.maroon, 2);
  }
}

function sofa(ctx: Ctx, w: number, h: number) {
  // back
  rr(ctx, 4, 2, w - 8, h * 0.62, 18); fillStroke(ctx, P.gold);
  rr(ctx, 14, 9, w - 28, h * 0.5, 12); fillStroke(ctx, P.maroon);
  // cushions
  const n = 3;
  const cw = (w - 40) / n;
  for (let i = 0; i < n; i++) {
    rr(ctx, 20 + i * cw, h * 0.42, cw - 4, h * 0.3, 8); fillStroke(ctx, P.rani, 2.5);
  }
  // arms
  rr(ctx, 2, h * 0.32, 22, h * 0.52, 10); fillStroke(ctx, P.gold);
  rr(ctx, w - 24, h * 0.32, 22, h * 0.52, 10); fillStroke(ctx, P.gold);
  // legs
  rr(ctx, 14, h - 12, 10, 11, 2); fillStroke(ctx, P.goldDark, 2);
  rr(ctx, w - 24, h - 12, 10, 11, 2); fillStroke(ctx, P.goldDark, 2);
}

function clothTable(ctx: Ctx, w: number, h: number, cloth = P.rani, trim = P.gold) {
  rr(ctx, 2, 2, w - 4, h - 4, 6); fillStroke(ctx, cloth);
  // scallops
  ctx.fillStyle = trim;
  const n = Math.max(3, Math.round(w / 22));
  const sw = (w - 8) / n;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(6 + sw * i + sw / 2, 12, sw / 2, 0, Math.PI);
    ctx.fill();
  }
  ctx.strokeStyle = OL; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(4, 12); ctx.lineTo(w - 4, 12); ctx.stroke();
  if (h > 40) {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3;
    for (let x = 20; x < w - 10; x += 26) {
      ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x - 4, h - 6); ctx.stroke();
    }
  }
}

function laddoo(ctx: Ctx) {
  circle(ctx, 11, 11, 9, P.marigold, 2.5);
  ctx.fillStyle = P.marigoldDark;
  for (const [x, y] of [[8, 9], [13, 7], [12, 13], [7, 14], [15, 11]]) {
    ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.arc(8, 7, 2, 0, Math.PI * 2); ctx.fill();
}

function vat(ctx: Ctx, w: number, h: number) {
  // syrup surface
  ellipse(ctx, w / 2, 16, w / 2 - 8, 12, '#f2b632');
  ctx.strokeStyle = '#e07b12'; ctx.lineWidth = 3;
  for (let x = 30; x < w - 30; x += 46) {
    ctx.beginPath();
    ctx.arc(x, 16, 6, 0, Math.PI * 1.6);
    ctx.arc(x, 16, 3, Math.PI * 1.6, 0, true);
    ctx.stroke();
  }
  // bowl
  ctx.beginPath();
  ctx.moveTo(4, 16);
  ctx.quadraticCurveTo(10, h - 2, w / 2, h - 2);
  ctx.quadraticCurveTo(w - 10, h - 2, w - 4, 16);
  ctx.quadraticCurveTo(w / 2, 30, 4, 16);
  ctx.closePath();
  fillStroke(ctx, '#3b3440');
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.ellipse(w * 0.3, h * 0.55, w * 0.12, 6, -0.2, 0, Math.PI * 2); ctx.fill();
  // handles
  rr(ctx, 0, 14, 12, 8, 4); fillStroke(ctx, '#3b3440', 2);
  rr(ctx, w - 12, 14, 12, 8, 4); fillStroke(ctx, '#3b3440', 2);
}

function canopy(ctx: Ctx, w: number, h: number) {
  const n = Math.max(4, Math.round(w / 40));
  const sw = (w - 4) / n;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.rect(2 + i * sw, 2, sw, h - 12);
    ctx.fillStyle = i % 2 ? P.gold : P.rani;
    ctx.fill();
  }
  ctx.strokeStyle = OL; ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, w - 4, h - 12);
  // scallops
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(2 + i * sw + sw / 2, h - 10, sw / 2 - 1, 0, Math.PI);
    fillStroke(ctx, i % 2 ? P.rani : P.gold, 2);
  }
}

function rocket(ctx: Ctx) {
  const cx = 18;
  // stick
  rr(ctx, cx - 2, 52, 4, 30, 2); fillStroke(ctx, '#a0703a', 2);
  // body
  rr(ctx, cx - 9, 18, 18, 40, 4); fillStroke(ctx, '#d72631');
  ctx.fillStyle = P.gold;
  ctx.fillRect(cx - 8, 28, 16, 5);
  ctx.fillRect(cx - 8, 42, 16, 5);
  // cone
  ctx.beginPath(); ctx.moveTo(cx - 10, 19); ctx.lineTo(cx, 2); ctx.lineTo(cx + 10, 19); ctx.closePath();
  fillStroke(ctx, P.rani);
  // fins
  ctx.beginPath(); ctx.moveTo(cx - 9, 46); ctx.lineTo(cx - 16, 60); ctx.lineTo(cx - 9, 57); ctx.closePath(); fillStroke(ctx, P.gold, 2);
  ctx.beginPath(); ctx.moveTo(cx + 9, 46); ctx.lineTo(cx + 16, 60); ctx.lineTo(cx + 9, 57); ctx.closePath(); fillStroke(ctx, P.gold, 2);
  // fuse
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, 58); ctx.quadraticCurveTo(cx + 6, 64, cx + 3, 70); ctx.stroke();
}

function gift(ctx: Ctx) {
  rr(ctx, 6, 18, 40, 30, 4); fillStroke(ctx, P.rani);
  rr(ctx, 3, 12, 46, 10, 3); fillStroke(ctx, P.raniDark);
  ctx.fillStyle = P.gold;
  ctx.fillRect(22, 13, 8, 34);
  ctx.strokeStyle = OL; ctx.lineWidth = 2;
  ctx.strokeRect(22, 13, 8, 34);
  ellipse(ctx, 18, 9, 8, 5, P.gold, 2, -0.4);
  ellipse(ctx, 34, 9, 8, 5, P.gold, 2, 0.4);
  circle(ctx, 26, 11, 4, P.goldDark, 2);
  ctx.fillStyle = P.gold;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('₹', 14, 40);
}

function cakeTier(level: number): Draw {
  return (ctx, w, h) => {
    rr(ctx, 2, 4, w - 4, h - 6, 8); fillStroke(ctx, P.cream);
    // drips
    ctx.fillStyle = level === 1 ? '#f48fb1' : P.rani;
    ctx.beginPath();
    ctx.moveTo(4, 8);
    const n = Math.round(w / 16);
    for (let i = 0; i <= n; i++) {
      const x = 4 + ((w - 8) * i) / n;
      ctx.lineTo(x, 12 + (i % 2 ? 10 : 4));
    }
    ctx.lineTo(w - 4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = P.gold;
    for (let x = 12; x < w - 8; x += 14) {
      ctx.beginPath(); ctx.arc(x, h - 10, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    rr(ctx, 2, 4, w - 4, h - 6, 8);
    ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.stroke();
    if (level === 2) {
      for (const x of [w * 0.3, w * 0.5, w * 0.7]) marigoldBall(ctx, x, 6, 5, x === w * 0.5 ? P.rani : P.marigold);
    }
  };
}

function pillar(ctx: Ctx, w: number, h: number) {
  rr(ctx, 4, 12, w - 8, h - 24, 3); fillStroke(ctx, P.cream);
  rr(ctx, 0, 0, w, 16, 4); fillStroke(ctx, P.gold);
  rr(ctx, 0, h - 16, w, 16, 4); fillStroke(ctx, P.gold);
  // spiral garland
  for (let y = 26; y < h - 26; y += 12) {
    const t = (y / 48) % 1;
    const x = 8 + Math.abs(Math.sin(t * Math.PI)) * (w - 16);
    marigoldBall(ctx, x, y, 5, (y / 12) % 2 ? P.marigold : P.rani);
  }
}

function block(style: string): Draw {
  return (ctx, w, h) => {
    if (style === 'giftTable') {
      clothTable(ctx, w, h, P.maroon, P.gold);
      // stacked presents painted on
      const cols = [P.rani, P.gold, P.leaf, P.marigold];
      let i = 0;
      for (let y = h - 34; y > 20; y -= 32) {
        for (let x = 8; x < w - 30; x += 34) {
          rr(ctx, x, y, 28, 26, 3); fillStroke(ctx, cols[i++ % cols.length], 2);
          ctx.fillStyle = P.cream; ctx.fillRect(x + 12, y + 1, 4, 24);
        }
      }
    } else if (style === 'riser') {
      rr(ctx, 2, 2, w - 4, h - 4, 4); fillStroke(ctx, P.maroon);
      ctx.fillStyle = P.maroonDark;
      for (let x = 14; x < w - 10; x += 30) ctx.fillRect(x, 10, 6, h - 20);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, w - 16, h - 16);
    } else if (style === 'ledge') {
      rr(ctx, 2, 2, w - 4, h - 4, 6); fillStroke(ctx, P.gold);
      garlandLine(ctx, 8, h - 4, w - 8, h - 4, 10, 4);
    } else {
      clothTable(ctx, w, h, P.rani, P.gold);
    }
  };
}

function stageTop(ctx: Ctx, w: number, h: number) {
  rr(ctx, 2, 2, w - 4, 16, 4); fillStroke(ctx, P.gold);
  rr(ctx, 6, 16, w - 12, h - 18, 2); fillStroke(ctx, P.maroon);
  // drapes on the skirt
  const n = Math.max(3, Math.round(w / 36));
  const sw = (w - 12) / n;
  ctx.strokeStyle = P.maroonDark; ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(6 + i * sw + sw / 2, 18, sw / 2, 0, Math.PI);
    ctx.stroke();
  }
  garlandLine(ctx, 8, 18, w - 8, 18, 0, 4);
}

function backdrop(ctx: Ctx, w: number, h: number) {
  rr(ctx, 3, 3, w - 6, h - 6, 10); fillStroke(ctx, P.rani);
  rr(ctx, 10, 10, w - 20, h - 20, 6); fillStroke(ctx, P.maroon, 2);
  for (let y = 22; y < h - 14; y += 14) marigoldBall(ctx, w / 2 + Math.sin(y / 20) * (w * 0.2), y, 5, y % 28 ? P.marigold : P.gold);
}

function archBeam(ctx: Ctx, w: number, h: number) {
  rr(ctx, 2, 2, w - 4, h - 4, 8); fillStroke(ctx, P.gold);
  garlandLine(ctx, 10, h - 2, w - 10, h - 2, 22, 5);
  for (let x = 20; x < w - 10; x += 40) garlandLine(ctx, x, h, x, h + 1, 0, 4);
}

function fanCage(ctx: Ctx) {
  // rod
  rr(ctx, 58, 0, 8, 26, 2); fillStroke(ctx, '#666', 2);
  circle(ctx, 62, 82, 54, 'rgba(255,255,255,0.08)', 4);
  ctx.strokeStyle = '#9aa0b0'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath(); ctx.moveTo(62, 82); ctx.lineTo(62 + Math.cos(a) * 52, 82 + Math.sin(a) * 52); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(62, 82, 30, 0, Math.PI * 2); ctx.stroke();
}

function fanBlades(ctx: Ctx) {
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    ctx.save();
    ctx.translate(48, 48);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, -24, 11, 22, 0, 0, Math.PI * 2);
    fillStroke(ctx, i === 0 ? P.rani : P.marigold, 2.5);
    ctx.restore();
  }
  circle(ctx, 48, 48, 9, P.gold, 2.5);
}

// ---------- scenery ----------
function sky(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#08102e');
  g.addColorStop(0.55, '#1d1b55');
  g.addColorStop(1, '#4b2763');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = `rgba(255,255,230,${0.3 + rnd() * 0.7})`;
    const s = rnd() * 2 + 0.6;
    ctx.fillRect(rnd() * w, rnd() * h * 0.7, s, s);
  }
  // moon
  ctx.fillStyle = 'rgba(255,240,200,0.15)';
  ctx.beginPath(); ctx.arc(w * 0.8, h * 0.18, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff2c4';
  ctx.beginPath(); ctx.arc(w * 0.8, h * 0.18, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a50';
  ctx.beginPath(); ctx.arc(w * 0.8 + 16, h * 0.18 - 8, 36, 0, Math.PI * 2); ctx.fill();
}

function bgFar(ctx: Ctx, _w: number, h: number) {
  // haveli and tent silhouettes with warm windows
  ctx.fillStyle = '#2c1f52';
  ctx.beginPath();
  ctx.moveTo(0, h);
  const pts = [
    [0, 170], [60, 170], [60, 120], [80, 100], [100, 120], [100, 150], [180, 150], [210, 110], [240, 150],
    [330, 150], [330, 80], [350, 60], [370, 80], [370, 60], [390, 40], [410, 60], [410, 80], [430, 60], [450, 80], [450, 150],
    [540, 150], [580, 100], [620, 150], [700, 150], [700, 110], [740, 90], [780, 110], [780, 140], [880, 140], [910, 100], [940, 140], [1024, 140], [1024, h],
  ];
  for (const [x, y] of pts) ctx.lineTo(x, y + 60);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,200,90,0.75)';
  for (const [x, y] of [[70, 200], [85, 200], [345, 150], [365, 150], [390, 130], [410, 150], [430, 150], [350, 180], [410, 180], [720, 190], [750, 190], [760, 170]]) {
    rr(ctx, x, y, 8, 12, 4);
    ctx.fill();
  }
  // domes outline glow
  ctx.strokeStyle = 'rgba(244,196,48,0.25)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(390, 106, 22, Math.PI, 0); ctx.stroke();
}

function bgNear(ctx: Ctx, w: number, h: number) {
  // shamiana tents in maroon and gold with fairy-light strings
  for (let i = 0; i < 4; i++) {
    const x = i * 256;
    ctx.fillStyle = i % 2 ? '#5a1838' : '#4a1a40';
    ctx.beginPath();
    ctx.moveTo(x + 10, h);
    ctx.lineTo(x + 10, 120);
    ctx.lineTo(x + 128, 60);
    ctx.lineTo(x + 246, 120);
    ctx.lineTo(x + 246, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(244,196,48,0.18)';
    for (let s = 0; s < 6; s++) {
      ctx.beginPath();
      ctx.moveTo(x + 128, 60);
      ctx.lineTo(x + 20 + s * 40, 122);
      ctx.lineTo(x + 36 + s * 40, 122);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,200,90,0.35)';
    ctx.fillRect(x + 100, 160, 56, h - 160);
  }
  // fairy lights
  for (let row = 0; row < 2; row++) {
    const y0 = 30 + row * 40;
    for (let x = 0; x < w; x += 128) {
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const px = x + t * 128;
        const py = y0 + Math.sin(t * Math.PI) * 26;
        const cols = ['#fff3a0', '#ffb347', '#ff7eb6', '#a0f0ff'];
        ctx.fillStyle = 'rgba(255,230,150,0.25)';
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = cols[(i + row) % 4];
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function ground(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2f7a35';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#368a3c';
  ctx.fillRect(0, 0, w / 2, h);
  ctx.fillStyle = '#4fae49';
  ctx.fillRect(0, 0, w, 8);
  ctx.fillStyle = OL;
  ctx.fillRect(0, 8, w, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  for (let x = 6; x < w; x += 16) ctx.fillRect(x, 20 + ((x * 7) % 30), 3, 6);
}

function star(full: boolean): Draw {
  return (ctx, w) => {
    const cx = w / 2, cy = w / 2, R = w * 0.46, r = w * 0.2;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rad = i % 2 ? r : R;
      ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath();
    fillStroke(ctx, full ? P.gold : '#3a2f5a', 4);
    if (full) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(cx - R * 0.2, cy - R * 0.25, R * 0.18, R * 0.1, -0.5, 0, Math.PI * 2); ctx.fill();
    }
  };
}

function lock(ctx: Ctx) {
  ctx.lineWidth = 6; ctx.strokeStyle = OL;
  ctx.beginPath(); ctx.arc(20, 18, 10, Math.PI, 0); ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = '#bbb';
  ctx.beginPath(); ctx.arc(20, 18, 10, Math.PI, 0); ctx.stroke();
  rr(ctx, 6, 18, 28, 22, 4); fillStroke(ctx, P.gold);
  circle(ctx, 20, 28, 3, OL, 0);
}

function cannonIcon(ctx: Ctx) {
  ctx.save();
  ctx.translate(16, 18);
  ctx.rotate(-0.5);
  rr(ctx, -6, -6, 26, 12, 4); fillStroke(ctx, '#4a3b6b', 2.5);
  ctx.restore();
  circle(ctx, 14, 22, 7, '#8b4a24', 2.5);
}

function soft(color: string): Draw {
  return (ctx, w) => {
    const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, w);
  };
}

export function generateCoreTextures(scene: Phaser.Scene, onProgress?: (p: number) => void) {
  const jobs: [string, number, number, Draw][] = [
    ['head_calm', 46, 46, luckyHead('calm')],
    ['head_scared', 46, 46, luckyHead('scared')],
    ['head_dizzy', 46, 46, luckyHead('dizzy')],
    ['head_happy', 46, 46, luckyHead('happy')],
    ['torso', 34, 52, (c) => {
      rr(c, 3, 3, 28, 46, 9); fillStroke(c, P.marigold);
      c.fillStyle = P.gold; c.fillRect(15, 6, 4, 40);
      c.strokeStyle = OL; c.lineWidth = 1.5; c.strokeRect(15, 6, 4, 40);
      for (const y of [14, 22, 30]) circle(c, 17, y, 1.6, P.maroon, 0);
      c.fillStyle = P.marigoldDark; c.fillRect(5, 40, 24, 5);
      ellipse(c, 17, 4, 8, 3, P.skin, 2);
    }],
    ['arm', 14, 34, (c) => {
      rr(c, 2, 2, 10, 24, 4); fillStroke(c, P.marigold, 2.5);
      c.fillStyle = P.gold; c.fillRect(3, 20, 8, 4);
      circle(c, 7, 28, 4.5, P.skin, 2);
    }],
    ['leg', 16, 40, (c) => {
      rr(c, 2, 2, 12, 31, 4); fillStroke(c, P.cream, 2.5);
      c.beginPath(); c.moveTo(1, 33); c.lineTo(12, 31); c.quadraticCurveTo(17, 34, 15, 38); c.lineTo(1, 38); c.closePath();
      fillStroke(c, P.gold, 2);
    }],
    ['pagdi', 42, 24, (c) => {
      c.beginPath(); c.moveTo(4, 20); c.quadraticCurveTo(4, 2, 21, 3); c.quadraticCurveTo(38, 2, 38, 20); c.closePath();
      fillStroke(c, P.rani);
      c.strokeStyle = P.raniDark; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(8, 16); c.quadraticCurveTo(20, 6, 34, 12); c.stroke();
      c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(22, 14, 30, 6); c.stroke();
      circle(c, 21, 12, 3.5, P.gold, 2);
      c.strokeStyle = P.cream; c.lineWidth = 3;
      c.beginPath(); c.moveTo(21, 9); c.quadraticCurveTo(25, 0, 31, 1); c.stroke();
    }],
    ['photographer_0', 48, 100, photographer(0)],
    ['photographer_1', 48, 100, photographer(1)],
    ['photographer_2', 48, 100, photographer(2)],
    ['aunty_0', 56, 100, aunty(0)],
    ['aunty_1', 56, 100, aunty(1)],
    ['aunty_2', 56, 100, aunty(2)],
    ['uncle_0', 56, 100, uncle(0)],
    ['uncle_1', 56, 100, uncle(1)],
    ['uncle_2', 56, 100, uncle(2)],
    ['dhol', 92, 82, dhol],
    ['cannon_barrel', 136, 60, cannonBarrel],
    ['cannon_base', 120, 70, cannonBase],
    ['sofa', 172, 64, sofa],
    ['laddoo', 22, 22, laddoo],
    ['rocket', 36, 84, rocket],
    ['gift', 52, 52, gift],
    ['cake_0', 150, 54, cakeTier(0)],
    ['cake_1', 116, 48, cakeTier(1)],
    ['cake_2', 82, 44, cakeTier(2)],
    ['fan_cage', 124, 140, fanCage],
    ['fan_blades', 96, 96, fanBlades],
    ['sky', 1280, 720, sky],
    ['bg_far', 1024, 300, bgFar],
    ['bg_near', 1024, 330, bgNear],
    ['ground', 128, 120, ground],
    ['star_full', 64, 64, star(true)],
    ['star_empty', 64, 64, star(false)],
    ['star_small', 26, 26, star(true)],
    ['star_small_empty', 26, 26, star(false)],
    ['lock', 40, 42, lock],
    ['cannon_icon', 34, 32, cannonIcon],
    ['px_smoke', 48, 48, soft('rgba(255,250,240,0.9)')],
    ['px_glow', 64, 64, soft('rgba(255,220,120,0.9)')],
    ['px_flash', 128, 128, soft('rgba(255,255,255,1)')],
    ['px_confetti', 10, 6, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 10, 6); }],
    ['px_petal', 14, 10, (c) => ellipse(c, 7, 5, 6, 4, P.marigold, 1.5)],
    ['px_frost', 16, 16, (c) => circle(c, 8, 8, 6, P.cream, 1.5)],
    ['px_dot', 10, 10, (c) => circle(c, 5, 5, 4, '#ffffff', 0)],
  ];
  jobs.forEach(([k, w, h, d], i) => {
    make(scene, k, w, h, d);
    onProgress?.((i + 1) / jobs.length);
  });
}

/** Textures whose size depends on the level; cached by size. */
export function sizedTexture(scene: Phaser.Scene, kind: string, w: number, h: number): string {
  w = Math.round(w); h = Math.round(h);
  const key = `${kind}_${w}x${h}`;
  const draws: Record<string, Draw> = {
    sweetsTable: (c, ww, hh) => clothTable(c, ww, hh),
    vat,
    canopy,
    pillar,
    stage: stageTop,
    backdrop,
    archBeam,
    giftTable: block('giftTable'),
    riser: block('riser'),
    ledge: block('ledge'),
    table: block('table'),
    archPost: pillar,
  };
  make(scene, key, w, h, draws[kind] ?? block('table'));
  return key;
}
