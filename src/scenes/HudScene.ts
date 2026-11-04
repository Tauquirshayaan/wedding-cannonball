import Phaser from 'phaser';
import { GAME_W, FONT, PHYS } from '../config';
import { bus } from '../systems/bus';
import { Button, closeButton } from '../ui/Button';
import { centerSafeArea, dimmer, isTouchDevice } from '../ui/Layout';
import { rupees } from '../systems/DamageTracker';
import type { LevelData } from '../levels/types';

export class HudScene extends Phaser.Scene {
  private dmgText!: Phaser.GameObjects.Text;
  private dmgShown = 0;
  private dmgTarget = 0;
  private targetText!: Phaser.GameObjects.Text;
  private icons: Phaser.GameObjects.Image[] = [];
  private gift: Phaser.GameObjects.Image | null = null;
  private comboText!: Phaser.GameObjects.Text;
  private toast!: Phaser.GameObjects.Container;
  private power!: Phaser.GameObjects.Graphics;
  private flailHint!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;
  private handlers: [string, (...a: never[]) => void][] = [];
  private level!: LevelData;

  constructor() { super('Hud'); }

  create() {
    centerSafeArea(this, undefined, true); // HUD hugs the top edge on tall and portrait screens
    this.icons = []; this.gift = null; this.dmgShown = 0; this.dmgTarget = 0;
    this.root = this.add.container(0, 0);
    // top bar
    const bar = this.add.graphics();
    bar.fillStyle(0x2a1420, 0.55);
    bar.fillRoundedRect(GAME_W / 2 - 190, 8, 380, 74, 22);
    bar.fillRoundedRect(10, 8, 340, 74, 22);
    this.root.add(bar);
    this.dmgText = this.add.text(GAME_W / 2, 36, '₹0 damage', { fontFamily: FONT, fontSize: '36px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 6 }).setOrigin(0.5);
    this.targetText = this.add.text(GAME_W / 2, 66, '', { fontFamily: FONT, fontSize: '17px', color: '#ffe9b8' }).setOrigin(0.5);
    this.comboText = this.add.text(GAME_W / 2 + 205, 40, '', { fontFamily: FONT, fontSize: '34px', color: '#ff4d6d', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 7 }).setOrigin(0, 0.5).setAlpha(0);
    this.root.add([this.dmgText, this.targetText, this.comboText]);

    // pause + restart (56 px touch targets)
    const mk = (x: number, draw: (g: Phaser.GameObjects.Graphics) => void, cb: () => void) => {
      const g = this.add.graphics();
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(-30, -26, 60, 60, 16);
      g.fillStyle(0xe6197e, 1); g.fillRoundedRect(-30, -30, 60, 60, 16);
      g.lineStyle(3, 0x2a1420, 1); g.strokeRoundedRect(-30, -30, 60, 60, 16);
      draw(g);
      // bigger on phones: the safe area is scaled down on short screens, so keep thumb-sized targets
      const big = isTouchDevice() ? 1.35 : 1;
      const c = this.add.container(x - (big - 1) * 30, 46 + (big - 1) * 20, [g]).setSize(64, 64).setScale(big).setInteractive({ useHandCursor: true });
      c.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); c.setScale(big * 0.9); });
      c.on('pointerout', () => c.setScale(big));
      c.on('pointerup', (_p: unknown, _x: unknown, _y: unknown, ev: Phaser.Types.Input.EventData) => { ev.stopPropagation(); c.setScale(big); cb(); });
      this.root.add(c);
    };
    mk(GAME_W - 46, (g) => { g.fillStyle(0xffffff, 1); g.fillRect(-11, -13, 8, 26); g.fillRect(3, -13, 8, 26); }, () => bus.emit('hud:pause'));
    mk(GAME_W - 118, (g) => {
      g.lineStyle(6, 0xffffff, 1); g.beginPath(); g.arc(0, 0, 12, -Math.PI * 0.2, Math.PI * 1.45); g.strokePath();
      g.fillStyle(0xffffff, 1); g.fillTriangle(6, -18, 16, -6, 2, -4);
    }, () => bus.emit('hud:restart'));

    // power meter (shown while aiming)
    this.power = this.add.graphics();
    this.root.add(this.power);

