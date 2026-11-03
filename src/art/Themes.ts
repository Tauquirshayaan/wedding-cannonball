import Phaser from 'phaser';

// Each level has its own venue (sky, background, decorations, floor) and Lucky wears a new outfit.
// Everything is secular party décor: lights, lanterns, bunting, flowers, chandeliers, fireworks.

type Ctx = CanvasRenderingContext2D;
const OL = '#2a1420';

export interface Theme {
  id: string;
  venue: string;
  sky: string[];               // gradient stops top -> bottom
  stars: boolean;
  body: 'moon' | 'sun' | 'none';
  bodyY?: number;
  clouds?: boolean;
  fireworks?: boolean;
  far: 'tents' | 'palace' | 'sea' | 'city' | 'hallWall' | 'hills' | 'lake' | 'dunes' | 'mountains' | 'windows';
  farColor: string;
  near: 'tents' | 'arches' | 'palms' | 'railing' | 'curtains' | 'trees' | 'lanterns' | 'camp' | 'pines' | 'chandeliers';
  nearColor: string;
  lights: string[];            // bulb colours for strings
  deco: 'fairy' | 'marigold' | 'lanterns' | 'bunting' | 'flowers' | 'crystals';
  ground: 'grass' | 'tiles' | 'sand' | 'deck' | 'carpet' | 'marble' | 'stone';
  groundColors: [string, string];
  carpet: number;
}

export const THEMES: Theme[] = [
  { id: 'garden', venue: 'Garden Lawn', sky: ['#08102e', '#1d1b55', '#4b2763'], stars: true, body: 'moon', far: 'tents', farColor: '#2c1f52', near: 'tents', nearColor: '#4a1a40', lights: ['#fff3a0', '#ffb347', '#ff7eb6', '#a0f0ff'], deco: 'fairy', ground: 'grass', groundColors: ['#2f7a35', '#368a3c'], carpet: 0xb3122f },
  { id: 'palace', venue: 'Palace Courtyard', sky: ['#2a1b5c', '#b4457a', '#f7a35c'], stars: false, body: 'sun', bodyY: 0.62, far: 'palace', farColor: '#5a2e4a', near: 'arches', nearColor: '#c97b4a', lights: ['#ffd36b', '#ffe9b8'], deco: 'marigold', ground: 'tiles', groundColors: ['#d9a066', '#c58a52'], carpet: 0x7a1c2e },
  { id: 'beach', venue: 'Beach Sunset', sky: ['#3b2a7a', '#e2557a', '#ffb35c'], stars: false, body: 'sun', bodyY: 0.7, far: 'sea', farColor: '#2b5c8a', near: 'palms', nearColor: '#1f3b2e', lights: ['#fff3a0', '#ffffff'], deco: 'lanterns', ground: 'sand', groundColors: ['#e8c48a', '#dcb57a'], carpet: 0xe6197e },
  { id: 'rooftop', venue: 'City Rooftop', sky: ['#05081e', '#16244f', '#3b3a78'], stars: true, body: 'moon', far: 'city', farColor: '#1a2342', near: 'railing', nearColor: '#2a2f45', lights: ['#ffffff', '#fff3a0'], deco: 'fairy', ground: 'deck', groundColors: ['#8a5a3a', '#7a4e32'], carpet: 0x3e4a9b },
  { id: 'banquet', venue: 'Banquet Hall', sky: ['#4a1530', '#6a1f3e', '#3a0f22'], stars: false, body: 'none', far: 'hallWall', farColor: '#5a1a36', near: 'curtains', nearColor: '#8a1f3e', lights: ['#ffe9b8', '#ffd36b'], deco: 'crystals', ground: 'carpet', groundColors: ['#7a1c2e', '#6a1626'], carpet: 0xf4c430 },
  { id: 'farm', venue: 'Farmhouse Day', sky: ['#5fb6f0', '#8fd0f7', '#d6f0ff'], stars: false, body: 'sun', bodyY: 0.18, clouds: true, far: 'hills', farColor: '#6fae5a', near: 'trees', nearColor: '#3e8a3a', lights: ['#e6197e', '#f7a21b', '#3e9b3a', '#2f6db5'], deco: 'bunting', ground: 'grass', groundColors: ['#5aa845', '#62b04c'], carpet: 0xe6197e },
  { id: 'lake', venue: 'Lakeside Twilight', sky: ['#1b2a5c', '#5a4a8a', '#e09a7a'], stars: true, body: 'moon', far: 'lake', farColor: '#2c3e6a', near: 'lanterns', nearColor: '#2a2440', lights: ['#ffb347', '#ffd36b'], deco: 'lanterns', ground: 'stone', groundColors: ['#8a8070', '#7a7062'], carpet: 0x2f6db5 },
  { id: 'desert', venue: 'Desert Camp', sky: ['#0a0a2a', '#2a1a4a', '#7a3a4a'], stars: true, body: 'moon', far: 'dunes', farColor: '#7a4a3a', near: 'camp', nearColor: '#5a2a2a', lights: ['#ffb347', '#ff7b2e'], deco: 'lanterns', ground: 'sand', groundColors: ['#c9945a', '#bb874e'], carpet: 0xb3122f },
  { id: 'hills', venue: 'Hill Resort', sky: ['#7ec4f2', '#b8e2fa', '#fde8c8'], stars: false, body: 'sun', bodyY: 0.2, clouds: true, far: 'mountains', farColor: '#6a7fa8', near: 'pines', nearColor: '#2e6a4a', lights: ['#ffffff', '#ff7eb6'], deco: 'flowers', ground: 'grass', groundColors: ['#4f9e48', '#58a850'], carpet: 0xf7a21b },
  { id: 'ballroom', venue: 'Grand Ballroom', sky: ['#0b0820', '#1e1240', '#3a1a50'], stars: true, body: 'none', fireworks: true, far: 'windows', farColor: '#3a2a10', near: 'chandeliers', nearColor: '#c9971a', lights: ['#ffe9b8', '#f4c430', '#ffffff'], deco: 'crystals', ground: 'marble', groundColors: ['#e8e0d0', '#d8cfbe'], carpet: 0x7a1c2e },
];

