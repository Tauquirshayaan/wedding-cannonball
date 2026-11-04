# Wedding Cannon: Shaadi Chaos

A 2D physics comedy web game. Lucky, a late wedding guest, is fired from a cannon across a chaotic Indian wedding and has to land on the stage. Knocking things over on the way earns **Shaadi Damage**.

Built with Phaser 3 and its built-in Matter.js physics, written in TypeScript and bundled with Vite. The art is drawn in code with Canvas 2D and every sound is synthesised with Web Audio. That means the game downloads **no asset files** and every asset is original.

## Play locally

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN, so you can test on a phone)
```

## Builds for each portal

| Command | Output | Use it for |
| --- | --- | --- |
| `npm run build` | `dist/web/` | itch.io, your own site |
| `npm run build:single` | `dist/single/index.html` | One-file preview to send to a phone |
| `npm run build:poki` | `dist/poki/` | Poki (loads the Poki SDK v2) |
| `npm run build:crazygames` | `dist/crazygames/` | CrazyGames (loads the CrazyGames SDK v3) |
| `npm run build:youtube` | `dist/youtube/index.html` | YouTube Playables (single file, loads `ytgame`) |
| `npm run build:all` | all of the above plus `release/*.zip` | Upload-ready zips |

Every build uses relative paths (`base: './'`), so the zip can be uploaded as is. You can also force a platform adapter at runtime with `?platform=poki|crazygames|youtube|web`.

### What each portal adapter does (`src/platform/Platform.ts`)

| Hook | Poki | CrazyGames | YouTube Playables |
| --- | --- | --- | --- |
| Loading finished | `gameLoadingFinished()` | `loadingStart/Stop()` | `firstFrameReady()`, `gameReady()` |
| Gameplay start/stop | `gameplayStart/Stop()` | `gameplayStart/Stop()` | – |
| Ad break (Result screen → Retry/Next) | `commercialBreak()` | `requestAd('midgame')` | – |
| Celebrate a 3-star clear | – | `happytime()` | – |
| Save data | localStorage | `SDK.data` + localStorage | `saveData/loadData` |
| Pause / audio | game mutes during ads | game mutes during ads | `onPause/onResume`, `onAudioEnabledChange` |
| Score | – | – | `engagement.sendScore()` (sum of best scores) |

On portals the Share button copies the text without a link, because portals do not allow outbound links. If an SDK fails to load (because of an ad blocker or being offline) the game still runs normally.

## Project layout

```
src/
  main.ts                 boot: platform SDK -> save -> Phaser
  config.ts               game size and every physics/tuning number
  data/objectTypes.ts     physics + damage values per object (tune once, applies everywhere)
  levels/level01..10.json level layouts (format in levels/types.ts)
  art/Textures.ts         all art, drawn with Canvas 2D at boot
  objects/Ragdoll.ts      6-part ragdoll + loose pagdi, 5 joints
  objects/LevelBuilder.ts builds props, sensors and static geometry from level JSON
  scenes/GameScene.ts     aiming, launch, fixed 60 Hz physics, scoring, settle rule, replay
  scenes/HudScene.ts      damage meter, combos, launches, gift, pause/restart, replay bars
  scenes/MenuScenes.ts    preload, title, level select, pause, settings, result
  systems/                AudioManager (Web Audio synth), SaveManager, DamageTracker,
                          ReplayRecorder, Analytics, bus
  platform/Platform.ts    Poki / CrazyGames / YouTube / web adapters
```

## Controls

| Action | Mouse / keyboard | Touch |
| --- | --- | --- |
| Aim and set power | Drag back from anywhere, then release | Drag back, then lift finger |
| Cancel aim | Drag back to where you started, or right-click | Drag back to where you started |
| Flail mid-air (once per launch) | Click | Tap |
| Skip the intro pan or replay | Click or Space | Tap |
| Restart | R | Restart button |
| Pause | Esc or P | Pause button |

## Level file format

```json
{
  "id": 3, "name": "Say Cheese", "tip": "…", "width": 2000,
  "cannon": { "x": 130, "y": 600 },
  "stage": { "x": 1620, "y": 600, "w": 320 },
  "gift": { "x": 1000, "y": 300 },
  "damageTarget": 4000,
  "objects": [
    { "type": "photographer", "x": 620, "walkRange": 220 },
    { "type": "garlandArch", "x": 1000, "gap": 150, "h": 250 }
  ]
}
```

Object types: `sofa`, `laddooPyramid` (count), `dhol` (y), `photographer` (walkRange), `relative` (variant `uncle` or `aunty`), `fan` (x, y, w, h, fx, fy = push direction), `vat` (w), `canopy` (y, w), `rocket` (y, angle in degrees), `cake`, `garlandArch` (gap, h), `pillar` (w, h), `block` (y = top, w, h, style `ledge`/`giftTable`/`riser`/`table`).

`x` is the object's centre. `y` is the surface it stands on (it defaults to the ground at 660) unless noted. For the stage, `x` and `y` are the left edge and top surface.

## Asset sources

All art and audio is generated in code in this repository, so there are no third-party assets. The music is an original band-baja style loop. There are no Bollywood songs and no religious objects.

## Performance, memory and security

**Measured** (headless Chromium in a 4-core cloud container, 3 Nov 2026):

| Check | Result |
| --- | --- |
| Physics cost, busiest level mid-crash | 0.07 ms per step, about 0.4% of a 60 fps frame |
| Memory over 60 level loads | Flat: 114 textures throughout, and the JS heap returns to about 40 MB, so no leak |
| 1,000 players loading at the same moment (`npm run loadtest`) | 1000/1000 OK, p95 1.6 s, about 380 KB per player |
| 5,000 players at the same moment | 5000/5000 OK, p95 5.9 s |
| `npm audit` | 0 vulnerabilities |

**How memory is kept low**
- Each venue's art and the level-sized textures are freed when you leave a level.
- The sky is drawn at half resolution, which uses a quarter of the memory.
- At most 10 floating text pops or speech bubbles exist at once.
- Resting props sleep in the physics engine.
- No music nodes are created while the music is muted.

**Security**
- The game is 100% client-side. There is no backend, no accounts and no data sent anywhere, apart from the portal SDK on portal builds.
- The web and single-file builds ship a Content-Security-Policy: no external scripts, no network calls, no plugins.
- Saved data is validated field by field on load, so a tampered save can't inject unexpected values.
- The `?platform=` override only works in development builds.
- `scripts/serve.mjs` serves only files that exist in the build, so there is no path traversal. It sends `nosniff`, `no-referrer`, `Permissions-Policy` and `COOP` headers, with immutable caching for hashed assets.

**Self-hosting:** `npm run build && npm run serve`. Behind a CDN (Cloudflare, Netlify, itch.io and the portals all use one), concurrent players are effectively unlimited, because every file is static and cacheable.

## Voice

The game uses the first of these that's available:
1. **A recorded voice pack** in `public/voice/` (one `<id>.mp3` per line).
   - Generate it in a natural male Indian voice (Azure `hi-IN-MadhurNeural`): `AZURE_SPEECH_KEY=… AZURE_SPEECH_REGION=centralindia npm run voices`.
   - Or record the lines yourself: the script is in `VOICE_LINES.md`. Drop the files in, then run `npm run voices -- --manifest`.
2. **The device's speech engine**, but only if it has a male Indian (Hindi or en-IN) voice.
3. **Otherwise, no speech:** speech bubbles, the LIVE ticker and cartoon reaction sounds only.

All reaction sounds (slide whistle, bonk, boing, falling scream, sizzle, blast) are synthesised in code, so they're original and safe for every portal.

## 1002 levels

Levels 1–10 are hand-made (`src/levels/level01..10.json`). Levels 11–1002 are generated by `src/levels/endless.ts` with a fixed seed per level, so everyone gets the same layout for the same level number.
- Difficulty rises over the first ~300 levels: the stage moves further away, sits higher on a riser more often, and the levels get more obstacles and hazards.
- Every generated level is checked to have clean winning shots before it can be played. All 992 currently have at least 4.
- Endless Baraat (unlocked after level 3) uses the same generator with a random seed per run.

## Game modes and progression

| Mode | What it is |
| --- | --- |
| Campaign (1–1002) | 10 hand-made levels, then 992 generated levels. Difficulty keeps rising all the way to 1002. |
| Boss levels | Every 50th level: a raised, narrow stage, more obstacles, a gold banner and a higher damage target. |
| Daily Challenge | One generated level per date, identical for everyone. It tracks a 🔥 day streak and has an emoji result to share. Unlocks after level 3. |
| Endless Baraat | Random rounds that get harder. One failed round ends the run, and the best run is saved. Unlocks after level 3. |

**Wardrobe:** 10 kurta, sherwani and Nehru-jacket looks, 4 suits unlocked by stars (6, 12, 18 and 24), and 5 milestone outfits unlocked by clearing levels 50, 100, 250, 500 and 1002.

**Monetisation (Poki and CrazyGames):** a mid-game ad between levels, plus an opt-in rewarded ad. When the last launch misses, the game offers one more launch for watching an ad, once per attempt. Neither appears on itch.io or YouTube.

**Settings:** sound and music volume, voice, vibration (phones), *Reduce effects* (turns off the crowd, light strings and shadows on slow phones), and reset progress, which keeps your settings and outfit.
