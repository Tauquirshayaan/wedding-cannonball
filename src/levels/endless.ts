// Endless Baraat: procedurally generated rounds that get harder, each verified to be winnable.
import { GROUND_Y, PHYS, STEP_MS } from '../config';
import type { LevelData, ObjDef } from './types';

export const ENDLESS_BASE = 100000; // level ids >= this are endless rounds (id = base + round)
export const ENDLESS_UNLOCK_AFTER = 3; // clear this campaign level to unlock Endless

/** Torso flight path from the cannon, identical to the game's physics (until it touches something). */
export function flightPath(cannonX: number, angle: number, power: number, maxX: number, maxSteps = 500) {
  const r = (angle * Math.PI) / 180;
  const v = power * PHYS.maxLaunchSpeed;
  let vx = Math.cos(r) * v, vy = -Math.sin(r) * v;
  let x = cannonX + 4 + Math.cos(r) * 96, y = GROUND_Y - 58 - Math.sin(r) * 96;
  const g = PHYS.gravityY * 0.001 * STEP_MS * STEP_MS;
  const pts: { x: number; y: number; vy: number }[] = [];
  for (let i = 0; i < maxSteps; i++) {
    vx *= 1 - PHYS.airFriction; vy = vy * (1 - PHYS.airFriction) + g;
    x += vx; y += vy;
    pts.push({ x, y, vy });
    if (y > GROUND_Y || x > maxX) break;
  }
  return pts;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['Late Again', 'Buffet Rush', 'Selfie Zone', 'Dance Off', 'Mithai Overload', 'Patakha Night', 'Rishtedaar Rush',
  'Photo Session', 'Cake Cutting', 'Lights & Lanterns', 'Bhangra Break', 'Shagun Hunt', 'Band Baaja Blast', 'Chaat Counter', 'Uncle Alert'];

interface Rect { x1: number; y1: number; x2: number; y2: number; }

/** Everything a clean winning shot must not touch before it reaches the stage. */
function obstacles(L: LevelData): Rect[] {
  const G = GROUND_Y, out: Rect[] = [];
  const add = (x1: number, y1: number, x2: number, y2: number) => out.push({ x1: x1 - 22, y1: y1 - 22, x2: x2 + 22, y2: y2 + 22 });
  for (const o of L.objects) {
    switch (o.type) {
      case 'sofa': add(o.x - 85, G - 62, o.x + 85, G); break;
      case 'laddooPyramid': add(o.x - 65, (o.y ?? G) - 110, o.x + 65, o.y ?? G); break;
      case 'dhol': add(o.x - 40, (o.y ?? G - 120) - 40, o.x + 40, G); break;
      case 'photographer': add(o.x - (o.walkRange ?? 160) / 2 - 20, G - 90, o.x + (o.walkRange ?? 160) / 2 + 20, G); break;
      case 'relative': add(o.x - 25, G - 95, o.x + 25, G); break;
      case 'fan': add(o.x - (o.w ?? 300) / 2, (o.y ?? 300) - (o.h ?? 300) / 2, o.x + (o.w ?? 300) / 2, (o.y ?? 300) + (o.h ?? 300) / 2); break;
      case 'vat': add(o.x - (o.w ?? 220) / 2, G - 80, o.x + (o.w ?? 220) / 2, G); break;
      case 'canopy': add(o.x - (o.w ?? 320) / 2, o.y ?? 420, o.x + (o.w ?? 320) / 2, G); break;
      case 'rocket': add(o.x - 48, (o.y ?? 380) - 48, o.x + 48, (o.y ?? 380) + 48); break;
      case 'cake': add(o.x - 75, G - 146, o.x + 75, G); break;
      case 'pillar': add(o.x - (o.w ?? 60) / 2, G - (o.h ?? 360), o.x + (o.w ?? 60) / 2, G); break;
      case 'kadhai': add(o.x - 66, G - 112, o.x + 66, G); break;
      case 'tandoor': add(o.x - 42, G - 172, o.x + 42, G); break;
      case 'cracker': add(o.x - 50, G - 80, o.x + 50, G); break;
    }
  }
  const s = L.stage;
  add(s.x + s.w - 20, s.y - 210, s.x + s.w + 8, s.y); // backdrop
  return out;
}

/** Counts clean shots that land on the stage without touching anything. */
export function winningShots(L: LevelData) {
  const obs = obstacles(L);
  const s = L.stage;
  let wins = 0;
  for (let a = 15; a <= 75; a += 2.5) {
    for (let p = 0.3; p <= 1.0001; p += 0.025) {
      const path = flightPath(L.cannon.x, a, p, L.width + 600);
      for (const pt of path) {
        if (obs.some((r) => pt.x > r.x1 && pt.x < r.x2 && pt.y > r.y1 && pt.y < r.y2)) break;
        if (pt.vy > 0 && pt.x > s.x + 20 && pt.x < s.x + s.w - 45 && pt.y >= s.y - 25) { wins++; break; }
        if (pt.y >= s.y - 25 && pt.x > s.x - 10 && pt.x < s.x + s.w) break; // hit the stage front
      }
    }
  }
  return wins;
}

function build(round: number, r: () => number): LevelData {
  const d = Math.min(1, (round - 1) / 15); // difficulty 0..1 over the first 16 rounds
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const stageW = Math.round(340 - d * 90);
  const stageX = Math.round(1150 + d * 950 + r() * 250);
  const raised = r() < 0.2 + d * 0.45;
  const stageY = raised ? Math.round(600 - 80 - r() * (60 + 200 * d)) : 600;
  const objects: ObjDef[] = [];
  const pool = ['sofa', 'laddooPyramid', 'cracker', 'photographer', 'dhol'];
  if (round >= 2) pool.push('relative', 'kadhai');
  if (round >= 3) pool.push('canopy', 'tandoor', 'cake');
  if (round >= 4) pool.push('vat', 'rocket');
  if (round >= 6) pool.push('fan', 'pillar');
  const count = 3 + Math.floor(d * 5) + (r() < 0.5 ? 1 : 0);
  let x = 420 + r() * 120;
  for (let i = 0; i < count && x < stageX - 220; i++) {
    let t = pick(pool);
    if (objects.length && t === objects[objects.length - 1].type) t = pick(pool); // avoid repeats
    if (objects.length && t === objects[objects.length - 1].type) t = pool[(pool.indexOf(t) + 1) % pool.length];
    const o: ObjDef = { type: t, x: Math.round(x) };
    let span = 180;
    switch (t) {
      case 'laddooPyramid': o.count = 6 + Math.floor(r() * 9); break;
      case 'dhol': o.y = Math.round(500 + r() * 60); break;
      case 'photographer': o.walkRange = Math.round(120 + r() * 120); span = 160 + o.walkRange; break;
      case 'relative': o.variant = r() < 0.5 ? 'uncle' : 'aunty'; span = 110; break;
      case 'canopy': o.w = Math.round(260 + r() * 120); o.y = Math.round(400 + r() * 80); span = o.w + 60; o.x += o.w / 2 - 90; break;
      case 'vat': o.w = Math.round(200 + d * 260); o.x += o.w / 2 - 90; span = o.w + 80; break;
      case 'rocket': o.y = Math.round(280 + r() * 140); o.angle = -Math.round(18 + r() * 25); break;
      case 'fan': o.w = 300; o.h = 480; o.y = 330; o.fx = 0.6; o.fy = -1; o.x += 60; span = 360; break;
      case 'pillar': o.w = 60; o.h = Math.round(200 + r() * 140 * d); span = 160; break;
      case 'cake': span = 210; break;
      case 'kadhai': span = 200; break;
    }
    objects.push(o);
    x += span + r() * 120;
  }
  const gift = r() < 0.6 ? { x: Math.round(500 + r() * Math.max(200, stageX - 800)), y: Math.round(170 + r() * 260) } : null;
  const theme = ENDLESS_BASE + round;
  return {
    id: theme,
    name: NAMES[(round - 1) % NAMES.length],
    tip: `Endless Baraat · Round ${round}`,
    width: stageX + stageW + 560,
    cannon: { x: 130, y: 600 },
    stage: { x: stageX, y: stageY, w: stageW },
    gift,
    damageTarget: Math.min(6000, 800 + round * 250),
    objects,
  };
}

/** Campaign levels 11+: the same generator with a fixed seed per level, so every player gets the same layout. */
export function campaignLevel(id: number): LevelData {
  const round = 2 + Math.floor((id - 11) / 25); // difficulty climbs slowly across ~1000 levels
  const L = generateRound(round, id * 7777 + 13);
  return { ...L, id, name: campaignName(id), tip: `Level ${id}`, damageTarget: Math.min(8000, 900 + round * 220) };
}

export function campaignName(id: number) { return NAMES[(id * 7) % NAMES.length]; }

/** Builds round N of a run. Retries with new layouts until at least a few clean winning shots exist. */
export function generateRound(round: number, runSeed: number): LevelData {
  let best: LevelData | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const L = build(round, rng(runSeed * 7919 + round * 104729 + attempt * 31337));
    if (winningShots(L) >= 4) return L;
    best = L;
  }
  // last resort: drop the obstacles closest to the stage until it is winnable
  const L = best!;
  while (L.objects.length && winningShots(L) < 4) L.objects.pop();
  return L;
}
