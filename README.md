# Date Anything – Comfort Edition

A Date-Everything-style prototype in plain HTML, CSS and JavaScript, built
around an accessibility settings window for players with motion sickness /
cybersickness.

## Run it
Double-click `index.html`. No server, no libraries, no build step.

## Controls
| Action | Keys | On screen |
|---|---|---|
| Move | W A S D / ↑ ↓ | |
| Turn | ← → (or Q) | |
| Talk / inspect | E or Space | 🔍 button |
| Date Specs (see who's dateable) | G | 👓 button |
| Relationships | R | ♥ button |
| End the day | | 🚪 button |
| Extended Settings | Esc | red gear ("one easy button") |

## Files
- `index.html`: game HUD + the Extended Settings window (4 tabs)
- `css/style.css`: all styling
- `js/data.js`: JSON-shaped data: default settings, ghost avatars, dateables + dialogue
- `js/settings.js`: settings load/save (localStorage), export/import `.json`, tab logic
- `js/game.js`: CSS-3D room, movement, camera, ghost avatar, dialogue, lighting effects

## Extended Settings
1. **Camera**: speed (slow→fast), POV (left shoulder / top of head / right shoulder),
   camera height + distance, zoom, steady cam, motion blur
2. **Lighting**: brightness (dim→bright), strobe lighting removed
3. **Ghost Avatar**: on/off (off = first person), opacity 20–100%, character select
4. **Save**: save my settings (auto-loads next time), export/import JSON, reset

Comfort-first defaults: steady cam on, motion blur off, strobe removed,
ghost avatar on at 50%.

## Adding things
- New dateable: add an entry to `DATEABLES` in `js/data.js` (kinds: fridge, box,
  couch, lamp, clock, door; or add a new kind in `buildRoom()` in `game.js`).
- New ghost: add to `AVATARS` (`hat`: none / bow / ears / wizard), or replace
  `ghostSVG()` in `settings.js` with your own art (`<img src="...png">` works too).
- Want real `.json` files? Move the objects into `data/*.json` and load them with
  `fetch()`. That needs a local server (e.g. VS Code Live Server), because browsers
  block `fetch()` on `file://`.
