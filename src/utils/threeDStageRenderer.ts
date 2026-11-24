import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Lipsync, VISEMES } from 'wawa-lipsync';

/**
 * Thực thi thực tế thư viện GitHub `mrdoob/three.js` (WebGL2 3D Engine),
 * `GLTFLoader` (.glb/.gltf/.vrm) và `wass08/wawa-lipsync` (WebAudio FFT Viseme Lip-Sync).
 * Dựng nhân vật 3D có khớp đầu/tay/mắt chớp/khẩu hình Viseme Lip-Sync và 4 bối cảnh sân khấu 3D
 * (NPU Silicon Core, Neural Lattice, Server Monoliths, TorusKnot Arena) ở độ phân giải 1080p.
 */

export interface VisemeWeightsSnapshot {
  activeViseme: VISEMES;
  mouthOpenAmount: number;
  jawScaleY: number;
  smileWidthX: number;
}

let sharedWawaLipsync: Lipsync | null = null;
const loadedGltfAvatarCache = new Map<string, THREE.Group>();

/**
 * Connects an HTMLAudioElement to wass08/wawa-lipsync and extracts real-time VISEMES blend weights.
 */
export function attachAudioToWawaLipsync(audioEl: HTMLMediaElement): Lipsync | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedWawaLipsync) {
      sharedWawaLipsync = new Lipsync();
    }
    sharedWawaLipsync.connectAudio(audioEl);
    return sharedWawaLipsync;
  } catch {
    return null;
  }
}

export function analyzeRealtimeVisemeWeights(
  clockSec: number,
  isSpeaking: boolean
): VisemeWeightsSnapshot {
  if (sharedWawaLipsync && isSpeaking) {
    try {
      sharedWawaLipsync.processAudio();
      const viseme = sharedWawaLipsync.viseme || VISEMES.sil;
      const openMap: Record<string, number> = {
        [VISEMES.sil]: 0.05,
        [VISEMES.PP]: 0.12,
        [VISEMES.FF]: 0.28,
        [VISEMES.TH]: 0.35,
        [VISEMES.DD]: 0.42,
        [VISEMES.kk]: 0.48,
        [VISEMES.CH]: 0.4,
        [VISEMES.SS]: 0.24,
        [VISEMES.nn]: 0.3,
        [VISEMES.RR]: 0.45,
        [VISEMES.aa]: 0.92,
        [VISEMES.E]: 0.68,
        [VISEMES.I]: 0.55,
        [VISEMES.O]: 0.8,
        [VISEMES.U]: 0.62,
      };
      const mouthOpenAmount = openMap[viseme] ?? 0.25;
      return {
        activeViseme: viseme,
        mouthOpenAmount,
        jawScaleY: 0.32 + mouthOpenAmount * 1.15,
        smileWidthX: viseme === VISEMES.I || viseme === VISEMES.E ? 1.16 : viseme === VISEMES.O || viseme === VISEMES.U ? 0.78 : 1.0,
      };
    } catch {
      // Fall through to deterministic speech cadence when WebAudio context is headless/suspended
    }
  }

  const energy = isSpeaking
    ? 0.25 + 0.75 * Math.abs(Math.sin(clockSec * 11.2) * 0.65 + Math.cos(clockSec * 7.4) * 0.35)
    : 0.06;
  return {
    activeViseme: isSpeaking ? VISEMES.aa : VISEMES.sil,
    mouthOpenAmount: energy,
    jawScaleY: 0.32 + energy * 1.05,
    smileWidthX: isSpeaking ? 1.0 + Math.sin(clockSec * 5.2) * 0.12 : 1.0,
  };
}

/**
 * Loads an external GLB/GLTF 3D avatar via Three.js GLTFLoader with memory cache.
 */
export async function loadCustomGltfAvatar(glbUrl: string): Promise<THREE.Group | null> {
  if (!glbUrl || typeof window === 'undefined') return null;
  const cached = loadedGltfAvatarCache.get(glbUrl);
  if (cached) return cached.clone();
  const loader = new GLTFLoader();
  try {
    const gltf = await loader.loadAsync(glbUrl);
    if (gltf?.scene) {
      loadedGltfAvatarCache.set(glbUrl, gltf.scene);
      return gltf.scene.clone();
    }
    return null;
  } catch {
    return null;
  }
}

interface ThreeRigHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  avatarGroup: THREE.Group;
  headGroup: THREE.Group;
  leftEyelid: THREE.Mesh;
  rightEyelid: THREE.Mesh;
  jawGroup: THREE.Group;
  leftArmGroup: THREE.Group;
  rightArmGroup: THREE.Group;
  stageEnvGroup: THREE.Group;
  propGroups: THREE.Group[];
  coreMesh: THREE.Mesh;
  ring1: THREE.Mesh;
  ring2: THREE.Mesh;
  particles: THREE.Points;
  canvas: HTMLCanvasElement;
}

let cachedRig: ThreeRigHandles | null = null;

function createOffscreenCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function getOrCreateThreeRig(width: number, height: number): ThreeRigHandles | null {
  if (typeof document === 'undefined') return null;

  if (!cachedRig) {
    try {
      const canvas = createOffscreenCanvas(width, height);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      camera.position.set(0, 1.35, 5.4);

      // Studio Three-Point PBR Lighting
      const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.35);
      scene.add(hemi);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3.2, 4.5, 4.5);
      scene.add(keyLight);

      const cyanRim = new THREE.PointLight(0x38bdf8, 8.5, 18);
      cyanRim.position.set(-2.8, 2.4, -1.6);
      scene.add(cyanRim);

      const amberRim = new THREE.PointLight(0xf59e0b, 5.5, 16);
      amberRim.position.set(2.9, 2.0, -1.2);
      scene.add(amberRim);

      const stageEnvGroup = new THREE.Group();
      scene.add(stageEnvGroup);

      // Glowing Perspective Grid & Spotlight Pedestal
      const grid = new THREE.GridHelper(20, 26, 0x38bdf8, 0x1e293b);
      grid.position.y = -1.15;
      stageEnvGroup.add(grid);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(1.15, 1.35, 0.22, 48),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.72, roughness: 0.22 })
      );
      pedestal.position.y = -1.04;
      stageEnvGroup.add(pedestal);

      const pedestalRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.025, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      pedestalRing.rotation.x = Math.PI / 2;
      pedestalRing.position.y = -0.92;
      stageEnvGroup.add(pedestalRing);

      // --- PROP VARIANT 0: Silicon NPU Quantum Core ---
      const prop0 = new THREE.Group();
      prop0.position.set(1.5, 0.85, -0.65);
      stageEnvGroup.add(prop0);

      const coreMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.68, 1),
        new THREE.MeshPhysicalMaterial({
          color: 0x0284c7,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.45,
          roughness: 0.14,
          metalness: 0.35,
          clearcoat: 1.0,
        })
      );
      prop0.add(coreMesh);
      prop0.add(
        new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.86, 1),
          new THREE.MeshBasicMaterial({ color: 0x7dd3fc, wireframe: true, transparent: true, opacity: 0.35 })
        )
      );
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.024, 16, 72),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
      );
      ring1.rotation.x = Math.PI * 0.35;
      prop0.add(ring1);
      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(1.38, 0.018, 16, 72),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 })
      );
      ring2.rotation.y = Math.PI * 0.42;
      prop0.add(ring2);

      // --- PROP VARIANT 1: Neural Lattice Network (Glowing Clustered Nodes) ---
      const prop1 = new THREE.Group();
      prop1.position.set(1.48, 0.85, -0.65);
      stageEnvGroup.add(prop1);
      const nodeOffsets = [
        [0, 0, 0],
        [-0.75, 0.55, 0.25],
        [0.75, 0.48, -0.2],
        [-0.65, -0.58, -0.2],
        [0.72, -0.52, 0.3],
        [0, 0.85, -0.3],
      ];
      nodeOffsets.forEach(([nx, ny, nz], idx) => {
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(idx === 0 ? 0.32 : 0.18, 24, 24),
          new THREE.MeshPhysicalMaterial({
            color: idx % 2 === 0 ? 0x10b981 : 0x38bdf8,
            emissive: idx % 2 === 0 ? 0x059669 : 0x0284c7,
            emissiveIntensity: 0.6,
            roughness: 0.2,
            metalness: 0.3,
          })
        );
        node.position.set(nx, ny, nz);
        prop1.add(node);
      });
      const latticeCage = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.02, 0),
        new THREE.MeshBasicMaterial({ color: 0x34d399, wireframe: true, transparent: true, opacity: 0.45 })
      );
      prop1.add(latticeCage);

      // --- PROP VARIANT 2: Glass Server Pillars & Hologram Matrix ---
      const prop2 = new THREE.Group();
      prop2.position.set(1.48, 0.35, -0.75);
      stageEnvGroup.add(prop2);
      for (let p = -2; p <= 2; p++) {
        const h = 1.2 + Math.cos(p * 0.9) * 0.55;
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, h, 0.26),
          new THREE.MeshPhysicalMaterial({
            color: p === 0 ? 0x0ea5e9 : 0x334155,
            emissive: p === 0 ? 0x0284c7 : 0x0f172a,
            emissiveIntensity: p === 0 ? 0.55 : 0.25,
            roughness: 0.18,
            metalness: 0.65,
            clearcoat: 0.9,
          })
        );
        pillar.position.set(p * 0.42, h * 0.35 - 0.5, Math.abs(p) * -0.18);
        prop2.add(pillar);
      }

      // --- PROP VARIANT 3: Golden Keynote TorusKnot Finale ---
      const prop3 = new THREE.Group();
      prop3.position.set(1.48, 0.85, -0.65);
      stageEnvGroup.add(prop3);
      const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.62, 0.16, 120, 20),
        new THREE.MeshPhysicalMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.35,
          metalness: 0.78,
          roughness: 0.16,
          clearcoat: 1.0,
        })
      );
      prop3.add(knot);

      // Volumetric Particle Field
      const pCount = 240;
      const pPositions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPositions[i * 3] = Math.sin(i * 12.9898) * 7;
        pPositions[i * 3 + 1] = ((Math.cos(i * 78.233) + 1) * 0.5) * 6 - 1;
        pPositions[i * 3 + 2] = Math.sin(i * 45.164) * 5 - 2;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.055, transparent: true, opacity: 0.7 })
      );
      stageEnvGroup.add(particles);

      // --- Sculpted Stylized 3D Humanoid Host ---
      const avatarGroup = new THREE.Group();
      scene.add(avatarGroup);

      const suitMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.24 });
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 0.62, 16, 32), suitMat);
      torso.scale.set(1.12, 1.0, 0.72);
      torso.position.set(0, -0.25, 0);
      avatarGroup.add(torso);

      const shirt = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.46, 4),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 })
      );
      shirt.rotation.x = Math.PI;
      shirt.rotation.y = Math.PI * 0.25;
      shirt.position.set(0, 0.14, 0.24);
      avatarGroup.add(shirt);

      const tie = new THREE.Mesh(
        new THREE.ConeGeometry(0.072, 0.42, 4),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          emissive: 0x0369a1,
          emissiveIntensity: 0.35,
          roughness: 0.3,
        })
      );
      tie.rotation.x = Math.PI;
      tie.position.set(0, 0.06, 0.32);
      avatarGroup.add(tie);

      const skinMat = new THREE.MeshPhysicalMaterial({
        color: 0xf6cbb1,
        roughness: 0.52,
        metalness: 0.02,
        clearcoat: 0.12,
      });
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.26, 24), skinMat);
      neck.position.set(0, 0.38, 0.02);
      avatarGroup.add(neck);

      const buildArm = (side: -1 | 1) => {
        const g = new THREE.Group();
        g.position.set(side * 0.58, 0.16, 0.02);
        const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.48, 12, 24), suitMat);
        sleeve.position.set(0, -0.26, 0.05);
        g.add(sleeve);
        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 20), skinMat);
        hand.position.set(0, -0.56, 0.12);
        g.add(hand);
        avatarGroup.add(g);
        return g;
      };
      const leftArmGroup = buildArm(-1);
      const rightArmGroup = buildArm(1);

      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.92, 0.04);
      avatarGroup.add(headGroup);

      const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.46, 36, 36), skinMat);
      cranium.scale.set(0.95, 1.07, 0.96);
      headGroup.add(cranium);

      // Subtle Nose Bridge
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 16), skinMat);
      nose.scale.set(0.85, 1.15, 0.9);
      nose.position.set(0, -0.02, 0.435);
      headGroup.add(nose);

      // Sleek Swept Hair Raised Above Forehead (NO helmet-over-eyebrows effect!)
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.48, metalness: 0.12 });
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.47, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.48),
        hairMat
      );
      hairCap.scale.set(0.98, 1.04, 0.99);
      hairCap.rotation.x = -0.44;
      hairCap.position.set(0, 0.14, -0.06);
      headGroup.add(hairCap);

      const hairWave = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.34, 12, 20), hairMat);
      hairWave.rotation.z = Math.PI * 0.43;
      hairWave.rotation.y = 0.2;
      hairWave.position.set(0.06, 0.46, 0.18);
      headGroup.add(hairWave);

      // Clean Acoustic Studio Earpieces
      for (const side of [-1, 1]) {
        const earPod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.1, 0.1, 0.055, 24),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.22 })
        );
        earPod.rotation.z = Math.PI / 2;
        earPod.position.set(side * 0.45, 0.0, -0.04);
        headGroup.add(earPod);

        const earGlow = new THREE.Mesh(
          new THREE.TorusGeometry(0.072, 0.013, 12, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        earGlow.rotation.y = Math.PI / 2;
        earGlow.position.set(side * 0.48, 0.0, -0.04);
        headGroup.add(earGlow);
      }

      const scleraMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, clearcoat: 1.0 });
      const irisMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.22 });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x020617 });

      const buildEye = (side: -1 | 1): THREE.Mesh => {
        const eyeGroup = new THREE.Group();
        eyeGroup.position.set(side * 0.155, 0.05, 0.39);

        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.072, 20, 20), scleraMat);
        sclera.scale.set(1.0, 1.04, 0.65);
        eyeGroup.add(sclera);

        const iris = new THREE.Mesh(new THREE.SphereGeometry(0.044, 16, 16), irisMat);
        iris.position.set(0, 0, 0.036);
        eyeGroup.add(iris);

        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), pupilMat);
        pupil.position.set(0, 0, 0.055);
        eyeGroup.add(pupil);

        const eyelid = new THREE.Mesh(
          new THREE.SphereGeometry(0.078, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
          skinMat
        );
        eyelid.position.set(0, 0.005, 0);
        eyelid.rotation.x = -Math.PI * 0.44;
        eyeGroup.add(eyelid);

        const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.017, 0.09, 6, 12), hairMat);
        brow.rotation.z = Math.PI / 2 - side * 0.1;
        brow.position.set(0, 0.12, 0.03);
        eyeGroup.add(brow);

        headGroup.add(eyeGroup);
        return eyelid;
      };

      const leftEyelid = buildEye(-1);
      const rightEyelid = buildEye(1);

      const jawGroup = new THREE.Group();
      jawGroup.position.set(0, -0.19, 0.395);
      headGroup.add(jawGroup);

      const mouthCavity = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.048, 0.075, 8, 16),
        new THREE.MeshBasicMaterial({ color: 0x9f3f3f })
      );
      mouthCavity.rotation.z = Math.PI / 2;
      jawGroup.add(mouthCavity);

      const teeth = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.022, 0.025),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 })
      );
      teeth.position.set(0, 0.02, 0.036);
      jawGroup.add(teeth);

      cachedRig = {
        renderer,
        scene,
        camera,
        avatarGroup,
        headGroup,
        leftEyelid,
        rightEyelid,
        jawGroup,
        leftArmGroup,
        rightArmGroup,
        stageEnvGroup,
        propGroups: [prop0, prop1, prop2, prop3],
        coreMesh,
        ring1,
        ring2,
        particles,
        canvas,
      };
    } catch {
      cachedRig = null;
    }
  }

  if (cachedRig && (cachedRig.canvas.width !== width || cachedRig.canvas.height !== height)) {
    cachedRig.renderer.setSize(width, height, false);
    cachedRig.camera.aspect = width / height;
    cachedRig.camera.updateProjectionMatrix();
  }

  return cachedRig;
}

