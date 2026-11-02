import type { LevelData } from './types';

const files = import.meta.glob('./level*.json', { eager: true, import: 'default' }) as Record<string, LevelData>;
export const LEVELS: LevelData[] = Object.keys(files).sort().map((k) => files[k]);
