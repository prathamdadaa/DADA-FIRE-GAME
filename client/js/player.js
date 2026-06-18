// player.js - local player controls + remote player avatar management
// Author: Pratham Dada

const Player = {
  camera: null,
  velocity: { x: 0, y: 0, z: 0 },
  keys: {},
  yaw: 0,
  pitch: 0,
  speed: 14,
  jumpForce: 8,
  gravity: -20,
  onGround: true,
  position: { x: 0, y: 1.6, z: 0 },
  alive: true,

  remoteMeshes: {}, // socketId -> THREE.Group

  init(camera, spawn) {
    this.camera = camera;
    this.position.x = spawn.x;
    this.position.z = spawn.z;
    this.position.y = 1.6;

    document.addEventListener("keydown", (e) => (this.keys[e.code] = true));
    document.addEventListener("keyup", (e) => (this.keys[e.code] = false));

    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== document.getElementById("gameCanvas")) return;
      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;
      this.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.pitch));
    });

    document.getElementById("gameCanvas").addEventListener("click", () => {
      document.getElementById("gameCanvas").requestPointerLock();
    });
  },

  update(deltaTime, mapHalfSize) {
    if (!this.alive) return;

    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.sin(this.yaw + Math.PI / 2), 0, Math.cos(this.yaw + Math.PI / 2));

    let moveX = 0;
    let moveZ = 0;
    if (this.keys["KeyW"]) { moveX -= forward.x; moveZ -= forward.z; }
    if (this.keys["KeyS"]) { moveX += forward.x; moveZ += forward.z; }
    if (this.keys["KeyA"]) { moveX -= right.x; moveZ -= right.z; }
    if (this.keys["KeyD"]) { moveX += right.x; moveZ += right.z; }

    const len = Math.hypot(moveX, moveZ);
    if (len > 0) {
      moveX = (moveX / len) * this.speed * deltaTime;
      moveZ = (moveZ / len) * this.speed * deltaTime;
    }

    this.position.x += moveX;
    this.position.z += moveZ;

    // Clamp to map bounds
    this.position.x = Math.max(-mapHalfSize, Math.min(mapHalfSize, this.position.x));
    this.position.z = Math.max(-mapHalfSize, Math.min(mapHalfSize, this.position.z));

    // Jump / gravity
    if (this.keys["Space"] && this.onGround) {
      this.velocity.y = this.jumpForce;
      this.onGround = false;
    }
    this.velocity.y += this.gravity * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    if (this.position.y <= 1.6) {
      this.position.y = 1.6;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this.camera.position.set(this.position.x, this.position.y, this.position.z);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  },

  // ----- Remote players -----
  createRemoteMesh(scene, player) {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff5733 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.2, 4, 8), bodyMat);
    body.position.y = 1;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffd9b3 })
    );
    head.position.y = 1.9;
    group.add(head);

    group.position.set(player.x, 0, player.z);
    group.userData.id = player.id;
    scene.add(group);
    this.remoteMeshes[player.id] = group;
  },

  updateRemoteMesh(player) {
    const mesh = this.remoteMeshes[player.id];
    if (!mesh) return;
    mesh.position.set(player.x, 0, player.z);
    mesh.rotation.y = player.rotY;
    mesh.visible = player.alive;
  },

  removeRemoteMesh(scene, id) {
    const mesh = this.remoteMeshes[id];
    if (mesh) {
      scene.remove(mesh);
      delete this.remoteMeshes[id];
    }
  },
};
