import Phaser from 'phaser';
import { GAME_W, GAME_H, GROUND_Y, FONT } from '../config';
import { generateCoreTextures } from '../art/Textures';
import { makeAllOutfits, themeFor, OUTFITS, outfitUnlocked } from '../art/Themes';
import { makeDecorTextures } from '../art/Decor';
import { Button, panel, title, closeButton, fullscreenButton } from '../ui/Button';
import { centerSafeArea, dimmer, isTouchDevice, enterFullscreen } from '../ui/Layout';
import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { Analytics } from '../systems/Analytics';
import { rupees } from '../systems/DamageTracker';
import publisher from '../data/publisher.json';
import pkg from '../../package.json';
import { platform } from '../platform/Platform';
import { TOTAL_LEVELS, EndlessRun, levelName } from '../levels';
import { ENDLESS_BASE, ENDLESS_UNLOCK_AFTER, DAILY_BASE, todayKey } from '../levels/endless';
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
  // drawn well beyond the 1280×720 safe area so wide and tall screens are fully covered
  scene.add.image(GAME_W / 2, GAME_H / 2, 'sky').setScale(6);
  scene.add.tileSprite(-2000, GROUND_Y - 290, GAME_W + 4000, 300, 'bg_far').setOrigin(0);
  scene.add.tileSprite(-2000, GROUND_Y - 320, GAME_W + 4000, 330, 'bg_near').setOrigin(0);
  scene.add.tileSprite(-2000, GROUND_Y - 11, GAME_W + 4000, 120, 'ground').setOrigin(0);
  scene.add.rectangle(-2000, GROUND_Y + 108, GAME_W + 4000, 2000, 0x245e2a).setOrigin(0);
  if (dim) scene.add.rectangle(-3000, -3000, GAME_W + 6000, GAME_H + 6000, 0x0e1a40, dim).setOrigin(0);
}

function soundToggle(scene: Phaser.Scene, x: number, y: number) {
  const icon = scene.add.graphics();
  const draw = () => {
    const m = AudioManager.isMuted();
    icon.clear();
    icon.fillStyle(0xffffff, 1);
    icon.fillRect(-14, -7, 9, 14);
    icon.fillTriangle(-6, -7, 6, -16, 6, 16);
    icon.fillTriangle(-6, -7, -6, 7, 6, 16);
    icon.lineStyle(3.5, 0xffffff, 1);
    if (m) {
      icon.lineBetween(11, -7, 23, 7); icon.lineBetween(23, -7, 11, 7);
    } else {
      icon.beginPath(); icon.arc(8, 0, 8, -0.9, 0.9); icon.strokePath();
      icon.beginPath(); icon.arc(8, 0, 15, -0.9, 0.9); icon.strokePath();
    }
  };
  const b = new Button(scene, x, y, '', () => {
    const m = !AudioManager.isMuted();
    AudioManager.setMuted(m);
    SaveManager.data.muted = m; SaveManager.persist();
    draw();
  }, { w: 64, h: 64, size: 28, color: 0x7a1c2e });
  icon.setPosition(-3, -2);
  b.add(icon);
  draw();
  return b;
}

// ---------------------------------------------------------------- Preload
export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }
  create() {
    centerSafeArea(this);
    this.cameras.main.setBackgroundColor('#0e1a40');
    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
    title(this, GAME_W / 2, 250, 'Wedding Cannon', 64);
    title(this, GAME_W / 2, 320, 'SHAADI CHAOS', 34, '#ff7eb6');
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
      makeAllOutfits(this);
      draw(1);
      tipText.setText(tip);
      this.time.delayedCall(250, () => {
        platform.loadingDone();
        // ?level=N jumps straight into a level (handy for phone testing)
        let jump = 0;
        try { jump = Number(new URLSearchParams(window.location.search).get('level')) || 0; } catch { /* ignore */ }
        let cover = false;
        try { cover = new URLSearchParams(window.location.search).has('cover'); } catch { /* ignore */ }
        if (cover) this.scene.start('Cover');
        else if (jump >= 1 && jump <= TOTAL_LEVELS) this.scene.start('Game', { levelId: jump });
        else this.scene.start('Title');
      });
    });
  }
}