export function renderThreeDStageToCanvas(
  targetCtx: CanvasRenderingContext2D,
  W: number,
  H: number,
  options: {
    clockSec: number;
    progress: number;
    sceneIdx?: number;
    cameraMotion?: string;
    isSpeaking: boolean;
    mode: 'full-stage' | 'pip-host';
  }
): boolean {
  const { clockSec, progress, sceneIdx = 0, cameraMotion = 'orbit', isSpeaking, mode } = options;

  if (mode === 'full-stage') {
    const rw = Math.min(1280, W);
    const rh = Math.round((rw * H) / W);
    const rig = getOrCreateThreeRig(rw, rh);
    if (!rig) return false;

    rig.stageEnvGroup.visible = true;
    const activeVariant = sceneIdx % rig.propGroups.length;
    rig.propGroups.forEach((pg, idx) => {
      pg.visible = idx === activeVariant;
      if (pg.visible) {
        pg.rotation.y = clockSec * 0.55 + idx;
        pg.position.y = (idx === 2 ? 0.35 : 0.85) + Math.sin(clockSec * 1.6) * 0.08;
      }
    });

    rig.avatarGroup.position.set(-1.15, -0.05 + Math.sin(clockSec * 2.2) * 0.025, 0.2);
    rig.avatarGroup.rotation.y = 0.24 + Math.sin(clockSec * 0.9) * 0.06;

    let camX = Math.sin(progress * Math.PI * 1.2 + sceneIdx * 0.6) * 0.55;
    let camY = 1.15 + Math.sin(clockSec * 0.8) * 0.06;
    let camZ = 4.65 - progress * 0.65;
    if (cameraMotion === 'dolly-in') {
      camX = 0.15;
      camZ = 5.0 - progress * 1.1;
    } else if (cameraMotion === 'dolly-out') {
      camX = -0.15;
      camZ = 3.9 + progress * 0.95;
    } else if (cameraMotion === 'crane-up') {
      camY = 0.75 + progress * 0.9;
      camZ = 4.55;
    }
    rig.camera.position.set(camX, camY, camZ);
    rig.camera.lookAt(0.15, 0.68, -0.1);

    rig.coreMesh.rotation.y = clockSec * 0.95;
    rig.coreMesh.rotation.x = Math.sin(clockSec * 0.7) * 0.3;
    rig.ring1.rotation.z = clockSec * 1.1;
    rig.ring2.rotation.z = -clockSec * 0.8;
    rig.particles.rotation.y = clockSec * 0.08;

    animateCharacterRig(rig, clockSec, isSpeaking);
    rig.renderer.render(rig.scene, rig.camera);

    targetCtx.save();
    targetCtx.drawImage(rig.canvas, 0, 0, W, H);
    targetCtx.restore();
    return true;
  }

  const isPortrait = W < H;
  const cardW = isPortrait ? Math.round(W * 0.28) : Math.round(W * 0.155);
  const cardH = Math.round(cardW * 1.15);
  const rig = getOrCreateThreeRig(360, Math.round(360 * 1.15));
  if (!rig) return false;

  rig.stageEnvGroup.visible = false;
  rig.avatarGroup.position.set(0, -0.12 + Math.sin(clockSec * 2.4) * 0.02, 0);
  rig.avatarGroup.rotation.y = Math.sin(clockSec * 1.1) * 0.08;
  rig.camera.position.set(0, 0.88, 2.55);
  rig.camera.lookAt(0, 0.78, 0);

  animateCharacterRig(rig, clockSec, isSpeaking);
  rig.renderer.render(rig.scene, rig.camera);

  const x = W * 0.025;
  const y = H - H * 0.135 - cardH;

  targetCtx.save();
  const backdrop = targetCtx.createLinearGradient(x, y, x + cardW, y + cardH);
  backdrop.addColorStop(0, 'rgba(15, 23, 42, 0.92)');
  backdrop.addColorStop(1, 'rgba(8, 47, 73, 0.88)');
  targetCtx.fillStyle = backdrop;
  targetCtx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
  targetCtx.lineWidth = Math.max(1.5, W * 0.0014);
  targetCtx.beginPath();
  targetCtx.roundRect(x, y, cardW, cardH, Math.round(cardW * 0.11));
  targetCtx.fill();
  targetCtx.stroke();

  targetCtx.beginPath();
  targetCtx.roundRect(x, y, cardW, cardH, Math.round(cardW * 0.11));
  targetCtx.clip();

  targetCtx.drawImage(rig.canvas, x, y, cardW, cardH);

  const pillH = Math.max(20, Math.round(cardH * 0.12));
  targetCtx.fillStyle = 'rgba(2, 132, 199, 0.92)';
  targetCtx.fillRect(x, y + cardH - pillH, cardW, pillH);
  targetCtx.fillStyle = '#ffffff';
  targetCtx.font = `700 ${Math.max(9, Math.round(pillH * 0.48))}px Inter, system-ui, sans-serif`;
  targetCtx.textAlign = 'center';
  targetCtx.textBaseline = 'middle';
  targetCtx.fillText('THREE.JS 3D • LIP-SYNC', x + cardW / 2, y + cardH - pillH / 2);

  targetCtx.restore();
  return true;
}

function animateCharacterRig(rig: ThreeRigHandles, clockSec: number, isSpeaking: boolean): void {
  rig.headGroup.rotation.y = Math.sin(clockSec * 1.15) * 0.09;
  rig.headGroup.rotation.z = Math.sin(clockSec * 1.7) * 0.045;
  rig.headGroup.rotation.x = Math.sin(clockSec * 2.1) * 0.035;

  const blinkWave = Math.sin(clockSec * 1.85);
  const blinkAngle = blinkWave > 0.94 ? -0.05 : -Math.PI * 0.44;
  rig.leftEyelid.rotation.x = blinkAngle;
  rig.rightEyelid.rotation.x = blinkAngle;

  const visemeWeights = analyzeRealtimeVisemeWeights(clockSec, isSpeaking);
  rig.jawGroup.scale.set(visemeWeights.smileWidthX, visemeWeights.jawScaleY, 1.0);

  rig.leftArmGroup.rotation.z = 0.18 + Math.sin(clockSec * 2.8) * 0.12;
  rig.leftArmGroup.rotation.x = -0.35 + Math.sin(clockSec * 3.4) * 0.18;
  rig.rightArmGroup.rotation.z = -0.18 - Math.cos(clockSec * 2.5) * 0.14;
  rig.rightArmGroup.rotation.x = -0.45 + Math.cos(clockSec * 3.9) * 0.22;
}

export interface CountrysideFableStageOptions {
  clockSec: number;
  progress: number;
  sceneIdx: number;
  speakerId?: string;
  cameraAngle?: string;
  isSpeaking?: boolean;
}

interface CountrysideActors {
  boyGroup: THREE.Group;
  boyHead: THREE.Group;
  boyJaw: THREE.Group;
  boyRightArm: THREE.Group;
  boyLeftArm: THREE.Group;
  boyHammer: THREE.Mesh;
  boyEyelids: [THREE.Mesh, THREE.Mesh];
  cowGroup: THREE.Group;
  cowHead: THREE.Group;
  cowJaw: THREE.Group;
  cowTail: THREE.Mesh;
  cowBell: THREE.Mesh;
  bunnyGroup: THREE.Group;
  bunnyHead: THREE.Group;
  bunnyJaw: THREE.Group;
  bunnyEars: [THREE.Mesh, THREE.Mesh];
  bunnyRightArm: THREE.Group;
  henGroup: THREE.Group;
  chicks: THREE.Group[];
  looseDoorGroup: THREE.Group;
  repairedPlankGroup: THREE.Group;
  foliageCanopies: THREE.Mesh[];
  pollenPoints: THREE.Points;
}

interface CountrysideRigHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  actors: CountrysideActors;
}

let cachedCountrysideRig: CountrysideRigHandles | null = null;

function createExpressiveEyes(
  headGroup: THREE.Group,
  eyeY: number,
  eyeZ: number,
  eyeSep: number,
  eyeRadius = 0.085
): [THREE.Mesh, THREE.Mesh] {
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
  const irisMat = new THREE.MeshPhysicalMaterial({ color: 0x3b2f2f, roughness: 0.1, clearcoat: 1.0 });
  const specMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0xfde2c8, roughness: 0.45 });

  const lids: THREE.Mesh[] = [];
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius, 20, 20), scleraMat);
    eye.position.set(side * eyeSep, eyeY, eyeZ);
    headGroup.add(eye);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.62, 16, 16), irisMat);
    iris.position.set(side * eyeSep, eyeY, eyeZ + eyeRadius * 0.55);
    headGroup.add(iris);

    const spec = new THREE.Mesh(new THREE.SphereGeometry(eyeRadius * 0.24, 10, 10), specMat);
    spec.position.set(side * eyeSep + eyeRadius * 0.22, eyeY + eyeRadius * 0.24, eyeZ + eyeRadius * 0.96);
    headGroup.add(spec);

    const lid = new THREE.Mesh(
      new THREE.SphereGeometry(eyeRadius * 1.12, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      lidMat
    );
    lid.position.set(side * eyeSep, eyeY, eyeZ);
    lid.rotation.x = -Math.PI * 0.46;
    headGroup.add(lid);
    lids.push(lid);
  }
  return [lids[0], lids[1]];
}

