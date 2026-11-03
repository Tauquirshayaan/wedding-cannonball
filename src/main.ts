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
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    render: { antialias: true, powerPreference: 'high-performance' },
    fps: { target: 60 },
    banner: false,
    scene: [PreloadScene, TitleScene, LevelSelectScene, GameScene, HudScene, PauseScene, SettingsScene, ResultScene, WardrobeScene],
  });
  (window as unknown as { __hcGame: Phaser.Game }).__hcGame = game;

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
