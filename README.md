# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/suxorukov122335-a11y/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/suxorukov122335-a11y/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/suxorukov122335-a11y/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/suxorukov122335-a11y/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/suxorukov122335-a11y/PlayGround).
- 🛠️ [Check build runs](https://github.com/suxorukov122335-a11y/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/suxorukov122335-a11y/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/suxorukov122335-a11y).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## CLAYFRONT

A handmade clay-art tower defense game for desktop and mobile. The last city is under siege, and its Clay Heart has 20 beats left. Build on the cracked pads, hold both avenues, and survive ten invasion waves.

### Play

No build step or dependencies. Serve the folder over HTTP and open the page:

```bash
python3 -m http.server 3002
# then open http://localhost:3002/
```

`start.sh` can also launch the project through the OMGithub runtime.

### Controls

- **Mouse / touch:** pick a tower card, then tap a construction pad. Tap a built tower to inspect, upgrade, or sell it.
- **Keyboard:** `1`–`4` select towers, `Q` targets Clayquake, `E` casts Kiln Rally, `Space` calls the next wave early, `Esc` pauses or cancels targeting, `P` pauses.
- **Powers:** Clayquake stuns and damages a street area; Kiln Rally supercharges every tower for a few seconds.
- **Goal:** survive all 10 waves. Calling waves early grants bonus clay. A boss closes the siege on wave 10.

Progress, sound preference, and the best run are stored locally. The responsive board switches between landscape and portrait layouts, with the same 12 pad positions in both orientations.

### Project layout

- `index.html` — HUD, dock, overlays, and dialogs.
- `styles.css` — responsive clay UI and safe-area/landscape layouts.
- `js/game.js` — game loop, waves, combat, input, powers, and persistence.
- `js/util.js` — tower/enemy definitions, waves, and map geometry.
- `js/art-*.js` — procedural canvas art for the city, towers, invaders, and effects.
- `assets/fonts/` — locally hosted display/UI fonts with licenses.

`window.__clayfront` exposes a small development/QA API in the browser console. It is safe to ignore during normal play.