function getOrCreateCountrysideRig(width: number, height: number): CountrysideRigHandles | null {
  if (typeof document === 'undefined') return null;
  if (!cachedCountrysideRig) {
    try {
      const canvas = createOffscreenCanvas(width, height);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.14;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x93c5fd);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.022);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 140);
      camera.position.set(0, 2.3, 9.2);

      // Lighting (Pixar Warm Sunny Meadow Key + Cool Sky Fill + Rim Light)
      const hemi = new THREE.HemisphereLight(0xf0f9ff, 0x3f6212, 1.38);
      scene.add(hemi);

      const sunLight = new THREE.DirectionalLight(0xfff1c9, 2.45);
      sunLight.position.set(8, 12, 7);
      scene.add(sunLight);

      const addContactShadow = (parent: THREE.Group, rx: number, rz: number) => {
        const disc = new THREE.Mesh(
          new THREE.CircleGeometry(1, 24),
          new THREE.MeshBasicMaterial({ color: 0x1a2e05, transparent: true, opacity: 0.28 })
        );
        disc.rotation.x = -Math.PI / 2;
        disc.scale.set(rx, rz, 1);
        disc.position.y = 0.03;
        parent.add(disc);
      };

      const rimLight = new THREE.PointLight(0xfbbf24, 5.0, 25);
      rimLight.position.set(-5, 3.8, -4);
      scene.add(rimLight);

      // Sun & Fluffy Clouds
      const sunDisc = new THREE.Mesh(
        new THREE.SphereGeometry(2.4, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      sunDisc.position.set(14, 11.5, -24);
      scene.add(sunDisc);

      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      [[-9, 7.2, -16], [1.5, 8.5, -20], [9.5, 6.8, -15]].forEach(([cx, cy, cz]) => {
        const cg = new THREE.Group();
        cg.position.set(cx, cy, cz);
        [[0, 0, 0, 1.1], [0.95, -0.15, 0.2, 0.8], [-0.95, -0.2, 0.1, 0.78]].forEach(([ox, oy, oz, r]) => {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 16), cloudMat);
          puff.position.set(ox, oy, oz);
          cg.add(puff);
        });
        scene.add(cg);
      });

      // Rolling Green Hills & Dirt Village Path
      const meadowMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.85 });
      const ground = new THREE.Mesh(new THREE.CylinderGeometry(28, 30, 1.0, 48), meadowMat);
      ground.position.y = -0.5;
      ground.receiveShadow = true;
      scene.add(ground);

      const distantHillMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.9 });
      [[-10, 0.4, -14, 7.5], [0, 0.9, -17, 9.2], [11, 0.5, -13, 6.8]].forEach(([hx, hy, hz, r]) => {
        const hill = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), distantHillMat);
        hill.position.set(hx, hy - 0.6, hz);
        hill.scale.set(1.4, 0.42, 0.8);
        scene.add(hill);
      });

      const dirtRoad = new THREE.Mesh(
        new THREE.BoxGeometry(3.8, 0.06, 16),
        new THREE.MeshStandardMaterial({ color: 0xd6a674, roughness: 0.92 })
      );
      dirtRoad.position.set(-0.2, 0.015, 1.2);
      dirtRoad.rotation.y = 0.14;
      dirtRoad.receiveShadow = true;
      scene.add(dirtRoad);

      // Crystal Village Creek & Wooden Footbridge
      const creek = new THREE.Mesh(
        new THREE.BoxGeometry(2.8, 0.08, 22),
        new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, roughness: 0.12, metalness: 0.1, clearcoat: 1.0 })
      );
      creek.position.set(5.4, 0.01, 0);
      creek.rotation.y = -0.22;
      scene.add(creek);

      // Wooden Barn & Fence (Subject of "Mất bò mới lo làm chuồng")
      const barnGroup = new THREE.Group();
      barnGroup.position.set(-3.2, 0, -2.8);
      barnGroup.rotation.y = 0.25;
      scene.add(barnGroup);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.72 });
      const lightWoodMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75 });

      const barnBody = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.3, 2.6), lightWoodMat);
      barnBody.position.y = 1.15;
      barnBody.castShadow = true;
      barnBody.receiveShadow = true;
      barnGroup.add(barnBody);

      const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.35, 4), roofMat);
      barnRoof.position.y = 2.95;
      barnRoof.rotation.y = Math.PI / 4;
      barnRoof.castShadow = true;
      barnGroup.add(barnRoof);

      // Barn Doorway Frame
      [-0.75, 0.75].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.65, 0.22), woodMat);
        post.position.set(px, 0.82, 1.32);
        barnGroup.add(post);
      });

      // Loose/broken door (visible when fence is unfixed)
      const looseDoorGroup = new THREE.Group();
      looseDoorGroup.position.set(-0.68, 0.78, 1.42);
      const looseDoor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 0.1), woodMat);
      looseDoor.position.set(0.66, 0, 0);
      looseDoor.castShadow = true;
      looseDoorGroup.add(looseDoor);
      barnGroup.add(looseDoorGroup);

      // Repaired solid planks (visible in Scenes 6-7)
      const repairedPlankGroup = new THREE.Group();
      [0.35, 0.75, 1.15].forEach((py) => {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.18, 0.14), new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.55 }));
        plank.position.set(0, py, 1.44);
        plank.castShadow = true;
        repairedPlankGroup.add(plank);
      });
      barnGroup.add(repairedPlankGroup);

      // Yard Fence Posts around Barn
      const fencePosts: Array<[number, number]> = [[2.2, 0.5], [3.3, 0.5], [2.2, -1.6], [3.3, -1.6]];
      fencePosts.forEach(([fx, fz]) => {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.0, 10), woodMat);
        p.position.set(fx, 0.5, fz);
        p.castShadow = true;
        barnGroup.add(p);
      });
      const railTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 0.08), woodMat);
      railTop.position.set(2.75, 0.82, 0.5);
      barnGroup.add(railTop);

      // Stylized Banyan / Country Trees & Haystack
      const foliageCanopies: THREE.Mesh[] = [];
      const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.72 });
      const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.75 });
      [[-6.8, -3.5, 1.15], [3.4, -5.2, 1.25], [7.2, -2.4, 0.95]].forEach(([tx, tz, sc], idx) => {
        const treeG = new THREE.Group();
        treeG.position.set(tx, 0, tz);
        treeG.scale.setScalar(sc);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.2, 12), woodMat);
        trunk.position.y = 1.1;
        trunk.castShadow = true;
        treeG.add(trunk);
        const crownA = new THREE.Mesh(new THREE.SphereGeometry(1.35, 18, 16), idx % 2 === 0 ? leafMat1 : leafMat2);
        crownA.position.set(0, 2.55, 0);
        crownA.castShadow = true;
        treeG.add(crownA);
        const crownB = new THREE.Mesh(new THREE.SphereGeometry(0.95, 16, 14), leafMat1);
        crownB.position.set(0.75, 2.1, 0.25);
        treeG.add(crownB);
        foliageCanopies.push(crownA);
        scene.add(treeG);
      });

      const haystack = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 1.35, 18),
        new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.95 })
      );
      haystack.position.set(-5.6, 0.65, 0.4);
      haystack.castShadow = true;
      scene.add(haystack);

      // === CHARACTER 1: BÉ TÍ (Vietnamese Country Shepherd Boy) ===
      const boyGroup = new THREE.Group();
      boyGroup.position.set(-1.35, 0, 1.2);
      addContactShadow(boyGroup, 0.48, 0.42);
      scene.add(boyGroup);

      const shirtMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.65 }); // Áo bà ba nâu
      const skinMat = new THREE.MeshPhysicalMaterial({ color: 0xfcd5b5, roughness: 0.42, clearcoat: 0.2 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 });
      const hatMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.6 });

      const boyTorso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.42, 10, 16), shirtMat);
      boyTorso.position.y = 0.82;
      boyTorso.castShadow = true;
      boyGroup.add(boyTorso);

      [-0.14, 0.14].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.36, 8, 12), pantsMat);
        leg.position.set(lx, 0.3, 0);
        leg.castShadow = true;
        boyGroup.add(leg);
      });

      const boyLeftArm = new THREE.Group();
      boyLeftArm.position.set(-0.36, 1.02, 0);
      const bArmL = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 8, 12), shirtMat);
      bArmL.position.y = -0.18;
      boyLeftArm.add(bArmL);
      boyGroup.add(boyLeftArm);

      const boyRightArm = new THREE.Group();
      boyRightArm.position.set(0.36, 1.02, 0);
      const bArmR = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.34, 8, 12), shirtMat);
      bArmR.position.y = -0.18;
      boyRightArm.add(bArmR);
      const boyHammer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.12), new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.3 }));
      boyHammer.position.set(0.05, -0.4, 0.15);
      boyHammer.rotation.x = Math.PI * 0.4;
      boyHammer.visible = false;
      boyRightArm.add(boyHammer);
      boyGroup.add(boyRightArm);

      const boyHead = new THREE.Group();
      boyHead.position.set(0, 1.44, 0);
      boyGroup.add(boyHead);

      const bHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 24), skinMat);
      bHeadMesh.castShadow = true;
      boyHead.add(bHeadMesh);
      const boyEyelids = createExpressiveEyes(boyHead, 0.05, 0.28, 0.12, 0.072);

      // Conical Nón Lá on back / head
      const nonLa = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.32, 24, 1, true), hatMat);
      nonLa.position.set(0, 0.34, -0.04);
      nonLa.rotation.x = -0.18;
      nonLa.castShadow = true;
      boyHead.add(nonLa);

      const boyJaw = new THREE.Group();
      boyJaw.position.set(0, -0.13, 0.29);
      const bMouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0x991b1b }));
      boyJaw.add(bMouth);
      boyHead.add(boyJaw);

      // === CHARACTER 2: BÒ VÀNG (Golden Countryside Calf with Brass Bell) ===
      const cowGroup = new THREE.Group();
      cowGroup.position.set(1.2, 0, -0.6);
      addContactShadow(cowGroup, 0.72, 0.95);
      scene.add(cowGroup);

      const cowMat = new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, roughness: 0.48, clearcoat: 0.25 });
      const cowBellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.3 });

      const cowBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.85, 12, 20), cowMat);
      cowBody.rotation.x = Math.PI / 2;
      cowBody.position.y = 0.72;
      cowBody.castShadow = true;
      cowGroup.add(cowBody);

      [[-0.24, 0.36], [0.24, 0.36], [-0.24, -0.36], [0.24, -0.36]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.65, 12), cowMat);
        leg.position.set(lx, 0.32, lz);
        leg.castShadow = true;
        cowGroup.add(leg);
      });

      const cowTail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.025, 0.55, 8), cowMat);
      cowTail.position.set(0, 0.72, -0.82);
      cowTail.rotation.x = -0.45;
      cowGroup.add(cowTail);

      const cowHead = new THREE.Group();
      cowHead.position.set(0, 1.04, 0.75);
      cowGroup.add(cowHead);

      const cowSkull = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.58), cowMat);
      cowSkull.castShadow = true;
      cowHead.add(cowSkull);
      const cowMuzzle = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.24), cowBellyMat);
      cowMuzzle.position.set(0, -0.1, 0.34);
      cowHead.add(cowMuzzle);
      createExpressiveEyes(cowHead, 0.08, 0.26, 0.16, 0.068);

      [-0.22, 0.22].forEach((hx) => {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.26, 12), hornMat);
        horn.position.set(hx, 0.34, 0);
        horn.rotation.z = hx < 0 ? 0.42 : -0.42;
        cowHead.add(horn);
      });

      const cowJaw = new THREE.Group();
      cowJaw.position.set(0, -0.22, 0.35);
      cowJaw.add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.07, 0.12), new THREE.MeshStandardMaterial({ color: 0xbe123c })));
      cowHead.add(cowJaw);

      const cowBell = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.82, roughness: 0.2 }));
      cowBell.position.set(0, -0.34, 0.16);
      cowHead.add(cowBell);

      // === CHARACTER 3: THỎ BUN (Pixar Stylized Friendly Rabbit) ===
      const bunnyGroup = new THREE.Group();
      bunnyGroup.position.set(0.35, 0, 1.35);
      addContactShadow(bunnyGroup, 0.36, 0.34);
      scene.add(bunnyGroup);

      const bunnyFur = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.45, clearcoat: 0.15 });
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.55 });
      const pinkInner = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.5 });

      const bunBody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), vestMat);
      bunBody.position.y = 0.48;
      bunBody.scale.set(1.0, 1.25, 0.9);
      bunBody.castShadow = true;
      bunnyGroup.add(bunBody);

      const bunnyRightArm = new THREE.Group();
      bunnyRightArm.position.set(0.28, 0.62, 0.05);
      const brArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.22, 8, 12), bunnyFur);
      brArm.position.y = -0.12;
      bunnyRightArm.add(brArm);
      bunnyGroup.add(bunnyRightArm);

      const bunnyHead = new THREE.Group();
      bunnyHead.position.set(0, 0.96, 0);
      bunnyGroup.add(bunnyHead);
      const bSkull = new THREE.Mesh(new THREE.SphereGeometry(0.26, 22, 22), bunnyFur);
      bSkull.castShadow = true;
      bunnyHead.add(bSkull);
      createExpressiveEyes(bunnyHead, 0.04, 0.22, 0.1, 0.062);

      const bunnyNose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), pinkInner);
      bunnyNose.position.set(0, -0.02, 0.26);
      bunnyHead.add(bunnyNose);

      const earL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.34, 8, 12), bunnyFur);
      earL.position.set(-0.1, 0.38, -0.02);
      earL.rotation.z = 0.18;
      bunnyHead.add(earL);
      const earR = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.34, 8, 12), bunnyFur);
      earR.position.set(0.1, 0.38, -0.02);
      earR.rotation.z = -0.18;
      bunnyHead.add(earR);

      const bunnyJaw = new THREE.Group();
      bunnyJaw.position.set(0, -0.11, 0.23);
      bunnyJaw.add(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.05, 0.05), pinkInner));
      bunnyHead.add(bunnyJaw);

      // === CHARACTER 4: ĐÀN GÀ CON MỚI NỞ & GÀ MẸ (Inspired by Glow Studios VQ0oiaUaROE) ===
      const henGroup = new THREE.Group();
      henGroup.position.set(2.25, 0, 1.55);
      addContactShadow(henGroup, 0.42, 0.48);
      scene.add(henGroup);

      const chickGold = new THREE.MeshPhysicalMaterial({ color: 0xfde047, roughness: 0.38, clearcoat: 0.35 });
      const orangeBeak = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
      const redComb = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.45 });

      const henBody = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 20), new THREE.MeshStandardMaterial({ color: 0xfff7ed, roughness: 0.5 }));
      henBody.position.y = 0.36;
      henBody.scale.set(1.0, 0.95, 1.25);
      henBody.castShadow = true;
      henGroup.add(henBody);
      const henHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), new THREE.MeshStandardMaterial({ color: 0xfff7ed }));
      henHead.position.set(0, 0.62, 0.18);
      henGroup.add(henHead);
      const henComb = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.16), redComb);
      henComb.position.set(0, 0.78, 0.18);
      henGroup.add(henComb);
      const henBeak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), orangeBeak);
      henBeak.position.set(0, 0.6, 0.38);
      henBeak.rotation.x = Math.PI / 2;
      henGroup.add(henBeak);

      const chicks: THREE.Group[] = [];
      [[-0.65, 0.42], [-0.32, 0.65], [0.15, 0.72], [0.55, 0.48], [0.82, 0.12]].forEach(([ox, oz]) => {
        const ch = new THREE.Group();
        ch.position.set(ox, 0, oz);
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), chickGold);
        body.position.y = 0.16;
        body.castShadow = true;
        ch.add(body);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), chickGold);
        head.position.set(0, 0.31, 0.05);
        ch.add(head);
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.075, 8), orangeBeak);
        beak.position.set(0, 0.3, 0.16);
        beak.rotation.x = Math.PI / 2;
        ch.add(beak);
        createExpressiveEyes(ch, 0.34, 0.12, 0.045, 0.022);
        henGroup.add(ch);
        chicks.push(ch);
      });

      // Golden Sunlight Pollen Motes
      const mCount = 140;
      const mPos = new Float32Array(mCount * 3);
      for (let i = 0; i < mCount; i++) {
        mPos[i * 3] = Math.sin(i * 19.3) * 8.5;
        mPos[i * 3 + 1] = 0.5 + ((Math.cos(i * 41.7) + 1) * 0.5) * 4.5;
        mPos[i * 3 + 2] = Math.sin(i * 73.1) * 6.5;
      }
      const mGeo = new THREE.BufferGeometry();
      mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
      const pollenPoints = new THREE.Points(
        mGeo,
        new THREE.PointsMaterial({ color: 0xfef08a, size: 0.075, transparent: true, opacity: 0.75 })
      );
      scene.add(pollenPoints);

      cachedCountrysideRig = {
        renderer,
        scene,
        camera,
        canvas,
        actors: {
          boyGroup,
          boyHead,
          boyJaw,
          boyRightArm,
          boyLeftArm,
          boyHammer,
          boyEyelids,
          cowGroup,
          cowHead,
          cowJaw,
          cowTail,
          cowBell,
          bunnyGroup,
          bunnyHead,
          bunnyJaw,
          bunnyEars: [earL, earR],
          bunnyRightArm,
          henGroup,
          chicks,
          looseDoorGroup,
          repairedPlankGroup,
          foliageCanopies,
          pollenPoints,
        },
      };
    } catch {
      return null;
    }
  } else if (cachedCountrysideRig.canvas.width !== width || cachedCountrysideRig.canvas.height !== height) {
    cachedCountrysideRig.canvas.width = width;
    cachedCountrysideRig.canvas.height = height;
    cachedCountrysideRig.renderer.setSize(width, height, false);
    cachedCountrysideRig.camera.aspect = width / Math.max(1, height);
    cachedCountrysideRig.camera.updateProjectionMatrix();
  }
  return cachedCountrysideRig;
}

/**
 * Renders the Pixar-inspired Vietnamese Countryside & Chicks 3D WebGL2 World directly to 2D Canvas.
 */
export function renderPixarCountrysideStageToCanvas(
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: CountrysideFableStageOptions
): boolean {
  const W = Math.max(640, Math.round(width));
  const H = Math.max(360, Math.round(height));
  const rig = getOrCreateCountrysideRig(W, H);
  if (!rig) return false;

  const { clockSec, progress, sceneIdx, speakerId = 'be-ti', cameraAngle = 'master-shot', isSpeaking = true } = options;
  const a = rig.actors;

  // Story continuity states across Scenes 1..7 (Scene index 0..6):
  // Scenes 0..2: Gate dangling loose; Scene 3..4: Cow wanders far across field, boy panics; Scenes 5..6: Repairing barn & joyful dance
  const isGateBroken = sceneIdx <= 4;
  const isCowLost = sceneIdx === 3 || sceneIdx === 4;
  const isRepairing = sceneIdx === 5;
  const isHappyFinale = sceneIdx >= 6;

  a.looseDoorGroup.visible = isGateBroken;
  a.looseDoorGroup.rotation.y = isGateBroken ? -0.45 + Math.sin(clockSec * 2.2) * 0.08 : 0;
  a.looseDoorGroup.rotation.z = sceneIdx >= 2 && isGateBroken ? -0.22 : -0.05;
  a.repairedPlankGroup.visible = !isGateBroken;

  a.boyHammer.visible = isRepairing;
  a.boyRightArm.rotation.x = isRepairing
    ? -0.95 - Math.abs(Math.sin(clockSec * 7.5)) * 0.9
    : -0.25 + (speakerId === 'be-ti' ? Math.sin(clockSec * 4.2) * 0.35 : 0);
  a.boyLeftArm.rotation.x = isHappyFinale ? -2.2 + Math.sin(clockSec * 6.0) * 0.3 : -0.2 + Math.cos(clockSec * 2.1) * 0.15;

  a.boyGroup.position.set(
    isRepairing ? -2.55 : -1.35 + Math.sin(clockSec * 1.1) * 0.08,
    isHappyFinale ? Math.abs(Math.sin(clockSec * 5.2)) * 0.16 : 0,
    isRepairing ? -1.1 : 1.15
  );
  a.boyGroup.rotation.y = isRepairing ? -2.4 : speakerId === 'tho-bun' ? 0.55 : 0.25;

  // Cow movement per scene story arc
  if (isCowLost) {
    a.cowGroup.position.set(4.5 + progress * 2.6, 0, -4.8 - progress * 1.8);
    a.cowGroup.rotation.y = 1.2 + Math.sin(clockSec * 1.5) * 0.12;
  } else if (isHappyFinale) {
    a.cowGroup.position.set(-2.3, 0, -0.6 + Math.sin(clockSec * 2.0) * 0.15);
    a.cowGroup.rotation.y = 0.25;
  } else {
    a.cowGroup.position.set(-2.6 + (sceneIdx === 2 ? progress * 2.1 : 0), 0, -0.75 + (sceneIdx === 2 ? progress * 1.4 : 0));
    a.cowGroup.rotation.y = 0.4 + Math.sin(clockSec * 1.3) * 0.1;
  }
  a.cowTail.rotation.z = Math.sin(clockSec * 5.5) * 0.35;
  a.cowBell.rotation.z = Math.sin(clockSec * 6.2) * 0.22;
  a.cowHead.rotation.y = Math.sin(clockSec * 1.6) * 0.16;

  // Bunny & Chicks liveliness (Inspired by Glow Studios)
  a.bunnyGroup.position.set(0.45, isHappyFinale || speakerId === 'tho-bun' ? Math.abs(Math.sin(clockSec * 5.6)) * 0.12 : 0, 1.35);
  a.bunnyGroup.rotation.y = speakerId === 'be-ti' ? -0.45 : -0.2;
  a.bunnyEars[0].rotation.z = 0.18 + Math.sin(clockSec * 4.5) * 0.14;
  a.bunnyEars[1].rotation.z = -0.18 - Math.cos(clockSec * 4.5) * 0.14;
  a.bunnyRightArm.rotation.x = speakerId === 'tho-bun' ? -0.75 + Math.sin(clockSec * 5.5) * 0.35 : -0.2;

  a.henGroup.position.set(2.1 + Math.sin(clockSec * 0.7) * 0.25, 0, 1.45 + Math.cos(clockSec * 0.7) * 0.15);
  a.henGroup.rotation.y = -0.45 + Math.sin(clockSec * 1.2) * 0.15;
  a.chicks.forEach((ch, idx) => {
    ch.position.y = Math.abs(Math.sin(clockSec * 6.8 + idx * 1.15)) * (speakerId === 'dan-ga-con' || isHappyFinale ? 0.18 : 0.08);
    ch.rotation.y = Math.sin(clockSec * 3.1 + idx) * 0.45;
  });

  // Blinking & Wawa-Lipsync Viseme Jaw weights
  const isBlink = Math.sin(clockSec * 2.1) > 0.94;
  a.boyEyelids.forEach((lid) => {
    lid.rotation.x = isBlink ? 0.05 : -Math.PI * 0.46;
  });
  const viseme = analyzeRealtimeVisemeWeights(clockSec, isSpeaking);
  a.boyJaw.scale.set(viseme.smileWidthX, speakerId === 'be-ti' || isHappyFinale ? viseme.jawScaleY : 0.45, 1.0);
  a.bunnyJaw.scale.set(viseme.smileWidthX, speakerId === 'tho-bun' || isHappyFinale ? viseme.jawScaleY : 0.45, 1.0);
  a.cowJaw.scale.set(1.0, speakerId === 'bo-vang' ? viseme.jawScaleY : 0.4 + Math.abs(Math.sin(clockSec * 2.4)) * 0.35, 1.0);

  a.foliageCanopies.forEach((c, idx) => {
    c.rotation.z = Math.sin(clockSec * 1.2 + idx) * 0.035;
  });
  a.pollenPoints.rotation.y = clockSec * 0.04;

  // Camera framing matching shot grammar
  let camPos: [number, number, number] = [0.2, 2.55, 8.6];
  let lookTarget: [number, number, number] = [0.0, 0.95, 0.0];

  if (cameraAngle === 'close-up-speaker') {
    if (speakerId === 'dan-ga-con') {
      camPos = [2.6, 1.15, 4.2];
      lookTarget = [2.1, 0.45, 1.5];
    } else if (speakerId === 'tho-bun') {
      camPos = [0.95, 1.25, 3.6];
      lookTarget = [0.45, 0.85, 1.35];
    } else if (speakerId === 'bo-vang') {
      camPos = [0.6, 1.55, 4.8];
      lookTarget = [a.cowGroup.position.x, 0.95, a.cowGroup.position.z];
    } else {
      camPos = [-1.1, 1.7, 3.8];
      lookTarget = [-1.35, 1.25, 1.15];
    }
  } else if (cameraAngle === 'two-shot') {
    camPos = [0.4 - progress * 0.65, 1.75, 5.15];
    lookTarget = [isRepairing ? -2.2 : -0.45, 0.9, isRepairing ? -1.4 : 1.2];
  } else if (cameraAngle === 'over-the-shoulder') {
    camPos = [-2.5, 1.9, 3.3];
    lookTarget = [2.2, 0.85, -1.8];
  } else if (cameraAngle === 'shot-reverse-shot') {
    camPos = [1.85 + Math.sin(progress * Math.PI) * 0.6, 1.45, 4.7];
    lookTarget = [0.1, 0.9, 1.0];
  } else {
    // master-shot wide slow orbital glide
    camPos = [-0.6 + progress * 1.4, 2.65 - progress * 0.25, 8.8 - progress * 1.1];
    lookTarget = [0.0, 0.95, -0.2];
  }

  rig.camera.position.set(camPos[0], camPos[1], camPos[2]);
  rig.camera.lookAt(lookTarget[0], lookTarget[1], lookTarget[2]);
  rig.renderer.render(rig.scene, rig.camera);

  targetCtx.save();
  targetCtx.drawImage(rig.canvas, 0, 0, W, H);
  targetCtx.restore();
  return true;
}

