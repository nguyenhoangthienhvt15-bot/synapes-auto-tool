import * as THREE from 'three';

export interface DragonflyStageOptions {
  clockSec: number;
  progress: number;
  sceneIdx: number;
  isSpeaking?: boolean;
}

interface ArticulatedDragonflyRig {
  root: THREE.Group;
  headGroup: THREE.Group;
  tailSegments: THREE.Mesh[];
  wings: {
    foreLeft: THREE.Group;
    foreRight: THREE.Group;
    hindLeft: THREE.Group;
    hindRight: THREE.Group;
  };
  legs: THREE.Group[];
  colorHex: number;
}

interface RainDropItem {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  offsetY: number;
  speed: number;
}

interface PondRippleItem {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  phase: number;
}

interface NoteItem {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
}

interface DragonflyWorldRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  hemiLight: THREE.HemisphereLight;
  sunLight: THREE.DirectionalLight;
  rimLight: THREE.PointLight;
  skyColor: THREE.Color;
  fog: THREE.FogExp2;
  sunMesh: THREE.Mesh;
  rainbowGroup: THREE.Group;
  cloudsGroup: THREE.Group;
  rainGroup: THREE.Group;
  rainDrops: RainDropItem[];
  pondRipples: PondRippleItem[];
  reeds: Array<{ mesh: THREE.Group; phase: number }>;
  lotusFlowers: Array<{ group: THREE.Group; baseY: number; phase: number }>;
  dragonflies: ArticulatedDragonflyRig[];
  sparkles: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }>;
  notes: NoteItem[];
}

let cachedDragonflyRig: DragonflyWorldRig | null = null;

