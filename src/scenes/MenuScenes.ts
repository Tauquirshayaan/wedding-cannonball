import Phaser from 'phaser';
import { GAME_W, GAME_H, GROUND_Y, FONT } from '../config';
import { generateCoreTextures } from '../art/Textures';
import { Button, panel, title } from '../ui/Button';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { Analytics } from '../systems/Analytics';
import { rupees } from '../systems/DamageTracker';
import { platform } from '../platform/Platform';
import { LEVELS } from '../levels';
import type { ResultData } from './GameScene';

const TIPS = [
  'Hit the dhol to fly higher',
  'Knocking things over earns Shaadi Damage',
  'Hits within 1.5 s chain into combos',
  'Tap once mid-air to flail upwards',
  'Avoid the chashni vat — it is very sticky',
  'Fly through a rocket for a big boost',
];

function backdrop(scene: Phaser.Scene, dim = 0) {
  scene.add.image(GAME_W / 2, GAME_H / 2, 'sky');
  scene.add.tileSprite(0, GROUND_Y - 290, GAME_W, 300, 'bg_far').setOrigin(0);
  scene.add.tileSprite(0, GROUND_Y - 320, GAME_W, 330, 'bg_near').setOrigin(0);
  scene.add.tileSprite(0, GROUND_Y - 11, GAME_W, 120, 'ground').setOrigin(0);
  if (dim) scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x0e1a40, dim).setOrigin(0);
}

function soundToggle(scene: Phaser.Scene, x: number, y: number) {
  const b = new Button(scene, x, y, AudioManager.isMuted() ? '🔇' : '🔊', () => {
    const m = !AudioManager.isMuted();
    AudioManager.setMuted(m);
    SaveManager.data.muted = m; SaveManager.persist();
    b.setText(m ? '🔇' : '🔊');
  }, { w: 64, h: 64, size: 28, color: 0x7a1c2e });
  return b;
}

// ---------------------------------------------------------------- Preload
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }
  create() {
    this.cameras.main.setBackgroundColor('#0e1a40');
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    title(this, GAME_W / 2, 250, 'Human Cannonball', 64);
    title(this, GAME_W / 2, 320, 'WEDDING EDITION', 34, '#ff7eb6');
    const g = this.add.graphics();
    const tipText = this.add.text(GAME_W / 2, 520, tip, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8' }).setOrigin(0.5);
    const draw = (p: number) => {
      g.clear();
      // cannon-shaped progress bar
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(390, 400, 500, 44, 22);
      g.fillStyle(0xf7a21b, 1); g.fillRoundedRect(396, 406, Math.max(30, 488 * p), 32, 16);
      g.fillStyle(0x8b4a24, 1); g.fillCircle(420, 460, 22); g.fillCircle(860, 460, 22);
      g.fillStyle(0xf4c430, 1); g.fillCircle(420, 460, 9); g.fillCircle(860, 460, 9);
    };
    draw(0);
    platform.firstFrame();
    // draw textures over a few frames so the bar moves
    this.time.delayedCall(30, () => {
      generateCoreTextures(this, (p) => { draw(p); platform.loadingProgress(p); });
      draw(1);
      tipText.setText(tip);
      this.time.delayedCall(250, () => {
        platform.loadingDone();
        this.scene.start('Title');
      });
    });
  }
}

