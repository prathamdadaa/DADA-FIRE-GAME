// Dada Fire - Game Server
// Authoritative server: tracks all players, broadcasts state, handles shooting/hits,
// and runs the shrinking safe-zone (battle royale) logic.
// Author: Pratham Dada

const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

// Serve the client folder as static files
app.use(express.static(path.join(__dirname, "..", "client")));

// ----- Game constants -----
const MAP_HALF_SIZE = 50; // world is from -50 to 50 on X and Z
const MAX_HEALTH = 100;
const BULLET_DAMAGE = 12;
const TICK_RATE = 1000 / 30; // 30 updates per second
const ZONE_SHRINK_INTERVAL_MS = 20000; // shrink every 20s
const ZONE_DAMAGE_PER_TICK = 2;

// ----- Game state -----
/** players: { [socketId]: { id, name, x, y, z, rotY, health, alive, kills } } */
const players = {};

let safeZone = {
  x: 0,
  z: 0,
  radius: MAP_HALF_SIZE, // starts covering the whole map
};

function randomSpawn() {
  return {
    x: (Math.random() - 0.5) * MAP_HALF_SIZE * 1.6,
    z: (Math.random() - 0.5) * MAP_HALF_SIZE * 1.6,
  };
}

function broadcastPlayerList() {
  io.emit("players_update", players);
}

function broadcastZone() {
  io.emit("zone_update", safeZone);
}

// ----- Socket connections -----
io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join_game", (data) => {
    const spawn = randomSpawn();
    players[socket.id] = {
      id: socket.id,
      name: (data && data.name) || "Player",
      x: spawn.x,
      y: 1,
      z: spawn.z,
      rotY: 0,
      health: MAX_HEALTH,
      alive: true,
      kills: 0,
    };

    socket.emit("init", {
      id: socket.id,
      players,
      zone: safeZone,
      mapHalfSize: MAP_HALF_SIZE,
    });

    socket.broadcast.emit("player_joined", players[socket.id]);
    broadcastPlayerList();
  });

  socket.on("move", (data) => {
    const p = players[socket.id];
    if (!p || !p.alive) return;
    // Basic sanity clamp so players can't teleport outside the map bounds
    p.x = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, data.x));
    p.z = Math.max(-MAP_HALF_SIZE, Math.min(MAP_HALF_SIZE, data.z));
    p.y = data.y;
    p.rotY = data.rotY;
  });

  socket.on("shoot", (data) => {
    const shooter = players[socket.id];
    if (!shooter || !shooter.alive) return;

    // data: { targetId } - client does its own raycast hit detection and
    // tells the server who it thinks it hit. Server validates basic state.
    const target = players[data.targetId];
    if (!target || !target.alive || data.targetId === socket.id) return;

    target.health -= BULLET_DAMAGE;
    io.emit("player_hit", { targetId: target.id, health: target.health });

    if (target.health <= 0) {
      target.alive = false;
      shooter.kills += 1;
      io.emit("player_died", {
        targetId: target.id,
        killerId: shooter.id,
        killerName: shooter.name,
      });
      checkWinCondition();
    }
  });

  socket.on("disconnect", () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit("player_left", socket.id);
    broadcastPlayerList();
    checkWinCondition();
  });
});

// ----- Win condition -----
function checkWinCondition() {
  const alivePlayers = Object.values(players).filter((p) => p.alive);
  if (alivePlayers.length === 1 && Object.keys(players).length > 1) {
    io.emit("game_won", { winnerId: alivePlayers[0].id, winnerName: alivePlayers[0].name });
  }
}

// ----- Safe zone shrinking loop -----
setInterval(() => {
  if (safeZone.radius > 8) {
    safeZone.radius -= 5;
    safeZone.x += (Math.random() - 0.5) * 6;
    safeZone.z += (Math.random() - 0.5) * 6;
    broadcastZone();
  }
}, ZONE_SHRINK_INTERVAL_MS);

// ----- Zone damage tick -----
setInterval(() => {
  for (const id in players) {
    const p = players[id];
    if (!p.alive) continue;
    const dx = p.x - safeZone.x;
    const dz = p.z - safeZone.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > safeZone.radius) {
      p.health -= ZONE_DAMAGE_PER_TICK;
      if (p.health <= 0 && p.alive) {
        p.alive = false;
        io.emit("player_died", { targetId: p.id, killerId: null, killerName: "the zone" });
        checkWinCondition();
      }
      io.emit("player_hit", { targetId: p.id, health: p.health });
    }
  }
}, 2000);

// Broadcast full player state at a steady tick rate (positions etc.)
setInterval(() => {
  broadcastPlayerList();
}, TICK_RATE);

server.listen(PORT, () => {
  console.log(`Dada Fire server running on http://localhost:${PORT}`);
});