function createIridescentDragonfly(
  primaryHex: number,
  accentHex: number,
  wingTintHex: number,
  scaleFactor = 1.0
): ArticulatedDragonflyRig {
  const root = new THREE.Group();
  root.scale.setScalar(scaleFactor);

  const chitinMat = new THREE.MeshPhysicalMaterial({
    color: primaryHex,
    metalness: 0.72,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: primaryHex,
    emissiveIntensity: 0.12,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: accentHex,
    metalness: 0.55,
    roughness: 0.25,
    clearcoat: 0.85,
  });

  const eyeMat = new THREE.MeshPhysicalMaterial({
    color: primaryHex,
    metalness: 0.35,
    roughness: 0.08,
    clearcoat: 1.0,
    emissive: 0x0f172a,
  });

  const darkLegMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.4,
    roughness: 0.45,
  });

  const wingMembraneMat = new THREE.MeshPhysicalMaterial({
    color: wingTintHex,
    transparent: true,
    opacity: 0.56,
    roughness: 0.12,
    metalness: 0.18,
    clearcoat: 1.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const wingVeinMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.25,
    metalness: 0.3,
  });

  // Thorax (Ngực căng tròn PBR)
  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 20), chitinMat);
  thorax.scale.set(0.95, 0.92, 1.32);
  root.add(thorax);

  const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.032, 12, 24), accentMat);
  collarRing.position.set(0, 0.02, 0.2);
  root.add(collarRing);

  // Head + Compound Eyes (Đầu & Đôi mắt kép lớn lấp lánh)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.06, 0.34);
  root.add(headGroup);

  const headCore = new THREE.Mesh(new THREE.SphereGeometry(0.145, 20, 18), accentMat);
  headGroup.add(headCore);

  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 18), eyeMat);
    eye.position.set(side * 0.11, 0.035, 0.04);
    eye.scale.set(1.05, 1.05, 1.15);
    headGroup.add(eye);

    const eyeSpec = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    eyeSpec.position.set(side * 0.14, 0.085, 0.12);
    headGroup.add(eyeSpec);
  }

  // Segmented Abdomen Tail (7 đốt thân đuôi thon dài uốn lượn)
  const tailSegments: THREE.Mesh[] = [];
  let parentObj: THREE.Object3D = root;
  let zStep = -0.26;
  for (let i = 0; i < 7; i += 1) {
    const segRadius = Math.max(0.038, 0.115 - i * 0.011);
    const segLen = i < 5 ? 0.22 : 0.18;
    const seg = new THREE.Mesh(
      new THREE.CapsuleGeometry(segRadius, segLen * 0.65, 8, 16),
      i % 2 === 0 ? chitinMat : accentMat
    );
    seg.rotation.x = Math.PI / 2;
    seg.position.set(0, i === 0 ? -0.02 : 0, zStep);
    parentObj.add(seg);
    tailSegments.push(seg);
    parentObj = seg;
    zStep = -0.175;
  }

  // 4 Articulated Translucent Wings (2 cặp cánh trước + sau vỗ độc lập)
  const buildWingPivot = (side: -1 | 1, isFore: boolean): THREE.Group => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.14, 0.14, isFore ? 0.08 : -0.09);
    root.add(pivot);

    const span = isFore ? 1.18 : 1.02;
    const chord = isFore ? 0.24 : 0.22;

    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.bezierCurveTo(side * span * 0.35, chord * 0.72, side * span * 0.85, chord * 0.58, side * span, chord * 0.08);
    bladeShape.bezierCurveTo(side * span * 0.92, -chord * 0.45, side * span * 0.45, -chord * 0.52, 0, -0.04);
    bladeShape.closePath();

    const geo = new THREE.ShapeGeometry(bladeShape, 18);
    geo.rotateX(-Math.PI / 2);
    const membrane = new THREE.Mesh(geo, wingMembraneMat);
    pivot.add(membrane);

    // Leading costal vein for silhouette clarity
    const veinGeo = new THREE.CylinderGeometry(0.012, 0.005, span * 0.96, 8);
    veinGeo.rotateZ(side * (-Math.PI / 2));
    const vein = new THREE.Mesh(veinGeo, wingVeinMat);
    vein.position.set(side * span * 0.48, 0.008, -chord * 0.28);
    pivot.add(vein);

    // Cross ribs for biological realism
    for (let v = 0.28; v <= 0.8; v += 0.22) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.004, chord * 0.85, 6),
        wingVeinMat
      );
      rib.rotation.x = Math.PI / 2;
      rib.position.set(side * span * v, 0.006, 0);
      pivot.add(rib);
    }

    return pivot;
  };

  const wings = {
    foreLeft: buildWingPivot(-1, true),
    foreRight: buildWingPivot(1, true),
    hindLeft: buildWingPivot(-1, false),
    hindRight: buildWingPivot(1, false),
  };

  // 6 Thin Articulated Legs
  const legs: THREE.Group[] = [];
  for (let pair = 0; pair < 3; pair += 1) {
    for (const side of [-1, 1]) {
      const legGroup = new THREE.Group();
      legGroup.position.set(side * 0.14, -0.1, 0.14 - pair * 0.12);
      const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.22, 6), darkLegMat);
      femur.position.set(side * 0.08, -0.08, 0.03);
      femur.rotation.z = side * 0.65;
      legGroup.add(femur);

      const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.005, 0.24, 6), darkLegMat);
      tibia.position.set(side * 0.15, -0.23, 0.07);
      tibia.rotation.z = side * -0.15;
      tibia.rotation.x = 0.25;
      legGroup.add(tibia);

      root.add(legGroup);
      legs.push(legGroup);
    }
  }

  return {
    root,
    headGroup,
    tailSegments,
    wings,
    legs,
    colorHex: primaryHex,
  };
}

function buildLotusFlowerMesh(bloomRadius = 0.45): THREE.Group {
  const flower = new THREE.Group();
  const outerPetalMat = new THREE.MeshPhysicalMaterial({
    color: 0xf472b6,
    roughness: 0.3,
    clearcoat: 0.45,
    side: THREE.DoubleSide,
  });
  const innerPetalMat = new THREE.MeshPhysicalMaterial({
    color: 0xfbcfe8,
    roughness: 0.24,
    clearcoat: 0.6,
    side: THREE.DoubleSide,
  });

  // Outer ring: 10 petals
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(bloomRadius * 0.34, 12, 12), outerPetalMat);
    petal.scale.set(0.58, 1.35, 0.24);
    petal.position.set(Math.cos(a) * bloomRadius * 0.42, bloomRadius * 0.18, Math.sin(a) * bloomRadius * 0.42);
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = 0.58;
    flower.add(petal);
  }
  // Inner ring: 7 petals
  for (let i = 0; i < 7; i += 1) {
    const a = (i / 7) * Math.PI * 2 + 0.25;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(bloomRadius * 0.28, 12, 12), innerPetalMat);
    petal.scale.set(0.55, 1.28, 0.22);
    petal.position.set(Math.cos(a) * bloomRadius * 0.22, bloomRadius * 0.28, Math.sin(a) * bloomRadius * 0.22);
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = 0.28;
    flower.add(petal);
  }
  // Golden center receptacle
  const pod = new THREE.Mesh(
    new THREE.ConeGeometry(bloomRadius * 0.22, bloomRadius * 0.26, 14),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 })
  );
  pod.rotation.x = Math.PI;
  pod.position.y = bloomRadius * 0.26;
  flower.add(pod);
  return flower;
}