export interface Outfit { id: string; style: 'kurta' | 'sherwani' | 'jacket'; main: string; dark: string; trim: string; legs: string; shoe: string; safa: string; safaDark: string; }

export const OUTFITS: Outfit[] = [
  { id: 'o1', style: 'kurta', main: '#f7a21b', dark: '#d9800b', trim: '#f4c430', legs: '#fff3d6', shoe: '#f4c430', safa: '#e6197e', safaDark: '#b0105e' },
  { id: 'o2', style: 'sherwani', main: '#fff3d6', dark: '#e8d8b0', trim: '#c9971a', legs: '#fff3d6', shoe: '#c9971a', safa: '#d72631', safaDark: '#a01020' },
  { id: 'o3', style: 'kurta', main: '#6ad1ff', dark: '#3aa8e0', trim: '#ffffff', legs: '#ffffff', shoe: '#8b4a24', safa: '#f7a21b', safaDark: '#d9800b' },
  { id: 'o4', style: 'jacket', main: '#1e2a5a', dark: '#141c40', trim: '#f4c430', legs: '#fff3d6', shoe: '#2a1420', safa: '#f4c430', safaDark: '#c9971a' },
  { id: 'o5', style: 'sherwani', main: '#7a1c2e', dark: '#5a1020', trim: '#f4c430', legs: '#fff3d6', shoe: '#f4c430', safa: '#fff3d6', safaDark: '#e0d0a8' },
  { id: 'o6', style: 'kurta', main: '#7ed957', dark: '#5ab83a', trim: '#f4c430', legs: '#fff3d6', shoe: '#8b4a24', safa: '#e6197e', safaDark: '#b0105e' },
  { id: 'o7', style: 'jacket', main: '#b39ddb', dark: '#8a70c0', trim: '#ffffff', legs: '#ffffff', shoe: '#f4c430', safa: '#3e9b3a', safaDark: '#2c7429' },
  { id: 'o8', style: 'sherwani', main: '#1b1b22', dark: '#0a0a10', trim: '#d72631', legs: '#fff3d6', shoe: '#d72631', safa: '#d72631', safaDark: '#a01020' },
  { id: 'o9', style: 'kurta', main: '#ffb3a7', dark: '#e88a7a', trim: '#2a9d8f', legs: '#fff3d6', shoe: '#2a9d8f', safa: '#2a9d8f', safaDark: '#1f7a6e' },
  { id: 'o10', style: 'sherwani', main: '#f4c430', dark: '#c9971a', trim: '#7a1c2e', legs: '#fff3d6', shoe: '#7a1c2e', safa: '#7a1c2e', safaDark: '#5a1020' },
];

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx, w: number, h: number) => void) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h);
  if (!t) return;
  t.context.lineJoin = 'round'; t.context.lineCap = 'round';
  draw(t.context, w, h);
  t.refresh();
}

