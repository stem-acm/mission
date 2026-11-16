# Mission: STEM Club

A small retro 2D game. The player explores the STEM Club campus and discovers what the club is, its vision, its goal and its activities.

**Play it:** https://stem-acm.github.io/mission/

## How to play

1. Talk to the people marked with **!** in the 6 zones to collect mission data.
2. In the 3 labs, try the optional puzzle (you can leave it at any time with **EXIT**).
3. When all 6 zones are visited, the **Mission Room** in the center of the campus opens.

A trail of small dots on the ground shows the way to the next zone.

| Device | Move | Talk / next | Close dialog |
|---|---|---|---|
| Keyboard | Arrow keys or WASD | Space, Enter or E | Esc or ✕ |
| Phone / tablet | On-screen pad | **A** button | ✕ |

## Zones

| Zone | Character | Content |
|---|---|---|
| STEM Hall | Rebecca | What S, T, E, M stand for |
| Vision Tower | Hanafy | The club vision |
| Goal Garden | Fabien | The club goal: driven problem solvers |
| 3D Modelling Lab | Tiana | Puzzle: match the TOP, FRONT and SIDE views |
| Electronics Lab | Martial | Puzzle: light the LED (closed loop, polarity, resistor) |
| Programming Lab | Hardi | Puzzle: guide the bot with `forward()`, `turnLeft()`, `turnRight()` and `repeat(n)` |

## Edit the content

All the text (dialogs, character names, puzzle instructions, ending, Facebook link) is in [`js/data.js`](js/data.js). You can change it without touching the game code.

After you change a file, increase the `?v=` number on the file links in [`index.html`](index.html) so that browsers load the new version.

## Run it locally

The game is plain HTML, CSS and JavaScript with no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project structure

| File | Role |
|---|---|
| `index.html` | Page layout: canvas, HUD, dialog, puzzle and ending overlays |
| `style.css` | Retro styles, touch controls, puzzle and ending styles |
| `js/data.js` | All game text, palette and character colours |
| `js/engine.js` | Pixel sprites, sound effects, keyboard and touch input |
| `js/world.js` | Campus layout, collisions and drawing |
| `js/puzzles.js` | The 3 lab puzzles |
| `js/main.js` | Game loop, dialogs, path hint, tracker and ending |

## Deployment

GitHub Pages serves the `master` branch. Every change merged into `master` goes live in a minute or two.

`master` is protected: changes go through a pull request with 1 approval.