export interface MotherDuckStageOptions {
  clockSec: number;
  progress: number;
  sceneIdx: number;
  cameraAngle?: string;
  isSpeaking?: boolean;
}

interface DucklingHandle {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftWing: THREE.Mesh;
  rightWing: THREE.Mesh;
  leftFoot: THREE.Mesh;
  rightFoot: THREE.Mesh;
  beakLower: THREE.Mesh;
  flowerHat?: THREE.Group;
}

interface MotherDuckRigHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  coopStageGroup: THREE.Group;
  coopDuckling: DucklingHandle;
  roosterStageGroup: THREE.Group;
  roosterGroup: THREE.Group;
  meadowStageGroup: THREE.Group;
  motherDuckRoot: THREE.Group;
  motherLeftWing: THREE.Group;
  motherRightWing: THREE.Group;
  motherBeakLower: THREE.Mesh;
  meadowDucklings: DucklingHandle[];
  pondStageGroup: THREE.Group;
  pondDucklings: DucklingHandle[];
  waterRipples: THREE.Mesh[];
  beeGroup: THREE.Group;
  beeWings: THREE.Mesh[];
  ferrisStageGroup: THREE.Group;
  ferrisWheelRim: THREE.Group;
  ferrisGondolas: Array<{ holder: THREE.Group; duck: DucklingHandle }>;
}

let cachedMotherDuckRig: MotherDuckRigHandles | null = null;

function createProceduralTexture(
  kind: 'wood' | 'wicker' | 'moss' | 'roof'
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  if (kind === 'wood') {
    ctx.fillStyle = '#c08b5c';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 42; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(110, 62, 26, 0.28)' : 'rgba(235, 198, 152, 0.22)';
      const y = (i * 19) % 256;
      ctx.beginPath();
      ctx.ellipse((i * 53) % 256, y, 75, 7 + (i % 5), 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(72, 36, 12, 0.45)';
    ctx.lineWidth = 3;
    for (let p = 64; p < 256; p += 64) {
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(256, p);
      ctx.stroke();
    }
  } else if (kind === 'wicker') {
    ctx.fillStyle = '#b99b6b';
    ctx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      for (let x = 0; x < 256; x += 24) {
        ctx.fillStyle = ((x / 24 + y / 16) % 2 === 0) ? '#d6bc8b' : '#8d6e42';
        ctx.fillRect(x + ((y / 16) % 2) * 8, y + 2, 18, 11);
      }
    }
  } else if (kind === 'moss') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 65; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(101, 163, 13, 0.42)' : i % 3 === 1 ? 'rgba(71, 85, 105, 0.35)' : 'rgba(226, 232, 240, 0.3)';
      ctx.beginPath();
      ctx.arc((i * 67) % 256, (i * 97) % 256, 8 + (i % 16), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#9a3412';
    for (let y = 0; y < 256; y += 32) {
      ctx.fillRect(0, y, 256, 6);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildDucklingActor(withFlowerHat = false): DucklingHandle {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 20),
    new THREE.MeshBasicMaterial({ color: 0x1a2e05, transparent: true, opacity: 0.26 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const yellowMat = new THREE.MeshPhysicalMaterial({ color: 0xfde047, roughness: 0.36, clearcoat: 0.25 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.45 });
  const orangeMat = new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.32, clearcoat: 0.4 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const tealIrisMat = new THREE.MeshPhysicalMaterial({ color: 0x0ea5e9, roughness: 0.1, clearcoat: 1.0 });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

  // Plump stylized duckling body + tail tip
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 22, 20), yellowMat);
  body.scale.set(0.95, 1.05, 1.15);
  body.position.set(0, 0.34, 0);
  bodyGroup.add(body);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 12), yellowMat);
  tail.position.set(0, 0.38, -0.26);
  tail.rotation.x = -Math.PI * 0.38;
  bodyGroup.add(tail);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 22), bellyMat);
  head.position.set(0, 0.64, 0.05);
  bodyGroup.add(head);

  // 3-tuft head feathers matching reference Vịt Con Lông Vàng
  [-0.05, 0, 0.05].forEach((tx, idx) => {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.13 + (idx === 1 ? 0.03 : 0), 8), yellowMat);
    tuft.position.set(tx, 0.87, 0.04);
    tuft.rotation.z = -tx * 3.5;
    tuft.rotation.x = -0.2;
    bodyGroup.add(tuft);
  });

  // Glossy big expressive eyes + cute arched eyebrows + eye catchlight + rosy cheeks
  const browMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55 });
  const cheekMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.65 });
  [-1, 1].forEach((side) => {
    const sc = new THREE.Mesh(new THREE.SphereGeometry(0.056, 16, 16), scleraMat);
    sc.position.set(side * 0.085, 0.68, 0.21);
    bodyGroup.add(sc);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.039, 14, 14), tealIrisMat);
    ir.position.set(side * 0.085, 0.68, 0.238);
    bodyGroup.add(ir);
    const pu = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), pupilMat);
    pu.position.set(side * 0.085, 0.68, 0.258);
    bodyGroup.add(pu);
    const sparkle = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), scleraMat);
    sparkle.position.set(side * 0.095, 0.695, 0.268);
    bodyGroup.add(sparkle);
    const brow = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 6, 12, Math.PI * 0.72), browMat);
    brow.position.set(side * 0.085, 0.72, 0.215);
    brow.rotation.z = side > 0 ? 0.28 : 0.45;
    brow.rotation.y = side * 0.15;
    bodyGroup.add(brow);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), cheekMat);
    cheek.scale.set(1.2, 0.75, 0.45);
    cheek.position.set(side * 0.145, 0.595, 0.175);
    bodyGroup.add(cheek);
  });

  // Flat broad duck beak (upper + articulated lower beak)
  const beakUpper = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), orangeMat);
  beakUpper.scale.set(1.25, 0.42, 1.35);
  beakUpper.position.set(0, 0.6, 0.27);
  bodyGroup.add(beakUpper);

  const beakLower = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 10), orangeMat);
  beakLower.scale.set(1.15, 0.35, 1.2);
  beakLower.position.set(0, 0.56, 0.25);
  bodyGroup.add(beakLower);

  // Articulated flapping wings
  const leftWing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), yellowMat);
  leftWing.scale.set(0.35, 0.85, 1.35);
  leftWing.position.set(-0.24, 0.36, -0.02);
  bodyGroup.add(leftWing);

  const rightWing = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), yellowMat);
  rightWing.scale.set(0.35, 0.85, 1.35);
  rightWing.position.set(0.24, 0.36, -0.02);
  bodyGroup.add(rightWing);

  // Orange webbed feet
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.18), orangeMat);
  leftFoot.position.set(-0.1, 0.05, 0.06);
  bodyGroup.add(leftFoot);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.18), orangeMat);
  rightFoot.position.set(0.1, 0.05, 0.06);
  bodyGroup.add(rightFoot);

  let flowerHat: THREE.Group | undefined;
  if (withFlowerHat) {
    flowerHat = new THREE.Group();
    flowerHat.position.set(0, 0.84, 0.03);
    const petalRedA = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.36, clearcoat: 0.25 });
    const petalRedB = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.42, clearcoat: 0.2 });
    const calyxMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });

    // 8 fluted overlapping flower petals forming a charming scalloped blossom cap
    for (let p = 0; p < 8; p++) {
      const ang = (p / 8) * Math.PI * 2;
      const petalHolder = new THREE.Group();
      petalHolder.rotation.y = ang;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), p % 2 === 0 ? petalRedA : petalRedB);
      petal.scale.set(0.88, 0.28, 1.55);
      petal.position.set(0, 0.02, 0.17);
      petal.rotation.x = 0.32 + (p % 2) * 0.06;
      petalHolder.add(petal);
      flowerHat.add(petalHolder);
    }

    // 5-pointed star green calyx cup on top of petals
    for (let c = 0; c < 5; c++) {
      const ang = (c / 5) * Math.PI * 2 + 0.2;
      const sepalHolder = new THREE.Group();
      sepalHolder.rotation.y = ang;
      const sepal = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.16, 8), calyxMat);
      sepal.rotation.x = 1.15;
      sepal.position.set(0, 0.095, 0.08);
      sepalHolder.add(sepal);
      flowerHat.add(sepalHolder);
    }

    const calyxBase = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), calyxMat);
    calyxBase.scale.set(1.1, 0.65, 1.1);
    calyxBase.position.y = 0.095;
    flowerHat.add(calyxBase);

    // Curved organic green stem + tiny leaf
    const stemCurve = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 12, Math.PI * 0.65), calyxMat);
    stemCurve.position.set(0.075, 0.145, 0);
    stemCurve.rotation.z = 1.75;
    flowerHat.add(stemCurve);

    bodyGroup.add(flowerHat);
  }

  return {
    root,
    bodyGroup,
    leftWing,
    rightWing,
    leftFoot,
    rightFoot,
    beakLower,
    flowerHat,
  };
}

