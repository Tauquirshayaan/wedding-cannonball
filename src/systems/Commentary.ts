// Live commentary and character reactions.
// Text shows as a speech bubble (characters) or a LIVE ticker (host).
// Voice, best first:
//   1. a recorded voice pack in public/voice/ (see scripts/make-voices.mjs and VOICE_LINES.md)
//   2. the device's speech engine, but only a MALE Indian voice (Hindi or en-IN)
//   3. no speech: bubbles + cartoon reaction sounds only

import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';

export type Speaker = 'lucky' | 'host' | 'uncle' | 'aunty' | 'photographer';
interface Line { t: string; hi: string; }
interface Cue { who: Speaker; lines: Line[]; priority: number; }

const L = (t: string, hi: string): Line => ({ t, hi });

export const CUES: Record<string, Cue> = {
  launch: { who: 'lucky', priority: 1, lines: [L('Aaaaaa!', 'आआआआ!'), L('Rukooo!', 'रुकोओ!'), L('Main aa raha hoon!', 'मैं आ रहा हूँ!'), L('Shaadi mein late nahi!', 'शादी में लेट नहीं!')] },
  vat: { who: 'lucky', priority: 5, lines: [L('Aaah! Jal gaya!', 'आह! जल गया!'), L('Garam garam chashni!', 'गरम गरम चाशनी!'), L('Main toh jalebi ban gaya!', 'मैं तो जलेबी बन गया!'), L('Ohh, jal gayi meri kismat!', 'ओह, जल गई मेरी किस्मत!')] },
  kadhai: { who: 'lucky', priority: 5, lines: [L('Ohh, jal gaya!', 'ओह, जल गया!'), L('Garam tel! Garam tel!', 'गरम तेल! गरम तेल!'), L('Main pakoda ban gaya!', 'मैं पकोड़ा बन गया!'), L('Aaah, mirchi lag gayi!', 'आह, मिर्ची लग गई!')] },
  fire: { who: 'lucky', priority: 5, lines: [L('Aag! Aag!', 'आग! आग!'), L('Pant jal gayi!', 'पैंट जल गई!'), L('Main toh tandoori ban gaya!', 'मैं तो तंदूरी बन गया!')] },
  cracker: { who: 'lucky', priority: 5, lines: [L('Dhamaka!', 'धमाका!'), L('Kaan phat gaye!', 'कान फट गए!'), L('Patakha phoot gaya!', 'पटाखा फूट गया!')] },
  dhol: { who: 'lucky', priority: 2, lines: [L('Dhum dhum!', 'धुम धुम!'), L('Upar chala!', 'ऊपर चला!'), L('Dhol baja diya!', 'ढोल बजा दिया!')] },
  sofa: { who: 'lucky', priority: 2, lines: [L('Aaram se!', 'आराम से!'), L('Sofa toh mast hai!', 'सोफ़ा तो मस्त है!')] },
  laddoo: { who: 'lucky', priority: 2, lines: [L('Mere laddoo!', 'मेरे लड्डू!'), L('Laddoo bikhar gaye!', 'लड्डू बिखर गए!'), L('Mithai gir gayi!', 'मिठाई गिर गई!')] },
  photographer: { who: 'photographer', priority: 3, lines: [L('Bhai, photo kharab!', 'भाई, फोटो खराब!'), L('Smile please... dhadaam!', 'स्माइल प्लीज़... धड़ाम!'), L('Mera camera!', 'मेरा कैमरा!')] },
  uncle: { who: 'uncle', priority: 3, lines: [L('Arre beta, dhyan se!', 'अरे बेटा, ध्यान से!'), L('Mera dance kharab kar diya!', 'मेरा डांस खराब कर दिया!'), L('Kaun hai yeh ladka?', 'कौन है ये लड़का?')] },
  aunty: { who: 'aunty', priority: 3, lines: [L('Haaye! Meri saree!', 'हाय! मेरी साड़ी!'), L('Haaye, kya kar diya!', 'हाय, क्या कर दिया!'), L('Aajkal ke bachche!', 'आजकल के बच्चे!')] },
  canopy: { who: 'lucky', priority: 2, lines: [L('Boing boing!', 'बोइंग बोइंग!'), L('Shamiana trampoline!', 'शामियाना ट्रैम्पोलिन!')] },
  rocket: { who: 'lucky', priority: 4, lines: [L('Patakha express!', 'पटाखा एक्सप्रेस!'), L('Udd gayaaa!', 'उड़ गया!'), L('Yeh toh rocket hai!', 'ये तो रॉकेट है!')] },
  cake: { who: 'lucky', priority: 3, lines: [L('Cake gaya!', 'केक गया!'), L('Sorry, cake!', 'सॉरी, केक!'), L('Mmm, frosting!', 'म्म्म, फ्रॉस्टिंग!')] },
  gift: { who: 'lucky', priority: 3, lines: [L('Shagun mil gaya!', 'शगुन मिल गया!'), L('Gift mera!', 'गिफ्ट मेरा!')] },
  wall: { who: 'lucky', priority: 2, lines: [L('Aaah, mera sar!', 'आह, मेरा सर!'), L('Ouch, deewar!', 'आउच, दीवार!'), L('Kisne rakha yeh?', 'किसने रखा ये?')] },
  ground: { who: 'lucky', priority: 1, lines: [L('Oof!', 'ऊफ़!'), L('Zameen pe!', 'ज़मीन पे!'), L('Aah, kamar!', 'आह, कमर!')] },
  turban: { who: 'lucky', priority: 3, lines: [L('Meri pagdi!', 'मेरी पगड़ी!'), L('Pagdi wapas do!', 'पगड़ी वापस दो!')] },
  missShort: { who: 'host', priority: 4, lines: [L('Thoda aur zor se!', 'थोड़ा और ज़ोर से!'), L('Stage abhi door hai!', 'स्टेज अभी दूर है!')] },
  missLong: { who: 'host', priority: 4, lines: [L('Bahut zyada power!', 'बहुत ज़्यादा पावर!'), L('Stage peeche reh gaya!', 'स्टेज पीछे रह गया!')] },
  missNear: { who: 'host', priority: 4, lines: [L('Bas thoda sa chuk gaya!', 'बस थोड़ा सा चूक गया!'), L('Itne paas!', 'इतने पास!')] },
  missVat: { who: 'host', priority: 4, lines: [L('Chashni mein dubki! Minus paanch sau!', 'चाशनी में डुबकी! माइनस पाँच सौ!')] },
  lastLaunch: { who: 'host', priority: 4, lines: [L('Aakhri mauka!', 'आखिरी मौका!')] },
  combo: { who: 'host', priority: 3, lines: [L('Dhamaka! Kya tabahi hai!', 'धमाका! क्या तबाही है!'), L('Combo pe combo!', 'कॉम्बो पे कॉम्बो!')] },
  win: { who: 'host', priority: 6, lines: [L('Kya entry hai! Pahunch gaya!', 'क्या एंट्री है! पहुँच गया!'), L('Stage pe landing! Wah!', 'स्टेज पे लैंडिंग! वाह!'), L('Grand entry ho gayi!', 'ग्रैंड एंट्री हो गई!')] },
  fail: { who: 'host', priority: 6, lines: [L('Shaadi miss ho gayi!', 'शादी मिस हो गई!'), L('Agli baar pakka!', 'अगली बार पक्का!')] },
};

