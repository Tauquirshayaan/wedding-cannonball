# Human Cannonball: Wedding Edition

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
