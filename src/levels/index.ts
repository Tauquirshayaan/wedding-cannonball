import type { LevelData } from './types';
import { ENDLESS_BASE, generateRound } from './endless';

const files = import.meta.glob('./level*.json', { eager: true, import: 'default' }) as Record<string, LevelData>;

/** Open ground behind every stage, so overshooting the stage is a real miss. */
export const RUNOFF = 560;

export const LEVELS: LevelData[] = Object.keys(files).sort().map((k) => {
  const L = files[k];
  return { ...L, width: Math.max(L.width, L.stage.x + L.stage.w + RUNOFF) };
});

export interface EndlessRun { seed: number; round: number; damage: number; }

/** Campaign level by id, or a generated Endless Baraat round. */
export function getLevel(id: number, run?: EndlessRun | null): LevelData {
  if (id >= ENDLESS_BASE && run) {
    const L = generateRound(run.round, run.seed);
    return { ...L, width: Math.max(L.width, L.stage.x + L.stage.w + RUNOFF) };
  }
  return LEVELS[Math.min(LEVELS.length, Math.max(1, id)) - 1];
}