    this.flailHint = this.add.text(GAME_W / 2, 690, 'Tap to flail!', { fontFamily: FONT, fontSize: '22px', color: '#ffffff', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5).setAlpha(0);
    this.root.add(this.flailHint);

    // toast
    const tBg = this.add.graphics();
    const tTitle = this.add.text(0, -14, '', { fontFamily: FONT, fontSize: '40px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 8 }).setOrigin(0.5);
    const tSub = this.add.text(0, 28, '', { fontFamily: FONT, fontSize: '22px', color: '#ffe9b8', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5);
    this.toast = this.add.container(GAME_W / 2, 200, [tBg, tTitle, tSub]).setAlpha(0);

    const on = <T extends unknown[]>(e: string, fn: (...a: T) => void) => { bus.on(e, fn); this.handlers.push([e, fn as never]); };
    on('hud:init', (d: { level: LevelData; launches: number }) => this.init2(d.level, d.launches));
    on('hud:damage', (total: number) => { this.dmgTarget = total; this.tweens.add({ targets: this.dmgText, scale: 1.25, duration: 80, yoyo: true }); });
    on('hud:launches', (n: number) => this.setLaunches(n));
    on('hud:gift', () => {
      if (!this.gift) return;
      this.gift.clearTint().setAlpha(1);
      this.tweens.add({ targets: this.gift, scale: 1.5, duration: 150, yoyo: true });
    });
    on('hud:combo', (mult: number, big: boolean) => {
      this.comboText.setText(big ? `DHAMAKA ×${mult}!` : `Combo ×${mult}!`).setAlpha(1).setScale(0.5).setColor(big ? '#ff4d6d' : '#ffd36b');
      this.tweens.killTweensOf(this.comboText);
      this.tweens.add({ targets: this.comboText, scale: 1, duration: 150, ease: 'Back.out' });
      this.tweens.add({ targets: this.comboText, alpha: 0, delay: 1300, duration: 300 });
    });
    on('hud:toast', (title: string, sub: string) => {
      tTitle.setText(title); tSub.setText(sub ?? '');
      const w = Math.max(tTitle.width, tSub.width) + 60;
      tBg.clear(); tBg.fillStyle(0x2a1420, 0.75); tBg.fillRoundedRect(-w / 2, -50, w, sub ? 104 : 74, 24);
      this.tweens.killTweensOf(this.toast);
      this.toast.setAlpha(0).setScale(0.8);
      this.tweens.add({ targets: this.toast, alpha: 1, scale: 1, duration: 200, ease: 'Back.out' });
      this.tweens.add({ targets: this.toast, alpha: 0, delay: 1700, duration: 300 });
    });
    on('hud:power', (p: number | null) => this.drawPower(p));
    on('hud:flail', () => this.flailHint.setAlpha(0));
    on('hud:hide', () => this.root.setVisible(false));
    on('hud:offer', () => {
      const dim = dimmer(this, 0.45);
      const g = this.add.graphics();
      g.fillStyle(0x2a1420, 1); g.fillRoundedRect(GAME_W / 2 - 300, 214, 600, 300, 28);
      g.fillStyle(0x7a1c2e, 1); g.fillRoundedRect(GAME_W / 2 - 300, 206, 600, 300, 28);
      g.lineStyle(5, 0xf4c430, 1); g.strokeRoundedRect(GAME_W / 2 - 292, 214, 584, 284, 22);
      const t1 = this.add.text(GAME_W / 2, 262, 'Out of launches!', { fontFamily: FONT, fontSize: '40px', color: '#f4c430', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 7 }).setOrigin(0.5);
      const t2 = this.add.text(GAME_W / 2, 314, 'Watch a short ad for one more launch?', { fontFamily: FONT, fontSize: '24px', color: '#ffffff' }).setOrigin(0.5);
      const items: Phaser.GameObjects.GameObject[] = [dim, g, t1, t2];
      const close = () => items.forEach((o) => o.destroy());
      items.push(new Button(this, GAME_W / 2, 390, '▶ +1 Launch', () => { close(); bus.emit('offer:accept'); }, { w: 320, h: 70, size: 30, color: 0x3e9b3a }));
      items.push(new Button(this, GAME_W / 2, 462, 'No thanks', () => { close(); bus.emit('offer:decline'); }, { w: 220, h: 50, size: 22, color: 0x5a1020 }));
      items.push(closeButton(this, GAME_W / 2 + 266, 240, () => { close(); bus.emit('offer:decline'); }));
    });
    on('hud:boss', () => {
      const g = this.add.graphics();
      g.fillStyle(0xf4c430, 1); g.fillRoundedRect(GAME_W / 2 - 120, 90, 240, 40, 14);
      g.lineStyle(3, 0x2a1420, 1); g.strokeRoundedRect(GAME_W / 2 - 120, 90, 240, 40, 14);
      const t = this.add.text(GAME_W / 2, 110, '★ BOSS LEVEL ★', { fontFamily: FONT, fontSize: '22px', color: '#2a1420', fontStyle: 'bold' }).setOrigin(0.5);
      const c = this.add.container(0, 0, [g, t]);
      this.root.add(c);
      this.tweens.add({ targets: c, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
    });
    on('hud:run', (run: { round: number; damage: number }) => {
      const t = this.add.text(30, 98, `∞ Run total ${rupees(run.damage)}`, { fontFamily: FONT, fontSize: '18px', color: '#ffe9b8', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 4 });
      this.root.add(t);
    });
    // LIVE commentary ticker
    const liveBg = this.add.graphics();
    const livePill = this.add.graphics();
    livePill.fillStyle(0xd72631, 1); livePill.fillRoundedRect(0, -16, 64, 32, 10);
    const liveTag = this.add.text(32, 0, 'LIVE', { fontFamily: FONT, fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    const liveTxt = this.add.text(78, 0, '', { fontFamily: FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0, 0.5);
    const live = this.add.container(-700, 612, [liveBg, livePill, liveTag, liveTxt]);
    this.tweens.add({ targets: livePill, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    on('hud:live', (text: string) => {
      liveTxt.setText(text);
      liveBg.clear(); liveBg.fillStyle(0x2a1420, 0.85); liveBg.fillRoundedRect(-10, -24, liveTxt.width + 100, 48, 16);
      this.tweens.killTweensOf(live);
      live.setPosition(-liveTxt.width - 120, 612).setAlpha(1);
      this.tweens.add({ targets: live, x: 24, duration: 260, ease: 'Back.out' });
      this.tweens.add({ targets: live, alpha: 0, delay: 2800, duration: 350 });
    });
    const aimG = this.add.graphics();
    const aimTxt = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0.5).setVisible(false);
    on('hud:aim', (d: { sx: number; sy: number; px: number; py: number; valid: boolean; angle: number; power: number } | null) => {
      aimG.clear();
      if (!d) { aimTxt.setVisible(false); return; }
      // pointer positions arrive in screen pixels; the HUD camera is scrolled to centre the safe area
      const cam = this.cameras.main;
      d = { ...d, sx: d.sx + cam.scrollX, sy: d.sy + cam.scrollY, px: d.px + cam.scrollX, py: d.py + cam.scrollY };
      aimG.lineStyle(3, 0xffffff, 0.55); aimG.strokeCircle(d.sx, d.sy, 24);
      aimG.lineStyle(5, 0xffffff, 0.35); aimG.lineBetween(d.sx, d.sy, d.px, d.py);
      aimG.fillStyle(d.valid ? 0xf4c430 : 0xffffff, 0.85); aimG.fillCircle(d.px, d.py, 12);
      aimTxt.setVisible(true).setPosition(d.px, d.py + 34).setText(d.valid ? `${Math.round(d.angle)}°  ·  ${Math.round(d.power * 100)}%` : 'Release to cancel');
    });
    const flash = this.add.rectangle(-3000, -3000, GAME_W + 6000, 720 + 6000, 0xffffff, 0).setOrigin(0);
    on('hud:flash', () => { flash.setAlpha(0.85); this.tweens.add({ targets: flash, alpha: 0, duration: 260 }); });
    let tut: Phaser.GameObjects.Container | null = null;
    on('hud:tutorial', (show: boolean) => {
      tut?.destroy(); tut = null;
      if (!show) return;
      const hand = this.add.graphics();
      hand.fillStyle(0xffffff, 0.9); hand.fillCircle(0, 0, 20);
      hand.lineStyle(4, 0x2a1420, 1); hand.strokeCircle(0, 0, 20);
      const sx = 640, sy = 400;
      const txt = this.add.text(sx - 60, sy - 110, 'Drag back & release\nto fire Lucky!', {
        fontFamily: FONT, fontSize: '32px', color: '#ffffff', fontStyle: 'bold', align: 'center', stroke: '#2a1420', strokeThickness: 7,
      }).setOrigin(0.5);
      const line = this.add.graphics();
      tut = this.add.container(0, 0, [line, hand, txt]);
      const proxy = { t: 0 };
      this.tweens.add({
        targets: proxy, t: 1, duration: 1300, repeat: -1, repeatDelay: 400, ease: 'Sine.inOut',
        onUpdate: () => {
          if (!tut) return;
          const hx = sx - 150 * proxy.t, hy = sy + 110 * proxy.t;
          hand.setPosition(hx, hy);
          line.clear(); line.lineStyle(5, 0xffffff, 0.5); line.lineBetween(sx, sy, hx, hy);
        },
      });
    });
    let replayUi: Phaser.GameObjects.Container | null = null;
    on('hud:replay', (total: number) => {
      this.root.setVisible(false);
      const bar1 = this.add.rectangle(-3000, -3000, GAME_W + 6000, 3070, 0x000000, 0.85).setOrigin(0);
      const bar2 = this.add.rectangle(-3000, 650, GAME_W + 6000, 3070, 0x000000, 0.85).setOrigin(0);
      const label = this.add.text(40, 35, '● REPLAY  x0.35', { fontFamily: FONT, fontSize: '28px', color: '#ff4d6d', fontStyle: 'bold' }).setOrigin(0, 0.5);
      const hint = this.add.text(GAME_W - 40, 685, 'Tap to skip', { fontFamily: FONT, fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0.5);
      const dmg = this.add.text(GAME_W / 2, 685, `Shaadi Damage ${rupees(total)}`, { fontFamily: FONT, fontSize: '26px', color: '#f4c430', fontStyle: 'bold' }).setOrigin(0.5);
      replayUi = this.add.container(0, 0, [bar1, bar2, label, hint, dmg]);
      this.tweens.add({ targets: label, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    });
    on('hud:replayEnd', () => { replayUi?.destroy(); replayUi = null; });
    this.events.once('shutdown', () => { for (const [e, fn] of this.handlers) bus.off(e, fn); this.handlers = []; });
  }

  private init2(level: LevelData, launches: number) {
    this.level = level;
    const name = this.add.text(30, 30, level.id >= 100_000_000 ? level.name : level.id >= 100000 ? `Round ${level.id - 100000}: ${level.name}` : `${level.id}. ${level.name}`, { fontFamily: FONT, fontSize: '24px', color: '#ffffff', fontStyle: 'bold', stroke: '#2a1420', strokeThickness: 5 }).setOrigin(0, 0.5);
    this.root.add(name);
    for (let i = 0; i < PHYS.launchesPerLevel; i++) {
      const ic = this.add.image(46 + i * 40, 62, 'cannon_icon').setScale(0.9);
      this.icons.push(ic);
      this.root.add(ic);
    }
    if (level.gift) {
      this.gift = this.add.image(46 + PHYS.launchesPerLevel * 40 + 30, 60, 'gift').setScale(0.6).setTint(0x555555).setAlpha(0.6);
      this.root.add(this.gift);
    }
    this.targetText.setText(`Shaadi Damage · ★ at ${rupees(level.damageTarget)}`);
    this.setLaunches(launches);
  }

  private setLaunches(n: number) {
    this.icons.forEach((ic, i) => ic.setAlpha(i < n ? 1 : 0.2));
    if (n < PHYS.launchesPerLevel) {
      this.flailHint.setAlpha(1);
      this.tweens.add({ targets: this.flailHint, alpha: 0, delay: 1800, duration: 400 });
    }
  }

  private drawPower(p: number | null) {
    const g = this.power;
    g.clear();
    if (p === null) return;
    const x = 30, y = 120, h = 200, w = 26;
    g.fillStyle(0x2a1420, 0.7); g.fillRoundedRect(x - 6, y - 6, w + 12, h + 12, 12);
    const col = p < 0.5 ? 0x3e9b3a : p < 0.85 ? 0xf7a21b : 0xe6197e;
    g.fillStyle(col, 1); g.fillRoundedRect(x, y + h * (1 - p), w, h * p, 8);
    g.lineStyle(3, 0xffffff, 0.8); g.strokeRoundedRect(x, y, w, h, 8);
  }

  update(_t: number, dt: number) {
    if (this.dmgShown !== this.dmgTarget) {
      const diff = this.dmgTarget - this.dmgShown;
      const step = Math.sign(diff) * Math.max(10, Math.abs(diff) * Math.min(1, dt / 120));
      this.dmgShown = Math.abs(step) >= Math.abs(diff) ? this.dmgTarget : this.dmgShown + step;
      this.dmgText.setText(`${rupees(this.dmgShown)} damage`);
      if (this.level) this.dmgText.setColor(this.dmgShown >= this.level.damageTarget ? '#7dff9a' : '#f4c430');
    }
  }
}
