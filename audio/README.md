# Sounds

Every sound in Last Colony is original. None is sampled or licensed from anyone: each one is synthesised from noise, filters and oscillators by the scripts in `source/`, so the game has no third-party audio and no licence terms to track.

| Path | Contents |
| --- | --- |
| `sounds.js` | all 180 sounds as MP3 (mono, 44.1 kHz), base64 inside one script that sets `window.LC_SOUNDS`. The game loads it after the player's first click or key press. It is a script rather than a folder of MP3s because the Windows app opens the game from disk (`file://`), where a page can't fetch files but can load a script. |
| `source/dsp.js` | the synthesis toolkit: noise colours, filters, envelopes, resonator banks for metal, bubbles for wet sounds, stick-slip creaks, grains, a small reverb, and seamless loop crossfades |
| `source/sounds.js` | one recipe per sound (93 recipes, several with 2 to 4 variations). Since v47 every combat shot and impact is built from noise (transients, noise bodies, fast-falling thuds, dense inharmonic metal clusters), never from pitched modes or bubbles. The seven `intro_` recipes (v48) are the opening cinematic's orbit hum, radio static, underground bed, distant drill resonance, tissue pulse, soil and Bloom opening; v49 adds `intro_wake` (the first strong pulse), `intro_rise` (nutrients moving up a root) and `intro_life` (the awake organism's bed). v58 adds `title_heart` (the title screen's heartbeat, two variations) and `title_vines` (7.4 s: soil splitting, a rising mass of creaks, rustles and squelches as the vines close over the screen, a deep thud when they meet and the tear of them parting at 5.6 s) |
| `source/tonal.js` | measures how pitched a sound is (strongest narrow spectral peak against its surroundings, in dB) |
| `source/tonalcheck.js` | fails if any combat sound peaks above 22 dB, so nothing rings as a note: `node tonalcheck.js out/wav` |
| `source/make.js` | renders every recipe to WAV, levels it and encodes MP3 with ffmpeg; writes `manifest.json` |
| `source/bundle.js` | packs the MP3s into `sounds.js` |

## Rebuilding

Needs Node and ffmpeg (with libmp3lame).

```
cd audio/source
node make.js out            # out/wav, out/mp3, out/manifest.json
node bundle.js out/mp3 ../sounds.js
```

The recipes are seeded, so the same scripts give the same sounds every time. `node make.js out burner` rebuilds only the recipes whose name matches.

## Levels and sizes

- One-shots are normalised to a 0.89 peak and their silent tails trimmed. Loops are levelled to -18 dBFS RMS, with their mean removed so the seam stays exact. Chromium decodes these MP3 loops gaplessly.
- Ambience is encoded at 48 kbit/s and everything else at 64 kbit/s: about 3 MB of MP3, 4 MB as the base64 script.
- The game's mixer sets the final balance: per-sound volumes, the three volume settings, a gentle compressor and dialogue ducking (in `index.html`, search for `SND`).