// device-speech character per speaker (male voices only): pitch / rate
const VOICE: Record<Speaker, { pitch: number; rate: number }> = {
  lucky: { pitch: 1.12, rate: 1.12 },
  host: { pitch: 0.95, rate: 1.05 },
  uncle: { pitch: 0.75, rate: 0.95 },
  aunty: { pitch: 1.0, rate: 1.05 },
  photographer: { pitch: 1.05, rate: 1.15 },
};
// recorded voice pack: per-speaker playback speed (slight pitch change gives each man his own voice)
const PACK_RATE: Record<Speaker, number> = { lucky: 1.06, host: 1.0, uncle: 0.9, aunty: 1.0, photographer: 1.03 };

const MALE_HINTS = ['madhur', 'hemant', 'ravi', 'prabhat', 'kunal', 'aarav', 'arjun', 'rishi', 'rohit', 'male', 'hid', 'hie-local-male', 'man '];
const FEMALE_HINTS = ['female', 'woman', 'swara', 'kalpana', 'heera', 'lekha', 'veena', 'neerja', 'aditi', 'raveena', 'priya', 'ananya', 'kavya', 'hia', 'hic', 'zira', 'samantha', 'google हिन्दी'];

export function allLineIds() {
  const out: { id: string; who: Speaker; t: string; hi: string }[] = [];
  for (const ev in CUES) CUES[ev].lines.forEach((l, i) => out.push({ id: `${ev}_${i}`, who: CUES[ev].who, t: l.t, hi: l.hi }));
  return out;
}

class CommentaryImpl {
  private voice: SpeechSynthesisVoice | null = null;
  private hindi = false;
  private speakingPriority = 0;
  private speakingUntil = 0;
  private last: Record<string, number> = {};
  private unlocked = false;
  private pack: Set<string> | null = null;
  private clips = new Map<string, Promise<AudioBuffer | null>>();
  private current: AudioBufferSourceNode | null = null;

