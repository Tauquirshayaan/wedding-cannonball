import type { LevelData } from './types';
import { ENDLESS_BASE, generateRound, campaignLevel, campaignName } from './endless';

const files = import.meta.glob('./level*.json', { eager: true, import: 'default' }) as Record<string, LevelData>;

/** Open ground behind every stage, so overshooting the stage is a real miss. */
export const RUNOFF = 560;

const withRunoff = (L: LevelData): LevelData => ({ ...L, width: Math.max(L.width, L.stage.x + L.stage.w + RUNOFF) });

/** The 10 hand-made levels. */
export const LEVELS: LevelData[] = Object.keys(files).sort().map((k) => withRunoff(files[k]));

/** Campaign length: 10 hand-made levels, then generated ones up to this number. */
export const TOTAL_LEVELS = 1002;

export interface EndlessRun { seed: number; round: number; damage: number; }

const cache = new Map<number, LevelData>();

/** Campaign level by id (hand-made or generated), or a generated Endless Baraat round. */
export function getLevel(id: number, run?: EndlessRun | null): LevelData {
  if (id >= ENDLESS_BASE && run) return withRunoff(generateRound(run.round, run.seed));
  id = Math.min(TOTAL_LEVELS, Math.max(1, Math.round(id)));
  if (id <= LEVELS.length) return LEVELS[id - 1];
  let L = cache.get(id);
  if (!L) {
    L = withRunoff(campaignLevel(id));
    cache.set(id, L);
    if (cache.size > 30) cache.delete(cache.keys().next().value as number);
  }
  return L;
}

/** Card title without generating the level. */
export function levelName(id: number) { return id <= LEVELS.length ? LEVELS[id - 1].name : campaignName(id); }
