// network.js - handles all communication with the Dada Fire server
// Author: Pratham Dada

const Network = {
  socket: null,
  myId: null,
  mapHalfSize: 50,

  init(name, callbacks) {
    this.socket = io();
    this.callbacks = callbacks;

    this.socket.on("connect", () => {
      this.socket.emit("join_game", { name });
    });

    this.socket.on("init", (data) => {
      this.myId = data.id;
      this.mapHalfSize = data.mapHalfSize;
      callbacks.onInit(data);
    });

    this.socket.on("players_update", (players) => {
      callbacks.onPlayersUpdate(players);
    });

    this.socket.on("player_joined", (player) => {
      callbacks.onPlayerJoined(player);
    });

    this.socket.on("player_left", (id) => {
      callbacks.onPlayerLeft(id);
    });

    this.socket.on("player_hit", (data) => {
      callbacks.onPlayerHit(data);
    });

    this.socket.on("player_died", (data) => {
      callbacks.onPlayerDied(data);
    });

    this.socket.on("game_won", (data) => {
      callbacks.onGameWon(data);
    });

    this.socket.on("zone_update", (zone) => {
      callbacks.onZoneUpdate(zone);
    });
  },

  sendMove(x, y, z, rotY) {
    if (!this.socket) return;
    this.socket.emit("move", { x, y, z, rotY });
  },

  sendShoot(targetId) {
    if (!this.socket) return;
    this.socket.emit("shoot", { targetId });
  },
};