function getOrCreateMotherDuckRig(width: number, height: number): MotherDuckRigHandles | null {
  if (typeof document === 'undefined') return null;
  if (!cachedMotherDuckRig) {
    try {
      const canvas = createOffscreenCanvas(width, height);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = false;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbfe3ff);
      scene.fog = new THREE.FogExp2(0xdbeafe, 0.015);

      const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);

      // Morning Glow Studio daylight
      scene.add(new THREE.HemisphereLight(0xf8fafc, 0x4d7c0f, 1.48));
      const sun = new THREE.DirectionalLight(0xfff7ed, 2.35);
      sun.position.set(7, 13, 8);
      scene.add(sun);
      const rim = new THREE.PointLight(0xfef08a, 4.0, 28);
      rim.position.set(-5, 4.5, -5);
      scene.add(rim);

      const woodTex = createProceduralTexture('wood');
      const wickerTex = createProceduralTexture('wicker');
      const mossTex = createProceduralTexture('moss');
      const roofTex = createProceduralTexture('roof');

      const woodMat = new THREE.MeshStandardMaterial({ map: woodTex || undefined, color: woodTex ? 0xffffff : 0xc08b5c, roughness: 0.72 });
      const wickerMat = new THREE.MeshStandardMaterial({ map: wickerTex || undefined, color: wickerTex ? 0xffffff : 0xb99b6b, roughness: 0.85, side: THREE.DoubleSide });
      const mossMat = new THREE.MeshStandardMaterial({ map: mossTex || undefined, color: mossTex ? 0xffffff : 0x94a3b8, roughness: 0.82 });
      const grassMat = new THREE.MeshStandardMaterial({ color: 0x76b82a, roughness: 0.85 });

      // Global distant bright clouds & sky hills
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [[-10, 8.5, -24], [3, 9.2, -26], [13, 7.6, -22]].forEach(([x, y, z]) => {
        const cg = new THREE.Group();
        cg.position.set(x, y, z);
        [[0, 0, 0, 1.4], [1.1, -0.2, 0, 1.0], [-1.1, -0.25, 0, 0.95]].forEach(([ox, oy, oz, r]) => {
          const p = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 14), cloudMat);
          p.position.set(ox, oy, oz);
          cg.add(p);
        });
        scene.add(cg);
      });

      // === STAGE 1: WOODEN DUCK COOP & WICKER NEST (0:05 Reference) ===
      const coopStageGroup = new THREE.Group();
      scene.add(coopStageGroup);

      const coopOuterGrass = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.6, 40), grassMat);
      coopOuterGrass.position.set(0, -0.35, 0);
      coopStageGroup.add(coopOuterGrass);

      // Exterior bamboo & bush silhouette visible around wooden coop doorway
      const coopLeafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
      [[-3.6, 1.4, -1.8], [-4.2, 2.2, -2.5], [3.8, 1.6, -2.0], [4.5, 2.4, -2.8]].forEach(([bx, by, bz]) => {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 12), coopLeafMat);
        bush.position.set(bx, by * 0.45, bz);
        coopStageGroup.add(bush);
      });

      const coopFloor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.24, 6.2), woodMat);
      coopFloor.position.set(0, -0.05, 0);
      coopStageGroup.add(coopFloor);

      // Warm sunlit honey-oak plank interior walls (zero black cave look)
      const warmCoopPlankMat = new THREE.MeshStandardMaterial({
        map: woodTex || undefined,
        color: 0xe6b88a,
        roughness: 0.78,
      });
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.2, 0.35), warmCoopPlankMat);
      backWall.position.set(0, 1.9, -1.75);
      coopStageGroup.add(backWall);

      [-3.35, 3.35].forEach((wx) => {
        const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.0, 2.8), warmCoopPlankMat);
        sideWall.position.set(wx, 1.85, -0.4);
        coopStageGroup.add(sideWall);
      });

      // Decorative sunny interior plank trim + cozy morning lantern glow inside coop
      const coopInnerGlow = new THREE.PointLight(0xffedd5, 6.2, 11);
      coopInnerGlow.position.set(0, 2.55, 0.15);
      coopStageGroup.add(coopInnerGlow);

      // Front arched doorway wall constructed from left, right, top pillars + thick curved wood arch
      const pillarL = new THREE.Mesh(new THREE.BoxGeometry(2.25, 3.65, 0.45), woodMat);
      pillarL.position.set(-2.35, 1.8, 0.72);
      coopStageGroup.add(pillarL);
      const pillarR = new THREE.Mesh(new THREE.BoxGeometry(2.25, 3.65, 0.45), woodMat);
      pillarR.position.set(2.35, 1.8, 0.72);
      coopStageGroup.add(pillarR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.95, 1.35, 0.45), woodMat);
      lintel.position.set(0, 3.25, 0.72);
      coopStageGroup.add(lintel);
      const stoneArch = new THREE.Mesh(
        new THREE.TorusGeometry(1.24, 0.25, 14, 36, Math.PI),
        new THREE.MeshStandardMaterial({ map: woodTex || undefined, color: 0xf1d5b5, roughness: 0.72 })
      );
      stoneArch.position.set(0, 1.5, 0.86);
      coopStageGroup.add(stoneArch);

      // Woven wicker nest bowl + thick braided rim + fluffy golden straw bedding
      const nestBowl = new THREE.Mesh(
        new THREE.SphereGeometry(1.22, 26, 18, 0, Math.PI * 2, Math.PI * 0.46, Math.PI * 0.54),
        wickerMat
      );
      nestBowl.scale.set(1.08, 0.65, 1.02);
      nestBowl.position.set(0, 1.12, -0.32);
      coopStageGroup.add(nestBowl);

      const nestRim = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.12, 10, 28), wickerMat);
      nestRim.rotation.x = Math.PI / 2;
      nestRim.scale.set(1.06, 1.0, 1.0);
      nestRim.position.set(0, 1.14, -0.32);
      coopStageGroup.add(nestRim);

      const strawMatA = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7 });
      const strawMatB = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.75 });
      for (let st = 0; st < 16; st++) {
        const ang = (st / 16) * Math.PI * 2;
        const wisp = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.018, 0.72, 6), st % 2 === 0 ? strawMatA : strawMatB);
        wisp.position.set(Math.cos(ang) * 0.65, 1.1, -0.32 + Math.sin(ang) * 0.55);
        wisp.rotation.set(Math.sin(ang) * 0.85, ang, Math.cos(ang) * 0.95);
        coopStageGroup.add(wisp);
      }

      const coopDuckling = buildDucklingActor(true);
      coopDuckling.root.position.set(0, 0.72, -0.32);
      coopDuckling.root.scale.setScalar(1.38);
      coopStageGroup.add(coopDuckling.root);

      // === STAGE 2: ROOSTER ON RED TILED ROOF (3:42 Reference) ===
      const roosterStageGroup = new THREE.Group();
      scene.add(roosterStageGroup);

      // Full countryside lawn, distant sunlit green hills, and rounded trees behind farmhouse
      const roosterLawn = new THREE.Mesh(new THREE.CylinderGeometry(26, 28, 0.6, 48), grassMat);
      roosterLawn.position.set(0, -0.3, 0);
      roosterStageGroup.add(roosterLawn);

      const roosterHill = new THREE.Mesh(
        new THREE.SphereGeometry(14, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.88 })
      );
      roosterHill.position.set(3.5, -2.4, -15);
      roosterHill.scale.set(1.7, 0.58, 0.9);
      roosterStageGroup.add(roosterHill);

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      const foliageA = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.72 });
      const foliageB = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      [[-5.8, -5.2, 1.35], [-4.4, -6.6, 1.65], [5.4, -4.8, 1.45], [6.8, -6.5, 1.8]].forEach(([tx, tz, ts], i) => {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.24 * ts, 0.34 * ts, 2.2 * ts, 10), trunkMat);
        tr.position.set(tx, 1.0 * ts, tz);
        roosterStageGroup.add(tr);
        const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.15 * ts, 16, 14), i % 2 === 0 ? foliageA : foliageB);
        canopy.position.set(tx, 2.55 * ts, tz);
        canopy.scale.set(1.15, 0.92, 1.0);
        roosterStageGroup.add(canopy);
      });

      const houseWallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.85 });
      const houseWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.0, 4.1), houseWallMat);
      houseWall.position.set(0, 1.5, 0);
      roosterStageGroup.add(houseWall);

      const stonePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.85, 0.55, 4.35), mossMat);
      stonePlinth.position.set(0, 0.27, 0);
      roosterStageGroup.add(stonePlinth);

      // Barn window on front wall
      const barnWindow = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.14), warmCoopPlankMat);
      barnWindow.position.set(0, 1.65, 2.04);
      roosterStageGroup.add(barnWindow);

      const redRoofMat = new THREE.MeshStandardMaterial({ map: roofTex || undefined, color: 0xdc2626, roughness: 0.65 });
      const barrelTileMat = new THREE.MeshPhysicalMaterial({ color: 0xb91c1c, roughness: 0.52, clearcoat: 0.15 });
      const tiledRoofL = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.34, 3.25), redRoofMat);
      tiledRoofL.position.set(0, 3.32, 0.86);
      tiledRoofL.rotation.x = 0.52;
      roosterStageGroup.add(tiledRoofL);

      const tiledRoofR = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.34, 3.25), redRoofMat);
      tiledRoofR.position.set(0, 3.32, -0.86);
      tiledRoofR.rotation.x = -0.52;
      roosterStageGroup.add(tiledRoofR);

      // 3D curved barrel terracotta roof tiles across front & back slopes
      for (let ti = -5; ti <= 5; ti++) {
        const frontTile = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 3.28, 10), barrelTileMat);
        frontTile.position.set(ti * 0.58, 3.45, 0.88);
        frontTile.rotation.set(0.52 + Math.PI / 2, 0, 0);
        roosterStageGroup.add(frontTile);
      }

      const ridgeBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6.6, 14), barrelTileMat);
      ridgeBeam.rotation.z = Math.PI / 2;
      ridgeBeam.position.set(0, 4.02, 0);
      roosterStageGroup.add(ridgeBeam);

      // Detailed Hero Rooster standing proudly on roof ridge
      const roosterGroup = new THREE.Group();
      roosterGroup.position.set(0, 4.18, 0);
      roosterStageGroup.add(roosterGroup);

      const roosterBodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0f766e, roughness: 0.28, metalness: 0.22, clearcoat: 0.65 });
      const roosterNeckMat = new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.38, clearcoat: 0.3 });
      const roosterRedMat = new THREE.MeshPhysicalMaterial({ color: 0xef4444, roughness: 0.32, clearcoat: 0.4 });
      const roosterGoldMat = new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.34, clearcoat: 0.25 });

      // Smooth legs & claws gripping ridge
      [-0.12, 0.12].forEach((lx) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.36, 10), orangeDuckMatStatic());
        leg.position.set(lx, 0.16, 0.03);
        roosterGroup.add(leg);
        const claw = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.18), orangeDuckMatStatic());
        claw.position.set(lx, 0.0, 0.07);
        roosterGroup.add(claw);
      });
      function orangeDuckMatStatic() {
        return new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      }

      const rBody = new THREE.Mesh(new THREE.SphereGeometry(0.42, 22, 20), roosterBodyMat);
      rBody.position.set(0, 0.58, -0.02);
      rBody.scale.set(0.9, 0.96, 1.28);
      roosterGroup.add(rBody);

      // Folded glossy wings
      [-1, 1].forEach((side) => {
        const rWing = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), roosterBodyMat);
        rWing.scale.set(0.32, 0.72, 1.38);
        rWing.position.set(side * 0.36, 0.56, -0.04);
        rWing.rotation.z = side * 0.18;
        roosterGroup.add(rWing);
      });

      // Smooth tapered neck + layered collar feathers blending chest to golden head (zero exposed cone seam)
      const rNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 0.52, 18), roosterNeckMat);
      rNeck.position.set(0, 0.92, 0.24);
      rNeck.rotation.x = 0.22;
      roosterGroup.add(rNeck);

      for (let cf = 0; cf < 8; cf++) {
        const ang = (cf / 8) * Math.PI * 2;
        const ruff = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.24, 8), roosterNeckMat);
        ruff.position.set(Math.sin(ang) * 0.24, 0.76, 0.2 + Math.cos(ang) * 0.22);
        ruff.rotation.set(Math.cos(ang) * 2.25, 0, -Math.sin(ang) * 0.45);
        roosterGroup.add(ruff);
      }

      const rHead = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 18), roosterGoldMat);
      rHead.position.set(0, 1.2, 0.33);
      roosterGroup.add(rHead);

      // 4-peak scalloped red comb
      [0.24, 0.31, 0.38, 0.44].forEach((cz, idx) => {
        const peak = new THREE.Mesh(new THREE.SphereGeometry(0.072 - idx * 0.008, 12, 12), roosterRedMat);
        peak.scale.set(0.55, 1.45, 0.85);
        peak.position.set(0, 1.41 + (idx === 1 ? 0.035 : idx === 2 ? 0.02 : 0), cz);
        roosterGroup.add(peak);
      });

      // Red wattles under beak
      [-0.04, 0.04].forEach((wx) => {
        const wattle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), roosterRedMat);
        wattle.scale.set(0.75, 1.45, 0.8);
        wattle.position.set(wx, 1.03, 0.46);
        roosterGroup.add(wattle);
      });

      // Crisp Rooster eyes
      [-1, 1].forEach((side) => {
        const eWhite = new THREE.Mesh(new THREE.SphereGeometry(0.048, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        eWhite.position.set(side * 0.12, 1.23, 0.44);
        roosterGroup.add(eWhite);
        const ePupil = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), new THREE.MeshBasicMaterial({ color: 0x09090b }));
        ePupil.position.set(side * 0.13, 1.23, 0.468);
        roosterGroup.add(ePupil);
      });

      const rBeak = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.21, 10), roosterGoldMat);
      rBeak.position.set(0, 1.16, 0.56);
      rBeak.rotation.x = Math.PI / 2;
      roosterGroup.add(rBeak);

      // Rich layered arched iridescent tail plumes fanning gracefully
      const tailPlumeSpecs = [
        { tx: -0.18, ry: -0.22, rad: 0.42, col: 0x06b6d4 },
        { tx: -0.09, ry: -0.1, rad: 0.52, col: 0x9333ea },
        { tx: 0.0, ry: 0.0, rad: 0.58, col: 0xf97316 },
        { tx: 0.09, ry: 0.1, rad: 0.52, col: 0x9333ea },
        { tx: 0.18, ry: 0.22, rad: 0.42, col: 0x0d9488 },
      ];
      tailPlumeSpecs.forEach(({ tx, ry, rad, col }) => {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(rad, 0.058, 10, 20, Math.PI * 1.15),
          new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.24, metalness: 0.28, clearcoat: 0.7 })
        );
        arc.rotation.y = Math.PI / 2 + ry;
        arc.position.set(tx, 0.96, -0.34);
        roosterGroup.add(arc);
      });

      // === STAGE 3: MEADOW EXERCISE CHOREOGRAPHY (0:51 & 1:29 Reference) ===
      const meadowStageGroup = new THREE.Group();
      scene.add(meadowStageGroup);

      const meadowLawn = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 0.6, 48), grassMat);
      meadowLawn.position.y = -0.3;
      meadowStageGroup.add(meadowLawn);
      const bgHill = new THREE.Mesh(new THREE.SphereGeometry(12, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48), new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.9 }));
      bgHill.position.set(4, -2.5, -14);
      bgHill.scale.set(1.6, 0.55, 0.9);
      meadowStageGroup.add(bgHill);

      // Segmented bamboo stalks with dark node rings + sprouting foliage + arching reeds behind Mother Duck
      const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.58 });
      const bambooNodeMat = new THREE.MeshStandardMaterial({ color: 0x1a2e05, roughness: 0.72 });
      const bambooLeafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.55 });
      [1.35, 2.15, 2.95, 3.75].forEach((bx, idx) => {
        const bz = -3.6 - idx * 0.18;
        const tilt = (idx - 1.5) * 0.04;
        const stalkGroup = new THREE.Group();
        stalkGroup.position.set(bx, 0, bz);
        stalkGroup.rotation.z = tilt;
        const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 7.6, 12), bambooMat);
        stalk.position.y = 3.2;
        stalkGroup.add(stalk);
        for (let ny = 0.85; ny <= 6.2; ny += 1.05) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175 - ny * 0.004, 0.032, 8, 16), bambooNodeMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = ny;
          stalkGroup.add(ring);
          if (ny >= 2.2) {
            const sideSign = (Math.round(ny) + idx) % 2 === 0 ? 1 : -1;
            const bLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), bambooLeafMat);
            bLeaf.scale.set(1.7, 0.22, 0.55);
            bLeaf.position.set(sideSign * 0.42, ny + 0.15, 0);
            bLeaf.rotation.z = sideSign * 0.38;
            stalkGroup.add(bLeaf);
          }
        }
        meadowStageGroup.add(stalkGroup);
      });

      const reedMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.62 });
      for (let b = 0; b < 9; b++) {
        const reedPivot = new THREE.Group();
        reedPivot.position.set(-2.9 + b * 0.32, 0, -3.25 - (b % 2) * 0.25);
        reedPivot.rotation.z = (b - 4) * 0.14;
        const blade = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), reedMat);
        blade.scale.set(0.55, 6.2 + (b % 3) * 0.8, 0.22);
        blade.position.y = 0.95;
        reedPivot.add(blade);
        meadowStageGroup.add(reedPivot);
      }

      // Moss-speckled grey rock podium encircled by 3D 6-petal daisies
      const rockPodium = new THREE.Mesh(new THREE.SphereGeometry(1.18, 22, 16), mossMat);
      rockPodium.scale.set(1.25, 0.42, 1.05);
      rockPodium.position.set(0, 0.08, -1.25);
      meadowStageGroup.add(rockPodium);

      const daisyCenterMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.45 });
      const daisyPetalMats = [
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: 0xf9a8d4, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: 0xfb923c, roughness: 0.4 }),
      ];
      for (let d = 0; d < 16; d++) {
        const ang = (d / 16) * Math.PI * 2;
        const dx = Math.cos(ang) * 1.48;
        const dz = -1.25 + Math.sin(ang) * 1.22;
        const flowerGroup = new THREE.Group();
        flowerGroup.position.set(dx, 0.04, dz);
        flowerGroup.rotation.x = 0.14 * Math.sin(ang);
        flowerGroup.rotation.z = -0.14 * Math.cos(ang);
        const fStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.16, 6), reedMat);
        fStem.position.y = 0.08;
        flowerGroup.add(fStem);
        const centerDisc = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 8), daisyCenterMat);
        centerDisc.scale.set(1, 0.6, 1);
        centerDisc.position.y = 0.17;
        flowerGroup.add(centerDisc);
        const pMat = daisyPetalMats[d % 3];
        for (let pt = 0; pt < 6; pt++) {
          const pAng = (pt / 6) * Math.PI * 2;
          const petal = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), pMat);
          petal.scale.set(0.75, 0.25, 1.55);
          petal.position.set(Math.sin(pAng) * 0.075, 0.165, Math.cos(pAng) * 0.075);
          petal.rotation.y = pAng;
          flowerGroup.add(petal);
        }
        meadowStageGroup.add(flowerGroup);
      }

      // Mother Duck (Vịt Mẹ) with sculpted 3-layer wings, cyan wingtips, cyan necklace, eye catchlights & curled green leaf
      const motherDuckRoot = new THREE.Group();
      motherDuckRoot.position.set(0, 0.42, -1.25);
      meadowStageGroup.add(motherDuckRoot);

      const whiteFeather = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, roughness: 0.34, clearcoat: 0.2 });
      const softSkyFeather = new THREE.MeshPhysicalMaterial({ color: 0xbae6fd, roughness: 0.34, clearcoat: 0.22 });
      const cyanMat = new THREE.MeshPhysicalMaterial({ color: 0x06b6d4, roughness: 0.28, clearcoat: 0.38 });
      const orangeDuckMat = new THREE.MeshPhysicalMaterial({ color: 0xf97316, roughness: 0.32 });

      const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.46, 24, 20), whiteFeather);
      mBody.scale.set(0.95, 1.15, 1.05);
      mBody.position.y = 0.65;
      motherDuckRoot.add(mBody);
      const mTail = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 12), whiteFeather);
      mTail.position.set(0, 0.72, -0.46);
      mTail.rotation.x = -Math.PI * 0.36;
      motherDuckRoot.add(mTail);
      const mNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.4, 16), whiteFeather);
      mNeck.position.y = 1.15;
      motherDuckRoot.add(mNeck);
      const mCollar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.045, 10, 24), cyanMat);
      mCollar.rotation.x = Math.PI / 2;
      mCollar.position.y = 1.08;
      motherDuckRoot.add(mCollar);
      const mHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 22), whiteFeather);
      mHead.position.y = 1.52;
      motherDuckRoot.add(mHead);

      [-1, 1].forEach((side) => {
        const sc = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        sc.position.set(side * 0.12, 1.57, 0.25);
        motherDuckRoot.add(sc);
        const ir = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), cyanMat);
        ir.position.set(side * 0.12, 1.57, 0.285);
        motherDuckRoot.add(ir);
        const pu = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), new THREE.MeshBasicMaterial({ color: 0x09090b }));
        pu.position.set(side * 0.12, 1.57, 0.312);
        motherDuckRoot.add(pu);
        const spk = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        spk.position.set(side * 0.132, 1.588, 0.324);
        motherDuckRoot.add(spk);
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.28, 10), orangeDuckMat);
        leg.position.set(side * 0.16, 0.14, 0);
        motherDuckRoot.add(leg);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.26), orangeDuckMat);
        foot.position.set(side * 0.16, 0.02, 0.08);
        motherDuckRoot.add(foot);
      });

      const mBeakTop = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), orangeDuckMat);
      mBeakTop.scale.set(1.2, 0.42, 1.5);
      mBeakTop.position.set(0, 1.46, 0.34);
      motherDuckRoot.add(mBeakTop);
      const motherBeakLower = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10), orangeDuckMat);
      motherBeakLower.scale.set(1.1, 0.34, 1.35);
      motherBeakLower.position.set(0, 1.41, 0.32);
      motherDuckRoot.add(motherBeakLower);

      // Curved tapered green sprout leaf dangling neatly from Mother Duck beak
      const beakLeafGroup = new THREE.Group();
      beakLeafGroup.position.set(0.05, 1.41, 0.44);
      const leafMain = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), reedMat);
      leafMain.scale.set(0.32, 1.55, 0.65);
      leafMain.position.set(0, -0.15, 0.03);
      leafMain.rotation.set(0.32, 0, -0.18);
      beakLeafGroup.add(leafMain);
      const leafTip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 8), reedMat);
      leafTip.position.set(0.04, -0.34, 0.07);
      leafTip.rotation.x = Math.PI + 0.35;
      beakLeafGroup.add(leafTip);
      motherDuckRoot.add(beakLeafGroup);

      const buildMotherFeatherWing = (sideSign: -1 | 1): THREE.Group => {
        const wg = new THREE.Group();
        wg.position.set(sideSign * 0.42, 0.84, 0);
        const cov1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), whiteFeather);
        cov1.scale.set(0.34, 1.15, 0.72);
        cov1.position.set(sideSign * 0.16, 0.1, 0.04);
        wg.add(cov1);
        const cov2 = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 12), softSkyFeather);
        cov2.scale.set(0.3, 1.08, 0.62);
        cov2.position.set(sideSign * 0.24, 0.24, -0.02);
        cov2.rotation.z = -sideSign * 0.18;
        wg.add(cov2);
        [-0.07, 0.01, 0.09].forEach((fz, fi) => {
          const pri = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), cyanMat);
          pri.scale.set(0.26, 1.45 - fi * 0.12, 0.55);
          pri.position.set(sideSign * (0.31 + fi * 0.025), 0.38 - fi * 0.05, fz - 0.06);
          pri.rotation.z = -sideSign * (0.28 + fi * 0.06);
          wg.add(pri);
        });
        motherDuckRoot.add(wg);
        return wg;
      };
      const motherLeftWing = buildMotherFeatherWing(-1);
      const motherRightWing = buildMotherFeatherWing(1);

      // 5 Ducklings lined up cleanly in clear foreground arc facing Mother Duck (zero flower hat blocking!)
      const meadowDucklings: DucklingHandle[] = [];
      for (let i = 0; i < 5; i++) {
        const dl = buildDucklingActor(false);
        const angleOff = (i - 2) * 0.44;
        dl.root.position.set(Math.sin(angleOff) * 3.38, 0, 1.45 + Math.cos(angleOff) * 0.52);
        dl.root.rotation.y = Math.PI - angleOff * 0.58;
        dl.root.scale.setScalar(1.02);
        meadowStageGroup.add(dl.root);
        meadowDucklings.push(dl);
      }

      // === STAGE 4 & 5: TURQUOISE POND + CURVED WOODEN DOCK + SCULPTED HYACINTHS + BEE (2:58 Reference) ===
      const pondStageGroup = new THREE.Group();
      scene.add(pondStageGroup);

      const pondWater = new THREE.Mesh(
        new THREE.CircleGeometry(22, 48),
        new THREE.MeshPhysicalMaterial({ color: 0x38e5f5, roughness: 0.1, metalness: 0.08, clearcoat: 1.0 })
      );
      pondWater.rotation.x = -Math.PI / 2;
      pondStageGroup.add(pondWater);

      const farShoreHill = new THREE.Mesh(new THREE.TorusGeometry(13.5, 2.4, 14, 40, Math.PI), grassMat);
      farShoreHill.rotation.x = Math.PI / 2;
      farShoreHill.position.set(0, -0.75, -4.5);
      pondStageGroup.add(farShoreHill);

      // Lush far-shore rounded bushes, trees & shoreline boulders enclosing pond landscape
      [[-4.8, -6.8, 1.1], [-2.5, -7.8, 1.4], [0.8, -8.2, 1.5], [3.8, -7.2, 1.25], [5.9, -6.2, 1.15]].forEach(([bx, bz, bs], idx) => {
        const shoreTree = new THREE.Mesh(new THREE.SphereGeometry(bs, 14, 12), idx % 2 === 0 ? foliageA : foliageB);
        shoreTree.scale.set(1.25, 0.9, 1.0);
        shoreTree.position.set(bx, 0.55 * bs, bz);
        pondStageGroup.add(shoreTree);
      });
      [[-3.6, -2.5, 0.65], [-1.8, -3.4, 0.55], [3.5, -2.2, 0.72]].forEach(([rx, rz, rs]) => {
        const rock = new THREE.Mesh(new THREE.SphereGeometry(rs, 12, 10), mossMat);
        rock.scale.set(1.35, 0.68, 1.05);
        rock.position.set(rx, 0.12, rz);
        pondStageGroup.add(rock);
      });

      // Curved Wooden Dock planks dipping gently toward water
      for (let p = 0; p < 7; p++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.14, 0.56), woodMat);
        plank.position.set(2.8 - p * 0.68, 0.72 - Math.pow(p / 6, 1.4) * 0.76, 0.45 + p * 0.25);
        plank.rotation.y = -0.35;
        plank.rotation.z = p >= 4 ? 0.24 : 0.04;
        pondStageGroup.add(plank);
      }
      [[0.4, 1.2], [2.4, 0.2]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.55, 12), woodMat);
        post.position.set(px, 0.45, pz);
        pondStageGroup.add(post);
      });

      // V-notched Lily pads & sculpted 14-floret purple water hyacinths + blooming lotus bud
      const padMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.58 });
      const hyacinthFlowerMat = new THREE.MeshPhysicalMaterial({ color: 0xc084fc, roughness: 0.35, clearcoat: 0.2 });
      const hyacinthDeepMat = new THREE.MeshPhysicalMaterial({ color: 0xa855f7, roughness: 0.38 });
      const hyacinthLeafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.52 });
      const yellowPollenMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      [[-2.25, 2.25], [-0.45, 2.85], [2.05, 2.15], [2.25, -1.55]].forEach(([lx, lz], idx) => {
        const pad = new THREE.Mesh(
          new THREE.CylinderGeometry(0.56, 0.56, 0.04, 24, 1, false, 0.28 + idx * 0.9, Math.PI * 1.82),
          padMat
        );
        pad.position.set(lx, 0.025, lz);
        pondStageGroup.add(pad);

        if (idx % 2 === 0) {
          // Bulbous green base + rounded leaves + rich 14-floret spherical purple flower cluster!
          for (let lf = 0; lf < 4; lf++) {
            const la = (lf / 4) * Math.PI * 2 + 0.4;
            const hLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), hyacinthLeafMat);
            hLeaf.scale.set(1.1, 0.35, 1.4);
            hLeaf.position.set(lx + Math.cos(la) * 0.22, 0.08, lz + Math.sin(la) * 0.22);
            hLeaf.rotation.y = -la;
            pondStageGroup.add(hLeaf);
          }
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.34, 8), hyacinthLeafMat);
          stem.position.set(lx, 0.2, lz);
          pondStageGroup.add(stem);
          for (let fl = 0; fl < 14; fl++) {
            const layer = fl < 6 ? 0.36 : fl < 12 ? 0.48 : 0.6;
            const rSpread = fl < 6 ? 0.13 : fl < 12 ? 0.095 : 0.04;
            const fAng = (fl * 2.39996);
            const fx = lx + Math.cos(fAng) * rSpread;
            const fz = lz + Math.sin(fAng) * rSpread;
            const floret = new THREE.Mesh(
              new THREE.SphereGeometry(0.072, 10, 8),
              fl % 2 === 0 ? hyacinthFlowerMat : hyacinthDeepMat
            );
            floret.position.set(fx, layer, fz);
            pondStageGroup.add(floret);
            if (fl % 3 === 0) {
              const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), yellowPollenMat);
              dot.position.set(fx * 1 + Math.cos(fAng) * 0.04, layer + 0.025, fz + Math.sin(fAng) * 0.04);
              pondStageGroup.add(dot);
            }
          }
        } else if (idx === 1) {
          // Pink blooming lotus bud on second pad
          const lotusMat = new THREE.MeshPhysicalMaterial({ color: 0xf472b6, roughness: 0.32, clearcoat: 0.25 });
          for (let lp = 0; lp < 6; lp++) {
            const la = (lp / 6) * Math.PI * 2;
            const lPetal = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), lotusMat);
            lPetal.scale.set(0.65, 1.5, 0.55);
            lPetal.position.set(lx + Math.cos(la) * 0.06, 0.11, lz + Math.sin(la) * 0.06);
            lPetal.rotation.z = -Math.cos(la) * 0.38;
            lPetal.rotation.x = Math.sin(la) * 0.38;
            pondStageGroup.add(lPetal);
          }
        }
      });

      const pondDucklings: DucklingHandle[] = [];
      const waterRipples: THREE.Mesh[] = [];
      const rippleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
      for (let i = 0; i < 4; i++) {
        const dl = buildDucklingActor(false);
        dl.root.scale.setScalar(0.92);
        pondStageGroup.add(dl.root);
        pondDucklings.push(dl);

        const r1 = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.37, 28), rippleMat.clone());
        r1.rotation.x = -Math.PI / 2;
        r1.position.y = 0.025;
        pondStageGroup.add(r1);
        waterRipples.push(r1);
      }

      // Expressive Striped Cartoon Bee hovering by the dock post (3 stripes, comic eyes, antennae, 4 wings)
      const beeGroup = new THREE.Group();
      beeGroup.position.set(0.65, 1.45, 1.35);
      pondStageGroup.add(beeGroup);
      const beeBody = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.32 }));
      beeBody.scale.set(1.0, 1.0, 1.42);
      beeGroup.add(beeBody);
      const beeBandMat = new THREE.MeshStandardMaterial({ color: 0x3b1704, roughness: 0.55 });
      [-0.12, -0.02, 0.08].forEach((bz, bi) => {
        const rRad = bi === 1 ? 0.172 : 0.155;
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(rRad, 0.028, 8, 18), beeBandMat);
        stripe.position.z = bz;
        beeGroup.add(stripe);
      });
      const beeStinger = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.1, 8), beeBandMat);
      beeStinger.position.set(0, 0, -0.28);
      beeStinger.rotation.x = -Math.PI / 2;
      beeGroup.add(beeStinger);
      const beeHead = new THREE.Mesh(new THREE.SphereGeometry(0.145, 16, 14), new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.35 }));
      beeHead.position.set(0, 0.055, 0.24);
      beeGroup.add(beeHead);
      [-1, 1].forEach((side) => {
        const bEyeW = new THREE.Mesh(new THREE.SphereGeometry(0.044, 10, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        bEyeW.position.set(side * 0.062, 0.08, 0.34);
        beeGroup.add(bEyeW);
        const bEyeP = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({ color: 0x09090b }));
        bEyeP.position.set(side * 0.066, 0.08, 0.368);
        beeGroup.add(bEyeP);
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.14, 6), beeBandMat);
        ant.position.set(side * 0.055, 0.21, 0.26);
        ant.rotation.z = -side * 0.35;
        ant.rotation.x = 0.25;
        beeGroup.add(ant);
        const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), beeBandMat);
        antBall.position.set(side * 0.085, 0.275, 0.285);
        beeGroup.add(antBall);
      });
      const beeWingMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.78, side: THREE.DoubleSide });
      const bWingFL = new THREE.Mesh(new THREE.CircleGeometry(0.175, 14), beeWingMat);
      bWingFL.position.set(-0.15, 0.23, 0.02);
      beeGroup.add(bWingFL);
      const bWingFR = new THREE.Mesh(new THREE.CircleGeometry(0.175, 14), beeWingMat);
      bWingFR.position.set(0.15, 0.23, 0.02);
      beeGroup.add(bWingFR);
      const bWingHL = new THREE.Mesh(new THREE.CircleGeometry(0.115, 12), beeWingMat);
      bWingHL.position.set(-0.12, 0.19, -0.09);
      beeGroup.add(bWingHL);
      const bWingHR = new THREE.Mesh(new THREE.CircleGeometry(0.115, 12), beeWingMat);
      bWingHR.position.set(0.12, 0.19, -0.09);
      beeGroup.add(bWingHR);

      // === STAGE 6: AMUSEMENT FERRIS WHEEL WITH RED GONDOLAS (5:56 Reference) ===
      const ferrisStageGroup = new THREE.Group();
      scene.add(ferrisStageGroup);

      const parkLawn = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.6, 42), grassMat);
      parkLawn.position.y = -0.3;
      ferrisStageGroup.add(parkLawn);
      const parkHill = new THREE.Mesh(
        new THREE.SphereGeometry(13, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
        new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.88 })
      );
      parkHill.position.set(-3, -2.5, -14);
      parkHill.scale.set(1.75, 0.55, 0.9);
      ferrisStageGroup.add(parkHill);

      // Park trees & shrubbery behind Ferris Wheel
      [[-6.5, -6.2, 1.4], [-3.8, -8.0, 1.7], [3.4, -7.2, 1.5], [6.2, -5.5, 1.3]].forEach(([tx, tz, ts], i) => {
        const pt = new THREE.Mesh(new THREE.CylinderGeometry(0.22 * ts, 0.3 * ts, 2.0 * ts, 8), trunkMat);
        pt.position.set(tx, 0.9 * ts, tz);
        ferrisStageGroup.add(pt);
        const pc = new THREE.Mesh(new THREE.SphereGeometry(1.15 * ts, 14, 12), i % 2 === 0 ? foliageA : foliageB);
        pc.position.set(tx, 2.35 * ts, tz);
        ferrisStageGroup.add(pc);
      });

      const wheelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.28, metalness: 0.35 });
      const redPodMat = new THREE.MeshPhysicalMaterial({ color: 0xdc2626, roughness: 0.16, clearcoat: 1.0 });

      // Grounding A-frame steel legs supporting hubSupport cleanly onto park concrete base
      const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.35, 2.4), mossMat);
      basePlinth.position.set(-1.5, 0.12, 0);
      ferrisStageGroup.add(basePlinth);
      [[-1.9, 0.56], [1.9, 0.56], [-1.9, -0.56], [1.9, -0.56]].forEach(([dx, dz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.65, 10), wheelMat);
        leg.position.set(-1.5 + dx * 0.5, 2.82, dz);
        leg.rotation.z = dx > 0 ? 0.347 : -0.347;
        ferrisStageGroup.add(leg);
      });

      const hubSupport = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.92, 1.45, 24), wheelMat);
      hubSupport.rotation.x = Math.PI / 2;
      hubSupport.position.set(-1.5, 5.45, 0);
      ferrisStageGroup.add(hubSupport);

      const ferrisWheelRim = new THREE.Group();
      ferrisWheelRim.position.set(-1.5, 5.45, 0);
      ferrisStageGroup.add(ferrisWheelRim);

      [3.15, 3.8].forEach((radius) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.085, 12, 48), wheelMat);
        ring.position.z = 0.34;
        ferrisWheelRim.add(ring);
        const ringBack = ring.clone();
        ringBack.position.z = -0.34;
        ferrisWheelRim.add(ringBack);
      });
      for (let s = 0; s < 12; s++) {
        const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 3.8, 8), wheelMat);
        const ang = (s / 12) * Math.PI * 2;
        sp.rotation.z = ang;
        sp.position.set(-Math.sin(ang) * 1.9, Math.cos(ang) * 1.9, 0.34);
        ferrisWheelRim.add(sp);
        const spBack = sp.clone();
        spBack.position.z = -0.34;
        ferrisWheelRim.add(spBack);
      }

      const ferrisGondolas: Array<{ holder: THREE.Group; duck: DucklingHandle }> = [];
      for (let g = 0; g < 6; g++) {
        const holder = new THREE.Group();
        // Pivot axle + T-strut hanger arm connecting rim pivot directly onto gondola top
        const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.78, 10), wheelMat);
        axle.rotation.x = Math.PI / 2;
        holder.add(axle);
        const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.35, 8), wheelMat);
        hanger.position.y = -0.16;
        holder.add(hanger);

        const gondolaBody = new THREE.Group();
        gondolaBody.position.y = -0.82;
        holder.add(gondolaBody);

        const pod = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.22, 14, 24), redPodMat);
        pod.scale.set(1.15, 0.92, 1.0);
        gondolaBody.add(pod);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.44), redPodMat);
        seat.position.y = -0.42;
        gondolaBody.add(seat);
        const duck = buildDucklingActor(false);
        duck.root.position.set(0, -0.35, 0.05);
        duck.root.scale.setScalar(0.84);
        gondolaBody.add(duck.root);
        ferrisWheelRim.add(holder);
        ferrisGondolas.push({ holder, duck });
      }

      cachedMotherDuckRig = {
        renderer,
        scene,
        camera,
        canvas,
        coopStageGroup,
        coopDuckling,
        roosterStageGroup,
        roosterGroup,
        meadowStageGroup,
        motherDuckRoot,
        motherLeftWing,
        motherRightWing,
        motherBeakLower,
        meadowDucklings,
        pondStageGroup,
        pondDucklings,
        waterRipples,
        beeGroup,
        beeWings: [bWingFL, bWingFR, bWingHL, bWingHR],
        ferrisStageGroup,
        ferrisWheelRim,
        ferrisGondolas,
      };
    } catch {
      return null;
    }
  } else if (cachedMotherDuckRig.canvas.width !== width || cachedMotherDuckRig.canvas.height !== height) {
    cachedMotherDuckRig.canvas.width = width;
    cachedMotherDuckRig.canvas.height = height;
    cachedMotherDuckRig.renderer.setSize(width, height, false);
    cachedMotherDuckRig.camera.aspect = width / Math.max(1, height);
    cachedMotherDuckRig.camera.updateProjectionMatrix();
  }
  return cachedMotherDuckRig;
}

