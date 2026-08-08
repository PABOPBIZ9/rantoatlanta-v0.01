# RanToAtlanta v0.01

Genius-inspired bounce lyrics archive for **Hot Boys — Shots Set’s It Off**, with FOMO IQ points, annotations, upvotes, DMs, and a live leaderboard.

## Live

**https://pabopbiz9.github.io/rantoatlanta-v0.01/**

## Features

- Click any lyric line → annotate (+100 IQ)
- Reddit-style comment upvotes / replies / repost / DM
- Sticky IQ HUD + live leaderboard (scores climb while you browse)
- Points for click, scroll, watch, share, comment, join, repost, DM
- Logo click refreshes the page
- Brand kit page + HQ drop folders

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