function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k);
  c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath();
}
function fs(c: Ctx, fill: string, lw = 3) { c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OL; c.stroke(); } }
function dot(c: Ctx, x: number, y: number, r: number, col: string) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function rnd(seed: number) { let s = seed; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); }

// ---------------- outfits ----------------
export function makeOutfit(scene: Phaser.Scene, o: Outfit) {
  make(scene, `torso_${o.id}`, 34, 52, (c) => {
    const long = o.style === 'sherwani';
    rr(c, 3, 3, 28, long ? 47 : 46, 9); fs(c, o.main);
    if (o.style === 'jacket') {
      // Nehru jacket over a cream kurta
      rr(c, 12, 5, 10, 40, 3); fs(c, '#fff3d6', 1.5);
      c.strokeStyle = o.trim; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 6); c.lineTo(12, 44); c.moveTo(22, 6); c.lineTo(22, 44); c.stroke();
      for (const y of [14, 22, 30]) dot(c, 17, y, 1.6, o.trim);
    } else {
      c.fillStyle = o.trim; c.fillRect(15, 6, 4, 40);
      c.strokeStyle = OL; c.lineWidth = 1.5; c.strokeRect(15, 6, 4, 40);
      for (const y of [14, 22, 30]) dot(c, 17, y, 1.6, o.dark);
      if (long) { c.strokeStyle = o.trim; c.lineWidth = 2; c.strokeRect(6, 8, 22, 38); }
    }
    c.fillStyle = o.dark; c.fillRect(5, 40, 24, 5);
    c.beginPath(); c.ellipse(17, 4, 8, 3, 0, 0, Math.PI * 2); fs(c, '#c88550', 2);
  });
  make(scene, `arm_${o.id}`, 14, 34, (c) => {
    rr(c, 2, 2, 10, 24, 4); fs(c, o.style === 'jacket' ? '#fff3d6' : o.main, 2.5);
    c.fillStyle = o.trim; c.fillRect(3, 20, 8, 4);
    c.beginPath(); c.arc(7, 28, 4.5, 0, Math.PI * 2); fs(c, '#c88550', 2);
  });
  make(scene, `leg_${o.id}`, 16, 40, (c) => {
    rr(c, 2, 2, 12, 31, 4); fs(c, o.legs, 2.5);
    c.beginPath(); c.moveTo(1, 33); c.lineTo(12, 31); c.quadraticCurveTo(17, 34, 15, 38); c.lineTo(1, 38); c.closePath();
    fs(c, o.shoe, 2);
  });
  make(scene, `pagdi_${o.id}`, 42, 24, (c) => {
    c.beginPath(); c.moveTo(4, 20); c.quadraticCurveTo(4, 2, 21, 3); c.quadraticCurveTo(38, 2, 38, 20); c.closePath();
    fs(c, o.safa);
    c.strokeStyle = o.safaDark; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(8, 16); c.quadraticCurveTo(20, 6, 34, 12); c.stroke();
    c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(22, 14, 30, 6); c.stroke();
    c.beginPath(); c.arc(21, 12, 3.5, 0, Math.PI * 2); fs(c, '#f4c430', 2);
  });
}

export function makeAllOutfits(scene: Phaser.Scene) { OUTFITS.forEach((o) => makeOutfit(scene, o)); }