function buildMusicalNoteMesh(colorHex: number): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.22,
    roughness: 0.18,
    metalness: 0.35,
    clearcoat: 0.9,
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 14), mat);
  head.scale.set(1.25, 0.88, 0.85);
  head.rotation.z = 0.35;
  g.add(head);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.56, 8), mat);
  stem.position.set(0.12, 0.28, 0);
  g.add(stem);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.04), mat);
  flag.position.set(0.23, 0.5, 0);
  flag.rotation.z = -0.35;
  g.add(flag);
  return g;
}

function getOrCreateDragonflyRig(width: number, height: number): DragonflyWorldRig | null {
  if (typeof document === 'undefined') return null;

  if (!cachedDragonflyRig) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const skyColor = new THREE.Color(0x88cdf6);
      const scene = new THREE.Scene();
      scene.background = skyColor;
      const fog = new THREE.FogExp2(0x9fd8f8, 0.022);
      scene.fog = fog;

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 140);
      camera.position.set(0, 1.8, 7.6);

      // Lighting
      const hemiLight = new THREE.HemisphereLight(0xfef9c3, 0x166534, 1.35);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.3);
      sunLight.position.set(-6.5, 9.5, 5.5);
      scene.add(sunLight);

      const rimLight = new THREE.PointLight(0x38bdf8, 6.0, 26);
      rimLight.position.set(4.5, 4.0, -3.5);
      scene.add(rimLight);

      // Sun Orb (upper-left like user's sunlit reference image)
      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      sunMesh.position.set(-7.5, 6.8, -14.0);
      scene.add(sunMesh);

      // 7-band 3D Rainbow Arch
      const rainbowGroup = new THREE.Group();
      rainbowGroup.position.set(0, -0.5, -13.5);
      const rainbowColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
      rainbowColors.forEach((col, idx) => {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(8.8 - idx * 0.24, 0.11, 12, 72, Math.PI),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 })
        );
        rainbowGroup.add(arc);
      });
      scene.add(rainbowGroup);

      // Cumulus Clouds Group (for bay thap thi mua / rain scenes)
      const cloudsGroup = new THREE.Group();
      cloudsGroup.position.set(0, 4.9, -6.5);
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.85, metalness: 0.02 });
      const cloudPositions = [
        [-5.2, 0.3, 0, 1.0],
        [-1.8, 0.65, -1.2, 1.25],
        [1.9, 0.45, -0.8, 1.15],
        [5.4, 0.2, -0.4, 0.95],
      ];
      cloudPositions.forEach(([cx, cy, cz, sc]) => {
        const cg = new THREE.Group();
        cg.position.set(cx, cy, cz);
        cg.scale.setScalar(sc);
        for (let p = 0; p < 5; p += 1) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(0.75 - Math.abs(p - 2) * 0.1, 14, 14), cloudMat);
          puff.position.set((p - 2) * 0.58, Math.sin(p) * 0.16, (p % 2) * 0.22);
          cg.add(puff);
        }
        cloudsGroup.add(cg);
      });
      scene.add(cloudsGroup);

      // Lotus Pond Surface
      const pondWater = new THREE.Mesh(
        new THREE.CircleGeometry(28, 64),
        new THREE.MeshPhysicalMaterial({
          color: 0x0d9488,
          roughness: 0.12,
          metalness: 0.25,
          clearcoat: 1.0,
          clearcoatRoughness: 0.08,
        })
      );
      pondWater.rotation.x = -Math.PI / 2;
      pondWater.position.y = 0;
      scene.add(pondWater);

      // Lush Mossy Foreground Shore Bank
      const shoreBank = new THREE.Mesh(
        new THREE.CylinderGeometry(7.2, 8.6, 0.6, 40),
        new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 })
      );
      shoreBank.position.set(0, -0.22, 6.2);
      scene.add(shoreBank);

      // Lotus Pads + Blooming Flowers
      const padMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.55, metalness: 0.08 });
      const lotusFlowers: Array<{ group: THREE.Group; baseY: number; phase: number }> = [];
      const padCoords: Array<[number, number, number, boolean]> = [
        [-2.8, -1.6, 1.05, true],
        [-0.8, -2.5, 0.92, false],
        [1.9, -1.9, 1.12, true],
        [3.4, -0.8, 0.85, false],
        [-3.9, 0.2, 0.78, true],
        [0.4, -0.4, 0.96, false],
        [-1.9, -4.4, 1.25, true],
        [2.6, -4.2, 1.18, true],
        [4.9, -3.2, 0.95, false],
      ];
      padCoords.forEach(([px, pz, rad, hasFlower], idx) => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.96, 0.04, 28, 1, false, 0.15, Math.PI * 1.85), padMat);
        pad.position.set(px, 0.025, pz);
        pad.rotation.y = idx * 0.9;
        scene.add(pad);

        if (hasFlower) {
          const fl = buildLotusFlowerMesh(0.42 + (idx % 2) * 0.1);
          fl.position.set(px + 0.18, 0.06, pz - 0.12);
          scene.add(fl);
          lotusFlowers.push({ group: fl, baseY: 0.06, phase: idx * 1.1 });
        }
      });

      // Arching Swordgrass Blades + Morning Dew Droplets (Foreground Hero Flora from Reference Image)
      const reeds: Array<{ mesh: THREE.Group; phase: number }> = [];
      const reedMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45, side: THREE.DoubleSide });
      const dewMat = new THREE.MeshPhysicalMaterial({
        color: 0xe0f2fe,
        roughness: 0.02,
        metalness: 0.05,
        transmission: 0.75,
        transparent: true,
        opacity: 0.88,
        clearcoat: 1.0,
      });

      for (let i = 0; i < 20; i += 1) {
        const rg = new THREE.Group();
        const sideLeft = i < 10;
        const bx = sideLeft ? -5.6 + (i % 5) * 0.48 : 2.6 + (i % 5) * 0.56;
        const bz = 1.4 + Math.floor((i % 10) / 5) * 0.95;
        rg.position.set(bx, 0, bz);

        const h = 1.15 + (i % 5) * 0.24;
        const blade = new THREE.Mesh(new THREE.ConeGeometry(0.055, h, 6), reedMat);
        blade.position.y = h * 0.5;
        blade.rotation.z = sideLeft ? -0.22 - (i % 3) * 0.08 : 0.22 + (i % 3) * 0.08;
        rg.add(blade);

        // Morning water droplets along foreground blades
        if (i % 4 === 0) {
          const drop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), dewMat);
          drop.position.set(sideLeft ? 0.12 : -0.12, h * 0.55, 0.02);
          rg.add(drop);
        }
        scene.add(rg);
        reeds.push({ mesh: rg, phase: i * 0.47 });
      }

      // Violet Shore Wildflowers on Left (matching reference image purple buds)
      const petalVioletMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
      for (let f = 0; f < 6; f += 1) {
        const flCluster = new THREE.Group();
        flCluster.position.set(-2.65 + (f % 3) * 0.35, 0.52 + (f % 2) * 0.25, 1.55 + Math.floor(f / 3) * 0.35);
        for (let p = 0; p < 5; p += 1) {
          const a = (p / 5) * Math.PI * 2;
          const pt = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), petalVioletMat);
          pt.scale.set(1.2, 0.4, 0.9);
          pt.position.set(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08);
          flCluster.add(pt);
        }
        const centerDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.038, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        flCluster.add(centerDot);
        scene.add(flCluster);
      }

      // 3 Hero Articulated 3D Dragonflies (Blue-Teal, Red-Orange, Emerald-Green)
      const blueDragonfly = createIridescentDragonfly(0x0284c7, 0x22d3ee, 0xe0f2fe, 1.08);
      const orangeDragonfly = createIridescentDragonfly(0xe84d1c, 0xfb923c, 0xffedd5, 0.98);
      const greenDragonfly = createIridescentDragonfly(0x16a34a, 0x4ade80, 0xdcfce7, 0.88);
      const dragonflies = [blueDragonfly, orangeDragonfly, greenDragonfly];
      dragonflies.forEach((df) => scene.add(df.root));

      // 220 3D Falling Raindrop Streaks (shown during Bay Thấp & Cơn Mưa)
      const rainGroup = new THREE.Group();
      const rainMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.62 });
      const rainDrops: RainDropItem[] = [];
      for (let i = 0; i < 220; i += 1) {
        const dropMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.34, 5), rainMat);
        dropMesh.rotation.z = 0.14;
        const bx = (((i * 73) % 140) / 140 - 0.5) * 16.0;
        const bz = (((i * 41) % 100) / 100 - 0.5) * 12.0;
        const offsetY = (i * 0.37) % 7.5;
        dropMesh.position.set(bx, offsetY, bz);
        rainGroup.add(dropMesh);
        rainDrops.push({ mesh: dropMesh, baseX: bx, baseZ: bz, offsetY, speed: 6.5 + (i % 5) * 0.9 });
      }
      scene.add(rainGroup);

      // 16 Concentric Rain Splash Ripples on Pond
      const pondRipples: PondRippleItem[] = [];
      for (let i = 0; i < 16; i += 1) {
        const rMat = new THREE.MeshBasicMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide,
        });
        const rMesh = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.19, 28), rMat);
        rMesh.rotation.x = -Math.PI / 2;
        const rx = (((i * 53) % 100) / 100 - 0.5) * 9.5;
        const rz = -3.8 + ((i * 29) % 50) / 10;
        rMesh.position.set(rx, 0.032, rz);
        scene.add(rMesh);
        pondRipples.push({ mesh: rMesh, baseX: rx, baseZ: rz, phase: i * 0.21 });
      }

      // Floating Sunlight Bokeh & Dew Sparkles
      const sparkles: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }> = [];
      for (let i = 0; i < 28; i += 1) {
        const sp = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef9c3, transparent: true, opacity: 0.78 })
        );
        const bx = (((i * 37) % 100) / 100 - 0.5) * 11.0;
        const by = 0.6 + ((i * 19) % 35) / 10;
        const bz = -3.0 + ((i * 23) % 55) / 10;
        sp.position.set(bx, by, bz);
        scene.add(sp);
        sparkles.push({ mesh: sp, baseX: bx, baseY: by, baseZ: bz, phase: i * 0.45 });
      }

      // 6 Sculpted 3D Musical Notes (displayed cleanly during song peak / chorus)
      const noteColors = [0xf43f5e, 0xf59e0b, 0x0ea5e9, 0x22c55e, 0x8b5cf6, 0xec4899];
      const notes: NoteItem[] = noteColors.map((col, idx) => {
        const g = buildMusicalNoteMesh(col);
        const nx = -3.2 + idx * 1.28;
        const ny = 2.65 + (idx % 2) * 0.35;
        const nz = -1.2 - (idx % 3) * 0.4;
        g.position.set(nx, ny, nz);
        scene.add(g);
        return { group: g, baseX: nx, baseY: ny, baseZ: nz, phase: idx * 0.85 };
      });

      cachedDragonflyRig = {
        renderer,
        scene,
        camera,
        canvas,
        hemiLight,
        sunLight,
        rimLight,
        skyColor,
        fog,
        sunMesh,
        rainbowGroup,
        cloudsGroup,
        rainGroup,
        rainDrops,
        pondRipples,
        reeds,
        lotusFlowers,
        dragonflies,
        sparkles,
        notes,
      };
    } catch {
      return null;
    }
  } else if (cachedDragonflyRig.canvas.width !== width || cachedDragonflyRig.canvas.height !== height) {
    cachedDragonflyRig.canvas.width = width;
    cachedDragonflyRig.canvas.height = height;
    cachedDragonflyRig.renderer.setSize(width, height, false);
    cachedDragonflyRig.camera.aspect = width / Math.max(1, height);
    cachedDragonflyRig.camera.updateProjectionMatrix();
  }

  return cachedDragonflyRig;
}