/**
 * Renders Glow Studios-grade "Vịt Mẹ Và Đàn Con - Vịt Con Lông Vàng" 3D WebGL2 worlds.
 */
export function renderMotherDuckAndDucklings3dStageToCanvas(
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: MotherDuckStageOptions
): boolean {
  const W = Math.max(640, Math.round(width));
  const H = Math.max(360, Math.round(height));
  const rig = getOrCreateMotherDuckRig(W, H);
  if (!rig) return false;

  const { clockSec, progress, sceneIdx, isSpeaking = true } = options;
  const viseme = analyzeRealtimeVisemeWeights(clockSec, isSpeaking);

  // Isolate active stage per scene so backgrounds & draw calls stay ultra-clean and crisp
  rig.coopStageGroup.visible = sceneIdx === 0;
  rig.roosterStageGroup.visible = sceneIdx === 1;
  rig.meadowStageGroup.visible = sceneIdx === 2;
  rig.pondStageGroup.visible = sceneIdx === 3 || sceneIdx === 4;
  rig.ferrisStageGroup.visible = sceneIdx >= 5;

  if (sceneIdx === 0) {
    // Cảnh 1 (0:05): Duckling with sculpted red hibiscus flower hat waking up inside sunlit wooden coop
    rig.coopDuckling.bodyGroup.rotation.y = Math.sin(clockSec * 2.2) * 0.35;
    rig.coopDuckling.bodyGroup.position.y = Math.abs(Math.sin(clockSec * 4.5)) * 0.08;
    rig.coopDuckling.leftWing.rotation.z = 0.25 + Math.sin(clockSec * 7.5) * 0.3;
    rig.coopDuckling.rightWing.rotation.z = -0.25 - Math.sin(clockSec * 7.5) * 0.3;
    rig.coopDuckling.beakLower.position.y = 0.56 - (viseme.mouthOpenAmount * 0.04);
    rig.camera.position.set(Math.sin(progress * 0.8) * 0.35, 1.72, 4.1 - progress * 0.42);
    rig.camera.lookAt(0, 1.5, -0.32);
  } else if (sceneIdx === 1) {
    // Cảnh 2 (3:42 Rooster hero shot on 3D barrel terracotta roof tiles at morning crow)
    rig.roosterGroup.rotation.y = -0.35 + Math.sin(clockSec * 2.4) * 0.12;
    rig.roosterGroup.position.y = 4.18 + Math.abs(Math.sin(clockSec * 6.0)) * 0.05;
    rig.camera.position.set(-1.35 + progress * 2.35, 4.85, 5.15 - progress * 0.45);
    rig.camera.lookAt(0, 4.65, 0);
  } else if (sceneIdx === 2) {
    // Cảnh 3 (1:29 Choreography): Mother Duck on daisy rock podium leading ALL 5 clearly visible ducklings ("1-2!")
    rig.motherDuckRoot.position.y = 0.42 + Math.abs(Math.sin(clockSec * 5.2)) * 0.08;
    rig.motherLeftWing.rotation.z = 0.26 + Math.sin(clockSec * 7.8) * 0.48;
    rig.motherRightWing.rotation.z = -0.26 - Math.sin(clockSec * 7.8) * 0.48;
    rig.motherBeakLower.position.y = 1.41 - (viseme.mouthOpenAmount * 0.045);

    rig.meadowDucklings.forEach((dl, idx) => {
      const march = clockSec * 6.5 + idx * 0.22;
      dl.bodyGroup.position.y = Math.abs(Math.sin(march)) * 0.1;
      dl.leftWing.rotation.z = 0.3 + Math.sin(clockSec * 8.5 + idx * 0.3) * 0.52;
      dl.rightWing.rotation.z = -0.3 - Math.sin(clockSec * 8.5 + idx * 0.3) * 0.52;
      dl.leftFoot.position.y = 0.05 + Math.max(0, Math.sin(march)) * 0.13;
      dl.rightFoot.position.y = 0.05 + Math.max(0, -Math.sin(march)) * 0.13;
    });
    // Elevated pull-back shot so all 5 ducklings + Mother Duck are unobstructed
    rig.camera.position.set(0.35 * Math.sin(progress * Math.PI), 2.82, 6.05 - progress * 0.35);
    rig.camera.lookAt(0.0, 0.95, -0.55);
  } else if (sceneIdx === 3) {
    // Cảnh 4 (2:58 Dock): 4 ducklings waddling eagerly down curved wooden dock toward water + bee greeting them
    rig.pondDucklings.forEach((dl, idx) => {
      const p = Math.min(0.45, Math.max(0, progress * 0.36 + (3 - idx) * 0.11));
      const worldX = 2.6 - p * 4.2;
      const worldY = Math.max(0.04, 0.78 - ((2.6 - worldX) / 3.4) * 0.72);
      const worldZ = 0.48 + p * 1.15;
      const march = clockSec * 7.2 + idx;
      dl.root.position.set(worldX, worldY + Math.abs(Math.sin(march)) * 0.05, worldZ);
      dl.root.rotation.y = -Math.PI * 0.52 + Math.sin(clockSec * 3.0 + idx) * 0.14;
      dl.leftWing.rotation.z = 0.2 + Math.sin(clockSec * 7.8 + idx) * 0.32;
      dl.rightWing.rotation.z = -0.2 - Math.sin(clockSec * 7.8 + idx) * 0.32;
      dl.beakLower.position.y = 0.56 - (viseme.mouthOpenAmount * 0.035);
    });
    rig.waterRipples.forEach((r) => {
      r.visible = false;
    });
    rig.beeGroup.position.set(
      0.45 + Math.sin(clockSec * 2.5) * 0.32,
      1.48 + Math.cos(clockSec * 4.2) * 0.14,
      1.28 + Math.sin(clockSec * 1.8) * 0.22
    );
    rig.beeGroup.rotation.y = -0.82 + Math.sin(clockSec * 2.2) * 0.22;
    rig.beeWings[0].rotation.x = Math.sin(clockSec * 48) * 0.55;
    rig.beeWings[1].rotation.x = -Math.sin(clockSec * 48) * 0.55;
    rig.beeWings[2].rotation.x = -Math.sin(clockSec * 48) * 0.45;
    rig.beeWings[3].rotation.x = Math.sin(clockSec * 48) * 0.45;

    rig.camera.position.set(-1.35 + progress * 1.0, 2.38, 5.25 - progress * 0.45);
    rig.camera.lookAt(0.45, 0.72, 0.75);
  } else if (sceneIdx === 4) {
    // Cảnh 5 (Pond Swimming): All 4 ducklings splashing happily in sparkling turquoise pond with expanding white ripples!
    rig.pondDucklings.forEach((dl, idx) => {
      const swimT = progress * 0.55 + (3 - idx) * 0.22;
      const worldX = 0.35 - swimT * 2.55;
      const worldZ = 0.85 + Math.sin(idx * 1.3 + progress * 2.5) * 0.75;
      const bobY = -0.2 + Math.sin(clockSec * 5.2 + idx * 1.1) * 0.035;
      dl.root.position.set(worldX, bobY, worldZ);
      dl.root.rotation.y = -Math.PI * 0.65 + Math.sin(clockSec * 2.6 + idx) * 0.18;
      dl.leftWing.rotation.z = 0.28 + Math.sin(clockSec * 8.5 + idx) * 0.38;
      dl.rightWing.rotation.z = -0.28 - Math.sin(clockSec * 8.5 + idx) * 0.38;
      dl.beakLower.position.y = 0.56 - (viseme.mouthOpenAmount * 0.04);

      const rp = rig.waterRipples[idx];
      if (rp) {
        const pulse = (clockSec * 0.9 + idx * 0.25) % 1;
        rp.visible = true;
        rp.position.set(worldX, 0.025, worldZ);
        rp.scale.setScalar(1.0 + pulse * 0.95);
        const rMat = rp.material as THREE.MeshBasicMaterial;
        rMat.opacity = Math.max(0.08, 0.72 * (1 - pulse));
      }
    });
    rig.beeGroup.position.set(
      -0.3 + Math.sin(clockSec * 2.2) * 0.55,
      1.35 + Math.cos(clockSec * 4.2) * 0.14,
      1.35 + Math.cos(clockSec * 1.8) * 0.25
    );
    rig.beeGroup.rotation.y = -1.05 + Math.sin(clockSec * 2.2) * 0.22;
    rig.beeWings[0].rotation.x = Math.sin(clockSec * 48) * 0.55;
    rig.beeWings[1].rotation.x = -Math.sin(clockSec * 48) * 0.55;
    rig.beeWings[2].rotation.x = -Math.sin(clockSec * 48) * 0.45;
    rig.beeWings[3].rotation.x = Math.sin(clockSec * 48) * 0.45;

    rig.camera.position.set(-2.35 + progress * 1.15, 2.15, 4.95 - progress * 0.35);
    rig.camera.lookAt(-0.55, 0.45, 0.95);
  } else {
    // Cảnh 6 (5:56 Rotating Ferris Wheel with grounded A-frame legs & T-strut Red Gondolas carrying ducklings)
    const wheelAng = clockSec * 0.32;
    rig.ferrisWheelRim.rotation.z = wheelAng;
    rig.ferrisGondolas.forEach((g, idx) => {
      const baseA = (idx / rig.ferrisGondolas.length) * Math.PI * 2;
      g.holder.position.set(Math.cos(baseA) * 3.5, Math.sin(baseA) * 3.5, 0);
      // Keep gondolas upright as ferris wheel spins!
      g.holder.rotation.z = -wheelAng;
      g.duck.leftWing.rotation.z = 0.25 + Math.sin(clockSec * 8 + idx) * 0.35;
      g.duck.rightWing.rotation.z = -0.25 - Math.sin(clockSec * 8 + idx) * 0.35;
      g.duck.beakLower.position.y = 0.56 - (viseme.mouthOpenAmount * 0.04);
    });
    rig.camera.position.set(2.45 - progress * 0.95, 5.15, 9.65 - progress * 0.5);
    rig.camera.lookAt(-0.45, 4.95, 0.0);
  }

  rig.renderer.render(rig.scene, rig.camera);
  targetCtx.save();
  targetCtx.drawImage(rig.canvas, 0, 0, W, H);
  targetCtx.restore();
  return true;
}

