import { platform } from '../platform/Platform';

export interface LevelRecord { stars: number; best: number; cleared: boolean; }
export interface SaveData {
  v: 1;
  levels: Record<number, LevelRecord>;
  sfx: number;
  music: number;
  muted: boolean;
  tutorialDone: boolean;
}

const fresh = (): SaveData => ({ v: 1, levels: {}, sfx: 0.8, music: 0.5, muted: false, tutorialDone: false });

class SaveManagerImpl {
  data: SaveData = fresh();

  async load() {
    try {
      const raw = await platform.load();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1) this.data = { ...fresh(), ...parsed };
      }
    } catch { this.data = fresh(); }
  }

  persist() {
    try { platform.save(JSON.stringify(this.data)); } catch { /* keep playing without saving */ }
  }

  level(id: number): LevelRecord {
    return this.data.levels[id] ?? { stars: 0, best: 0, cleared: false };
  }

  isUnlocked(id: number) {
    return id === 1 || this.level(id - 1).cleared;
  }

  totalStars() {
    return Object.values(this.data.levels).reduce((a, l) => a + l.stars, 0);
  }

  /** Records a result and returns whether the score is a new best. */
  record(id: number, cleared: boolean, stars: number, score: number): boolean {
    const prev = this.level(id);
    const newBest = cleared && score > prev.best;
    this.data.levels[id] = {
      cleared: prev.cleared || cleared,
      stars: Math.max(prev.stars, stars),
      best: Math.max(prev.best, cleared ? score : 0),
    };
    this.persist();
    return newBest;
  }

  reset() {
    const { sfx, music, muted } = this.data;
    this.data = { ...fresh(), sfx, music, muted };
    this.persist();
  }
}

export const SaveManager = new SaveManagerImpl();