// ---------------- venues ----------------
function sky(t: Theme) {
  return (c: Ctx, w: number, h: number) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    t.sky.forEach((col, i) => g.addColorStop(i / (t.sky.length - 1), col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = rnd(t.id.length * 31);
    if (t.stars) for (let i = 0; i < 140; i++) { c.fillStyle = `rgba(255,255,230,${0.3 + r() * 0.7})`; const s = r() * 2 + 0.6; c.fillRect(r() * w, r() * h * 0.7, s, s); }
    if (t.body === 'moon') {
      dot(c, w * 0.8, h * 0.18, 62, 'rgba(255,240,200,0.15)'); dot(c, w * 0.8, h * 0.18, 40, '#fff2c4');
      dot(c, w * 0.8 + 16, h * 0.18 - 8, 36, t.sky[0]);
    } else if (t.body === 'sun') {
      const y = h * (t.bodyY ?? 0.2);
      dot(c, w * 0.72, y, 110, 'rgba(255,230,150,0.18)'); dot(c, w * 0.72, y, 70, 'rgba(255,220,130,0.35)'); dot(c, w * 0.72, y, 48, '#fff1b0');
    }
    if (t.clouds) {
      for (let i = 0; i < 7; i++) {
        const x = r() * w, y = 40 + r() * h * 0.35, s = 0.6 + r() * 0.8;
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (const [dx, dy, rad] of [[0, 0, 30], [30, -12, 36], [64, 0, 28], [32, 8, 30]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rad * s, 0, Math.PI * 2); c.fill(); }
      }
    }
    if (t.fireworks) {
      const cols = ['#ff7eb6', '#ffd36b', '#6ad1ff', '#7dff9a'];
      for (let i = 0; i < 6; i++) {
        const x = 100 + r() * (w - 200), y = 60 + r() * h * 0.4, R = 30 + r() * 40;
        c.strokeStyle = cols[i % 4]; c.lineWidth = 2.5;
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3); c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); c.stroke(); dot(c, x + Math.cos(a) * R, y + Math.sin(a) * R, 2.5, '#ffffff'); }
      }
    }
  };
}

function far(t: Theme) {
  return (c: Ctx, w: number, h: number) => {
    const r = rnd(t.id.length * 7 + 3);
    c.fillStyle = t.farColor;
    const warm = 'rgba(255,200,90,0.75)';
    switch (t.far) {
      case 'tents': case 'palace': {
        c.beginPath(); c.moveTo(0, h);
        for (let x = 0; x <= w; x += 64) {
          const tall = t.far === 'palace' ? 90 + ((x / 64) % 3) * 30 : 150 + ((x / 64) % 4) * 15;
          c.lineTo(x, h - tall); c.lineTo(x + 32, h - tall - (t.far === 'palace' ? 24 : 40)); c.lineTo(x + 64, h - tall);
        }
        c.lineTo(w, h); c.closePath(); c.fill();
        for (let x = 20; x < w; x += 64) { c.fillStyle = warm; rr(c, x, h - 80, 10, 16, 5); c.fill(); }
        break;
      }
      case 'sea': {
        c.fillRect(0, h - 120, w, 120);
        c.strokeStyle = 'rgba(255,220,160,0.5)'; c.lineWidth = 3;
        for (let i = 0; i < 18; i++) { const x = r() * w, y = h - 110 + r() * 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 + r() * 40, y); c.stroke(); }
        break;
      }
      case 'city': {
        for (let x = 0; x < w; x += 60) {
          const bh = 100 + r() * 170; c.fillStyle = t.farColor; c.fillRect(x, h - bh, 54, bh);
          for (let y = h - bh + 12; y < h - 10; y += 18) for (let wx = x + 8; wx < x + 48; wx += 14) if (r() > 0.45) { c.fillStyle = warm; c.fillRect(wx, y, 7, 9); }
        }
        break;
      }
      case 'hallWall': {
        c.fillRect(0, 0, w, h);
        for (let x = 30; x < w; x += 170) {
          rr(c, x, 40, 110, h - 40, 55); fs(c, '#3a0f22', 0);
          c.strokeStyle = '#c9971a'; c.lineWidth = 4; rr(c, x, 40, 110, h - 40, 55); c.stroke();
          dot(c, x + 55, 110, 18, 'rgba(255,220,150,0.25)');
        }
        break;
      }
      case 'hills': case 'mountains': {
        const peak = t.far === 'mountains';
        c.beginPath(); c.moveTo(0, h);
        for (let x = 0; x <= w; x += peak ? 128 : 256) {
          if (peak) { c.lineTo(x + 64, h - 200 - ((x / 128) % 2) * 50); c.lineTo(x + 128, h - 90); }
          else c.quadraticCurveTo(x + 128, h - 200, x + 256, h - 90);
        }
        c.lineTo(w, h); c.closePath(); c.fill();
        if (peak) { c.fillStyle = '#ffffff'; for (let x = 64; x < w; x += 128) { const py = h - 200 - (((x - 64) / 128) % 2) * 50; c.beginPath(); c.moveTo(x, py); c.lineTo(x - 22, py + 34); c.lineTo(x + 22, py + 34); c.closePath(); c.fill(); } }
        break;
      }
      case 'lake': {
        c.beginPath(); c.moveTo(0, h - 110);
        for (let x = 0; x <= w; x += 256) c.quadraticCurveTo(x + 128, h - 210, x + 256, h - 110);
        c.lineTo(w, h - 110); c.closePath(); c.fill();
        c.fillStyle = '#3a5a8a'; c.fillRect(0, h - 110, w, 110);
        c.strokeStyle = 'rgba(255,220,180,0.35)'; c.lineWidth = 2;
        for (let i = 0; i < 20; i++) { const x = r() * w, y = h - 100 + r() * 90; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 26, y); c.stroke(); }
        break;
      }
      case 'dunes': {
        c.beginPath(); c.moveTo(0, h);
        for (let x = 0; x <= w; x += 256) c.quadraticCurveTo(x + 128, h - 170, x + 256, h - 70);
        c.lineTo(w, h); c.closePath(); c.fill();
        break;
      }
      case 'windows': {
        c.fillStyle = '#2a1a0a'; c.fillRect(0, 0, w, h);
        for (let x = 20; x < w; x += 128) {
          rr(c, x, 30, 88, h - 30, 44); c.fillStyle = 'rgba(30,18,64,0.95)'; c.fill();
          c.strokeStyle = '#c9971a'; c.lineWidth = 5; c.stroke();
          c.strokeStyle = 'rgba(201,151,26,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + 44, 30); c.lineTo(x + 44, h); c.moveTo(x, 150); c.lineTo(x + 88, 150); c.stroke();
          const col = ['#ff7eb6', '#ffd36b', '#6ad1ff'][(x / 128) % 3 | 0];
          c.strokeStyle = col; for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; c.beginPath(); c.moveTo(x + 44, 100); c.lineTo(x + 44 + Math.cos(a) * 26, 100 + Math.sin(a) * 26); c.stroke(); }
        }
        break;
      }
    }
  };
}

