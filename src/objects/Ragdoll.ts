import Phaser from 'phaser';
import { PHYS } from '../config';

type Body = MatterJS.BodyType;

interface PartDef {
  key: string; tex: string; shape: 'circle' | 'rect'; w: number; h: number; density: number;
  ox: number; oy: number; depth: number;
}

// Offsets are relative to the torso centre with Lucky standing upright.
const PARTS: PartDef[] = [
  { key: 'armBack', tex: 'arm', shape: 'rect', w: 10, h: 30, density: 0.001, ox: 10, oy: -4, depth: 0 },
  { key: 'legBack', tex: 'leg', shape: 'rect', w: 12, h: 36, density: 0.0012, ox: 6, oy: 36, depth: 1 },
  { key: 'legFront', tex: 'leg', shape: 'rect', w: 12, h: 36, density: 0.0012, ox: -6, oy: 36, depth: 2 },
  { key: 'torso', tex: 'torso', shape: 'rect', w: 26, h: 44, density: 0.002, ox: 0, oy: 0, depth: 3 },
  { key: 'head', tex: 'head_calm', shape: 'circle', w: 14, h: 14, density: 0.0015, ox: 0, oy: -36, depth: 4 },
  { key: 'pagdi', tex: 'pagdi', shape: 'rect', w: 30, h: 14, density: 0.0006, ox: 0, oy: -54, depth: 5 },
  { key: 'armFront', tex: 'arm', shape: 'rect', w: 10, h: 30, density: 0.001, ox: -10, oy: -4, depth: 6 },
];

// [partA, pointA, partB, pointB, stiffness]
const JOINTS: [string, [number, number], string, [number, number], number][] = [
  ['torso', [0, -21], 'head', [0, 15], PHYS.neckStiffness],
  ['torso', [10, -17], 'armBack', [0, -13], PHYS.jointStiffness],
  ['torso', [-10, -17], 'armFront', [0, -13], PHYS.jointStiffness],
  ['torso', [6, 20], 'legBack', [0, -16], PHYS.jointStiffness],
  ['torso', [-6, 20], 'legFront', [0, -16], PHYS.jointStiffness],
];

const OUTFIT_PARTS = ['torso', 'arm', 'leg', 'pagdi'];
const texFor = (tex: string) => (OUTFIT_PARTS.includes(tex) ? `${tex}_${Ragdoll.outfit}` : tex);

export class Ragdoll {
  /** outfit id for the current level (textures torso_<id>, arm_<id>, ...) */
  static outfit = 'o1';
  scene: Phaser.Scene;
  bodies: Record<string, Body> = {};
  images: Record<string, Phaser.GameObjects.Image> = {};
  list: Body[] = [];
  private constraints: MatterJS.ConstraintType[] = [];
  private pagdiJoint: MatterJS.ConstraintType | null = null;
  pagdiLost = false;
  face: string = 'head_calm';

  constructor(scene: Phaser.Scene, x: number, y: number, rotation: number, depthBase = 40) {
    this.scene = scene;
    const M = scene.matter;
    const group = M.world.nextGroup(true);
    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    for (const p of PARTS) {
      const px = x + p.ox * cos - p.oy * sin;
      const py = y + p.ox * sin + p.oy * cos;
      const opts: MatterJS.IChamferableBodyDefinition = {
        density: p.density,
        friction: PHYS.ragdollFriction,
        restitution: PHYS.ragdollRestitution,
        frictionAir: PHYS.airFriction,
        collisionFilter: { group, category: 0x0002, mask: 0xffff },
        angle: rotation,
        label: 'lucky_' + p.key,
      };
      const b = p.shape === 'circle'
        ? M.add.circle(px, py, p.w, opts)
        : M.add.rectangle(px, py, p.w, p.h, { ...opts, chamfer: { radius: p.key === 'torso' ? 8 : 4 } });
      (b as unknown as { sleepThreshold: number }).sleepThreshold = 1e9;
      this.bodies[p.key] = b;
      this.list.push(b);
      const img = scene.add.image(px, py, texFor(p.tex)).setRotation(rotation).setDepth(depthBase + p.depth);
      if (p.key === 'pagdi') img.setOrigin(0.5, 0.62);
      this.images[p.key] = img;
    }
    for (const [a, pa, b, pb, k] of JOINTS) {
      const c = M.add.constraint(this.bodies[a], this.bodies[b], 0, k, {
        pointA: { x: pa[0], y: pa[1] }, pointB: { x: pb[0], y: pb[1] }, damping: PHYS.jointDamping,
      });
      this.constraints.push(c);
    }
    this.pagdiJoint = M.add.constraint(this.bodies.head, this.bodies.pagdi, 0, 0.8, {
      pointA: { x: 0, y: -13 }, pointB: { x: 0, y: 5 }, damping: 0.1,
    });
    // a second anchor keeps the turban from spinning on its single pin
    this.constraints.push(M.add.constraint(this.bodies.head, this.bodies.pagdi, 0, 0.5, {
      pointA: { x: 10, y: -13 }, pointB: { x: 10, y: 5 }, damping: 0.1,
    }));
  }