  constructor() {
    this.loadPack();
    const synth = this.synth();
    if (!synth) return;
    const pick = () => {
      const vs = synth.getVoices();
      const name = (v: SpeechSynthesisVoice) => (v.name + ' ' + v.voiceURI).toLowerCase();
      const male = (v: SpeechSynthesisVoice) => MALE_HINTS.some((h) => name(v).includes(h)) && !FEMALE_HINTS.some((h) => name(v).includes(h));
      const lang = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-');
      // Hindi male voice only, speaking Devanagari: English voices (even en-IN) read Hinglish with a foreign accent
      const hi = vs.find((v) => lang(v).startsWith('hi') && male(v));
      this.voice = hi ?? null;
      this.hindi = !!hi;
    };
    pick();
    try { synth.addEventListener('voiceschanged', pick); } catch { /* old browsers */ }
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch { /* ignore */ }
    };
    document.addEventListener('pointerdown', unlock, { capture: true, once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.stop(); });
  }

  private async loadPack() {
    if (location.protocol === 'file:') return; // opened as a local file: no voice pack folder to read
    try {
      const r = await fetch('voice/manifest.json', { cache: 'no-cache' });
      if (!r.ok) return;
      const ids = await r.json();
      if (Array.isArray(ids)) this.pack = new Set(ids.filter((x) => typeof x === 'string' && /^[a-z0-9_]+$/i.test(x)));
    } catch { /* no voice pack (e.g. single-file build): fall back */ }
  }

  private clip(id: string) {
    let p = this.clips.get(id);
    if (!p) {
      p = (async () => {
        const ctx = AudioManager.ctx;
        if (!ctx) return null;
        try {
          const r = await fetch(`voice/${id}.mp3`);
          if (!r.ok) return null;
          return await ctx.decodeAudioData(await r.arrayBuffer());
        } catch { return null; }
      })();
      this.clips.set(id, p);
    }
    return p;
  }

  private synth(): SpeechSynthesis | null {
    try { return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null; } catch { return null; }
  }

  /** Picks a line for an event; returns it for on-screen display. */
  pick(event: string): { who: Speaker; text: string; line: Line; priority: number; id: string } | null {
    const cue = CUES[event];
    if (!cue) return null;
    let i = Math.floor(Math.random() * cue.lines.length);
    if (cue.lines.length > 1 && i === this.last[event]) i = (i + 1) % cue.lines.length;
    this.last[event] = i;
    const line = cue.lines[i];
    return { who: cue.who, text: line.t, line, priority: cue.priority, id: `${event}_${i}` };
  }

  speak(who: Speaker, line: Line, priority: number, id: string) {
    if (!SaveManager.data.voice) return;
    const vol = AudioManager.voiceVolume();
    if (vol <= 0) return;
    const now = performance.now();
    const busy = now < this.speakingUntil;
    if (busy && priority <= this.speakingPriority) return;
    if (this.pack?.has(id)) { void this.playClip(id, who, priority); return; }
    const synth = this.synth();
    if (!synth || !this.voice || who === 'aunty') return; // no Indian male voice on this device: stay silent
    try {
      if (busy) synth.cancel();
      const u = new SpeechSynthesisUtterance(this.hindi ? line.hi : line.t);
      u.voice = this.voice; u.lang = this.voice.lang;
      const v = VOICE[who];
      u.pitch = v.pitch; u.rate = v.rate; u.volume = Math.min(1, vol * 1.1);
      this.speakingPriority = priority;
      this.speakingUntil = now + 400 + line.t.length * 70;
      u.onend = () => { this.speakingUntil = 0; this.speakingPriority = 0; };
      synth.speak(u);
    } catch { /* speech unavailable */ }
  }

  private async playClip(id: string, who: Speaker, priority: number) {
    const buf = await this.clip(id);
    const ctx = AudioManager.ctx;
    if (!buf || !ctx) return;
    try { this.current?.stop(); } catch { /* already stopped */ }
    const src = AudioManager.playBuffer(buf, PACK_RATE[who]);
    if (!src) return;
    this.current = src;
    this.speakingPriority = priority;
    this.speakingUntil = performance.now() + (buf.duration / PACK_RATE[who]) * 1000;
    src.onended = () => { if (this.current === src) { this.current = null; this.speakingUntil = 0; this.speakingPriority = 0; } };
  }

  stop() {
    const s = this.synth();
    try { s?.cancel(); } catch { /* ignore */ }
    try { this.current?.stop(); } catch { /* ignore */ }
    this.current = null;
    this.speakingUntil = 0; this.speakingPriority = 0;
  }
}

export const Commentary = new CommentaryImpl();