function lightString(c: Ctx, w: number, y0: number, sag: number, cols: string[], deco: Theme['deco']) {
  for (let x = 0; x < w; x += 128) {
    c.strokeStyle = 'rgba(40,20,30,0.6)'; c.lineWidth = 1.5;
    c.beginPath(); for (let i = 0; i <= 16; i++) { const t = i / 16; const px = x + t * 128, py = y0 + Math.sin(t * Math.PI) * sag; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
    const n = deco === 'bunting' ? 7 : deco === 'lanterns' ? 4 : 10;
    for (let i = 1; i < n; i++) {
      const t = i / n; const px = x + t * 128, py = y0 + Math.sin(t * Math.PI) * sag;
      const col = cols[(i + Math.round(y0)) % cols.length];
      if (deco === 'bunting') { c.beginPath(); c.moveTo(px - 8, py); c.lineTo(px + 8, py); c.lineTo(px, py + 18); c.closePath(); fs(c, col, 1.5); }
      else if (deco === 'lanterns') { dot(c, px, py + 12, 14, 'rgba(255,180,80,0.25)'); rr(c, px - 7, py + 2, 14, 20, 6); fs(c, col, 1.5); }
      else if (deco === 'marigold') { dot(c, px, py, 5, i % 2 ? '#f7a21b' : '#f4c430'); }
      else if (deco === 'flowers') { for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; dot(c, px + Math.cos(a) * 4, py + Math.sin(a) * 4, 3, col); } dot(c, px, py, 2.5, '#f4c430'); }
      else if (deco === 'crystals') { c.beginPath(); c.moveTo(px, py); c.lineTo(px + 4, py + 8); c.lineTo(px, py + 16); c.lineTo(px - 4, py + 8); c.closePath(); fs(c, 'rgba(255,255,255,0.8)', 0); }
      else { dot(c, px, py, 6, 'rgba(255,230,150,0.25)'); dot(c, px, py, 2.5, col); }
    }
  }
}

