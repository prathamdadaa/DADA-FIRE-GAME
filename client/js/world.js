// world.js - builds the 3D map: ground, sky, obstacles, and the shrinking safe zone
// Author: Pratham Dada

const World = {
  scene: null,
  zoneMesh: null,
  zoneData: { x: 0, z: 0, radius: 50 },

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 60, 160);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 80, 30);
    sun.castShadow = true;
    this.scene.add(sun);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Scattered cover/obstacles (crates, walls) so it's not an empty field
    this.addObstacles();

    // Safe zone ring (visual indicator on the ground)
    const ringGeo = new THREE.RingGeometry(49.5, 50, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    this.zoneMesh = new THREE.Mesh(ringGeo, ringMat);
    this.zoneMesh.rotation.x = -Math.PI / 2;
    this.zoneMesh.position.y = 0.05;
    this.scene.add(this.zoneMesh);

    return this.scene;
  },

  addObstacles() {
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    for (let i = 0; i < 25; i++) {
      const size = 2 + Math.random() * 2;
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        crateMat
      );
      crate.position.set(
        (Math.random() - 0.5) * 90,
        size / 2,
        (Math.random() - 0.5) * 90
      );
      crate.castShadow = true;
      crate.userData.isObstacle = true;
      this.scene.add(crate);
    }
  },

  updateZone(zone) {
    this.zoneData = zone;
    // Re-draw the ring at new radius/position
    this.scene.remove(this.zoneMesh);
    const ringGeo = new THREE.RingGeometry(
      Math.max(zone.radius - 0.5, 0),
      zone.radius,
      64
    );
    this.zoneMesh.geometry.dispose();
    this.zoneMesh.geometry = ringGeo;
    this.zoneMesh.position.set(zone.x, 0.05, zone.z);
  },
};