// ---------------------------------------------------------------- Title
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    backdrop(this);
    AudioManager.startMusic();
    platform.gameplayStop();
    // cannon with Lucky waving
    const cx = 300;
    const barrel = this.add.image(cx + 4, GROUND_Y - 58, 'cannon_barrel').setOrigin(26 / 136, 0.5).setRotation(-0.7);
    const head = this.add.image(cx + 70, GROUND_Y - 130, 'head_happy').setRotation(0.2);
    const pagdi = this.add.image(cx + 74, GROUND_Y - 148, 'pagdi').setRotation(0.2);
    const arm = this.add.image(cx + 95, GROUND_Y - 132, 'arm').setOrigin(0.5, 0.1);
    this.children.bringToTop(barrel);
    this.add.image(cx, GROUND_Y - 36, 'cannon_base');
    this.tweens.add({ targets: arm, rotation: { from: -2.6, to: -1.6 }, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: [head, pagdi], y: '-=6', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // stage on the right
    this.add.image(1080, GROUND_Y - 60, 'uncle_0');
    this.add.image(1160, GROUND_Y - 58, 'aunty_1');
    this.add.image(960, GROUND_Y - 44, 'photographer_0').setFlipX(true);

    const logo = title(this, GAME_W / 2, 150, 'HUMAN CANNONBALL', 84);
    const sub = title(this, GAME_W / 2, 238, 'WEDDING EDITION', 44, '#ff7eb6');
    this.tweens.add({ targets: logo, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    sub.setAngle(-2);
    this.add.text(GAME_W / 2, 296, 'Lucky is late for the shaadi. Fire him in!', { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);

    const play = new Button(this, GAME_W / 2, 400, 'PLAY', () => this.scene.start('LevelSelect'), { w: 280, h: 86, size: 46 });
    this.tweens.add({ targets: play, scale: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    new Button(this, GAME_W / 2, 500, 'Settings', () => { this.scene.pause(); this.scene.launch('Settings', { from: 'Title' }); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e });
    soundToggle(this, GAME_W - 56, 56);
    const stars = SaveManager.totalStars();
    if (stars > 0) this.add.text(56, 56, `★ ${stars}/30`, { fontFamily: FONT, fontSize: '28px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 6 }).setOrigin(0, 0.5);
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('LevelSelect'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('LevelSelect'));
  }
}

// ---------------------------------------------------------------- Level select
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }
  create() {
    backdrop(this, 0.45);
    platform.gameplayStop();
    title(this, GAME_W / 2, 70, 'Choose a Function', 52);
    this.add.text(GAME_W / 2, 122, `★ ${SaveManager.totalStars()} / ${LEVELS.length * 3}`, { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8', fontStyle: 'bold' }).setOrigin(0.5);
    const cw = 210, ch = 190, gap = 26;
    const x0 = GAME_W / 2 - (5 * cw + 4 * gap) / 2 + cw / 2;
    LEVELS.forEach((L, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = x0 + col * (cw + gap), y = 270 + row * (ch + 30);
      const unlocked = SaveManager.isUnlocked(L.id);
      const rec = SaveManager.level(L.id);
      const g = this.add.graphics();
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(-cw / 2, -ch / 2 + 8, cw, ch, 22);
      g.fillStyle(unlocked ? (rec.cleared ? 0x7a1c2e : 0xb0105e) : 0x3a2f5a, 1); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
      g.lineStyle(4, unlocked ? 0xf4c430 : 0x6a5f8a, 1); g.strokeRoundedRect(-cw / 2 + 7, -ch / 2 + 7, cw - 14, ch - 14, 16);
      g.lineStyle(4, 0x2a1420, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
      const parts: Phaser.GameObjects.GameObject[] = [g];
      parts.push(this.add.text(0, -48, `${L.id}`, { fontFamily: FONT, fontSize: '54px', color: unlocked ? '#f4c430' : '#8a80aa', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 7 }).setOrigin(0.5));
      parts.push(this.add.text(0, 12, L.name, { fontFamily: FONT, fontSize: '21px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 24 } }).setOrigin(0.5));
      if (unlocked) {
        for (let s = 0; s < 3; s++) parts.push(this.add.image(-36 + s * 36, 58, s < rec.stars ? 'star_full' : 'star_empty').setScale(0.48));
      } else {
        parts.push(this.add.image(0, 58, 'lock'));
      }
      const card = this.add.container(x, y, parts).setSize(cw, ch);
      if (unlocked) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => card.setScale(0.95));
        card.on('pointerout', () => card.setScale(1));
        card.on('pointerup', () => { card.setScale(1); AudioManager.play('pop'); startLevel(this, L.id); });
      }
    });
    new Button(this, 110, 660, '◀ Back', () => this.scene.start('Title'), { w: 170, h: 60, size: 26, color: 0x7a1c2e });
    soundToggle(this, GAME_W - 56, 56);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
  }
}

export function startLevel(scene: Phaser.Scene, id: number) {
  for (const k of ['Result', 'Pause', 'Hud', 'Game']) if (k !== scene.scene.key && scene.scene.isActive(k)) scene.scene.stop(k);
  scene.scene.start('Game', { levelId: id });
}

// ---------------------------------------------------------------- Pause
export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }
  create(data: { levelId: number }) {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.55).setOrigin(0).setInteractive();
    panel(this, GAME_W / 2, GAME_H / 2, 520, 470);
    const L = LEVELS[data.levelId - 1];
    title(this, GAME_W / 2, 175, 'Paused', 54);
    this.add.text(GAME_W / 2, 230, `${L.id}. ${L.name}`, { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8' }).setOrigin(0.5);
    const resume = () => { this.scene.stop(); this.scene.resume('Game'); platform.gameplayStart(); };
    new Button(this, GAME_W / 2, 310, 'Resume', resume, { w: 300, h: 70, size: 32 });
    new Button(this, GAME_W / 2, 395, 'Restart', () => { Analytics.track('retry', { level: L.id }); this.scene.stop(); startLevel(this, L.id); }, { w: 300, h: 64, size: 28, color: 0xf7a21b });
    new Button(this, GAME_W / 2, 475, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 300, h: 64, size: 28, color: 0x7a1c2e });
    soundToggle(this, GAME_W / 2 + 200, 175);
    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-P', resume);
  }
}

// ---------------------------------------------------------------- Settings
export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(data: { from: string }) {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.6).setOrigin(0).setInteractive();
    panel(this, GAME_W / 2, GAME_H / 2, 620, 540);
    title(this, GAME_W / 2, 140, 'Settings', 52);
    this.slider(220, 'Sound effects', SaveManager.data.sfx, (v) => { SaveManager.data.sfx = v; AudioManager.setSfx(v); AudioManager.play('pop'); });
    this.slider(320, 'Music', SaveManager.data.music, (v) => { SaveManager.data.music = v; AudioManager.setMusic(v); });
    let confirm = false;
    const reset = new Button(this, GAME_W / 2, 440, 'Reset progress', () => {
      if (!confirm) { confirm = true; reset.setText('Tap again to confirm'); return; }
      SaveManager.reset();
      reset.setText('Progress reset!').setEnabled(false);
    }, { w: 380, h: 60, size: 24, color: 0x5a1020 });
    new Button(this, GAME_W / 2, 540, 'Back', () => {
      SaveManager.persist();
      this.scene.stop();
      if (data.from === 'Title') this.scene.start('Title'); else this.scene.resume(data.from);
    }, { w: 220, h: 64, size: 30 });
  }

  private slider(y: number, label: string, value: number, onChange: (v: number) => void) {
    this.add.text(GAME_W / 2 - 240, y - 30, label, { fontFamily: FONT, fontSize: '26px', color: '#ffffff', fontStyle: 'bold' });
    const x0 = GAME_W / 2 - 240, w = 480;
    const track = this.add.graphics();
    const knob = this.add.circle(x0 + value * w, y + 24, 22, 0xf4c430).setStrokeStyle(4, 0x2a1420).setInteractive({ draggable: true, useHandCursor: true });
    const draw = () => {
      track.clear();
      track.fillStyle(0x2a1420, 1); track.fillRoundedRect(x0, y + 16, w, 16, 8);
      track.fillStyle(0xe6197e, 1); track.fillRoundedRect(x0, y + 16, Math.max(16, knob.x - x0), 16, 8);
    };
    draw();
    const set = (px: number) => { knob.x = Phaser.Math.Clamp(px, x0, x0 + w); draw(); onChange((knob.x - x0) / w); };
    knob.on('drag', (_p: Phaser.Input.Pointer, dx: number) => set(dx));
    const hit = this.add.rectangle(x0 + w / 2, y + 24, w + 40, 60, 0, 0).setInteractive();
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => set(p.x));
    this.children.bringToTop(knob);
  }
}

// ---------------------------------------------------------------- Result
export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  create(d: ResultData) {
    const L = LEVELS[d.levelId - 1];
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0.5).setOrigin(0).setInteractive();
    panel(this, GAME_W / 2, GAME_H / 2, 700, 620, d.cleared ? 0x7a1c2e : 0x3a2f5a);
    title(this, GAME_W / 2, 92, d.cleared ? 'Pahunch Gaye!' : 'Shaadi Miss Ho Gayi!', 52, d.cleared ? '#f4c430' : '#ff9ad0');
    this.add.text(GAME_W / 2, 146, `${L.id}. ${L.name}`, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8' }).setOrigin(0.5);

    // stars
    const labels = ['Land on stage', `${rupees(d.target)} damage`, d.hasGift ? 'Collect the gift' : 'Clear in 1 launch'];
    for (let i = 0; i < 3; i++) {
      const x = GAME_W / 2 + (i - 1) * 130;
      const s = this.add.image(x, 225, 'star_empty').setScale(1.15);
      this.add.text(x, 282, labels[i], { fontFamily: FONT, fontSize: '16px', color: '#ffe9b8', align: 'center', wordWrap: { width: 120 } }).setOrigin(0.5, 0);
      if (i < d.stars) {
        const f = this.add.image(x, 225, 'star_full').setScale(0);
        this.tweens.add({ targets: f, scale: 1.15, delay: 300 + i * 320, duration: 300, ease: 'Back.out', onStart: () => AudioManager.play('star', 1 + i * 0.12) });
        void s;
      }
    }
    // numbers
    const dmg = this.add.text(GAME_W / 2, 350, `Shaadi Damage: ₹0`, { fontFamily: FONT, fontSize: '32px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 6 }).setOrigin(0.5);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: d.damage, duration: 900, delay: 200, ease: 'Cubic.out', onUpdate: () => dmg.setText(`Shaadi Damage: ${rupees(counter.v)}`) });
    if (d.cleared) {
      const rec = SaveManager.level(d.levelId);
      this.add.text(GAME_W / 2, 395, `Score ${d.score.toLocaleString('en-IN')}   ·   Best ${rec.best.toLocaleString('en-IN')}`, { fontFamily: FONT, fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      if (d.newBest) {
        const nb = this.add.text(GAME_W / 2 + 270, 330, 'NEW BEST!', { fontFamily: FONT, fontSize: '24px', color: '#7dff9a', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5).setAngle(12);
        this.tweens.add({ targets: nb, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
      }
      if (d.badge) {
        const bg = this.add.graphics();
        bg.fillStyle(0xf4c430, 1); bg.fillRoundedRect(GAME_W / 2 - 130, 420, 260, 40, 20);
        this.add.text(GAME_W / 2, 440, `🏅 ${d.badge}`, { fontFamily: FONT, fontSize: '22px', color: '#2a1420', fontStyle: 'bold' }).setOrigin(0.5);
      }
    } else {
      this.add.text(GAME_W / 2, 400, 'Land Lucky on the stage within 3 launches.', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    }

    const hasNext = d.cleared && d.levelId < LEVELS.length;
    const go = async (id: number) => {
      for (const b of buttons) b.setEnabled(false);
      AudioManager.setExternalMute(true);
      await platform.commercialBreak();
      AudioManager.setExternalMute(false);
      startLevel(this, id);
    };
    const buttons: Button[] = [];
    const by = 530;
    buttons.push(new Button(this, GAME_W / 2 - (hasNext ? 160 : 0), by, '↻ Retry', () => { Analytics.track('retry', { level: d.levelId }); void go(d.levelId); }, { w: 260, h: 74, size: 32, color: hasNext ? 0xf7a21b : 0xe6197e }));
    if (hasNext) buttons.push(new Button(this, GAME_W / 2 + 160, by, 'Next ▶', () => void go(d.levelId + 1), { w: 260, h: 74, size: 32 }));
    else if (d.cleared && d.levelId === LEVELS.length) {
      this.add.text(GAME_W / 2, 476, 'You made the Grand Entry! Shaadi Mubarak!', { fontFamily: FONT, fontSize: '22px', color: '#7dff9a', fontStyle: 'bold' }).setOrigin(0.5);
    }
    buttons.push(new Button(this, GAME_W / 2 - 130, by + 92, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e }));
    const share = new Button(this, GAME_W / 2 + 130, by + 92, 'Share', () => void this.share(d, share), { w: 220, h: 60, size: 26, color: 0x3e9b3a });
    buttons.push(share);
    this.input.keyboard?.once('keydown-R', () => { void go(d.levelId); });
    if (hasNext) this.input.keyboard?.once('keydown-ENTER', () => { void go(d.levelId + 1); });
  }

  private async share(d: ResultData, btn: Button) {
    Analytics.track('share_click', { level: d.levelId });
    const link = platform.allowExternalLinks ? ' ' + window.location.href.split('?')[0] : '';
    const text = `I caused ${rupees(d.damage)} of Shaadi Damage on Level ${d.levelId} of Human Cannonball: Wedding Edition 🎆 Can you beat it?${link}`;
    try {
      const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
      if (nav.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await nav.share({ title: 'Human Cannonball: Wedding Edition', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      btn.setText('Copied!');
    } catch {
      btn.setText('Copy failed');
    }
    this.time.delayedCall(1500, () => btn.setText('Share'));
  }
}
