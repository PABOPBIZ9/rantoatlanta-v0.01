# RanToAtlanta v0.01

Genius-inspired bounce lyrics archive for **Hot Boys — Shots Set’s It Off**, with FOMO IQ points, annotations, upvotes, DMs, and a live leaderboard.

## Live

**https://pabopbiz9.github.io/rantoatlanta-v0.01/**

## Features

- **On-site Studio** — audio/video/clips from `media/embeds/` (no leave-to-YouTube)
- Genius-style lyric annotations + contributor **profile.html**
- Wallet: tip · farm · subscribe · refer · go live · bounce markets
- Reddit-style comments / upvotes / DMs / repost
- Sticky IQ + cash HUD, streaks, levels, live leaderboard
- Marketing banner rail from `brand/promo/banners/`
- Logo click refreshes the page

## Drop media (important)

```
media/embeds/audio/shots-sets-it-off.mp3
media/embeds/video/shots-sets-it-off.mp4
media/embeds/clips/shots-hook-15s.mp4
brand/promo/banners/web/*.png|svg
```

Update `media/manifest.json` if you add new track IDs.

## Drop folders

| Path | Use |
|------|-----|
| `brand/` | Logos, colors, promo, guidelines |
| `media/images/hq/` | High-quality stills |
| `media/audio/` | Tracks, stems, samples |
| `media/video/` | Clips, full, promo |
| `drops/` | Community staging |
| `community/` | Avatars, memes |

See `brand/DROP.md` and `media/DROP.md`.

## Mobile

Mobile-first layout with sticky IQ HUD, hamburger menu, and bottom dock (Lyrics / Board / Play / DMs / Join). Safe-area aware for notched phones.

## Local preview

```bash
python3 -m http.server 8080
```

## Deploy

GitHub Pages via Actions on `main`.