  get torso() { return this.bodies.torso; }

  isPart(b: Body) { return this.list.includes(b); }

  setVelocity(vx: number, vy: number) {
    for (const b of this.list) this.scene.matter.body.setVelocity(b, { x: vx, y: vy });
  }

  averageVelocity() {
    let x = 0, y = 0;
    for (const b of this.list) { x += b.velocity.x; y += b.velocity.y; }
    return { x: x / this.list.length, y: y / this.list.length };
  }

  capVelocity(cap: number) {
    for (const b of this.list) {
      const s = Math.hypot(b.velocity.x, b.velocity.y);
      if (s > cap) this.scene.matter.body.setVelocity(b, { x: (b.velocity.x / s) * cap, y: (b.velocity.y / s) * cap });
    }
  }

  push(dx: number, dy: number) {
    for (const b of this.list) this.scene.matter.body.setVelocity(b, { x: b.velocity.x + dx, y: b.velocity.y + dy });
  }

  flail() {
    const r = (n: number) => (Math.random() - 0.5) * n;
    for (const k of ['armBack', 'armFront', 'legBack', 'legFront']) {
      this.scene.matter.body.setAngularVelocity(this.bodies[k], r(1.2));
    }
  }

  loseTurban() {
    if (this.pagdiLost || !this.pagdiJoint) return false;
    this.pagdiLost = true;
    this.scene.matter.world.removeConstraint(this.pagdiJoint);
    // the helper anchor goes too
    const last = this.constraints.pop();
    if (last) this.scene.matter.world.removeConstraint(last);
    const p = this.bodies.pagdi;
    this.scene.matter.body.setVelocity(p, { x: p.velocity.x * 0.6 + (Math.random() - 0.5) * 4, y: p.velocity.y - 5 });
    this.scene.matter.body.setAngularVelocity(p, (Math.random() - 0.5) * 0.6);
    return true;
  }

  setFace(f: 'calm' | 'scared' | 'dizzy' | 'happy') {
    const key = 'head_' + f;
    if (this.face === key) return;
    this.face = key;
    this.images.head.setTexture(key);
  }

  freeze() {
    for (const b of this.list) {
      this.scene.matter.body.setVelocity(b, { x: 0, y: 0 });
      this.scene.matter.body.setStatic(b, true);
    }
  }

  sync() {
    for (const k in this.bodies) {
      const b = this.bodies[k];
      this.images[k].setPosition(b.position.x, b.position.y).setRotation(b.angle);
    }
  }

  /** Snapshot for the replay buffer: x, y, angle per part. */
  snapshot(out: number[]) {
    for (const p of PARTS) {
      const b = this.bodies[p.key];
      out.push(b.position.x, b.position.y, b.angle);
    }
  }

  static partKeys() { return PARTS.map((p) => p.key); }
  static partTextures() { return PARTS.map((p) => texFor(p.tex)); }

  destroy() {
    const w = this.scene.matter.world;
    for (const c of this.constraints) w.removeConstraint(c);
    if (this.pagdiJoint && !this.pagdiLost) w.removeConstraint(this.pagdiJoint);
    for (const b of this.list) w.remove(b);
    for (const k in this.images) this.images[k].destroy();
    this.list = [];
  }
}
