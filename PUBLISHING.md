# Publishing pack

Everything needed to publish the game, in one place.

## Step 1: Fill in your details (2 minutes)
Choose your developer name, support email and city, then run:

```bash
npm run legal -- --name "Cenova Games" --email "support@yourdomain.com" --city "Mumbai"
```

```bash
npm run build:all
```

This:
- fills in your details in the privacy policy, terms and credits
- builds them as web pages (`privacy.html`, `terms.html`, `credits.html`) inside every build
- puts your name on the in-game About screen

Use a **dedicated support email**, not your personal one. It will be public.

## Step 2: Confirm two things only you can confirm
- [ ] The licence for the **"ow"** and **"awww"** sound clips (see `legal/THIRD_PARTY_NOTICES.md`)
- [ ] The **game name**. "Human Cannonball" clashes with a 1979 Atari game, so see the recommendation in `marketing/STORE_LISTING.md`.

## Step 3: Upload

| Platform | Upload | Guide |
| --- | --- | --- |
| itch.io | `release/human-cannonball-web.zip` | `LAUNCH.md` § 2 |
| CrazyGames | `release/human-cannonball-crazygames.zip` | `LAUNCH.md` § 3 |
| YouTube Playables | `release/human-cannonball-youtube.zip` | `LAUNCH.md` § 5 |
| Poki (later) | `release/human-cannonball-poki.zip` | `LAUNCH.md` § 4 |

## Documents

| File | What it is |
| --- | --- |
| `marketing/STORE_LISTING.md` | Name, taglines, descriptions in every length, tags, categories, technical details, release notes |
| `marketing/*.png` | Covers (16:9, 2:3, 1:1, itch.io) and 7 screenshots |
| `legal/PRIVACY_POLICY.md` | Privacy policy, written for India's DPDP Act, GDPR and COPPA |
| `legal/TERMS_OF_USE.md` | Terms of use (licence to play, video sharing allowed, no warranty) |
| `legal/THIRD_PARTY_NOTICES.md` | Licences for Phaser and Matter.js (MIT) and the sound credits |
| `legal/CONTENT_RATING.md` | Answers for age-rating questionnaires (expected: Everyone / PEGI 3–7) |
| `LAUNCH.md` | Step-by-step portal checklists |
| `CREDITS.md` | Asset source list |

*These documents are a solid, standard starting point for a free, no-data browser game, but they are not legal advice. If you start earning significant revenue, or add accounts or purchases, have a lawyer review them.*
