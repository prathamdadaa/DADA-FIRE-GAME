// main.js - ties together World, Player, and Network. Runs the render loop.
// Author: Pratham Dada

let renderer, camera, raycaster;
let clock = new THREE.Clock();
let myHealth = 100;
let gameStarted = false;

function setupRenderer() {
  const canvas = document.getElementById("gameCanvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  raycaster = new THREE.Raycaster();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function startGame(name) {
  setupRenderer();
  const scene = World.init();

  Network.init(name, {
    onInit(data) {
      Player.init(camera, { x: data.players[data.id].x, z: data.players[data.id].z });
      // Spawn meshes for all existing players except ourselves
      for (const id in data.players) {
        if (id !== data.id) Player.createRemoteMesh(scene, data.players[id]);
      }
      World.updateZone(data.zone);
      document.getElementById("lobby").classList.add("hidden");
      document.getElementById("hud").classList.remove("hidden");
      gameStarted = true;
      animate();
    },

    onPlayersUpdate(players) {
      updateAliveCount(players);
      for (const id in players) {
        if (id === Network.myId) continue;
        if (!Player.remoteMeshes[id]) {
          Player.createRemoteMesh(World.scene, players[id]);
        } else {
          Player.updateRemoteMesh(players[id]);
        }
      }
    },

    onPlayerJoined(player) {
      if (player.id !== Network.myId && !Player.remoteMeshes[player.id]) {
        Player.createRemoteMesh(World.scene, player);
      }
    },

    onPlayerLeft(id) {
      Player.removeRemoteMesh(World.scene, id);
    },

    onPlayerHit(data) {
      if (data.targetId === Network.myId) {
        myHealth = data.health;
        updateHealthBar();
        if (myHealth <= 0) handleDeath("the zone");
      }
    },

    onPlayerDied(data) {
      addKillFeed(`${data.killerName || "Zone"} eliminated ${getPlayerName(data.targetId)}`);
      if (data.targetId === Network.myId) {
        handleDeath(data.killerName);
      } else {
        const mesh = Player.remoteMeshes[data.targetId];
        if (mesh) mesh.visible = false;
      }
    },

    onGameWon(data) {
      showOverlay(
        data.winnerId === Network.myId
          ? "🏆 YOU WON DADA FIRE! 🏆"
          : `${data.winnerName} won the match`
      );
    },

    onZoneUpdate(zone) {
      World.updateZone(zone);
    },
  });
}

let lastPlayersSnapshot = {};
function updateAliveCount(players) {
  lastPlayersSnapshot = players;
  const alive = Object.values(players).filter((p) => p.alive).length;
  document.getElementById("aliveCount").textContent = `Players alive: ${alive}`;
}

function getPlayerName(id) {
  return (lastPlayersSnapshot[id] && lastPlayersSnapshot[id].name) || "Player";
}

function updateHealthBar() {
  const pct = Math.max(0, myHealth);
  document.getElementById("healthBar").style.width = pct + "%";
  document.getElementById("healthText").textContent = pct;
  document.getElementById("healthBar").style.background =
    pct > 50 ? "linear-gradient(90deg,#2ecc71,#27ae60)" :
    pct > 20 ? "linear-gradient(90deg,#f1c40f,#f39c12)" :
    "linear-gradient(90deg,#e74c3c,#c0392b)";
}

function addKillFeed(text) {
  const feed = document.getElementById("killFeed");
  const entry = document.createElement("div");
  entry.textContent = text;
  feed.appendChild(entry);
  setTimeout(() => entry.remove(), 5000);
}

function handleDeath(killerName) {
  Player.alive = false;
  document.exitPointerLock();
  showOverlay(`💀 You were eliminated by ${killerName}`);
}

function showOverlay(title) {
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlay").classList.remove("hidden");
}

// ----- Shooting -----
document.addEventListener("mousedown", (e) => {
  if (!gameStarted || !Player.alive) return;
  if (document.pointerLockElement !== document.getElementById("gameCanvas")) return;
  if (e.button !== 0) return; // left click only

  raycaster.setFromCamera({ x: 0, y: 0 }, camera); // crosshair is centered
  const meshes = Object.values(Player.remoteMeshes);
  const intersects = raycaster.intersectObjects(meshes, true);

  if (intersects.length > 0) {
    let hitObj = intersects[0].object;
    while (hitObj.parent && !hitObj.userData.id) hitObj = hitObj.parent;
    if (hitObj.userData.id) {
      Network.sendShoot(hitObj.userData.id);
    }
  }
});

// ----- Render loop -----
function animate() {
  if (!gameStarted) return;
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.1);

  Player.update(delta, Network.mapHalfSize);

  // Zone warning check
  const dx = Player.position.x - World.zoneData.x;
  const dz = Player.position.z - World.zoneData.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  document.getElementById("zoneWarning").classList.toggle("hidden", dist <= World.zoneData.radius);

  Network.sendMove(Player.position.x, Player.position.y, Player.position.z, Player.yaw);

  renderer.render(World.scene, camera);
}

// ----- Lobby UI -----
document.getElementById("joinBtn").addEventListener("click", () => {
  const name = document.getElementById("nameInput").value.trim() || "Player";
  startGame(name);
});

document.getElementById("respawnBtn").addEventListener("click", () => {
  window.location.reload();
});
