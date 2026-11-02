import Phaser from 'phaser';
import { GROUND_Y } from '../config';
import { OBJ } from '../data/objectTypes';
import { sizedTexture } from '../art/Textures';
import type { LevelData, ObjDef } from '../levels/types';

type Body = MatterJS.BodyType;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MatterLib = (Phaser.Physics.Matter as any).Matter;
function sleep(b: Body) {
  if (MatterLib?.Sleeping) MatterLib.Sleeping.set(b, true);
}
type Img = Phaser.GameObjects.Image;

export type Sound = 'crash' | 'laddoo' | 'click' | 'dhol' | 'splat';

export interface Prop {
  type: string;
  name: string;
  value: number;
  body: Body;
  img: Img;
  hitSpeed: number;
  scoredLaunch: number;
  sound: Sound;
  movable: boolean;
  knocked: boolean;
  /** called when this prop takes a scoring hit */
  onHit?: (impact: number, from: { x: number; y: number }) => void;
  update?: (dt: number, t: number) => void;
}

export interface Bouncer { kind: 'dhol' | 'canopy'; body: Body; img: Img; speed: number; lastMs: number; prop: Prop; }
export interface FanZone { rect: Phaser.Geom.Rectangle; fx: number; fy: number; blades: Img; }
export interface VatZone { rect: Phaser.Geom.Rectangle; img: Img; }
export interface Rocket { x: number; y: number; angle: number; img: Img; glow: Img; armed: boolean; flyTween?: Phaser.Tweens.Tween; }
export interface Gift { x: number; y: number; img: Img; glow: Img; collected: boolean; }

export interface LevelWorld {
  props: Prop[];
  bodyProp: Map<number, Prop>;
  bouncers: Map<number, Bouncer>;
  fans: FanZone[];
  vats: VatZone[];
  rockets: Rocket[];
  gift: Gift | null;
  stageZone: Phaser.Geom.Rectangle;
  stageGlow: Img;
  movables: Img[];
  dynamicCount: number;
}