function near(t: Theme) {
  return (c: Ctx, w: number, h: number) => {
    const r = rnd(t.id.length * 13 + 5);
    c.fillStyle = t.nearColor;
    switch (t.near) {
      case 'tents': case 'camp':
        for (let i = 0; i < 4; i++) {
          const x = i * 256;
          c.fillStyle = i % 2 ? t.nearColor : shade(t.nearColor, -12);
          c.beginPath(); c.moveTo(x + 10, h); c.lineTo(x + 10, 120); c.lineTo(x + 128, 60); c.lineTo(x + 246, 120); c.lineTo(x + 246, h); c.closePath(); c.fill();
          c.fillStyle = 'rgba(255,200,90,0.35)'; c.fillRect(x + 100, 160, 56, h - 160);
          if (t.near === 'camp') { // torches
            for (const tx of [x + 30, x + 226]) { c.fillStyle = '#3a2418'; c.fillRect(tx - 2, h - 120, 4, 120); dot(c, tx, h - 126, 14, 'rgba(255,150,50,0.35)'); dot(c, tx, h - 126, 6, '#ffb347'); }
          }
        }
        break;
      case 'arches':
        c.fillRect(0, 60, w, h - 60);
        for (let x = 0; x < w; x += 128) {
          c.fillStyle = shade(t.nearColor, -40); rr(c, x + 24, 120, 80, h - 120, 40); c.fill();
          c.strokeStyle = '#f4c430'; c.lineWidth = 3; rr(c, x + 24, 120, 80, h - 120, 40); c.stroke();
          dot(c, x + 64, 150, 10, 'rgba(255,210,120,0.5)');
        }
        c.fillStyle = shade(t.nearColor, 20); c.fillRect(0, 52, w, 14);
        break;
      case 'palms':
        for (let x = 60; x < w; x += 256) {
          c.strokeStyle = '#4a3020'; c.lineWidth = 10; c.beginPath(); c.moveTo(x, h); c.quadraticCurveTo(x + 20, h - 120, x + 6, h - 210); c.stroke();
          c.fillStyle = t.nearColor;
          for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.55; c.beginPath(); c.ellipse(x + 6 + Math.cos(a) * 46, h - 214 + Math.sin(a) * 26 + 18, 52, 10, a, 0, Math.PI * 2); c.fill(); }
        }
        break;
      case 'railing':
        c.fillStyle = t.nearColor; c.fillRect(0, h - 90, w, 10);
        for (let x = 6; x < w; x += 32) c.fillRect(x, h - 90, 5, 90);
        break;
      case 'curtains':
        for (let x = 0; x < w; x += 256) {
          for (const side of [0, 1]) {
            c.fillStyle = t.nearColor; c.beginPath();
            const sx = x + side * 256;
            c.moveTo(sx, 0); c.lineTo(sx + (side ? -90 : 90), 0); c.quadraticCurveTo(sx + (side ? -30 : 30), h * 0.5, sx + (side ? -60 : 60), h); c.lineTo(sx, h); c.closePath(); c.fill();
            c.strokeStyle = shade(t.nearColor, -30); c.lineWidth = 3;
            for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(sx + (side ? -k * 20 : k * 20), 0); c.lineTo(sx + (side ? -k * 14 : k * 14), h); c.stroke(); }
          }
          chandelier(c, x + 128, 20);
        }
        break;
      case 'chandeliers':
        for (let x = 128; x < w; x += 256) chandelier(c, x, 10, 1.4);
        break;
      case 'trees': case 'pines':
        for (let x = 40; x < w; x += 140 + Math.round(r() * 30)) {
          if (x > w - 40) break;
          c.fillStyle = '#5a3a24'; c.fillRect(x - 5, h - 70, 10, 70);
          c.fillStyle = t.nearColor;
          if (t.near === 'pines') { for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x, h - 200 + k * 40); c.lineTo(x - 50 + k * 6, h - 110 + k * 30); c.lineTo(x + 50 - k * 6, h - 110 + k * 30); c.closePath(); c.fill(); } }
          else { for (const [dx, dy, rad] of [[0, -130, 46], [-34, -100, 38], [34, -100, 38]]) dot(c, x + dx, h + dy, rad, t.nearColor); }
        }
        break;
      case 'lanterns':
        for (let x = 64; x < w; x += 192) {
          c.fillStyle = '#3a2a20'; c.fillRect(x - 3, h - 200, 6, 200);
          dot(c, x, h - 205, 26, 'rgba(255,180,80,0.3)'); rr(c, x - 12, h - 222, 24, 32, 8); fs(c, '#ffb347', 2);
        }
        break;
    }
    lightString(c, w, 30, 26, t.lights, t.deco);
    if (t.deco !== 'bunting') lightString(c, w, 72, 22, t.lights, t.deco === 'lanterns' ? 'fairy' : t.deco);
  };
}

