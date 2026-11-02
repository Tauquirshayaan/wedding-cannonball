import Phaser from 'phaser';
import { FONT } from '../config';
import { AudioManager } from '../systems/AudioManager';

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
