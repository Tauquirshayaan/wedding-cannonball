# Launch checklist

## 1. Build

```bash
npm install
npm run build:all       # writes release/human-cannonball-<portal>.zip
```

## 2. itch.io (Day 7, first launch)

1. Create a new project. Set **Kind of project** to *HTML*.
2. Upload `release/human-cannonball-web.zip` and tick **This file will be played in the browser**.
3. Set the viewport to **1280 × 720**, turn on **Mobile friendly** with landscape orientation, and turn on **Fullscreen button**.
4. Tags: `physics`, `comedy`, `ragdoll`, `india`, `wedding`, `casual`.
5. For screenshots and a cover, run `node scripts/screenshots.cjs http://localhost:4173` against `npm run preview`. The images are saved to `marketing/`.

## 3. CrazyGames (week 2)

1. Upload `release/human-cannonball-crazygames.zip` in the CrazyGames developer portal ("Basic launch").
2. Already wired in: SDK v3 init, `loadingStart/Stop`, `gameplayStart/Stop` (in levels and on pause), `happytime` (3-star clears), midgame ads on Result → Retry/Next, `SDK.data` saves.
3. Before submitting, test with their QA tool. Check their current requirements first, because they change: build size, no external links, and the ad rules.

## 4. Poki (after 30 days of data)

1. Apply through the Poki for Developers portal and share the itch.io link with your numbers.
2. Once accepted, upload `release/human-cannonball-poki.zip` to Poki's inspector.
3. Already wired in: `PokiSDK.init`, `gameLoadingFinished`, `gameplayStart/Stop`, and `commercialBreak` on Result → Retry/Next, with audio muted during ads.
4. Space and the arrow keys are blocked from scrolling the page, and there are no outbound links.

## 5. YouTube Playables

1. Apply to the YouTube Playables program, which is invite or application based.
2. Upload `release/human-cannonball-youtube.zip`. It is a single `index.html` that loads the `ytgame` SDK by script tag.
3. Already wired in: `firstFrameReady`, `gameReady`, `saveData/loadData` for progress, `onPause/onResume`, `onAudioEnabledChange`, and `sendScore` (the sum of best level scores).
4. Note: Playables can run in portrait on phones. The game shows a "rotate your phone" prompt in portrait, so check that this meets their current certification rules.

## Bug checklist before every upload

- [ ] Each level is clearable in 3 launches (`scripts` solver run, or play it)
- [ ] Restart, pause and tab switching never break physics
- [ ] Audio works on iPhone after the first tap
- [ ] Progress survives a reload
- [ ] No console errors