function chandelier(c: Ctx, x: number, y: number, s = 1) {
  c.strokeStyle = '#c9971a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, y + 20 * s); c.stroke();
  dot(c, x, y + 50 * s, 46 * s, 'rgba(255,230,160,0.18)');
  c.beginPath(); c.ellipse(x, y + 40 * s, 40 * s, 12 * s, 0, 0, Math.PI); fs(c, '#f4c430', 2);
  for (let k = -3; k <= 3; k++) { c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + k * 11 * s, y + 42 * s); c.lineTo(x + k * 11 * s, y + (58 - Math.abs(k) * 3) * s); c.stroke(); dot(c, x + k * 11 * s, y + (60 - Math.abs(k) * 3) * s, 2.5 * s, '#ffffff'); }
  for (let k = -2; k <= 2; k++) dot(c, x + k * 16 * s, y + 34 * s, 3 * s, '#fff3a0');
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function ground(t: Theme) {
  return (c: Ctx, w: number, h: number) => {
    const [a, b] = t.groundColors;
    c.fillStyle = a; c.fillRect(0, 0, w, h);
    switch (t.ground) {
      case 'grass': c.fillStyle = b; c.fillRect(0, 0, w / 2, h); c.fillStyle = 'rgba(0,0,0,0.12)'; for (let x = 6; x < w; x += 16) c.fillRect(x, 20 + ((x * 7) % 30), 3, 6); break;
      case 'tiles': case 'marble': case 'stone':
        c.fillStyle = b; c.fillRect(0, 0, w / 2, 60); c.fillRect(w / 2, 60, w / 2, 60);
        c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 2; c.strokeRect(0, 0, w / 2, 60); c.strokeRect(w / 2, 0, w / 2, 60); c.strokeRect(0, 60, w / 2, 60); c.strokeRect(w / 2, 60, w / 2, 60);
        if (t.ground === 'marble') { c.strokeStyle = 'rgba(150,140,120,0.35)'; c.beginPath(); c.moveTo(10, 30); c.quadraticCurveTo(50, 10, 110, 50); c.stroke(); }
        break;
      case 'sand': c.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 30; i++) c.fillRect((i * 37) % w, (i * 53) % h, 3, 2); break;
      case 'deck': c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2; for (let y = 16; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } break;
      case 'carpet': c.fillStyle = b; for (let x = 0; x < w; x += 32) for (let y = 16; y < h; y += 32) { c.beginPath(); c.moveTo(x + 16, y - 8); c.lineTo(x + 24, y); c.lineTo(x + 16, y + 8); c.lineTo(x + 8, y); c.closePath(); c.fill(); } break;
    }
    c.fillStyle = shade(a, 30); c.fillRect(0, 0, w, 8);
    c.fillStyle = OL; c.fillRect(0, 8, w, 3);
  };
}

/** Generates (once) and returns texture keys for a venue. */
export function themeTextures(scene: Phaser.Scene, t: Theme) {
  const k = { sky: `sky_${t.id}`, far: `far_${t.id}`, near: `near_${t.id}`, ground: `ground_${t.id}` };
  make(scene, k.sky, 640, 360, sky(t)); // half resolution: a gradient upscales cleanly and uses 1/4 of the memory
  make(scene, k.far, 1024, 300, far(t));
  make(scene, k.near, 1024, 330, near(t));
  make(scene, k.ground, 128, 120, ground(t));
  return k;
}

/** Frees a venue's canvases (CPU + GPU memory) when leaving a level. */
export function releaseThemeTextures(scene: Phaser.Scene, t: Theme) {
  for (const k of [`sky_${t.id}`, `far_${t.id}`, `near_${t.id}`, `ground_${t.id}`]) if (scene.textures.exists(k)) scene.textures.remove(k);
}

export function themeFor(levelId: number) { return THEMES[(levelId - 1) % THEMES.length]; }
export function outfitFor(levelId: number) { return OUTFITS[(levelId - 1) % OUTFITS.length]; }
