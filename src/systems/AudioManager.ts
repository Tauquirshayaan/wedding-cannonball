// All sound is synthesised live with Web Audio: original by construction, zero bytes to download.

export type Sfx =
  | 'boom' | 'whoosh' | 'dhol' | 'crash' | 'laddoo' | 'click' | 'ohh' | 'whistle'
  | 'shehnai' | 'sad' | 'pop' | 'star' | 'splat' | 'combo' | 'gift' | 'bounce' | 'flail';

class AudioManagerImpl {
  ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private musicDuck!: GainNode;
  private noise!: AudioBuffer;
  private sfxVol = 0.8;
  private musicVol = 0.5;
  private muted = false;
  private externallyMuted = false;
  private hidden = false;
  private musicOn = false;
  private musicTimer: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private lastPlay: Record<string, number> = {};

  constructor() {
    const unlock = () => this.unlock();
    ['pointerdown', 'touchend', 'keydown', 'mousedown'].forEach((e) => document.addEventListener(e, unlock, { capture: true }));
  }

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.master);
        this.musicGain = this.ctx.createGain();
        this.musicDuck = this.ctx.createGain();
        this.musicGain.connect(this.musicDuck);
        this.musicDuck.connect(this.master);
        const len = this.ctx.sampleRate * 1;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolumes();
        if (this.musicOn) this.startScheduler();
      }
      if (this.ctx.state === 'suspended' && !this.hidden) void this.ctx.resume();
    } catch { /* audio unavailable: play silently */ }
  }

  configure(sfx: number, music: number, muted: boolean) {
    this.sfxVol = sfx; this.musicVol = music; this.muted = muted;
    this.applyVolumes();
  }
  setSfx(v: number) { this.sfxVol = v; this.applyVolumes(); }
  setMusic(v: number) { this.musicVol = v; this.applyVolumes(); }
  setMuted(m: boolean) { this.muted = m; this.applyVolumes(); }
  isMuted() { return this.muted; }
  /** Portal-controlled mute (ads, YouTube audio setting). */
  setExternalMute(m: boolean) { this.externallyMuted = m; this.applyVolumes(); }

  setHidden(h: boolean) {
    this.hidden = h;
    if (!this.ctx) return;
    if (h) void this.ctx.suspend(); else void this.ctx.resume();
  }

  private applyVolumes() {
    if (!this.ctx) return;
    const off = this.muted || this.externallyMuted;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(off ? 0 : 1, t, 0.02);
    this.sfxGain.gain.setTargetAtTime(this.sfxVol * 0.9, t, 0.02);
    this.musicGain.gain.setTargetAtTime(this.musicVol * 0.32, t, 0.05);
  }

  duck(on: boolean) {
    if (!this.ctx) return;
    this.musicDuck.gain.setTargetAtTime(on ? 0.25 : 1, this.ctx.currentTime, 0.15);
  }

  // ---------- building blocks ----------
  private env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private tone(type: OscillatorType, f0: number, f1: number, t: number, dur: number, vol: number, out: AudioNode, attack = 0.005) {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    this.env(g, t, attack, vol, dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + attack + dur + 0.05);
    return o;
  }

  private noiseHit(t: number, dur: number, vol: number, filter: BiquadFilterType, f0: number, f1: number, out: AudioNode, q = 1) {
    const c = this.ctx!;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    const g = c.createGain();
    this.env(g, t, 0.004, vol, dur);
    s.connect(f); f.connect(g); g.connect(out);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  private reed(freqs: [number, number, number][], t0: number, vol: number, out: AudioNode, bright = 1400, vibDepth = 7) {
    // freqs: [frequency, start offset, duration] — shehnai/brass-like lead with vibrato and slides
    const c = this.ctx!;
    const o = c.createOscillator();
    const o2 = c.createOscillator();
    o.type = 'sawtooth'; o2.type = 'square';
    const lfo = c.createOscillator(); const lfoG = c.createGain();
    lfo.frequency.value = 5.5; lfoG.gain.value = vibDepth;
    lfo.connect(lfoG); lfoG.connect(o.frequency); lfoG.connect(o2.frequency);
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bright; f.Q.value = 1.2;
    const g = c.createGain(); const mix2 = c.createGain(); mix2.gain.value = 0.35;
    o.connect(f); o2.connect(mix2); mix2.connect(f); f.connect(g); g.connect(out);
    g.gain.setValueAtTime(0.0001, t0);
    let end = t0;
    for (const [fr, off, dur] of freqs) {
      const t = t0 + off;
      o.frequency.setTargetAtTime(fr, t, 0.02);
      o2.frequency.setTargetAtTime(fr * 1.002, t, 0.02);
      g.gain.setTargetAtTime(vol, t, 0.02);
      g.gain.setTargetAtTime(vol * 0.7, t + dur * 0.6, 0.05);
      end = Math.max(end, t + dur);
    }
    o.frequency.setValueAtTime(freqs[0][0], t0);
    o2.frequency.setValueAtTime(freqs[0][0], t0);
    g.gain.setTargetAtTime(0.0001, end, 0.06);
    [o, o2, lfo].forEach((n) => { n.start(t0); n.stop(end + 0.5); });
  }

  // ---------- sound effects ----------
  play(name: Sfx, intensity = 1) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    // simple rate limit so pile-ups do not get deafening
    const minGap = name === 'laddoo' || name === 'crash' ? 0.05 : 0.03;
    if (this.lastPlay[name] && now - this.lastPlay[name] < minGap) return;
    this.lastPlay[name] = now;
    const t = now + 0.005;
    const out = this.sfxGain;
    const v = Math.min(1.4, Math.max(0.3, intensity));
    switch (name) {
      case 'boom':
        this.noiseHit(t, 0.6, 0.9, 'lowpass', 1400, 90, out);
        this.tone('sine', 140, 38, t, 0.45, 0.9, out);
        break;
      case 'whoosh':
        this.noiseHit(t, 0.45, 0.25 * v, 'bandpass', 300, 1800, out, 2);
        break;
      case 'dhol':
        this.tone('sine', 150, 52, t, 0.3, 0.9, out);
        this.noiseHit(t, 0.05, 0.4, 'highpass', 2000, 1500, out);
        this.tone('triangle', 330, 260, t + 0.08, 0.12, 0.25, out);
        break;
      case 'bounce':
        this.tone('sine', 220, 520, t, 0.18, 0.4, out);
        break;
      case 'crash':
        this.noiseHit(t, 0.22, 0.45 * v, 'lowpass', 3500, 400, out);
        for (let i = 0; i < 3; i++) this.tone('triangle', 260 + Math.random() * 380, 180, t + i * 0.045, 0.06, 0.22 * v, out);
        break;
      case 'laddoo':
        for (let i = 0; i < 5; i++) this.tone('sine', 900 + Math.random() * 700, 700, t + i * 0.03, 0.04, 0.12, out);
        break;
      case 'click':
        this.noiseHit(t, 0.02, 0.6, 'highpass', 4000, 3000, out);
        this.noiseHit(t + 0.07, 0.03, 0.5, 'highpass', 3000, 2500, out);
        this.tone('square', 1800, 1800, t + 0.07, 0.03, 0.08, out);
        break;
      case 'ohh': {
        const c = this.ctx;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 3;
        f.frequency.setValueAtTime(800, t); f.frequency.linearRampToValueAtTime(450, t + 0.9);
        const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5, t + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        f.connect(g); g.connect(out);
        for (let i = 0; i < 7; i++) {
          const o = c.createOscillator(); o.type = 'sawtooth';
          const base = 150 + Math.random() * 130;
          o.frequency.setValueAtTime(base * 1.15, t); o.frequency.exponentialRampToValueAtTime(base * 0.85, t + 1);
          o.connect(f); o.start(t + Math.random() * 0.08); o.stop(t + 1.2);
        }
        break;
      }
      case 'whistle':
        this.tone('sine', 700, 2600, t, 0.5, 0.3, out, 0.02);
        this.noiseHit(t, 0.5, 0.15, 'bandpass', 1500, 4000, out, 4);
        this.noiseHit(t + 0.5, 0.3, 0.5, 'lowpass', 2500, 200, out);
        break;
      case 'splat':
        this.noiseHit(t, 0.3, 0.6, 'lowpass', 900, 120, out);
        this.tone('sine', 300, 80, t, 0.35, 0.5, out);
        this.tone('sine', 200, 420, t + 0.15, 0.2, 0.25, out);
        break;
      case 'pop':
        this.tone('sine', 520, 880, t, 0.07, 0.3, out);
        break;
      case 'star':
        this.tone('triangle', 1046 * intensity, 1046 * intensity, t, 0.25, 0.35, out);
        this.tone('sine', 2093 * intensity, 2093 * intensity, t, 0.3, 0.15, out);
        break;
      case 'combo':
        this.tone('square', 440 * intensity, 660 * intensity, t, 0.1, 0.12, out);
        this.tone('triangle', 660 * intensity, 880 * intensity, t + 0.06, 0.12, 0.2, out);
        break;
      case 'gift':
        [784, 988, 1175, 1568].forEach((f, i) => this.tone('triangle', f, f, t + i * 0.06, 0.18, 0.28, out));
        break;
      case 'flail':
        this.tone('sawtooth', 300, 700, t, 0.15, 0.12, out);
        break;
      case 'shehnai': {
        const n = (s: number) => 523.25 * Math.pow(2, s / 12);
        // celebratory reed fanfare
        this.reed([[n(-5), 0, 0.18], [n(-4), 0.18, 0.18], [n(-1), 0.36, 0.18], [n(0), 0.54, 0.5], [n(-1), 1.04, 0.15], [n(0), 1.19, 0.15], [n(1), 1.34, 0.2], [n(0), 1.54, 0.7]], t, 0.35, out, 1500);
        this.tone('sine', 98, 98, t, 2.0, 0.25, out, 0.05);
        break;
      }
      case 'sad': {
        const n = (s: number) => 233.08 * Math.pow(2, s / 12);
        this.reed([[n(0), 0, 0.35], [n(-1), 0.4, 0.35], [n(-2), 0.8, 0.35], [n(-3), 1.2, 1.1]], t, 0.4, out, 700, 12);
        break;
      }
    }
  }

  // ---------- music: original band-baja style loop ----------
  startMusic() {
    this.musicOn = true;
    if (this.ctx) this.startScheduler();
  }
  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer !== null) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
  private startScheduler() {
    if (this.musicTimer !== null || !this.ctx) return;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.step = 0;
    this.musicTimer = window.setInterval(() => this.schedule(), 25);
  }

  private schedule() {
    const c = this.ctx;
    if (!c || c.state !== 'running') { if (c) this.nextStepTime = c.currentTime + 0.05; return; }
    const stepDur = 60 / 124 / 4;
    while (this.nextStepTime < c.currentTime + 0.12) {
      this.playStep(this.step, this.nextStepTime, stepDur);
      this.nextStepTime += stepDur;
      this.step = (this.step + 1) % 64;
    }
  }

  private playStep(s: number, t: number, sd: number) {
    const out = this.musicGain;
    const b = s % 16;
    // dhol: bass "dhum" and treble "ta"
    if ([0, 3, 6, 8, 11, 14].includes(b)) this.tone('sine', 120, 55, t, 0.22, 0.8, out);
    if (b === 4 || b === 12) { this.noiseHit(t, 0.09, 0.45, 'bandpass', 1800, 900, out, 1.5); this.tone('triangle', 380, 300, t, 0.08, 0.25, out); }
    if (b % 2 === 1) this.noiseHit(t, 0.03, 0.12, 'highpass', 6000, 5000, out);
    // bass line
    const roots = [0, 0, 5, 7];
    const bar = Math.floor(s / 16);
    if (b === 0 || b === 6 || b === 10) this.tone('triangle', 98 * Math.pow(2, roots[bar] / 12), 98 * Math.pow(2, roots[bar] / 12), t, sd * 2.5, 0.35, out);
    // brass melody
    const mel = MELODY.find((m) => m[0] === s);
    if (mel) {
      const f = 392 * Math.pow(2, mel[1] / 12);
      this.reed([[f, 0, mel[2] * sd * 0.92]], t, 0.16, out, 1800, 4);
    }
    // chord stabs
    if (b === 2 || b === 10) {
      const r = 196 * Math.pow(2, roots[bar] / 12);
      [1, 1.26, 1.5].forEach((m) => this.tone('square', r * m, r * m, t, 0.08, 0.04, out));
    }
  }
}

// [step, semitones from G4, length in 16th steps]
const MELODY: [number, number, number][] = [
  [0, 0, 2], [2, 4, 2], [4, 5, 2], [6, 7, 4], [10, 5, 2], [12, 4, 2], [14, 2, 2],
  [16, 0, 4], [20, 2, 2], [22, 4, 2], [24, 2, 4], [28, 0, 2], [30, -2, 2],
  [32, 7, 2], [34, 9, 2], [36, 10, 2], [38, 12, 4], [42, 10, 2], [44, 9, 2], [46, 7, 2],
  [48, 5, 2], [50, 7, 2], [52, 4, 2], [54, 5, 2], [56, 2, 2], [58, 4, 2], [60, 0, 4],
];

export const AudioManager = new AudioManagerImpl();