export interface Zodiac12StageOptions {
  clockSec: number;
  progress: number;
  sceneIdx: number;
  prevSceneIdx?: number;
  sceneElapsedSec?: number;
  vocalRms?: number;
  isSpeaking?: boolean;
}

interface ZodiacPetal3D {
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  speedY: number;
  driftX: number;
  phase: number;
  spinX: number;
  spinY: number;
  spinZ: number;
}

interface ZodiacSparkle3D {
  mesh: THREE.Mesh;
  baseX: number;
  baseY: number;
  baseZ: number;
  speedY: number;
  phase: number;
  baseScale: number;
}

interface ZodiacNote3D {
  group: THREE.Group;
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
}

interface Zodiac12RigHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  stagePivot: THREE.Group;
  currPlane: THREE.Mesh;
  currMat: THREE.MeshBasicMaterial;
  prevPlane: THREE.Mesh;
  prevMat: THREE.MeshBasicMaterial;
  petals: ZodiacPetal3D[];
  sparkles: ZodiacSparkle3D[];
  notes: ZodiacNote3D[];
  textures: Array<THREE.Texture | null>;
  loadedFlags: boolean[];
}

const ZODIAC_SCENE_URLS = [
  '/zodiac-3d/zodiac_scene_01.jpg',
  '/zodiac-3d/zodiac_scene_02.jpg',
  '/zodiac-3d/zodiac_scene_03.jpg',
  '/zodiac-3d/zodiac_scene_04.jpg',
  '/zodiac-3d/zodiac_scene_05.jpg',
  '/zodiac-3d/zodiac_scene_06.jpg',
  '/zodiac-3d/zodiac_scene_07.jpg',
  '/zodiac-3d/zodiac_scene_08.jpg',
];

