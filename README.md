# Roxena

A 2D platformer arcade game built with vanilla JavaScript and HTML5 Canvas. Fight through food-themed enemies across multiple themed levels!

## Play

Open `index.html` in any modern browser — no build tools or dependencies required. Works on desktop and mobile.

## Features

- **4 Themed Levels** — The Kitchen, Fast Food Alley, Candy Factory, and Costi's Gym (final boss)
- **Multiple Enemy Types** — Candy, Chips, Soda, Cake, and a final boss
- **Combat System** — Punch, kick, and jump-kick attacks with cooldowns
- **Player Mechanics** — Health system, 3 lives, invincibility frames, coyote-time jumping
- **Level Elements** — Platforms, spikes, coins, power-ups, and checkpoints
- **Mobile Support** — Touch controls with on-screen D-pad and action buttons
- **Online High Scores** — Shared global leaderboard

## Controls

### Desktop
| Key | Action |
|-----|--------|
| Arrow Keys | Move / Jump |
| Z | Punch |
| X | Kick |
| P | Pause |

### Mobile
On-screen D-pad for movement, with Jump, Punch, and Kick buttons. Landscape orientation required.

## Project Structure

```
src/
├── core/       # Game engine (Game, GameLoop, Input, Camera)
├── world/      # Level system (TileMap, Background, Level)
├── entities/   # Game objects (Player, Enemies, Particles)
├── physics/    # Physics and collision detection
├── data/       # Level data, enemy definitions, item data
├── items/      # Power-ups and collectibles
assets/         # Sprites, audio, backgrounds
css/            # Styling
index.html      # Entry point
```

## Tech Stack

- HTML5 Canvas
- Vanilla JavaScript (ES6+ classes)
- CSS3
