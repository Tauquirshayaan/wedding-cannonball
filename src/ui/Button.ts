import Phaser from 'phaser';
import { FONT } from '../config';
import { AudioManager } from '../systems/AudioManager';
import { platform } from '../platform/Platform';

export interface ButtonOpts {
  w?: number; h?: number; color?: number; textColor?: string; size?: number; icon?: string;
}

/** Chunky rounded button with press feedback. At least 48 px tall for thumbs. */
export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  private bw: number; private bh: number; private color: number;
  enabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number, text: string, onClick: () => void, o: ButtonOpts = {}) {
    super(scene, x, y);
    this.bw = o.w ?? 220; this.bh = o.h ?? 64; this.color = o.color ?? 0xe6197e;
    this.bg = scene.add.graphics();
    this.draw(false);
    this.label = scene.add.text(0, -2, text, {
      fontFamily: FONT, fontSize: `${o.size ?? 28}px`, color: o.textColor ?? '#ffffff', fontStyle: 'bold',
      stroke: '#2a1420', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(this.bw, this.bh);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev?.stopPropagation?.();
      if (!this.enabled) return;
      this.draw(true); this.setScale(0.95);
    });
    this.on('pointerout', () => { this.draw(false); this.setScale(1); });
    this.on('pointerup', (_p: Phaser.Input.Pointer, _x: number, _y: number, ev: Phaser.Types.Input.EventData) => {
      ev?.stopPropagation?.();
      if (!this.enabled) return;
      this.draw(false); this.setScale(1);
      AudioManager.play('pop');
      onClick();
    });
    scene.add.existing(this);
  }

  setEnabled(e: boolean) { this.enabled = e; this.setAlpha(e ? 1 : 0.4); return this; }
  setText(t: string) { this.label.setText(t); return this; }

  private draw(pressed: boolean) {
    const g = this.bg, w = this.bw, h = this.bh;
    g.clear();
    g.fillStyle(0x2a1420, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 18);
    g.fillStyle(this.color, 1);
    g.fillRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, 18);
    g.fillStyle(0xffffff, 0.22);
    g.fillRoundedRect(-w / 2 + 8, -h / 2 + 6 + (pressed ? 4 : 0), w - 16, h * 0.32, 10);
    g.lineStyle(4, 0x2a1420, 1);
    g.strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 4 : 0), w, h, 18);
  }
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color = 0x7a1c2e) {
  const g = scene.add.graphics();
  g.fillStyle(0x2a1420, 1); g.fillRoundedRect(x - w / 2, y - h / 2 + 8, w, h, 26);
  g.fillStyle(color, 1); g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 26);
  g.lineStyle(5, 0xf4c430, 1); g.strokeRoundedRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 20);
  g.lineStyle(4, 0x2a1420, 1); g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 26);
  return g;
}

export function title(scene: Phaser.Scene, x: number, y: number, text: string, size = 44, color = '#f4c430') {
  return scene.add.text(x, y, text, {
    fontFamily: FONT, fontSize: `${size}px`, color, fontStyle: 'bold', stroke: '#2a1420', strokeThickness: Math.round(size / 6),
    align: 'center',
  }).setOrigin(0.5);
}

/** Round ✕ close button (56 px touch target) for overlays and menus. */
export function closeButton(scene: Phaser.Scene, x: number, y: number, onClose: () => void) {
  const g = scene.add.graphics();
  g.fillStyle(0x2a1420, 1); g.fillCircle(0, 4, 28);
  g.fillStyle(0xe6197e, 1); g.fillCircle(0, 0, 28);
  g.lineStyle(3, 0x2a1420, 1); g.strokeCircle(0, 0, 28);
  g.lineStyle(6, 0xffffff, 1);
  g.lineBetween(-10, -10, 10, 10); g.lineBetween(10, -10, -10, 10);
  const big = (() => { try { return window.matchMedia('(pointer: coarse)').matches ? 1.3 : 1; } catch { return 1; } })();
  const c = scene.add.container(x, y, [g]).setSize(64, 64).setScale(big).setInteractive({ useHandCursor: true }).setDepth(1000);
  c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev?.stopPropagation?.(); c.setScale(big * 0.9); });
  c.on('pointerout', () => c.setScale(big));
  c.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev?.stopPropagation?.(); c.setScale(big); AudioManager.play('pop'); onClose(); });
  return c;
}

/** ⛶ full-screen toggle, shown only where the browser supports it. */
export function fullscreenButton(scene: Phaser.Scene, x: number, y: number) {
  if (!scene.scale.fullscreen.available || platform.ownFullscreen) return null;
  const g = scene.add.graphics();
  const draw = () => {
    g.clear();
    g.fillStyle(0x2a1420, 1); g.fillRoundedRect(-32, -28, 64, 64, 16);
    g.fillStyle(0x7a1c2e, 1); g.fillRoundedRect(-32, -32, 64, 64, 16);
    g.lineStyle(3, 0x2a1420, 1); g.strokeRoundedRect(-32, -32, 64, 64, 16);
    g.lineStyle(5, 0xffffff, 1);
    const k = scene.scale.isFullscreen ? -1 : 1; // arrows point out (enter) or in (exit)
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const cx = sx * (k > 0 ? 14 : 6), cy = sy * (k > 0 ? 14 : 6);
      g.lineBetween(cx, cy, cx - sx * 9 * k, cy); g.lineBetween(cx, cy, cx, cy - sy * 9 * k);
    }
  };
  draw();
  const c = scene.add.container(x, y, [g]).setSize(64, 64).setInteractive({ useHandCursor: true });
  c.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => {
    ev?.stopPropagation?.();
    AudioManager.play('pop');
    if (scene.scale.isFullscreen) scene.scale.stopFullscreen(); else scene.scale.startFullscreen();
  });
  scene.scale.on('enterfullscreen', draw); scene.scale.on('leavefullscreen', draw);
  scene.events.once('shutdown', () => { scene.scale.off('enterfullscreen', draw); scene.scale.off('leavefullscreen', draw); });
  return c;
}
