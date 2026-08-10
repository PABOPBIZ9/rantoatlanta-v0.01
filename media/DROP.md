# Media Drop Zone (HQ + on-site embeds)

**Keep users on the site.** Drop playable files into `embeds/` and register them in `manifest.json`.

## Quick start

1. Drop `shots-sets-it-off.mp3` → `media/embeds/audio/`
2. Drop `shots-sets-it-off.mp4` → `media/embeds/video/`
3. Optional short loop → `media/embeds/clips/shots-hook-15s.mp4`
4. Refresh — Studio plays local files first (YouTube only as in-page fallback)

## Folders

| Path | Put |
|------|-----|
| `embeds/audio/` | `.mp3` `.m4a` `.wav` `.ogg` |
| `embeds/video/` | `.mp4` `.webm` full videos |
| `embeds/clips/` | short vertical/square loops |
| `images/hq/` | print-quality stills |
| `images/hero/` | full-bleed heroes |
| `images/album/` | covers |
| `images/og/` | share cards |
| `images/banners/` | extra web banners (or use `brand/promo/banners/`) |
| `audio/tracks/` | archival masters |
| `video/promo/` | promo cuts |
| `gifs/` | reaction loops |
| `manifest.json` | catalog the site player reads |

Also see `brand/promo/banners/` for marketing SVGs/PNGs and `live/replays/` for go-live recordings.