// ---------------------------------------------------------------- Title
export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    centerSafeArea(this);
    backdrop(this);
    AudioManager.startMusic();
    platform.gameplayStop();
    // cannon with Lucky waving
    const cx = 300;
    const barrel = this.add.image(cx + 4, GROUND_Y - 58, 'cannon_barrel').setOrigin(26 / 136, 0.5).setRotation(-0.7);
    const head = this.add.image(cx + 70, GROUND_Y - 130, 'head_happy').setRotation(0.2);
    const pagdi = this.add.image(cx + 74, GROUND_Y - 148, 'pagdi_o1').setRotation(0.2);
    const arm = this.add.image(cx + 95, GROUND_Y - 132, 'arm_o1').setOrigin(0.5, 0.1);
    this.children.bringToTop(barrel);
    this.add.image(cx, GROUND_Y - 36, 'cannon_base');
    this.tweens.add({ targets: arm, rotation: { from: -2.6, to: -1.6 }, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.tweens.add({ targets: [head, pagdi], y: '-=6', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // stage on the right
    this.add.image(1080, GROUND_Y - 60, 'uncle_0');
    this.add.image(1160, GROUND_Y - 58, 'aunty_1');
    this.add.image(960, GROUND_Y - 44, 'photographer_0').setFlipX(true);

    const logo = title(this, GAME_W / 2, 150, 'WEDDING CANNON', 84);
    const sub = title(this, GAME_W / 2, 238, 'SHAADI CHAOS', 44, '#ff7eb6');
    this.tweens.add({ targets: logo, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    sub.setAngle(-2);
    this.add.text(GAME_W / 2, 296, 'Lucky is late for the shaadi. Fire him in!', { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);

    const play = new Button(this, GAME_W / 2, 400, 'PLAY', () => this.scene.start('LevelSelect'), { w: 280, h: 86, size: 46 });
    this.tweens.add({ targets: play, scale: 1.06, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    new Button(this, GAME_W / 2 - 120, 500, 'Wardrobe', () => this.scene.start('Wardrobe', { from: 'Title' }), { w: 220, h: 60, size: 26, color: 0x3e9b3a });
    new Button(this, GAME_W / 2 + 120, 500, 'Settings', () => { this.scene.pause(); this.scene.launch('Settings', { from: 'Title' }); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e });
    soundToggle(this, GAME_W - 56, 56);
    fullscreenButton(this, GAME_W - 136, 56);
    if (platform.portrait && this.scale.height > this.scale.width) {
      this.add.text(GAME_W / 2, 600, '↻ Tip: turn your phone sideways for a bigger view', { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);
    }
    if (platform.name === 'web' && isTouchDevice()) this.input.once('pointerup', () => enterFullscreen(this));
    const stars = SaveManager.totalStars();
    if (stars > 0) this.add.text(56, 56, `★ ${stars}/30`, { fontFamily: FONT, fontSize: '28px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 6 }).setOrigin(0, 0.5);
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('LevelSelect'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('LevelSelect'));
  }
}

// ---------------------------------------------------------------- Level select
export class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }
  private page = -1;

  create(data: { page?: number }) {
    centerSafeArea(this);
    backdrop(this, 0.45);
    platform.gameplayStop();
    title(this, GAME_W / 2, 62, 'Choose a Function', 50);
    const pages = Math.ceil(TOTAL_LEVELS / 10);
    // open on the page with the newest unlocked level
    let latest = 1;
    while (latest < TOTAL_LEVELS && SaveManager.isUnlocked(latest + 1)) latest++;
    const page = Phaser.Math.Clamp(data?.page ?? (this.page >= 0 ? this.page : Math.floor((latest - 1) / 10)), 0, pages - 1);
    this.page = page;
    this.add.text(GAME_W / 2, 110, `★ ${SaveManager.totalStars()} / ${TOTAL_LEVELS * 3}   ·   Levels ${page * 10 + 1}–${Math.min(TOTAL_LEVELS, page * 10 + 10)} of ${TOTAL_LEVELS}`, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8', fontStyle: 'bold' }).setOrigin(0.5);
    const go = (p: number) => this.scene.restart({ page: Phaser.Math.Clamp(p, 0, pages - 1) });
    if (page > 0) new Button(this, 44, 375, '◀', () => go(page - 1), { w: 64, h: 110, size: 34, color: 0x7a1c2e });
    if (page < pages - 1) new Button(this, GAME_W - 44, 375, '▶', () => go(page + 1), { w: 64, h: 110, size: 34, color: 0x7a1c2e });
    if (page !== Math.floor((latest - 1) / 10)) new Button(this, GAME_W / 2 + 420, 110, 'Latest', () => go(Math.floor((latest - 1) / 10)), { w: 120, h: 44, size: 20, color: 0x3e9b3a });
    this.input.keyboard?.on('keydown-LEFT', () => page > 0 && go(page - 1));
    this.input.keyboard?.on('keydown-RIGHT', () => page < pages - 1 && go(page + 1));
    const cw = 200, ch = 180, gap = 24;
    const x0 = GAME_W / 2 - (5 * cw + 4 * gap) / 2 + cw / 2;
    const ids = Array.from({ length: Math.min(10, TOTAL_LEVELS - page * 10) }, (_, i) => page * 10 + i + 1);
    ids.map((id) => ({ id, name: levelName(id) })).forEach((L, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = x0 + col * (cw + gap), y = 255 + row * (ch + 26);
      const unlocked = SaveManager.isUnlocked(L.id);
      const rec = SaveManager.level(L.id);
      const g = this.add.graphics();
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(-cw / 2, -ch / 2 + 8, cw, ch, 22);
      g.fillStyle(unlocked ? (rec.cleared ? 0x7a1c2e : 0xb0105e) : 0x3a2f5a, 1); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
      g.lineStyle(4, unlocked ? 0xf4c430 : 0x6a5f8a, 1); g.strokeRoundedRect(-cw / 2 + 7, -ch / 2 + 7, cw - 14, ch - 14, 16);
      g.lineStyle(4, 0x2a1420, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 22);
      const parts: Phaser.GameObjects.GameObject[] = [g];
      parts.push(this.add.text(0, -50, `${L.id}`, { fontFamily: FONT, fontSize: L.id >= 100 ? '44px' : '54px', color: unlocked ? '#f4c430' : '#8a80aa', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 7 }).setOrigin(0.5));
      parts.push(this.add.text(0, 26, themeFor(L.id).venue, { fontFamily: FONT, fontSize: '14px', color: '#ffe9b8' }).setOrigin(0.5));
      parts.push(this.add.text(0, -6, L.name, { fontFamily: FONT, fontSize: '21px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 24 } }).setOrigin(0.5));
      if (unlocked) {
        for (let s = 0; s < 3; s++) parts.push(this.add.image(-36 + s * 36, 64, s < rec.stars ? 'star_full' : 'star_empty').setScale(0.48));
      } else {
        parts.push(this.add.image(0, 62, 'lock').setScale(0.8));
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
    const endlessOpen = SaveManager.level(ENDLESS_UNLOCK_AFTER).cleared;
    const eb = SaveManager.data.endless;
    const endless = new Button(this, GAME_W / 2 - 30, 660, endlessOpen ? '∞ ENDLESS' : `∞ Endless · clear ${ENDLESS_UNLOCK_AFTER}`, () => { if (endlessOpen) newEndlessRun(this); },
      { w: 300, h: 64, size: endlessOpen ? 28 : 20, color: endlessOpen ? 0xf7a21b : 0x3a2f5a });
    if (!endlessOpen) endless.setEnabled(false);
    if (endlessOpen && eb.round > 0) this.add.text(GAME_W / 2 - 30, 616, `Best: round ${eb.round} · ${rupees(eb.damage)}`, { fontFamily: FONT, fontSize: '16px', color: '#ffe9b8', fontStyle: 'bold' }).setOrigin(0.5);
    const today = todayKey();
    const dd = SaveManager.data.daily;
    const doneToday = dd.date === today;
    const daily = new Button(this, GAME_W / 2 + 300, 660, endlessOpen ? (doneToday ? '✓ DAILY' : '★ DAILY') : `Daily · clear ${ENDLESS_UNLOCK_AFTER}`, () => { if (endlessOpen) { Analytics.track('daily_start'); startLevel(this, DAILY_BASE + today); } },
      { w: 260, h: 64, size: endlessOpen ? 28 : 20, color: endlessOpen ? 0xe6197e : 0x3a2f5a });
    if (!endlessOpen) daily.setEnabled(false);
    if (endlessOpen && dd.streak > 0) this.add.text(GAME_W / 2 + 300, 616, `🔥 ${dd.streak}-day streak${doneToday ? ` · best ${dd.launches}/3` : ''}`, { fontFamily: FONT, fontSize: '16px', color: '#ffe9b8', fontStyle: 'bold' }).setOrigin(0.5);
    new Button(this, GAME_W - 190, 56, 'Wardrobe', () => this.scene.start('Wardrobe', { from: 'LevelSelect' }), { w: 180, h: 56, size: 22, color: 0x3e9b3a });
    closeButton(this, 50, 56, () => this.scene.start('Title'));
    fullscreenButton(this, 130, 56);
    soundToggle(this, GAME_W - 56, 56);
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Title'));
  }
}

export function startLevel(scene: Phaser.Scene, id: number, run: EndlessRun | null = null) {
  for (const k of ['Result', 'Pause', 'Hud', 'Game']) if (k !== scene.scene.key && scene.scene.isActive(k)) scene.scene.stop(k);
  scene.scene.start('Game', { levelId: id, run });
}

export function newEndlessRun(scene: Phaser.Scene) {
  Analytics.track('endless_start');
  startLevel(scene, ENDLESS_BASE + 1, { seed: Math.floor(Math.random() * 1e9), round: 1, damage: 0 });
}

// ---------------------------------------------------------------- Pause
export class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }
  create(data: { levelId: number; run?: EndlessRun | null; name: string }) {
    centerSafeArea(this);
    dimmer(this, 0.55);
    panel(this, GAME_W / 2, GAME_H / 2, 520, 470);
    const L = { id: data.levelId, name: data.name };
    const run = data.run ?? null;
    title(this, GAME_W / 2, 175, 'Paused', 54);
    this.add.text(GAME_W / 2, 230, run ? `Endless · Round ${run.round}: ${L.name}` : `${L.id}. ${L.name}`, { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8' }).setOrigin(0.5);
    const resume = () => { this.scene.stop(); this.scene.resume('Game'); platform.gameplayStart(); };
    new Button(this, GAME_W / 2, 310, 'Resume', resume, { w: 300, h: 70, size: 32 });
    new Button(this, GAME_W / 2, 395, 'Restart', () => { Analytics.track('retry', { level: L.id }); this.scene.stop(); startLevel(this, L.id, run); }, { w: 300, h: 64, size: 28, color: 0xf7a21b });
    new Button(this, GAME_W / 2, 475, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 300, h: 64, size: 28, color: 0x7a1c2e });
    soundToggle(this, GAME_W / 2 - 200, 175);
    fullscreenButton(this, GAME_W / 2 - 200, 255);
    closeButton(this, GAME_W / 2 + 226, 159, resume);
    this.input.keyboard?.once('keydown-ESC', resume);
    this.input.keyboard?.once('keydown-P', resume);
  }
}

// ---------------------------------------------------------------- Settings
export class SettingsScene extends Phaser.Scene {
  constructor() { super('Settings'); }
  create(data: { from: string }) {
    centerSafeArea(this);
    dimmer(this, 0.6);
    panel(this, GAME_W / 2, GAME_H / 2, 620, 540);
    title(this, GAME_W / 2, 140, 'Settings', 52);
    const closeSettings = () => {
      SaveManager.persist();
      this.scene.stop();
      if (data.from === 'Title') this.scene.start('Title'); else this.scene.resume(data.from);
    };
    closeButton(this, GAME_W / 2 + 276, 124, closeSettings);
    this.input.keyboard?.once('keydown-ESC', closeSettings);
    this.slider(195, 'Sound effects', SaveManager.data.sfx, (v) => { SaveManager.data.sfx = v; AudioManager.setSfx(v); AudioManager.play('pop'); });
    this.slider(270, 'Music', SaveManager.data.music, (v) => { SaveManager.data.music = v; AudioManager.setMusic(v); });
    const toggle = (x: number, y: number, w: number, label: string, key: 'voice' | 'haptics' | 'lowfx', color: number) => {
      const text = () => `${label}: ${SaveManager.data[key] ? 'ON' : 'OFF'}`;
      const b = new Button(this, x, y, text(), () => { SaveManager.data[key] = !SaveManager.data[key]; SaveManager.persist(); b.setText(text()); }, { w, h: 54, size: 20, color });
      return b;
    };
    toggle(GAME_W / 2 - 145, 345, 270, 'Voice', 'voice', 0x3e9b3a);
    toggle(GAME_W / 2 + 145, 345, 270, 'Vibration', 'haptics', 0x3e9b3a);
    toggle(GAME_W / 2, 412, 380, 'Reduce effects', 'lowfx', 0x2f6db5);
    let confirm = false;
    const reset = new Button(this, GAME_W / 2, 479, 'Reset progress', () => {
      if (!confirm) { confirm = true; reset.setText('Tap again to confirm'); return; }
      SaveManager.reset();
      reset.setText('Progress reset!').setEnabled(false);
    }, { w: 380, h: 54, size: 22, color: 0x5a1020 });
    new Button(this, GAME_W / 2 - 120, 560, 'Back', () => {
      SaveManager.persist();
      this.scene.stop();
      if (data.from === 'Title') this.scene.start('Title'); else this.scene.resume(data.from);
    }, { w: 200, h: 60, size: 26 });
    new Button(this, GAME_W / 2 + 120, 560, 'About', () => { SaveManager.persist(); this.scene.stop(); this.scene.launch('About', { from: data.from }); this.scene.bringToTop('About'); }, { w: 200, h: 60, size: 26, color: 0x2f6db5 });
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
    hit.on('pointerdown', (p: Phaser.Input.Pointer) => set(p.worldX));
    this.children.bringToTop(knob);
  }
}

// ---------------------------------------------------------------- Result
export class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  create(d: ResultData) {
    centerSafeArea(this);
    if (d.run) { this.endless(d); return; }
    if (d.daily) { this.dailyResult(d); return; }
    const L = { id: d.levelId, name: d.name };
    dimmer(this, 0.5);
    panel(this, GAME_W / 2, GAME_H / 2, 700, 620, d.cleared ? 0x7a1c2e : 0x3a2f5a);
    title(this, GAME_W / 2, 92, d.cleared ? 'Pahunch Gaye!' : 'Shaadi Miss Ho Gayi!', 52, d.cleared ? '#f4c430' : '#ff9ad0');
    this.add.text(GAME_W / 2, 146, `${L.id}. ${L.name}`, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8' }).setOrigin(0.5);

    // stars
    const labels = ['Land on stage', `${rupees(d.target)} damage`, d.hasGift ? 'Collect the gift' : 'Clear in 1 launch'];
    for (let i = 0; i < 3; i++) {
      const x = GAME_W / 2 + (i - 1) * 130;
      const s = this.add.image(x, 225, 'star_empty').setScale(1.15);
      const earned = d.starFlags ? d.starFlags[i] : i < d.stars;
      let label = labels[i];
      if (d.cleared && !earned && i === 1) label = `${rupees(d.damage)} / ${rupees(d.target)} damage`;
      if (d.cleared && !earned && i === 2 && d.hasGift) label = 'Gift missed';
      this.add.text(x, 282, d.cleared ? `${earned ? '✓ ' : ''}${label}` : label, { fontFamily: FONT, fontSize: '16px', color: d.cleared ? (earned ? '#7dff9a' : '#ffb3b3') : '#ffe9b8', align: 'center', wordWrap: { width: 124 }, fontStyle: 'bold' }).setOrigin(0.5, 0);
      if (earned) {
        const f = this.add.image(x, 225, 'star_full').setScale(0);
        this.tweens.add({ targets: f, scale: 1.15, delay: 300 + i * 320, duration: 300, ease: 'Back.out', onStart: () => AudioManager.play('star', 1 + i * 0.12) });
        void s;
      }
    }
    // numbers
    const dmg = this.add.text(GAME_W / 2, 350, `Shaadi Damage: ₹0`, { fontFamily: FONT, fontSize: '32px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 6 }).setOrigin(0.5);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: d.damage, duration: 900, delay: 200, ease: 'Cubic.out', onUpdate: () => dmg.setText(`Shaadi Damage: ${rupees(counter.v)}`) });
    if (d.unlock) {
      const u = this.add.text(GAME_W / 2, 172, `NEW OUTFIT UNLOCKED: ${d.unlock}!`, { fontFamily: FONT, fontSize: '22px', color: '#7dff9a', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);
      this.tweens.add({ targets: u, scale: 1.08, duration: 450, yoyo: true, repeat: -1 });
    }
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
        this.add.text(GAME_W / 2, 440, `★ ${d.badge} ★`, { fontFamily: FONT, fontSize: '22px', color: '#2a1420', fontStyle: 'bold' }).setOrigin(0.5);
      }
    } else {
      this.add.text(GAME_W / 2, 400, 'Land Lucky on the stage within 3 launches.', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    }

    const hasNext = d.cleared && d.levelId < TOTAL_LEVELS;
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
    else if (d.cleared && d.levelId === TOTAL_LEVELS) {
      this.add.text(GAME_W / 2, 476, `All ${TOTAL_LEVELS} levels done! Shaadi Mubarak!`, { fontFamily: FONT, fontSize: '22px', color: '#7dff9a', fontStyle: 'bold' }).setOrigin(0.5);
    }
    buttons.push(new Button(this, GAME_W / 2 - 130, by + 92, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e }));
    const share = !platform.allowShare ? null : new Button(this, GAME_W / 2 + 130, by + 92, 'Share', () => share && void this.share(d, share), { w: 220, h: 60, size: 26, color: 0x3e9b3a });
    if (share) buttons.push(share);
    this.input.keyboard?.once('keydown-R', () => { void go(d.levelId); });
    if (hasNext) this.input.keyboard?.once('keydown-ENTER', () => { void go(d.levelId + 1); });
  }

  /** Result screen for the Daily Challenge. */
  private dailyResult(d: ResultData) {
    const dl = d.daily!;
    dimmer(this, 0.5);
    panel(this, GAME_W / 2, GAME_H / 2, 700, 620, d.cleared ? 0x7a1c2e : 0x3a2f5a);
    title(this, GAME_W / 2, 100, d.cleared ? 'Daily Cleared!' : 'Not Today… Yet!', 52, d.cleared ? '#f4c430' : '#ff9ad0');
    this.add.text(GAME_W / 2, 156, d.name, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8' }).setOrigin(0.5);
    const best = SaveManager.data.daily;
    const rows = d.cleared
      ? [['Landed in', `${dl.launches}/3 launches`], ['Shaadi Damage', rupees(d.damage)], ['Streak', `🔥 ${dl.streak} day${dl.streak === 1 ? '' : 's'}`], ["Today's best", best.date === dl.date ? `${best.launches}/3 · ${rupees(best.damage)}` : '–']]
      : [['Shaadi Damage', rupees(d.damage)], ['Streak', `🔥 ${best.streak} day${best.streak === 1 ? '' : 's'}`], ['Tip', 'Retry as often as you like today']];
    rows.forEach(([k, v], i) => {
      this.add.text(GAME_W / 2 - 230, 220 + i * 54, k, { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8' }).setOrigin(0, 0.5);
      this.add.text(GAME_W / 2 + 230, 220 + i * 54, v, { fontFamily: FONT, fontSize: '26px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(1, 0.5);
    });
    if (d.cleared && dl.best) {
      const nb = this.add.text(GAME_W / 2, 445, "TODAY'S BEST!", { fontFamily: FONT, fontSize: '26px', color: '#7dff9a', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);
      this.tweens.add({ targets: nb, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
    }
    const buttons: Button[] = [];
    buttons.push(new Button(this, GAME_W / 2, 530, '↻ Try Again', async () => {
      buttons.forEach((b) => b.setEnabled(false));
      AudioManager.setExternalMute(true); await platform.commercialBreak(); AudioManager.setExternalMute(false);
      startLevel(this, d.levelId);
    }, { w: 300, h: 74, size: 32, color: d.cleared ? 0xf7a21b : 0xe6197e }));
    buttons.push(new Button(this, GAME_W / 2 - 130, 622, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e }));
    const share = !platform.allowShare ? null : new Button(this, GAME_W / 2 + 130, 622, 'Share', () => share && void this.share(d, share), { w: 220, h: 60, size: 26, color: 0x3e9b3a });
    if (share) buttons.push(share);
  }

  /** Result screen for an Endless Baraat round. */
  private endless(d: ResultData) {
    const run = d.run!;
    dimmer(this, 0.5);
    panel(this, GAME_W / 2, GAME_H / 2, 700, 620, d.cleared ? 0x7a1c2e : 0x3a2f5a);
    title(this, GAME_W / 2, 100, d.cleared ? `Round ${run.round} Cleared!` : 'Run Over!', 52, d.cleared ? '#f4c430' : '#ff9ad0');
    this.add.text(GAME_W / 2, 156, `Endless Baraat · ${d.name}`, { fontFamily: FONT, fontSize: '24px', color: '#ffe9b8' }).setOrigin(0.5);
    const cleared = d.cleared ? run.round : run.round - 1;
    const best = SaveManager.data.endless;
    const lines = [
      [`Rounds cleared`, `${cleared}`],
      [`This round's damage`, rupees(d.damage)],
      [`Run total`, rupees(run.damage)],
      [`Best run`, `round ${best.round} · ${rupees(best.damage)}`],
    ];
    lines.forEach(([k, v], i) => {
      this.add.text(GAME_W / 2 - 230, 220 + i * 54, k, { fontFamily: FONT, fontSize: '26px', color: '#ffe9b8' }).setOrigin(0, 0.5);
      this.add.text(GAME_W / 2 + 230, 220 + i * 54, v, { fontFamily: FONT, fontSize: '28px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(1, 0.5);
    });
    if (!d.cleared && d.recordRun) {
      const nb = this.add.text(GAME_W / 2, 445, 'NEW BEST RUN!', { fontFamily: FONT, fontSize: '28px', color: '#7dff9a', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);
      this.tweens.add({ targets: nb, scale: 1.12, duration: 400, yoyo: true, repeat: -1 });
    }
    const buttons: Button[] = [];
    const go = async (fn: () => void) => {
      for (const b of buttons) b.setEnabled(false);
      AudioManager.setExternalMute(true);
      await platform.commercialBreak();
      AudioManager.setExternalMute(false);
      fn();
    };
    const by = 530;
    if (d.cleared) {
      const next = () => startLevel(this, ENDLESS_BASE + run.round + 1, { ...run, round: run.round + 1 });
      buttons.push(new Button(this, GAME_W / 2, by, `Round ${run.round + 1} ▶`, () => void go(next), { w: 320, h: 74, size: 32 }));
      this.input.keyboard?.once('keydown-ENTER', () => void go(next));
    } else {
      buttons.push(new Button(this, GAME_W / 2, by, '↻ New Run', () => void go(() => newEndlessRun(this)), { w: 320, h: 74, size: 32 }));
      this.input.keyboard?.once('keydown-R', () => void go(() => newEndlessRun(this)));
    }
    buttons.push(new Button(this, GAME_W / 2 - 130, by + 92, 'Levels', () => { this.scene.stop('Hud'); this.scene.stop('Game'); this.scene.start('LevelSelect'); }, { w: 220, h: 60, size: 26, color: 0x7a1c2e }));
    const share = !platform.allowShare ? null : new Button(this, GAME_W / 2 + 130, by + 92, 'Share', () => share && void this.share(d, share), { w: 220, h: 60, size: 26, color: 0x3e9b3a });
    if (share) buttons.push(share);
  }

  private async share(d: ResultData, btn: Button) {
    Analytics.track('share_click', { level: d.levelId });
    const link = platform.allowExternalLinks ? ' ' + window.location.href.split('?')[0] : '';
    const text = d.daily
      ? `Wedding Cannon ${d.name}\n🎯 ${d.cleared ? `Landed in ${d.daily.launches}/3` : 'Missed the stage'} · 💥 ${rupees(d.damage)} · 🔥 ${d.cleared ? d.daily.streak : SaveManager.data.daily.streak}-day streak${link}`
      : d.run
      ? `I survived ${d.cleared ? d.run.round : d.run.round - 1} rounds of Endless Baraat with ${rupees(d.run.damage)} of Shaadi Damage in Wedding Cannon: Shaadi Chaos 🎆 Can you beat it?${link}`
      : `I caused ${rupees(d.damage)} of Shaadi Damage on Level ${d.levelId} of Wedding Cannon: Shaadi Chaos 🎆 Can you beat it?${link}`;
    try {
      const nav = navigator as Navigator & { share?: (d: { text: string; title?: string }) => Promise<void> };
      if (nav.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await nav.share({ title: 'Wedding Cannon: Shaadi Chaos', text });
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

// ---------------------------------------------------------------- Wardrobe
export class WardrobeScene extends Phaser.Scene {
  constructor() { super('Wardrobe'); }
  create(data: { from: string }) {
    centerSafeArea(this);
    backdrop(this, 0.55);
    title(this, GAME_W / 2, 60, "Lucky's Wardrobe", 50);
    const stars = SaveManager.totalStars();
    this.add.text(GAME_W / 2, 108, `★ ${stars}  ·  stars unlock suits · milestone levels unlock special outfits`, { fontFamily: FONT, fontSize: '22px', color: '#ffe9b8', fontStyle: 'bold' }).setOrigin(0.5);
    const items: { id: string; name: string; stars: number; level?: number }[] = [{ id: 'auto', name: 'Auto (new look each level)', stars: 0 }, ...OUTFITS];
    const isLocked = (it: { stars: number; level?: number }) => !outfitUnlocked({ ...OUTFITS[0], ...it }, stars, (i) => SaveManager.level(i).cleared);
    const cw = 114, ch = 158, cols = 10;
    const x0 = GAME_W / 2 - ((cols - 1) * (cw + 12)) / 2;
    const cards: Phaser.GameObjects.Graphics[] = [];
    const draw = () => cards.forEach((g, i) => {
      const it = items[i];
      const locked = isLocked(it);
      const sel = SaveManager.data.outfit === it.id;
      g.clear();
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(-cw / 2, -ch / 2 + 6, cw, ch, 18);
      g.fillStyle(locked ? 0x3a2f5a : sel ? 0xe6197e : 0x7a1c2e, 1); g.fillRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
      g.lineStyle(sel ? 6 : 3, sel ? 0xf4c430 : 0x2a1420, 1); g.strokeRoundedRect(-cw / 2, -ch / 2, cw, ch, 18);
    });
    items.forEach((it, i) => {
      const x = x0 + (i % cols) * (cw + 12), y = 250 + Math.floor(i / cols) * (ch + 40);
      const g = this.add.graphics();
      cards.push(g);
      const parts: Phaser.GameObjects.GameObject[] = [g];
      const locked = isLocked(it);
      if (it.id === 'auto') {
        parts.push(this.add.text(0, -14, '?', { fontFamily: FONT, fontSize: '64px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 8 }).setOrigin(0.5));
      } else {
        // assembled Lucky preview
        const o = it.id;
        parts.push(this.add.image(-6, 18, `leg_${o}`), this.add.image(6, 18, `leg_${o}`), this.add.image(10, -12, `arm_${o}`).setAngle(-20),
          this.add.image(0, -10, `torso_${o}`), this.add.image(0, -44, 'head_happy').setScale(0.9), this.add.image(0, -60, `pagdi_${o}`).setScale(0.9),
          this.add.image(-10, -12, `arm_${o}`).setAngle(20));
        if (locked) parts.forEach((p, k) => { if (k > 0) (p as Phaser.GameObjects.Image).setTint(0x333344); });
      }
      parts.push(this.add.text(0, ch / 2 - 22, it.name, { fontFamily: FONT, fontSize: '14px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: cw - 12 } }).setOrigin(0.5));
      if (locked) {
        parts.push(this.add.image(0, -20, 'lock'));
        parts.push(this.add.text(0, 14, it.level ? `Clear ${it.level}` : `★ ${it.stars}`, { fontFamily: FONT, fontSize: '22px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5));
      }
      const card = this.add.container(x, y, parts).setSize(cw, ch);
      if (!locked) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerup', () => { SaveManager.data.outfit = it.id; SaveManager.persist(); AudioManager.play('pop'); Analytics.track('outfit', { id: it.id }); draw(); });
      }
    });
    draw();
    new Button(this, 110, 660, '◀ Back', () => this.scene.start(data.from === 'LevelSelect' ? 'LevelSelect' : 'Title'), { w: 170, h: 60, size: 26, color: 0x7a1c2e });
    closeButton(this, GAME_W - 50, 56, () => this.scene.start(data.from === 'LevelSelect' ? 'LevelSelect' : 'Title'));
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start(data.from === 'LevelSelect' ? 'LevelSelect' : 'Title'));
  }
}

// ---------------------------------------------------------------- Store cover art (open with ?cover=1 at the target size)
export class CoverScene extends Phaser.Scene {
  constructor() { super('Cover'); }
  create() {
    makeDecorTextures(this);
    const w = this.scale.width, h = this.scale.height;
    const portrait = h > w * 1.1;
    const k = Math.min(w / 1280, h / 720) * (portrait ? 1.35 : 1);
    this.add.image(w / 2, h / 2, 'sky').setScale(Math.max(w / 640, h / 360) * 1.05);
    const gy = h - 90 * k;
    this.add.tileSprite(0, gy - 300 * k, w, 330, 'bg_near').setOrigin(0).setScale(1, k).setTileScale(k);
    this.add.tileSprite(0, gy - 11 * k, w, 400, 'ground').setOrigin(0).setTileScale(k);
    const s = (img: Phaser.GameObjects.Image, sc = 1) => img.setScale(k * sc);
    // stage on the right, crowd, balloons
    s(this.add.image(w - 150 * k, gy, 'flower_pillar').setOrigin(0.5, 1), 1.3);
    s(this.add.image(w - 300 * k, gy + 4 * k, 'balloons').setOrigin(0.5, 1), 1.2);
    s(this.add.image(w * 0.62, gy, 'uncle_0').setOrigin(0.5, 1), 1.4);
    s(this.add.image(w * 0.62 + 90 * k, gy, 'aunty_1').setOrigin(0.5, 1), 1.4);
    s(this.add.image(w * 0.45, gy, 'photographer_0').setOrigin(0.5, 1).setFlipX(true), 1.4);
    // cannon firing, bottom-left
    s(this.add.image(150 * k, gy - 50 * k, 'cannon_barrel').setOrigin(26 / 136, 0.5).setRotation(-0.75), 1.6);
    s(this.add.image(150 * k, gy - 30 * k, 'cannon_base'), 1.6);
    const smoke = this.add.particles(0, 0, 'px_smoke', { lifespan: 4000, speed: 0, scale: { start: 2.5 * k, end: 2.5 * k }, alpha: 0.7, emitting: false });
    smoke.explode(6, 290 * k, gy - 190 * k);
    // Lucky flying, arms out, scared
    const lx = portrait ? w * 0.55 : w * 0.5, ly = portrait ? h * 0.55 : h * 0.47, L = 2.6 * k;
    const part = (tex: string, dx: number, dy: number, rot: number) => this.add.image(lx + dx * L, ly + dy * L, tex).setScale(L).setRotation(rot);
    part('leg_s2', -8, 32, 0.5); part('leg_s2', 8, 30, -0.3); part('arm_s2', 22, -14, -2.2);
    part('torso_s2', 0, 0, 0.25); part('head_scared', 6, -34, 0.3); part('pagdi_s2', 12, -52, 0.6); part('arm_s2', -22, -12, 2.4);
    for (let i = 0; i < 5; i++) this.add.image(lx - (60 + i * 45) * L * 0.4, ly + (20 + i * 26) * L * 0.4, 'px_dot').setScale(L * (1.6 - i * 0.25)).setAlpha(0.8 - i * 0.12);
    // title
    const t = (text: string, y: number, size: number, color: string) => this.add.text(w / 2, y, text, {
      fontFamily: FONT, fontSize: `${Math.round(size * k)}px`, color, fontStyle: 'bold', stroke: '#2a1420', strokeThickness: Math.round(size * k / 6), align: 'center',
    }).setOrigin(0.5);
    if (portrait) {
      t('WEDDING', h * 0.11, 96, '#f4c430'); t('CANNON', h * 0.11 + 100 * k, 96, '#f4c430'); t('SHAADI CHAOS', h * 0.11 + 190 * k, 54, '#ff7eb6');
    } else {
      t('WEDDING CANNON', h * 0.17, 96, '#f4c430'); t('SHAADI CHAOS', h * 0.17 + 95 * k, 54, '#ff7eb6');
    }
  }
}

// ---------------------------------------------------------------- About & credits (no outbound links: portals forbid them)
export class AboutScene extends Phaser.Scene {
  constructor() { super('About'); }
  create(data: { from: string }) {
    centerSafeArea(this);
    dimmer(this, 0.7);
    panel(this, GAME_W / 2, GAME_H / 2, 860, 640);
    title(this, GAME_W / 2, 92, 'About & Credits', 44);
    const back = () => { this.scene.stop(); this.scene.launch('Settings', { from: data.from }); this.scene.bringToTop('Settings'); };
    closeButton(this, GAME_W / 2 + 392, 76, back);
    this.input.keyboard?.once('keydown-ESC', back);
    const lines = [
      `Wedding Cannon: Shaadi Chaos  ·  version ${pkg.version}`,
      `Made by ${publisher.developer}${publisher.email ? `  ·  ${publisher.email}` : ''}`,
      '',
      'Privacy: no account, no personal data collected, no tracking.',
      'Progress is saved on your device (or in your platform account\'s cloud save).',
      'On game platforms, ads are shown by the platform under its own privacy policy.',
      '',
      'Credits',
      'Game design, art, music and code: original work.',
      'Engine: Phaser 3 (MIT licence) with Matter.js physics (MIT licence).',
      'Sound effects: Universfield, freesound_community, VoiceBosch (Pixabay Content License).',
      '',
      'All characters are fictional. Cartoon slapstick only. No religious content.',
      'Full privacy policy, terms and licences are on the game\'s store page.',
    ];
    lines.forEach((t, i) => this.add.text(GAME_W / 2, 150 + i * 30, t, {
      fontFamily: FONT, fontSize: i === 7 ? '24px' : '19px', color: i === 0 || i === 7 ? '#f4c430' : '#ffe9b8', fontStyle: i === 0 || i === 7 ? 'bold' : 'normal', align: 'center',
    }).setOrigin(0.5));
    new Button(this, GAME_W / 2, 630, 'Back', back, { w: 220, h: 58, size: 26 });
  }
}
