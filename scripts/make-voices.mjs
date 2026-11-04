// Generates the voice pack (public/voice/*.mp3 + manifest.json) for every commentary line.
//
//   Male Indian voice via Azure Speech (free tier: 500k characters/month, commercial use allowed):
//     AZURE_SPEECH_KEY=xxxx AZURE_SPEECH_REGION=centralindia node scripts/make-voices.mjs
//
//   Or record lines yourself: name each file <id>.mp3 (ids are in VOICE_LINES.md), put them in
//   public/voice/, then run `node scripts/make-voices.mjs --manifest` to register them.
//
// Options: --voice hi-IN-MadhurNeural (default male)  --aunty-voice hi-IN-SwaraNeural  --only vat,kadhai
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const src = readFileSync(new URL('../src/systems/Commentary.ts', import.meta.url), 'utf8');

// parse CUES: one cue per line in Commentary.ts
const lines = [];
for (const m of src.matchAll(/^\s+(\w+): \{ who: '(\w+)', priority: \d+, lines: \[(.*)\] \},$/gm)) {
  const [, ev, who, body] = m;
  [...body.matchAll(/L\('((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'\)/g)].forEach((l, i) => lines.push({ id: `${ev}_${i}`, who, t: l[1].replace(/\\'/g, "'"), hi: l[2] }));
}
if (!lines.length) { console.error('No lines found in Commentary.ts'); process.exit(1); }

// always refresh the script for voice actors
let md = '# Voice lines\n\nRecord or generate one file per line, named `<id>.mp3`, into `public/voice/`.\nKeep each clip short, energetic and comic. Lucky is a young man, the host is a mature man, and Uncle is an older man.\n\n| id | who | line (Hinglish) | Hindi |\n| --- | --- | --- | --- |\n';
for (const l of lines) md += `| ${l.id} | ${l.who} | ${l.t} | ${l.hi} |\n`;
writeFileSync(new URL('../VOICE_LINES.md', import.meta.url), md);
console.log(`VOICE_LINES.md: ${lines.length} lines`);

const outDir = new URL('../public/voice/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const writeManifest = () => {
  const ids = readdirSync(outDir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)).sort();
  writeFileSync(new URL('manifest.json', outDir), JSON.stringify(ids));
  console.log(`public/voice/manifest.json: ${ids.length} clips`);
};
if (process.argv.includes('--manifest')) { writeManifest(); process.exit(0); }

const key = process.env.AZURE_SPEECH_KEY, region = process.env.AZURE_SPEECH_REGION;
if (!key || !region) { console.log('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to generate audio (or record your own and use --manifest).'); process.exit(0); }

const male = arg('--voice', 'hi-IN-MadhurNeural');
const aunty = arg('--aunty-voice', 'hi-IN-SwaraNeural');
const only = arg('--only', '')?.split(',').filter(Boolean);
// per-character delivery
const STYLE = {
  lucky: { pitch: '+8%', rate: '+12%', volume: '+0%' },
  host: { pitch: '-4%', rate: '+5%', volume: '+0%' },
  uncle: { pitch: '-14%', rate: '-4%', volume: '+0%' },
  photographer: { pitch: '+2%', rate: '+15%', volume: '+0%' },
  aunty: { pitch: '+6%', rate: '+8%', volume: '+0%' },
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const l of lines) {
  if (only?.length && !only.some((o) => l.id.startsWith(o + '_'))) continue;
  const file = new URL(`${l.id}.mp3`, outDir);
  if (existsSync(file) && !process.argv.includes('--force')) continue;
  const v = l.who === 'aunty' ? aunty : male;
  const st = STYLE[l.who] ?? STYLE.host;
  const ssml = `<speak version="1.0" xml:lang="hi-IN"><voice name="${v}"><prosody pitch="${st.pitch}" rate="${st.rate}">${esc(l.hi)}</prosody></voice></speak>`;
  const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'wedding-cannon-voicegen' },
    body: ssml,
  });
  if (!r.ok) { console.error(`${l.id}: HTTP ${r.status} ${await r.text()}`); continue; }
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  console.log(`${l.id}  ${l.t}`);
}
writeManifest();
