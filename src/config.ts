// Core game size and physics tuning values. Tune here; everything reads from this file.
export const GAME_W = 1280;
export const GAME_H = 720;
export const GROUND_Y = 660; // top surface of the lawn
export const STEP_MS = 1000 / 60; // fixed physics step

export const PHYS = {
  gravityY: 1.0,
  maxLaunchSpeed: 32, // px per step at 100% power
  velocityCap: 45, // px per step, stops tunnelling
  ragdollFriction: 0.6,
  ragdollRestitution: 0.2,
  airFriction: 0.007,
  positionIterations: 10,
  velocityIterations: 6,
  jointStiffness: 0.7,
  neckStiffness: 0.9,
  jointDamping: 0.05,
  minAngle: 10,
  maxAngle: 80,
  dragForFullPower: 210, // screen px of drag for 100% power
  hitSpeed: 4, // impact speed that counts as a damaging hit
  shakeSpeed: 8, // impact speed that shakes the screen
  hitStopSpeed: 13, // impact speed that triggers a 60 ms freeze
  settleSpeed: 0.3,
  settleMs: 1000,
  maxLaunchMs: 8000,
  launchesPerLevel: 3,
  comboWindowMs: 1500,
  comboStep: 0.5,
  comboMax: 3,
  flailNudge: 7, // stretch feature: one mid-air tap per launch
};

export const COLORS = {
  marigold: 0xf7a21b,
  rani: 0xe6197e,
  maroon: 0x7a1c2e,
  gold: 0xf4c430,
  leaf: 0x3e9b3a,
  night: 0x0e1a40,
  outline: 0x2a1420,
  cream: 0xfff3d6,
};

export const FONT = "'Trebuchet MS', 'Arial Rounded MT Bold', Verdana, 'Segoe UI', Roboto, sans-serif";
