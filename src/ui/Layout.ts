import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';

/**
 * Responsive layout. The canvas fills the whole screen (Scale.EXPAND), so the visible area is at
 * least 1280×720 and wider or taller on other screen shapes. Menus and the HUD are designed for a
 * 1280×720 "safe area" that is kept centred; gameplay simply shows more of the world.
 */
export function safeArea(scene: Phaser.Scene, anchorTop = false) {
  const w = scene.scale.width, h = scene.scale.height;
  return { w, h, ox: (w - GAME_W) / 2, oy: anchorTop ? 0 : (h - GAME_H) / 2 };
}

/** Keeps the 1280×720 design centred on any screen shape, also after rotation or resize. */
export function centerSafeArea(scene: Phaser.Scene, after?: () => void, anchorTop = false) {
  const apply = () => {
    const s = safeArea(scene, anchorTop);
    const cam = scene.cameras.main;
    cam.setSize(s.w, s.h);
    cam.setScroll(-s.ox, -s.oy);
    after?.();
  };
  apply();
  scene.scale.on('resize', apply);
  scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}

/** Runs fn now and on every resize until the scene shuts down. */
export function onResize(scene: Phaser.Scene, fn: () => void) {
  fn();
  scene.scale.on('resize', fn);
  scene.events.once('shutdown', () => scene.scale.off('resize', fn));
}

/** Full-screen dimmer for overlays, large enough for any screen shape. */
export function dimmer(scene: Phaser.Scene, alpha: number) {
  return scene.add.rectangle(-3000, -3000, GAME_W + 6000, GAME_H + 6000, 0x000000, alpha).setOrigin(0).setInteractive();
}

export const isTouchDevice = () => {
  try { return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0; } catch { return false; }
};

/** Goes full screen and locks landscape where the browser allows it (Android Chrome, desktop). iPhones cannot. */
export function enterFullscreen(scene: Phaser.Scene) {
  try {
    if (!scene.scale.fullscreen.available || scene.scale.isFullscreen) return;
    scene.scale.startFullscreen();
    const o = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    setTimeout(() => { o?.lock?.('landscape').catch(() => { /* not allowed on this device */ }); }, 300);
  } catch { /* fullscreen refused */ }
}
