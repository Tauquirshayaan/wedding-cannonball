import { platform } from '../platform/Platform';

export interface LevelRecord { stars: number; best: number; cleared: boolean; }
export interface SaveData {
  v: 1;
  levels: Record<number, LevelRecord>;
  sfx: number;
  music: number;
  muted: boolean;
  tutorialDone: boolean;
  voice: boolean;
}

const fresh = (): SaveData => ({ v: 1, levels: {}, sfx: 0.8, music: 0.5, muted: false, tutorialDone: false, voice: true });

const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);

/** Saves can be edited by players or corrupted: copy only known fields, with types and ranges checked. */
function sanitize(raw: Record<string, unknown>): SaveData {
  const out = fresh();
  out.sfx = num(raw.sfx, 0, 1, out.sfx);
  out.music = num(raw.music, 0, 1, out.music);
  out.muted = bool(raw.muted, false);
  out.tutorialDone = bool(raw.tutorialDone, false);
  out.voice = bool(raw.voice, true);
  const lv = raw.levels;
  if (lv && typeof lv === 'object') {
    for (let id = 1; id <= 50; id++) {
      const r = (lv as Record<string, unknown>)[String(id)];
      if (!r || typeof r !== 'object') continue;
      const rec = r as Record<string, unknown>;
      out.levels[id] = { stars: Math.round(num(rec.stars, 0, 3, 0)), best: Math.round(num(rec.best, 0, 1e7, 0)), cleared: bool(rec.cleared, false) };
    }
  }
  return out;
}

class SaveManagerImpl {
  data: SaveData = fresh();

  async load() {
    try {
      const raw = await platform.load();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v === 1) this.data = sanitize(parsed);
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
    // settings survive a progress reset; only levels and the tutorial flag are cleared
    const { sfx, music, muted, voice } = this.data;
    this.data = { ...fresh(), sfx, music, muted, voice };
    this.persist();
  }
}

export const SaveManager = new SaveManagerImpl();