/**
 * Sân khấu WebGL 3D thực thụ cho dự án "Chuồn chuồn bay thấp bay cao (dự báo mưa nắng)"
 * với 3 nhân vật chuồn chuồn PBR đa khớp cánh trong suốt vỗ nhịp thực, ao sen nổi,
 * mưa 3D + sóng vòng đồng tâm và cầu vồng 7 sắc biến thiên theo từng phân cảnh lời hát.
 */
export function renderDragonflyRainSong3dStageToCanvas(
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: DragonflyStageOptions
): boolean {
  const W = Math.max(640, Math.round(width));
  const H = Math.max(360, Math.round(height));
  const rig = getOrCreateDragonflyRig(W, H);
  if (!rig) return false;

  const { clockSec, progress, sceneIdx } = options;
  const idx = Math.max(0, Math.min(5, Math.floor(sceneIdx)));

  // Atmospheric Mood State across 6 scenes:
  // 0 = Bình minh | 1 = Bay thấp báo mưa | 2 = Cơn mưa rào | 3 = Bay vừa râm mát | 4 = Bay cao nắng vàng | 5 = Vũ điệu đồng dao
  const isStormApproaching = idx === 1;
  const isHeavyRain = idx === 2;
  const isModerateShade = idx === 3;
  const isSunnyHigh = idx >= 4;

  const targetSkyHex = isHeavyRain
    ? 0x475e73
    : isStormApproaching
      ? 0x6c87a3
      : isModerateShade
        ? 0x8cc3e8
        : isSunnyHigh
          ? 0x72cbfa
          : 0xa2dcf8;

  rig.skyColor.setHex(targetSkyHex);
  rig.fog.color.setHex(targetSkyHex);
  rig.fog.density = isHeavyRain ? 0.036 : isStormApproaching ? 0.028 : 0.017;

  rig.sunLight.intensity = isHeavyRain ? 0.85 : isStormApproaching ? 1.25 : isSunnyHigh ? 2.55 : 2.1;
  rig.sunLight.color.setHex(isHeavyRain || isStormApproaching ? 0xcbd5e1 : 0xfff7cc);
  rig.hemiLight.intensity = isHeavyRain ? 0.95 : 1.38;

  rig.sunMesh.visible = !isHeavyRain && !isStormApproaching;
  rig.sunMesh.scale.setScalar(isSunnyHigh ? 1.28 : 1.0);
  rig.rainbowGroup.visible = isSunnyHigh;
  rig.cloudsGroup.visible = isStormApproaching || isHeavyRain || isModerateShade;
  rig.cloudsGroup.position.x = Math.sin(clockSec * 0.25) * 0.65;

  // Rain drops active heavily in Scene 2, lightly starting in late Scene 1
  const rainOpacity = isHeavyRain ? 0.72 : isStormApproaching && progress > 0.55 ? (progress - 0.55) * 0.9 : 0;
  rig.rainGroup.visible = rainOpacity > 0.02;
  if (rig.rainGroup.visible) {
    rig.rainDrops.forEach((rd) => {
      const fall = ((rd.offsetY + clockSec * rd.speed) % 7.5);
      const yNow = 7.2 - fall;
      rd.mesh.position.set(rd.baseX - fall * 0.14, yNow, rd.baseZ);
      (rd.mesh.material as THREE.MeshBasicMaterial).opacity = rainOpacity;
    });
  }

  // Water Splash Ripples on pond during rain & cool shade
  rig.pondRipples.forEach((rp) => {
    const showRipple = isHeavyRain || isStormApproaching || isModerateShade;
    rp.mesh.visible = showRipple;
    if (showRipple) {
      const cyc = (clockSec * (isHeavyRain ? 1.55 : 0.75) + rp.phase) % 1;
      rp.mesh.scale.setScalar(0.6 + cyc * 3.2);
      (rp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0.05, (isHeavyRain ? 0.78 : 0.35) * (1 - cyc));
    }
  });

  // Gentle wind sway on reeds & lotus blooms
  const windForce = isHeavyRain ? 0.16 : isStormApproaching ? 0.11 : 0.05;
  rig.reeds.forEach((r) => {
    r.mesh.rotation.z = Math.sin(clockSec * (isHeavyRain ? 3.8 : 2.1) + r.phase) * windForce;
  });
  rig.lotusFlowers.forEach((fl) => {
    fl.group.position.y = fl.baseY + Math.sin(clockSec * 1.9 + fl.phase) * 0.03;
  });

  // Dragonfly Altitude & Flight Paths matching exact lyrics:
  // "bay thấp thì mưa" (y ~ 0.38..0.68) | "bay vừa thì râm" (y ~ 1.45..1.85) | "bay cao thì nắng" (y ~ 2.45..3.35)
  const altitudeBase = isHeavyRain
    ? 0.65
    : isStormApproaching
      ? 0.48
      : isModerateShade
        ? 1.55
        : isSunnyHigh
          ? idx === 4
            ? 2.65
            : 2.15
          : 1.05;

  rig.dragonflies.forEach((df, dIdx) => {
    const phaseGap = (dIdx * Math.PI * 2) / 3;
    const t = clockSec * 1.15 + phaseGap;
    const laneOffsetX = dIdx === 0 ? 1.85 : dIdx === 1 ? -1.85 : 0.0;
    const laneOffsetY = dIdx === 0 ? 0.12 : dIdx === 1 ? -0.06 : 0.36;
    let px = laneOffsetX;
    let py = altitudeBase + laneOffsetY;
    let pz = 0;
    let yaw = 0;

    if (idx === 0) {
      // Scene 0: Perched hero formation lifting gently off foreground swordgrass/blossoms
      const lift = Math.max(0, (progress - 0.2) * 1.25);
      const basePos: Array<[number, number, number, number]> = [
        [1.65, 1.05, 0.75, -0.58],
        [-1.75, 0.95, 0.55, 0.65],
        [-0.08, 1.72, -0.45, 0.22],
      ];
      const [bx, by, bz, byaw] = basePos[dIdx];
      px = bx + Math.sin(t * 0.7) * 0.26 * lift;
      py = by + Math.sin(t * 1.8) * 0.11 + lift * 0.25;
      pz = bz + Math.cos(t * 0.6) * 0.22 * lift;
      yaw = byaw + Math.sin(t * 0.9) * 0.22;
    } else if (idx === 1 || idx === 2) {
      // Scene 1 & 2: Low agile skimming separated neatly at 120deg intervals over pond
      const orbitR = 2.05 + dIdx * 0.35;
      const ang = clockSec * 0.88 + phaseGap;
      px = Math.cos(ang) * orbitR;
      pz = -0.95 + Math.sin(ang) * 1.35;
      py = altitudeBase + laneOffsetY * 0.65 + Math.sin(clockSec * 3.8 + phaseGap) * 0.11;
      yaw = Math.atan2(-Math.sin(ang) * orbitR, Math.cos(ang) * 1.35);
    } else if (idx === 3) {
      // Scene 3: Graceful V-formation figure-8 mid-altitude dance ("bay vừa thì râm")
      const fAng = clockSec * 0.78 + phaseGap;
      px = Math.sin(fAng) * 2.55;
      pz = -1.05 + Math.sin(fAng * 2) * 0.95;
      py = altitudeBase + laneOffsetY + Math.cos(fAng * 1.5) * 0.16;
      yaw = Math.atan2(Math.cos(fAng) * 2.55, Math.cos(fAng * 2) * 1.9);
    } else {
      // Scene 4 & 5: Triumphant high sunlit flock soaring across rainbow sky ("bay cao thì nắng")
      const climbBoost = idx === 4 ? progress * 0.65 : 0.25;
      const sAng = clockSec * 0.85 + phaseGap;
      px = Math.cos(sAng) * 2.45 + laneOffsetX * 0.32;
      pz = -1.15 + Math.sin(sAng) * 1.45;
      py = altitudeBase + climbBoost + laneOffsetY + Math.sin(clockSec * 2.6 + phaseGap) * 0.16;
      yaw = Math.atan2(-Math.sin(sAng) * 2.45, Math.cos(sAng) * 1.45);
    }

    df.root.position.set(px, py, pz);
    df.root.rotation.y = yaw;
    df.root.rotation.x = Math.sin(clockSec * 3.1 + dIdx) * 0.08 + (isSunnyHigh ? -0.14 : 0.06);
    df.root.rotation.z = Math.cos(clockSec * 2.4 + dIdx) * 0.09;

    // Rapid translucent wingbeat (real phase difference between forewings & hindwings)
    const wingFreq = isHeavyRain ? 34 : isSunnyHigh ? 28 : 24;
    const flapA = Math.sin(clockSec * wingFreq + dIdx * 1.3) * 0.62;
    const flapB = Math.sin(clockSec * wingFreq + dIdx * 1.3 - 0.65) * 0.56;
    df.wings.foreLeft.rotation.z = -flapA;
    df.wings.foreRight.rotation.z = flapA;
    df.wings.hindLeft.rotation.z = -flapB;
    df.wings.hindRight.rotation.z = flapB;

    // Subtle agile abdomen tail wave
    df.tailSegments.forEach((seg, sIdx) => {
      seg.rotation.z = Math.sin(clockSec * 4.5 + sIdx * 0.45 + dIdx) * 0.04;
    });
  });

  // Golden Sparkles & Musical Notes
  rig.sparkles.forEach((sp) => {
    sp.mesh.visible = !isHeavyRain;
    if (sp.mesh.visible) {
      sp.mesh.position.set(
        sp.baseX + Math.sin(clockSec * 0.8 + sp.phase) * 0.35,
        sp.baseY + Math.cos(clockSec * 1.1 + sp.phase) * 0.25,
        sp.baseZ
      );
      sp.mesh.scale.setScalar(0.65 + 0.55 * Math.sin(clockSec * 3.5 + sp.phase));
    }
  });

  rig.notes.forEach((nt) => {
    nt.group.visible = idx === 5 || idx === 3;
    if (nt.group.visible) {
      nt.group.position.set(
        nt.baseX + Math.sin(clockSec * 1.4 + nt.phase) * 0.18,
        nt.baseY + Math.abs(Math.sin(clockSec * 3.6 + nt.phase)) * 0.28,
        nt.baseZ
      );
      nt.group.rotation.y = Math.sin(clockSec * 2.2 + nt.phase) * 0.5;
    }
  });

  // Dynamic Camera Choreography matching altitude per scene
  let camX = 0;
  let camY = 1.75;
  let camZ = 6.9;
  let lookX = 0;
  let lookY = 1.15;
  let lookZ = -0.5;

  if (idx === 0) {
    // Scene 0: Warm macro-to-medium push in across all 3 dragonflies
    camX = -0.65 + progress * 1.1;
    camY = 1.48 + Math.sin(progress * Math.PI) * 0.18;
    camZ = 5.65 - progress * 0.85;
    lookY = 1.12;
  } else if (idx === 1) {
    // Scene 1: Low-angle water skimmer tracking low-flying dragonflies before rain
    camX = Math.sin(progress * Math.PI) * 1.35;
    camY = 0.92;
    camZ = 6.2 - progress * 0.6;
    lookY = 0.55;
  } else if (idx === 2) {
    // Scene 2: Rainstorm orbital sweep over rippling pond
    camX = -1.6 + progress * 3.2;
    camY = 1.55;
    camZ = 6.45;
    lookY = 0.65;
  } else if (idx === 3) {
    // Scene 3: Mid-altitude tranquil circling over blooming lotus
    camX = Math.cos(progress * Math.PI) * 1.4;
    camY = 2.05;
    camZ = 6.6;
    lookY = 1.45;
  } else if (idx === 4) {
    // Scene 4: Uplifting Hero Low-to-High upward tilt capturing high flight & rainbow
    camX = -0.9 + progress * 1.8;
    camY = 1.45 + progress * 0.55;
    camZ = 7.15;
    lookY = 2.35 + progress * 0.55;
    lookZ = -2.2;
  } else {
    // Scene 5: Joyful panoramic finale pull-back with rainbow + lotus pond + musical notes
    camX = Math.sin(progress * Math.PI * 1.4) * 1.25;
    camY = 2.15 + progress * 0.35;
    camZ = 7.45 + progress * 0.75;
    lookY = 1.65;
    lookZ = -1.5;
  }

  rig.camera.position.set(camX, camY, camZ);
  rig.camera.lookAt(lookX, lookY, lookZ);

  rig.renderer.render(rig.scene, rig.camera);
  targetCtx.save();
  targetCtx.drawImage(rig.canvas, 0, 0, W, H);
  targetCtx.restore();
  return true;
}
