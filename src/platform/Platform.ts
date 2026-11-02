// Portal SDK adapter. One build per portal: `npm run build:poki`, `build:crazygames`, `build:youtube`.
// Every call is safe to make even if the SDK failed to load (ad blockers, offline, local testing).

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    PokiSDK?: any;
    CrazyGames?: any;
    ytgame?: any;
  }
}

export interface Platform {
  name: string;
  /** Portal pages must not link out to other sites. */
  allowExternalLinks: boolean;
  init(): Promise<void>;
  loadingProgress(p: number): void;
  loadingDone(): void;
  firstFrame(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Mid-game ad between levels. Resolves when the game may continue. */
  commercialBreak(): Promise<void>;
  happyTime(): void;
  sendScore(score: number): void;
  load(): Promise<string | null>;
  save(data: string): void;
  onPause(cb: () => void): void;
  onResume(cb: () => void): void;
  onAudioChange(cb: (enabled: boolean) => void): void;
}

const LS_KEY = 'hc_wedding_save_v1';

function lsGet(): string | null {
  try { return window.localStorage.getItem(LS_KEY); } catch { return null; }
}
function lsSet(v: string) {
  try { window.localStorage.setItem(LS_KEY, v); } catch { /* storage blocked: play without saving */ }
}

function loadScript(src: string, timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const s = document.createElement('script');
    let done = false;
    const finish = (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
    s.src = src;
    s.async = true;
    s.onload = () => finish(true);
    s.onerror = () => finish(false);
    setTimeout(() => finish(false), timeoutMs);
    document.head.appendChild(s);
  });
}

class WebPlatform implements Platform {
  name = 'web';
  allowExternalLinks = true;
  protected inGameplay = false;
  async init() {}
  loadingProgress() {}
  loadingDone() {}
  firstFrame() {}
  gameplayStart() { this.inGameplay = true; }
  gameplayStop() { this.inGameplay = false; }
  async commercialBreak() {}
  happyTime() {}
  sendScore(_score: number) {}
  async load() { return lsGet(); }
  save(data: string) { lsSet(data); }
  onPause(_cb: () => void) {}
  onResume(_cb: () => void) {}
  onAudioChange(_cb: (enabled: boolean) => void) {}
}

class PokiPlatform extends WebPlatform {
  name = 'poki';
  allowExternalLinks = false;
  private ok = false;
  async init() {
    const loaded = await loadScript('https://game-cdn.poki.com/scripts/v2/poki-sdk.js');
    if (!loaded || !window.PokiSDK) return;
    try {
      await window.PokiSDK.init();
      this.ok = true;
    } catch {
      // Poki: init rejects when an ad blocker is active; the game continues normally.
      this.ok = true;
    }
  }
  loadingDone() { if (this.ok) window.PokiSDK.gameLoadingFinished(); }
  gameplayStart() { if (this.ok && !this.inGameplay) window.PokiSDK.gameplayStart(); this.inGameplay = true; }
  gameplayStop() { if (this.ok && this.inGameplay) window.PokiSDK.gameplayStop(); this.inGameplay = false; }
  async commercialBreak() {
    if (!this.ok) return;
    this.gameplayStop();
    try { await window.PokiSDK.commercialBreak(() => pauseHooks.forEach((h) => h())); } catch { /* ignore */ }
    resumeHooks.forEach((h) => h());
  }
}

class CrazyGamesPlatform extends WebPlatform {
  name = 'crazygames';
  allowExternalLinks = false;
  private sdk: any = null;
  async init() {
    const loaded = await loadScript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
    if (!loaded || !window.CrazyGames?.SDK) return;
    try {
      await window.CrazyGames.SDK.init();
      this.sdk = window.CrazyGames.SDK;
      this.sdk.game.loadingStart?.();
    } catch { this.sdk = null; }
  }
  loadingDone() { try { this.sdk?.game.loadingStop?.(); } catch { /* ignore */ } }
  gameplayStart() { if (!this.inGameplay) try { this.sdk?.game.gameplayStart(); } catch { /* ignore */ } this.inGameplay = true; }
  gameplayStop() { if (this.inGameplay) try { this.sdk?.game.gameplayStop(); } catch { /* ignore */ } this.inGameplay = false; }
  happyTime() { try { this.sdk?.game.happytime(); } catch { /* ignore */ } }
  commercialBreak(): Promise<void> {
    if (!this.sdk) return Promise.resolve();
    this.gameplayStop();
    return new Promise((resolve) => {
      const done = () => { resumeHooks.forEach((h) => h()); resolve(); };
      try {
        this.sdk.ad.requestAd('midgame', {
          adStarted: () => pauseHooks.forEach((h) => h()),
          adFinished: done,
          adError: done,
        });
      } catch { done(); }
    });
  }
  async load() {
    try { const v = this.sdk?.data?.getItem(LS_KEY); if (v) return v; } catch { /* ignore */ }
    return lsGet();
  }
  save(data: string) {
    try { this.sdk?.data?.setItem(LS_KEY, data); } catch { /* ignore */ }
    lsSet(data);
  }
}

class YouTubePlatform extends WebPlatform {
  name = 'youtube';
  allowExternalLinks = false;
  private yt: any = null;
  async init() {
    if (!window.ytgame) await loadScript('https://www.youtube.com/game_api/v1');
    this.yt = window.ytgame ?? null;
  }
  firstFrame() { try { this.yt?.game.firstFrameReady(); } catch { /* ignore */ } }
  loadingDone() { try { this.yt?.game.gameReady(); } catch { /* ignore */ } }
  sendScore(score: number) { try { this.yt?.engagement.sendScore({ value: Math.round(score) }); } catch { /* ignore */ } }
  async load() {
    if (!this.yt) return lsGet();
    try { const v = await this.yt.game.loadData(); return v || null; } catch { return null; }
  }
  save(data: string) {
    if (!this.yt) return lsSet(data);
    try { this.yt.game.saveData(data); } catch { /* ignore */ }
  }
  onPause(cb: () => void) { try { this.yt?.system.onPause(cb); } catch { /* ignore */ } }
  onResume(cb: () => void) { try { this.yt?.system.onResume(cb); } catch { /* ignore */ } }
  onAudioChange(cb: (enabled: boolean) => void) {
    try {
      if (!this.yt) return;
      cb(this.yt.system.isAudioEnabled());
      this.yt.system.onAudioEnabledChange(cb);
    } catch { /* ignore */ }
  }
}

const pauseHooks: (() => void)[] = [];
const resumeHooks: (() => void)[] = [];
/** Called around ads so the game can mute and pause. */
export function onAdPause(cb: () => void) { pauseHooks.push(cb); }
export function onAdResume(cb: () => void) { resumeHooks.push(cb); }

function pick(): Platform {
  let name = typeof __PLATFORM__ !== 'undefined' ? __PLATFORM__ : 'web';
  try {
    const q = new URLSearchParams(window.location.search).get('platform');
    if (q) name = q;
  } catch { /* ignore */ }
  switch (name) {
    case 'poki': return new PokiPlatform();
    case 'crazygames': return new CrazyGamesPlatform();
    case 'youtube': return new YouTubePlatform();
    default: return new WebPlatform();
  }
}

export const platform: Platform = pick();