export function buildLevel(scene: Phaser.Scene, level: LevelData): LevelWorld {
  const M = scene.matter;
  const world: LevelWorld = {
    props: [], bodyProp: new Map(), bouncers: new Map(), fans: [], vats: [], rockets: [], gift: null,
    stageZone: new Phaser.Geom.Rectangle(), stageGlow: null as unknown as Img, movables: [], dynamicCount: 0,
  };
  const decor = scene.add.graphics().setDepth(5);

  const staticBox = (cx: number, cy: number, w: number, h: number, extra: MatterJS.IChamferableBodyDefinition = {}) =>
    M.add.rectangle(cx, cy, w, h, { isStatic: true, friction: 0.6, restitution: 0.1, label: 'static', ...extra });

  /** create dynamic, then make static, so it can later be released with its real mass */
  const sleepingStatic = (body: Body) => { M.body.setStatic(body, true); return body; };

  const addProp = (p: Prop) => {
    world.props.push(p);
    world.bodyProp.set(p.body.id, p);
    if (p.movable) world.movables.push(p.img);
    return p;
  };

  // --- ground and walls ---
  staticBox(level.width / 2, GROUND_Y + 150, level.width + 3000, 300, { friction: 0.8, label: 'ground' });
  staticBox(-25, GROUND_Y - 1500, 50, 3200, { label: 'wall' });
  staticBox(level.width + 25, GROUND_Y - 1500, 50, 3200, { label: 'wall' });

  // --- stage ---
  const s = level.stage;
  const sh = OBJ.stage.h;
  if (s.y + sh < GROUND_Y) {
    const rh = GROUND_Y - (s.y + sh) + 4;
    staticBox(s.x + s.w / 2, s.y + sh + rh / 2 - 2, s.w - 20, rh);
    scene.add.image(s.x + s.w / 2, s.y + sh + rh / 2 - 2, sizedTexture(scene, 'riser', s.w - 20, rh)).setDepth(6);
  }
  staticBox(s.x + s.w / 2, s.y + sh / 2, s.w, sh, { friction: 0.9, restitution: 0.02, label: 'stage' });
  scene.add.image(s.x + s.w / 2, s.y + sh / 2, sizedTexture(scene, 'stage', s.w, sh)).setDepth(7);
  const bdH = OBJ.stage.backdropH;
  staticBox(s.x + s.w - 6, s.y - bdH / 2, 28, bdH, { friction: 0.9, restitution: 0.02, label: 'backdrop' });
  scene.add.image(s.x + s.w - 6, s.y - bdH / 2, sizedTexture(scene, 'backdrop', 40, bdH)).setDepth(6);
  world.stageZone.setTo(s.x - 4, s.y - OBJ.stage.zoneHeight, s.w - 18, OBJ.stage.zoneHeight + 4);
  world.stageGlow = scene.add.image(s.x + s.w / 2 - 10, s.y - 30, 'px_glow').setDepth(4).setTint(0xffd36b)
    .setDisplaySize(s.w * 1.1, 120).setAlpha(0.45);
  scene.tweens.add({ targets: world.stageGlow, alpha: 0.15, duration: 800, yoyo: true, repeat: -1 });
  // banner
  scene.add.text(s.x + s.w / 2 - 12, s.y - bdH + 26, 'SHAADI\nSTAGE', {
    fontFamily: 'Trebuchet MS, Verdana, sans-serif', fontSize: '15px', color: '#f4c430', fontStyle: 'bold', align: 'center',
    stroke: '#2a1420', strokeThickness: 4,
  }).setOrigin(0.5).setDepth(8).setAngle(-4);
  // flower stands either side
  decor.lineStyle(4, 0x2a1420, 1);

  // --- objects ---
  for (const o of level.objects) build(o);

  // --- gift ---
  if (level.gift) {
    const g = level.gift;
    const glow = scene.add.image(g.x, g.y, 'px_glow').setDepth(29).setScale(1.4).setAlpha(0.8);
    const img = scene.add.image(g.x, g.y, 'gift').setDepth(30);
    scene.tweens.add({ targets: img, y: g.y - 8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: glow, scale: 1.8, alpha: 0.4, duration: 700, yoyo: true, repeat: -1 });
    world.gift = { x: g.x, y: g.y, img, glow, collected: false };
  }

  return world;

  function build(o: ObjDef) {
    const baseY = o.y ?? GROUND_Y;
    switch (o.type) {
      case 'sofa': {
        const d = OBJ.sofa;
        const cy = baseY - d.h / 2;
        const body = staticBox(o.x, cy + 4, d.w - 8, d.h - 8, { friction: d.friction, restitution: d.restitution, label: 'sofa' });
        const img = scene.add.image(o.x, cy, 'sofa').setDepth(12);
        addProp({ type: 'sofa', name: 'Sofa', value: d.damage, body, img, hitSpeed: 4, scoredLaunch: -1, sound: 'crash', movable: false, knocked: false,
          onHit: () => scene.tweens.add({ targets: img, scaleY: 0.85, scaleX: 1.06, duration: 80, yoyo: true }) });
        break;
      }
      case 'laddooPyramid': {
        const t = OBJ.sweetsTable;
        const tw = o.w ?? t.w;
        staticBox(o.x, baseY - t.h / 2, tw, t.h, { label: 'table', friction: 0.5 });
        scene.add.image(o.x, baseY - t.h / 2, sizedTexture(scene, 'sweetsTable', tw, t.h)).setDepth(10);
        const count = Math.min(o.count ?? 10, 15);
        const r = OBJ.laddoo.radius;
        let rows = 1;
        while ((rows * (rows + 1)) / 2 < count) rows++;
        let placed = 0;
        for (let row = 0; row < rows && placed < count; row++) {
          const n = rows - row;
          for (let i = 0; i < n && placed < count; i++) {
            const lx = o.x - ((n - 1) * r * 2.02) / 2 + i * r * 2.02;
            const ly = baseY - t.h - r - row * r * 1.75;
            const body = M.add.circle(lx, ly, r, {
              density: OBJ.laddoo.density, friction: OBJ.laddoo.friction, restitution: OBJ.laddoo.restitution, frictionAir: 0.005, label: 'laddoo',
            });
            sleep(body);
            const img = scene.add.image(lx, ly, 'laddoo').setDepth(14);
            world.dynamicCount++;
            addProp({ type: 'laddoo', name: 'Laddoo', value: OBJ.laddoo.damage, body, img, hitSpeed: 3.2, scoredLaunch: -1, sound: 'laddoo', movable: true, knocked: false });
            placed++;
          }
        }
        break;
      }
      case 'dhol': {
        const d = OBJ.dhol;
        const y = o.y ?? GROUND_Y - 120;
        // stand
        decor.lineStyle(6, 0x2a1420, 1);
        decor.lineBetween(o.x, y + 20, o.x - 30, GROUND_Y);
        decor.lineBetween(o.x, y + 20, o.x + 30, GROUND_Y);
        decor.lineBetween(o.x, y + 20, o.x, GROUND_Y);
        decor.lineStyle(3, 0xc9971a, 1);
        decor.lineBetween(o.x, y + 20, o.x - 30, GROUND_Y);
        decor.lineBetween(o.x, y + 20, o.x + 30, GROUND_Y);
        decor.lineBetween(o.x, y + 20, o.x, GROUND_Y);
        const body = M.add.circle(o.x, y, d.radius, { isStatic: true, restitution: d.restitution, friction: 0.3, label: 'dhol' });
        const img = scene.add.image(o.x, y, 'dhol').setDepth(15);
        const prop = addProp({ type: 'dhol', name: 'Dhol', value: d.damage, body, img, hitSpeed: 3, scoredLaunch: -1, sound: 'dhol', movable: false, knocked: false });
        world.bouncers.set(body.id, { kind: 'dhol', body, img, speed: d.bounceSpeed, lastMs: -1e9, prop });
        break;
      }
      case 'photographer':
      case 'relative': {
        const isPh = o.type === 'photographer';
        const d = isPh ? OBJ.photographer : OBJ.relative;
        const variant = isPh ? 'photographer' : (o.variant ?? 'uncle');
        const cy = baseY - d.h / 2;
        const body = M.add.rectangle(o.x, cy, d.w, d.h, { density: 0.0018, friction: 0.7, restitution: 0.1, label: o.type, chamfer: { radius: 8 } });
        sleepingStatic(body);
        world.dynamicCount++;
        const img = scene.add.image(o.x, cy, `${variant}_0`).setDepth(20);
        const range = o.walkRange ?? 160;
        let dir = 1;
        let frameT = Math.random() * 300;
        let frame = 0;
        let x = o.x;
        const prop: Prop = {
          type: o.type, name: isPh ? 'Photographer' : (variant === 'aunty' ? 'Aunty' : 'Uncle'), value: d.damage, body, img,
          hitSpeed: d.hitSpeed, scoredLaunch: -1, sound: isPh ? 'click' : 'crash', movable: true, knocked: false,
          update: (dt, t) => {
            if (prop.knocked) return;
            frameT += dt;
            if (frameT > (isPh ? 220 : 330)) { frameT = 0; frame = 1 - frame; img.setTexture(`${variant}_${frame}`); }
            if (isPh) {
              x += dir * OBJ.photographer.walkSpeed * (dt / 16.67);
              if (x > o.x + range / 2) { x = o.x + range / 2; dir = -1; }
              if (x < o.x - range / 2) { x = o.x - range / 2; dir = 1; }
              img.setFlipX(dir < 0);
              M.body.setPosition(body, { x, y: cy });
              img.setPosition(x, cy);
            } else {
              const sway = Math.sin(t / 260 + o.x) * 0.12;
              img.setRotation(sway).setPosition(o.x, cy);
            }
          },
          onHit: (impact, from) => {
            if (prop.knocked) return;
            prop.knocked = true;
            M.body.setStatic(body, false);
            const dirX = Math.sign(body.position.x - from.x) || 1;
            M.body.setVelocity(body, { x: dirX * Math.min(10, 2 + impact * 0.45), y: -Math.min(8, 2 + impact * 0.3) });
            M.body.setAngularVelocity(body, dirX * 0.12);
            img.setTexture(`${variant}_2`).setFlipX(false);
          },
        };
        addProp(prop);
        break;
      }
      case 'fan': {
        const w = o.w ?? 300, h = o.h ?? 300;
        const rect = new Phaser.Geom.Rectangle(o.x - w / 2, (o.y ?? 300) - h / 2, w, h);
        const fx = o.fx ?? 0.6, fy = o.fy ?? -0.4;
        const len = Math.hypot(fx, fy) || 1;
        // fan sits on the upwind edge of the zone
        const fanX = rect.centerX - (fx / len) * (w / 2 + 10);
        const fanY = rect.centerY - (fy / len) * (h / 2 + 10);
        decor.lineStyle(5, 0x555566, 1);
        decor.lineBetween(fanX, fanY - 60, fanX, Math.min(fanY - 60, -400));
        const cage = scene.add.image(fanX, fanY - 12, 'fan_cage').setDepth(26).setRotation(Math.atan2(fy, fx));
        cage.setOrigin(0.5, 0.58);
        const blades = scene.add.image(fanX, fanY, 'fan_blades').setDepth(25);
        // wind streaks
        const zoneG = scene.add.graphics().setDepth(3);
        zoneG.fillStyle(0xa0f0ff, 0.06);
        zoneG.fillRoundedRect(rect.x, rect.y, rect.width, rect.height, 30);
        scene.add.particles(0, 0, 'px_dot', {
          x: { min: rect.x, max: rect.right }, y: { min: rect.y, max: rect.bottom },
          speedX: fx * 260 / len, speedY: fy * 260 / len, lifespan: 900, frequency: 70, alpha: { start: 0.5, end: 0 },
          scaleX: 1.8, scaleY: 0.3, rotate: (Math.atan2(fy, fx) * 180) / Math.PI, tint: 0xd8f6ff,
        }).setDepth(27);
        world.fans.push({ rect, fx, fy, blades });
        break;
      }
      case 'vat': {
        const w = o.w ?? 220, h = OBJ.vat.h;
        const img = scene.add.image(o.x, GROUND_Y - h / 2 + 6, sizedTexture(scene, 'vat', w, h)).setDepth(16);
        // low rim so Lucky does not roll straight through
        staticBox(o.x - w / 2 + 6, GROUND_Y - h / 2 + 10, 12, h - 20, { label: 'vatRim' });
        staticBox(o.x + w / 2 - 6, GROUND_Y - h / 2 + 10, 12, h - 20, { label: 'vatRim' });
        world.vats.push({ rect: new Phaser.Geom.Rectangle(o.x - w / 2 + 10, GROUND_Y - h - 10, w - 20, h + 10), img });
        // steam
        scene.add.particles(0, 0, 'px_smoke', {
          x: { min: o.x - w / 2 + 20, max: o.x + w / 2 - 20 }, y: GROUND_Y - h + 6, speedY: { min: -40, max: -20 },
          lifespan: 1400, frequency: 260, scale: { start: 0.4, end: 1 }, alpha: { start: 0.25, end: 0 },
        }).setDepth(17);
        break;
      }
      case 'canopy': {
        const d = OBJ.canopy;
        const w = o.w ?? 320;
        const y = o.y ?? 420;
        decor.lineStyle(7, 0x2a1420, 1);
        decor.lineBetween(o.x - w / 2 + 10, y, o.x - w / 2 + 10, GROUND_Y);
        decor.lineBetween(o.x + w / 2 - 10, y, o.x + w / 2 - 10, GROUND_Y);
        decor.lineStyle(3, 0xf4c430, 1);
        decor.lineBetween(o.x - w / 2 + 10, y, o.x - w / 2 + 10, GROUND_Y);
        decor.lineBetween(o.x + w / 2 - 10, y, o.x + w / 2 - 10, GROUND_Y);
        const body = staticBox(o.x, y + d.h / 2 - 8, w, d.h - 6, { restitution: d.restitution, label: 'canopy' });
        const img = scene.add.image(o.x, y + 2, sizedTexture(scene, 'canopy', w, d.h + 12)).setOrigin(0.5, 0.3).setDepth(18);
        const prop = addProp({ type: 'canopy', name: 'Shamiana', value: d.damage, body, img, hitSpeed: 3, scoredLaunch: -1, sound: 'crash', movable: false, knocked: false });
        world.bouncers.set(body.id, { kind: 'canopy', body, img, speed: d.bounceSpeed, lastMs: -1e9, prop });
        break;
      }
      case 'rocket': {
        const y = o.y ?? 380;
        const angle = o.angle ?? -45;
        const glow = scene.add.image(o.x, y, 'px_glow').setDepth(28).setScale(1.5).setTint(0xff9a3c).setAlpha(0.7);
        const img = scene.add.image(o.x, y, 'rocket').setDepth(29).setRotation(Phaser.Math.DegToRad(angle + 90));
        scene.tweens.add({ targets: glow, scale: 2, alpha: 0.35, duration: 500, yoyo: true, repeat: -1 });
        world.rockets.push({ x: o.x, y, angle, img, glow, armed: true });
        // launch-direction chevrons
        const rad = Phaser.Math.DegToRad(angle);
        decor.lineStyle(4, 0xffd36b, 0.6);
        for (let i = 1; i <= 3; i++) {
          const cx = o.x + Math.cos(rad) * (40 + i * 22), cy = y + Math.sin(rad) * (40 + i * 22);
          const a1 = rad + Math.PI * 0.8, a2 = rad - Math.PI * 0.8;
          decor.lineBetween(cx, cy, cx + Math.cos(a1) * 10, cy + Math.sin(a1) * 10);
          decor.lineBetween(cx, cy, cx + Math.cos(a2) * 10, cy + Math.sin(a2) * 10);
        }
        break;
      }
      case 'cake': {
        const d = OBJ.cake;
        let y = baseY;
        d.tiers.forEach((tier, i) => {
          const cy = y - tier.h / 2;
          const body = M.add.rectangle(o.x, cy, tier.w, tier.h - 2, { density: d.density, friction: 0.8, restitution: 0.05, label: 'cake', chamfer: { radius: 6 } });
          sleep(body);
          world.dynamicCount++;
          const img = scene.add.image(o.x, cy, `cake_${i}`).setDepth(19);
          const prop: Prop = { type: 'cake', name: 'Cake', value: d.damage, body, img, hitSpeed: 3.5, scoredLaunch: -1, sound: 'splat', movable: true, knocked: false };
          addProp(prop);
          y -= tier.h - 2;
        });
        break;
      }
      case 'garlandArch': {
        const gap = o.gap ?? 150;
        const h = o.h ?? 260;
        const pw = 30;
        for (const sx of [-1, 1]) {
          const px = o.x + sx * (gap / 2 + pw / 2);
          staticBox(px, GROUND_Y - h / 2, pw, h, { label: 'arch' });
          scene.add.image(px, GROUND_Y - h / 2, sizedTexture(scene, 'archPost', pw + 6, h)).setDepth(9);
        }
        const bw = gap + pw * 2 + 20;
        staticBox(o.x, GROUND_Y - h - 12, bw, 26, { label: 'arch' });
        scene.add.image(o.x, GROUND_Y - h - 12, sizedTexture(scene, 'archBeam', bw, 30)).setDepth(9);
        break;
      }
      case 'pillar': {
        const w = o.w ?? 60, h = o.h ?? 360;
        staticBox(o.x, GROUND_Y - h / 2, w, h, { label: 'pillar' });
        scene.add.image(o.x, GROUND_Y - h / 2, sizedTexture(scene, 'pillar', w, h)).setDepth(9);
        break;
      }
      case 'block': {
        const w = o.w ?? 120, h = o.h ?? 60;
        const top = o.y ?? GROUND_Y - h;
        staticBox(o.x, top + h / 2, w, h, { label: 'block', friction: 0.8 });
        scene.add.image(o.x, top + h / 2, sizedTexture(scene, o.style ?? 'table', w, h)).setDepth(9);
        break;
      }
      default:
        console.warn('Unknown object type', o.type);
    }
  }
}
