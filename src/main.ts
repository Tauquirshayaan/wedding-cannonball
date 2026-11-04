import Phaser from 'phaser';
import { GAME_W, GAME_H } from './config';
import { PreloadScene, TitleScene, LevelSelectScene, PauseScene, SettingsScene, ResultScene, WardrobeScene } from './scenes/MenuScenes';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { platform, onAdPause, onAdResume } from './platform/Platform';
import { SaveManager } from './systems/SaveManager';
import { AudioManager } from './systems/AudioManager';

// Stop the page from scrolling on Space/arrow keys inside portal iframes.
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});

async function boot() {
  await platform.init();
  await SaveManager.load();
  const d = SaveManager.data;
  AudioManager.configure(d.sfx, d.music, d.muted);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: '#0e1a40',
    // EXPAND: fill the whole screen at any aspect ratio (no black bars); 1280×720 is the minimum visible area
    scale: { mode: Phaser.Scale.EXPAND, autoCenter: Phaser.Scale.CENTER_BOTH, width: GAME_W, height: GAME_H },
    input: { activePointers: 2 },
    render: { antialias: true, powerPreference: 'high-performance' },
    fps: { target: 60 },
    banner: false,
    scene: [PreloadScene, TitleScene, LevelSelectScene, GameScene, HudScene, PauseScene, SettingsScene, ResultScene, WardrobeScene],
  });
  (window as unknown as { __hcGame: Phaser.Game }).__hcGame = game;

  // Mobile browsers often report the old size right after a rotation or when the toolbar hides:
  // re-measure a few times so the canvas always fills the screen.
  const refit = () => [50, 250, 600].forEach((ms) => setTimeout(() => game.scale.refresh(), ms));
  window.addEventListener('orientationchange', refit);
  window.addEventListener('resize', refit);
  window.visualViewport?.addEventListener('resize', refit);
  document.addEventListener('fullscreenchange', refit);

  // Tab switching: pause and mute.
  document.addEventListener('visibilitychange', () => AudioManager.setHidden(document.hidden));

  // Portal ad breaks and YouTube pause/audio controls.
  onAdPause(() => { AudioManager.setExternalMute(true); game.loop.sleep(); });
  onAdResume(() => { AudioManager.setExternalMute(false); game.loop.wake(); });
  platform.onPause(() => { AudioManager.setHidden(true); game.events.emit('hidden'); game.loop.sleep(); });
  platform.onResume(() => { AudioManager.setHidden(false); game.loop.wake(); });
  platform.onAudioChange((enabled) => AudioManager.setExternalMute(!enabled));
}

void boot();
