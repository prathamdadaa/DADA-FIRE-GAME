# 🔥 Dada Fire

A simple browser-based 3D multiplayer battle royale shooter, inspired by games like Free Fire.
Built with **Three.js** (3D graphics) and **Node.js + Socket.IO** (real-time multiplayer server).

Created by **Pratham Dada**.

> Note: This is a learning/prototype project, not a commercial-grade game. It includes the
> core battle royale loop (movement, shooting, shrinking safe zone, last-player-standing win
> condition) so you can play it with friends and keep building on it.

## Features

- Real multiplayer — players see and shoot each other live via Socket.IO
- First-person 3D movement (WASD + mouse look + jump) using Three.js
- Click-to-shoot with raycasting hit detection
- Health bar, kill feed, alive player counter
- Shrinking "safe zone" that damages players outside it (battle royale style)
- Last player standing wins

## Project Structure

```
dada-fire/
├── package.json          # Server dependencies and start script
├── .gitignore
├── README.md
├── server/
│   └── index.js          # Authoritative game server (Express + Socket.IO)
└── client/
    ├── index.html         # Game page (lobby, HUD, canvas)
    ├── css/
    │   └── style.css      # HUD and lobby styling
    └── js/
        ├── network.js      # Socket.IO client wrapper
        ├── world.js        # Three.js scene, map, obstacles, safe zone visuals
        ├── player.js        # Local player controls + remote player avatars
        └── main.js          # Render loop, shooting logic, HUD updates
```

## How to Run Locally

1. Make sure [Node.js](https://nodejs.org) is installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser at:
   ```
   http://localhost:3000
   ```
5. To test multiplayer, open the same URL in multiple browser tabs/windows (or on other
   devices on the same network using your computer's local IP instead of `localhost`).

## How to Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Dada Fire game"
git branch -M main
git remote add origin https://github.com/<your-username>/dada-fire.git
git push -u origin main
```

## Deploying Online (so friends can join from anywhere)

This is a Node.js + Socket.IO app, so it needs a host that runs a persistent server
(not a static-site host). Free/easy options to look into: Render, Railway, Glitch, or a
small VPS. After deploying, just share the live URL instead of `localhost:3000`.

## Controls

| Action       | Key/Button     |
|--------------|----------------|
| Move         | W A S D        |
| Look around  | Mouse          |
| Jump         | Space          |
| Shoot        | Left Click     |

## Ideas to Extend This Project

- Add real weapon models, reload mechanics, and ammo limits
- Add sound effects (gunshots, footsteps, zone warning)
- Add a minimap
- Add loot crates / pickups (health packs, weapon upgrades)
- Replace capsule/sphere player models with real 3D character models (glTF)
- Add mobile touch controls (virtual joystick + fire button)
- Add voice/text chat
- Persist player stats (kills, wins) with a database

## License

MIT — free to use, modify, and learn from.
