import Phaser from 'phaser';
/** Global event bus shared by GameScene, HudScene and overlays. */
export const bus = new Phaser.Events.EventEmitter();
