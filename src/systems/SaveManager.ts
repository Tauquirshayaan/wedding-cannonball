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
  outfit: string;
  haptics: boolean;
  lowfx: boolean;
  daily: { last: number; streak: number; date: number; launches: number; damage: number };
  endless: { round: number; damage: number };
}

const fresh = (): SaveData => ({ v: 1, levels: {}, sfx: 0.8, music: 0.5, muted: false, tutorialDone: false, voice: true, outfit: 'auto', haptics: true, lowfx: false, daily: { last: 0, streak: 0, date: 0, launches: 0, damage: 0 }, endless: { round: 0, damage: 0 } });

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
  out.haptics = bool(raw.haptics, true);
  out.lowfx = bool(raw.lowfx, false);
  out.outfit = typeof raw.outfit === 'string' && /^[a-z0-9]{1,8}$/.test(raw.outfit) ? raw.outfit : 'auto';
  const dl = raw.daily as Record<string, unknown> | undefined;
  if (dl && typeof dl === 'object') out.daily = { last: Math.round(num(dl.last, 0, 1e8, 0)), streak: Math.round(num(dl.streak, 0, 1e5, 0)), date: Math.round(num(dl.date, 0, 1e8, 0)), launches: Math.round(num(dl.launches, 0, 9, 0)), damage: Math.round(num(dl.damage, 0, 1e9, 0)) };
  const e = raw.endless as Record<string, unknown> | undefined;
  if (e && typeof e === 'object') out.endless = { round: Math.round(num(e.round, 0, 1e4, 0)), damage: Math.round(num(e.damage, 0, 1e9, 0)) };
  const lv = raw.levels;
  if (lv && typeof lv === 'object') {
    for (const key of Object.keys(lv)) {
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1 || id > 1002) continue;
      const r = (lv as Record<string, unknown>)[key];
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

  /** Records a Daily Challenge clear: keeps today's best and the day streak. Returns true if it is today's best. */
  recordDaily(date: number, launches: number, damage: number) {
    const d = this.data.daily;
    if (d.last !== date) {
      const y = new Date(Math.floor(date / 10000), (Math.floor(date / 100) % 100) - 1, (date % 100) - 1);
      const yesterday = y.getFullYear() * 10000 + (y.getMonth() + 1) * 100 + y.getDate();
      d.streak = d.last === yesterday ? d.streak + 1 : 1;
      d.last = date;
    }
    const better = d.date !== date || launches < d.launches || (launches === d.launches && damage > d.damage);
    if (better) { d.date = date; d.launches = launches; d.damage = damage; }
    this.persist();
    return better;
  }

  /** Records a finished Endless run; returns true if it beats the best. */
  recordEndless(round: number, damage: number) {
    const b = this.data.endless;
    const better = round > b.round || (round === b.round && damage > b.damage);
    if (better) { this.data.endless = { round, damage }; this.persist(); }
    return better;
  }

  reset() {
    // settings survive a progress reset; only levels and the tutorial flag are cleared
    const { sfx, music, muted, voice, haptics, lowfx, outfit } = this.data;
    this.data = { ...fresh(), sfx, music, muted, voice, haptics, lowfx, outfit };
    this.persist();
  }
}

export const SaveManager = new SaveManagerImpl();