let cachedZodiac12Rig: Zodiac12RigHandles | null = null;

function createSculptedDepthStageGeometry(): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(17.2, 9.675, 48, 28);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    // Subtle theatrical depth relief: central zodiac characters project gently forward while distant sky recesses
    const subjectRelief = 0.68 * Math.exp(-(x * x) / 30 - ((y + 0.5) * (y + 0.5)) / 15);
    const subtleEdgeCurve = 0.24 * Math.pow(Math.abs(x) / 8.6, 2.2);
    pos.setZ(i, subjectRelief + subtleEdgeCurve);
  }
  geo.computeVertexNormals();
  return geo;
}

function createPetalTexture(isApricotGold: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(32, 26, 4, 32, 32, 28);
  if (isApricotGold) {
    grad.addColorStop(0, 'rgba(254, 249, 195, 0.98)');
    grad.addColorStop(0.6, 'rgba(250, 204, 21, 0.94)');
    grad.addColorStop(1, 'rgba(234, 179, 8, 0.0)');
  } else {
    grad.addColorStop(0, 'rgba(255, 241, 242, 0.98)');
    grad.addColorStop(0.55, 'rgba(251, 113, 133, 0.92)');
    grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(32, 32, 18, 26, 0.15, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function getOrCreateZodiac12Rig(width: number, height: number): Zodiac12RigHandles | null {
  if (typeof document === 'undefined') return null;
  if (!cachedZodiac12Rig) {
    try {
      const canvas = createOffscreenCanvas(width, height);
      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.shadowMap.enabled = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfff7ed);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0, 12.2);

      // Warm daylight for foreground 3D blossoms & musical notes
      scene.add(new THREE.AmbientLight(0xfffbeb, 1.55));
      const sun = new THREE.DirectionalLight(0xffedd5, 1.85);
      sun.position.set(4, 8, 10);
      scene.add(sun);

      const stagePivot = new THREE.Group();
      scene.add(stagePivot);

      const stageGeo = createSculptedDepthStageGeometry();
      const prevMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const prevPlane = new THREE.Mesh(stageGeo, prevMat);
      prevPlane.position.z = -0.06;
      stagePivot.add(prevPlane);

      const currMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
      });
      const currPlane = new THREE.Mesh(stageGeo, currMat);
      stagePivot.add(currPlane);

      // Load all 8 Pixar 3D textures eagerly
      const loader = new THREE.TextureLoader();
      const textures: Array<THREE.Texture | null> = new Array(ZODIAC_SCENE_URLS.length).fill(null);
      const loadedFlags: boolean[] = new Array(ZODIAC_SCENE_URLS.length).fill(false);

      ZODIAC_SCENE_URLS.forEach((url, idx) => {
        loader.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.anisotropy = 4;
            textures[idx] = tex;
            loadedFlags[idx] = true;
          },
          undefined,
          () => {
            loadedFlags[idx] = true;
          }
        );
      });

      // 52 Sculpted 3D Spring Petals (Hoa Đào hồng & Hoa Mai vàng) drifting in real 3D parallax space
      const pinkTex = createPetalTexture(false);
      const goldTex = createPetalTexture(true);
      const pinkPetalMat = new THREE.MeshBasicMaterial({
        map: pinkTex || undefined,
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const goldPetalMat = new THREE.MeshBasicMaterial({
        map: goldTex || undefined,
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const petalGeo = new THREE.PlaneGeometry(0.32, 0.36);
      const petals: ZodiacPetal3D[] = [];
      for (let i = 0; i < 52; i++) {
        const isGold = i % 2 === 1;
        const m = new THREE.Mesh(petalGeo, isGold ? goldPetalMat : pinkPetalMat);
        const s = 0.65 + ((i * 37) % 100) / 110;
        m.scale.setScalar(s);
        scene.add(m);
        petals.push({
          mesh: m,
          baseX: ((i * 2.71) % 18) - 9,
          baseY: ((i * 1.93) % 12) - 6,
          baseZ: 1.6 + ((i * 1.13) % 5.8),
          speedY: 0.55 + ((i * 29) % 10) * 0.08,
          driftX: 0.35 + ((i * 17) % 8) * 0.07,
          phase: i * 0.73,
          spinX: 0.9 + (i % 5) * 0.25,
          spinY: 1.1 + (i % 4) * 0.3,
          spinZ: 0.7 + (i % 3) * 0.28,
        });
      }

      // 26 Floating Golden Spring Bokeh & Stardust Sparkles
      const sparkMatA = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      const sparkMatB = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
      const sparkGeo = new THREE.SphereGeometry(0.085, 10, 10);
      const sparkles: ZodiacSparkle3D[] = [];
      for (let i = 0; i < 26; i++) {
        const m = new THREE.Mesh(sparkGeo, i % 2 === 0 ? sparkMatA : sparkMatB);
        scene.add(m);
        sparkles.push({
          mesh: m,
          baseX: ((i * 3.17) % 16) - 8,
          baseY: ((i * 2.11) % 10) - 5,
          baseZ: 1.8 + ((i * 0.97) % 4.2),
          speedY: 0.32 + (i % 5) * 0.07,
          phase: i * 1.07,
          baseScale: 0.55 + (i % 4) * 0.32,
        });
      }

      // 6 Sculpted 3D Musical Notes gently dancing in upper sky margins on the 126 BPM beat
      const noteColors = [0xf43f5e, 0xf59e0b, 0x06b6d4, 0xec4899, 0x10b981, 0xf97316];
      const notes: ZodiacNote3D[] = [];
      const noteAnchors = [
        [-6.6, 3.2, 2.6],
        [-5.4, 3.6, 2.3],
        [5.6, 3.3, 2.5],
        [6.7, 2.8, 2.8],
        [-6.1, 2.1, 2.2],
        [6.2, 2.0, 2.3],
      ];
      noteAnchors.forEach(([nx, ny, nz], idx) => {
        const ng = new THREE.Group();
        const nMat = new THREE.MeshPhysicalMaterial({
          color: noteColors[idx % noteColors.length],
          roughness: 0.22,
          clearcoat: 0.9,
          emissive: noteColors[idx % noteColors.length],
          emissiveIntensity: 0.18,
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), nMat);
        head.scale.set(1.22, 0.88, 0.72);
        head.rotation.z = 0.28;
        ng.add(head);
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.62, 10), nMat);
        stem.position.set(0.14, 0.31, 0);
        ng.add(stem);
        const flag = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.038, 8, 14, Math.PI * 0.85), nMat);
        flag.position.set(0.32, 0.45, 0);
        flag.rotation.z = Math.PI * 0.65;
        ng.add(flag);
        ng.position.set(nx, ny, nz);
        scene.add(ng);
        notes.push({
          group: ng,
          baseX: nx,
          baseY: ny,
          baseZ: nz,
          phase: idx * 1.15,
        });
      });

      cachedZodiac12Rig = {
        renderer,
        scene,
        camera,
        canvas,
        stagePivot,
        currPlane,
        currMat,
        prevPlane,
        prevMat,
        petals,
        sparkles,
        notes,
        textures,
        loadedFlags,
      };
    } catch {
      return null;
    }
  } else if (cachedZodiac12Rig.canvas.width !== width || cachedZodiac12Rig.canvas.height !== height) {
    cachedZodiac12Rig.canvas.width = width;
    cachedZodiac12Rig.canvas.height = height;
    cachedZodiac12Rig.renderer.setSize(width, height, false);
    cachedZodiac12Rig.camera.aspect = width / Math.max(1, height);
    cachedZodiac12Rig.camera.updateProjectionMatrix();
  }
  return cachedZodiac12Rig;
}

/**
 * Ensures all 8 Pixar 3D Zodiac textures are loaded into GPU memory before offline 1080p batch capture.
 */
export async function preloadZodiac12Textures(width = 1920, height = 1080): Promise<boolean> {
  const rig = getOrCreateZodiac12Rig(width, height);
  if (!rig) return false;
  const start = Date.now();
  while (rig.loadedFlags.some((f) => !f) && Date.now() - start < 15000) {
    await new Promise((r) => setTimeout(r, 40));
  }
  return rig.textures.every((t) => Boolean(t));
}

/**
 * Renders Pixar/Disney-grade "Bài Ca 12 Con Giáp Rộn Ràng Ngày Xuân" 3D WebGL2 Cinema Stage
 * with sculpted depth relief, 126 BPM beat-synced elastic bounce, 3D drifting hoa đào/hoa mai petals,
 * golden lantern bokeh orbs, 3D bouncing musical notes, and dreamy crossfade transitions.
 */
export function renderZodiac12Pixar3dStageToCanvas(
  targetCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: Zodiac12StageOptions
): boolean {
  const W = Math.max(640, Math.round(width));
  const H = Math.max(360, Math.round(height));
  const rig = getOrCreateZodiac12Rig(W, H);
  if (!rig) return false;

  const {
    clockSec,
    progress,
    sceneIdx,
    prevSceneIdx,
    sceneElapsedSec = 9.0,
    vocalRms = 0.35,
    isSpeaking = true,
  } = options;

  const idx = Math.max(0, Math.min(ZODIAC_SCENE_URLS.length - 1, sceneIdx));
  const currTex = rig.textures[idx];
  if (!currTex) return false;

  if (rig.currMat.map !== currTex) {
    rig.currMat.map = currTex;
    rig.currMat.needsUpdate = true;
  }

  // Smooth dreamy crossfade from previous scene during first 0.55s
  const fadeDur = 0.55;
  const pIdx =
    typeof prevSceneIdx === 'number' && prevSceneIdx >= 0 && prevSceneIdx !== idx
      ? Math.min(ZODIAC_SCENE_URLS.length - 1, prevSceneIdx)
      : idx > 0
        ? idx - 1
        : -1;
  if (pIdx >= 0 && sceneElapsedSec < fadeDur && rig.textures[pIdx]) {
    const t = Math.max(0, Math.min(1, sceneElapsedSec / fadeDur));
    const smoothT = t * t * (3 - 2 * t);
    if (rig.prevMat.map !== rig.textures[pIdx]) {
      rig.prevMat.map = rig.textures[pIdx];
      rig.prevMat.needsUpdate = true;
    }
    rig.prevPlane.visible = true;
    rig.prevMat.opacity = 1 - smoothT;
    rig.currMat.opacity = smoothT;
  } else {
    rig.prevPlane.visible = false;
    rig.currMat.opacity = 1;
  }

  // 126 BPM joyful children's song beat + vocal RMS squash-and-stretch breathing!
  const beatRad = clockSec * (126 / 60) * Math.PI;
  const beatPulse = Math.pow(Math.abs(Math.sin(beatRad)), 2.2);
  const voiceEnergy = isSpeaking ? Math.max(0.08, Math.min(1.0, vocalRms)) : 0.04;
  const bounceY = (beatPulse * 0.065 + voiceEnergy * 0.045);
  const scaleBreathY = 1.0 + beatPulse * 0.011 + voiceEnergy * 0.008;
  const scaleBreathX = 1.0 - beatPulse * 0.005;

  rig.stagePivot.position.y = bounceY;
  rig.stagePivot.scale.set(scaleBreathX, scaleBreathY, 1.0);
  rig.stagePivot.rotation.z = Math.sin(beatRad * 0.5) * 0.0085;

  // Tailored 3D cinematic camera choreography per scene matching lyric flow (Left character -> Right character!)
  const pEase = progress * progress * (3 - 2 * progress);
  let camX = 0;
  let camY = 0;
  let camZ = 11.4;
  let lookX = 0;
  let lookY = -0.08;

  if (idx === 0) {
    // Scene 1: Grand Spring Courtyard Dolly-In & gentle upward reveal
    camX = Math.sin(progress * Math.PI) * 0.35;
    camY = 0.35 - pEase * 0.45;
    camZ = 12.1 - pEase * 1.15;
    lookX = 0;
    lookY = -0.15;
  } else if (idx === 1 || idx === 2 || idx === 4 || idx === 5 || idx === 6) {
    // Duo Hero Scenes (Tý->Sửu, Dần->Mão, Ngọ->Mùi, Thân->Dậu, Tuất->Hợi): smooth pan following the song lyrics from left friend to right friend!
    const dir = idx % 2 === 1 ? 1 : -1;
    const sweep = (pEase - 0.5) * 1.45 * dir;
    camX = sweep;
    camY = 0.08 + Math.sin(progress * Math.PI) * 0.18;
    camZ = 10.65 - Math.sin(progress * Math.PI) * 0.55;
    lookX = sweep * 0.72;
    lookY = -0.1;
  } else if (idx === 3) {
    // Scene 4 (Thìn floating high left -> Tỵ perched low right)
    camX = -0.75 + pEase * 1.5;
    camY = 0.42 - pEase * 0.62;
    camZ = 10.85 - Math.sin(progress * Math.PI) * 0.5;
    lookX = -0.5 + pEase * 1.0;
    lookY = 0.25 - pEase * 0.45;
  } else {
    // Scene 8 (Grand Finale): Sweeping celebratory Dolly-Out revealing all 12 Zodiac friends dancing!
    camX = Math.sin(progress * Math.PI * 1.5) * 0.42;
    camY = -0.1 + pEase * 0.25;
    camZ = 10.55 + pEase * 1.35;
    lookX = 0;
    lookY = -0.12;
  }

  rig.camera.position.set(camX, camY, camZ);
  rig.camera.lookAt(lookX, lookY, 0);

  // Animate 52 3D Hoa Đào & Hoa Mai petals drifting gracefully in 3D space
  for (const pt of rig.petals) {
    const fallSpan = 12.0;
    const rawY = pt.baseY - clockSec * pt.speedY;
    const wrappedY = ((((rawY + 6.0) % fallSpan) + fallSpan) % fallSpan) - 6.0;
    const swayX = pt.baseX + Math.sin(clockSec * pt.driftX + pt.phase) * 1.35;
    pt.mesh.position.set(swayX, wrappedY, pt.baseZ);
    pt.mesh.rotation.set(
      clockSec * pt.spinX + pt.phase,
      clockSec * pt.spinY + pt.phase,
      clockSec * pt.spinZ
    );
  }

  // Animate 26 Floating Golden Lantern Bokeh & Sparkles
  for (const sp of rig.sparkles) {
    const riseSpan = 10.0;
    const rawY = sp.baseY + clockSec * sp.speedY;
    const wrappedY = ((((rawY + 5.0) % riseSpan) + riseSpan) % riseSpan) - 5.0;
    sp.mesh.position.set(
      sp.baseX + Math.cos(clockSec * 0.7 + sp.phase) * 0.55,
      wrappedY,
      sp.baseZ
    );
    const pulseS = sp.baseScale * (0.72 + 0.45 * Math.sin(clockSec * 3.8 + sp.phase) + beatPulse * 0.22);
    sp.mesh.scale.setScalar(Math.max(0.2, pulseS));
  }

  // Animate 6 Sculpted 3D Musical Notes dancing happily to the 126 BPM beat!
  for (const nt of rig.notes) {
    const hop = Math.abs(Math.sin(beatRad + nt.phase)) * 0.34;
    nt.group.position.set(
      nt.baseX + Math.sin(clockSec * 1.2 + nt.phase) * 0.22,
      nt.baseY + hop,
      nt.baseZ
    );
    nt.group.rotation.y = Math.sin(clockSec * 2.1 + nt.phase) * 0.55;
    nt.group.rotation.z = Math.cos(beatRad + nt.phase) * 0.16;
    const noteScale = 0.88 + beatPulse * 0.22;
    nt.group.scale.setScalar(noteScale);
  }

  rig.renderer.render(rig.scene, rig.camera);
  targetCtx.save();
  targetCtx.drawImage(rig.canvas, 0, 0, W, H);
  targetCtx.restore();
  return true;
}

export { renderDragonflyRainSong3dStageToCanvas } from './dragonflyStage3d';
