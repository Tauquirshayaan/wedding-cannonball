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
5. Screenshots and a 630×500 cover are ready in `marketing/`. To regenerate them, run `npm run serve` and then `node scripts/screenshots.cjs http://localhost:8080`.

## 3. CrazyGames

**Upload:** `release/human-cannonball-crazygames.zip` (about 1.8 MB, 12 files, `index.html` at the root).

**Steps**
1. Go to the CrazyGames developer portal → Submit a game → HTML5. Choose **Basic Launch** first. That gives you a limited-traffic test, and they decide on a Full Launch from your numbers.
2. Upload the zip. Set orientation to **Landscape**, and tick **mobile and desktop**.
3. Images (from `marketing/`): landscape `cover-landscape-1920x1080.png`, portrait `cover-portrait-800x1200.png`, square `cover-square-800x800.png`. The title, description, controls and tags are in `marketing/STORE_LISTING.md`.
4. Test in their **QA / preview tool** before submitting:
   - The loading bar finishes, and the game reaches the title.
   - **Midgame ad:** play a level and press Next or Retry on the result screen. The game should go silent during the ad and continue after.
   - **Rewarded ad:** miss with all 3 launches, then tap "+1 Launch". After the ad you should get one more launch.
   - **Saves:** progress should survive a page reload (cloud save through `SDK.data`).

**Already built into this version**
- **SDK v3 events:** `init`, `loadingStart/loadingStop`, `gameplayStart/gameplayStop` (stops on pause, results and menus), and `happytime` on ★★★.
- **Ads:** midgame ads only between levels, on player-initiated Next or Retry, never mid-launch. The rewarded ad is opt-in only. Sound is muted and the game paused during every ad.
- **Saves:** go through `SDK.data`, with localStorage as a backup.
- **Portal rules:**
  - no outbound links (Share copies text without a link)
  - no full-screen button of our own (CrazyGames has one)
  - no other branding, and no network calls except the SDK
  - Space and the arrow keys don't scroll the page

**Check against their current requirements page before submitting.** I couldn't open their docs from my sandbox, so these points come from their earlier rules:
- [ ] Initial download size limit. Ours is about 0.6 MB compressed and about 1.8 MB unzipped, so it should pass.
- [ ] File count limit. Ours is 12 files, so it should pass.
- [ ] Any rule on how often midgame ads may show. CrazyGames throttles ads on its side, and we only ask between levels.
- [ ] Current cover image sizes. If they've changed, re-render with `?cover=1` at the new size.

## 4. Poki (after 30 days of data)

1. Apply through the Poki for Developers portal and share the itch.io link with your numbers.
2. Once accepted, upload `release/human-cannonball-poki.zip` to Poki's inspector.
3. Already wired in: `PokiSDK.init`, `gameLoadingFinished`, `gameplayStart/Stop`, and `commercialBreak` on Result → Retry/Next, with audio muted during ads.
4. Space and the arrow keys are blocked from scrolling the page, and there are no outbound links.

## 5. YouTube Playables

**Upload:** `release/human-cannonball-youtube.zip`: one self-contained `index.html` (about 1.8 MB). All art, sound and code are inside it.

**Steps**
1. Apply for the YouTube Playables program. Access is by application or invitation, through the YouTube Playables developer page.
2. Once you have access, upload the zip in their submission portal and run their **test suite**. It checks the SDK calls, load time and pause/resume.
3. Images: `marketing/cover-landscape-1920x1080.png` (16:9) and `cover-square-800x800.png`. Use the text in `marketing/STORE_LISTING.md`.

**Already built into this version**
- **SDK:** loaded by a plain `<script src="https://www.youtube.com/game_api/v1">` before the game code. Calls:
  - `firstFrameReady()` on the first frame
  - `gameReady()` when the title screen is interactive
  - `saveData/loadData` for all progress (the save is a few KB)
  - `engagement.sendScore()` with the total best score
  - `system.onPause/onResume`: the game pauses and sound stops
  - `isAudioEnabled/onAudioEnabledChange`: respects YouTube's mute
- **No ads** of any kind (no midgame and no rewarded), and no outbound links or Share button.
- **Portrait works.** The game plays in portrait, with the HUD at the top and the whole level visible. It shows a gentle "turn your phone sideways" tip on the title screen, never a blocking message.
- **No network calls** except the SDK script. It works offline after loading.

**Check against their current certification requirements.** I couldn't open their docs from my sandbox:
- [ ] Bundle and initial-load size limits. Ours is about 1.8 MB, far below any limit they've had.
- [ ] Whether `speechSynthesis` (spoken commentary) and `navigator.vibrate` are allowed. Both can be turned off in Settings, and the game works without them.
- [ ] Whether portrait support meets their rules as built, or whether they want the game locked to one orientation.
- [ ] Language: the UI is English and Hinglish. If they require localisation, the next step is reading `ytgame.system.getLanguage()` and adding a Hindi menu.

## Automated audit

`npm run build:all && npm run test:e2e` runs 109 checks in headless Chromium:
- menus, aiming, flail, cancel, pause and resume, restart, and pause on tab switch
- a winning shot on all 10 levels, plus saving and reload
- recovery from a tampered save
- settings
- the Poki, CrazyGames and YouTube SDK calls, using mock SDKs
- generated campaign levels 11, 250, 500 and 1002 won with real physics, identical layouts on every load, and level-select paging
- the Boss level 50 (and its outfit unlock), plus the Daily Challenge (same level all day, streak saved)
- the rewarded "+1 launch" on Poki and CrazyGames
- Endless Baraat: 6 generated rounds won with real physics, run over, new run, best run saved
- the Wardrobe: suits unlock with stars, and Lucky wears the chosen outfit in game
- the single-file build
- zero console errors and zero CSP violations

## Bug checklist before every upload

- [ ] Each level is clearable in 3 launches (`scripts` solver run, or play it)
- [ ] Restart, pause and tab switching never break physics
- [ ] Audio works on iPhone after the first tap
- [ ] Progress survives a reload
- [ ] No console errors
