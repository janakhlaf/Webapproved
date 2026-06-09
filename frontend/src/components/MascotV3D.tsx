import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MascotV3DProps {
  onStateChange?: (state: 'init' | 'assemble' | 'showcase' | 'docking' | 'idle') => void;
  prefersReducedMotion?: boolean;
}

export default function MascotV3D({ onStateChange, prefersReducedMotion = false }: MascotV3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stateRef = useRef<'init' | 'assemble' | 'showcase' | 'docking' | 'idle'>('init');
  const timerRef = useRef<number>(0);
  const morphProgressRef = useRef<number>(0); // 0 = fully robot, 1 = fully voxel V

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 4);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.65;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight1.position.set(4, 9, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x4ddfff, 1.55);
    dirLight2.position.set(-3.5, 0.5, 3.5);
    scene.add(dirLight2);

    const rimLight = new THREE.DirectionalLight(0x66ccff, 2.6);
    rimLight.position.set(-1, 3.5, -4);
    scene.add(rimLight);

    const baseLight = new THREE.PointLight(0x00d9ff, 2.5, 3.0);
    baseLight.position.set(0, -0.85, 0.5);
    scene.add(baseLight);

    // --- BUILD MODELS GROUP ---
    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    // ─── PART A: CHATBOT ROBOT ───
    const robotGroup = new THREE.Group();
    mascotGroup.add(robotGroup);

    // Robot Materials - Exact same materials as Robot3D/Chatbot
    const whiteCeramicMat = new THREE.MeshPhysicalMaterial({
      color: 0x8f99a6,
      roughness: 0.13,
      metalness: 0.72,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      sheen: 0.2,
      sheenColor: new THREE.Color(0xb8c4d0),
      transparent: true,
      opacity: 0,
    });

    const facePanelMat = new THREE.MeshPhysicalMaterial({
      color: 0x030712,
      roughness: 0.06,
      metalness: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.015,
      transparent: true,
      opacity: 0,
    });

    const chromeJointMat = new THREE.MeshStandardMaterial({
      color: 0x9ca9ba,
      roughness: 0.16,
      metalness: 0.92,
      transparent: true,
      opacity: 0,
    });

    const carbonMat = new THREE.MeshPhysicalMaterial({
      color: 0x111827,
      roughness: 0.18,
      metalness: 0.85,
      clearcoat: 0.7,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0,
    });

    const armorPanelMat = new THREE.MeshPhysicalMaterial({
      color: 0x7f8a98,
      roughness: 0.16,
      metalness: 0.66,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05,
      transparent: true,
      opacity: 0,
    });

    const cyanGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      transparent: true,
      opacity: 0,
    });

    const softBlueGlowMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x67e8f9,
      emissiveIntensity: 1.7,
      roughness: 0.1,
      transparent: true,
      opacity: 0,
    });

    const antennaBallMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      transparent: true,
      opacity: 0,
    });

    const chestGlowMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      transparent: true,
      opacity: 0,
    });

    // Helper geometries builders
    const roundedRectShape = (width: number, height: number, radius: number) => {
      const shape = new THREE.Shape();
      const x = -width / 2;
      const y = -height / 2;
      shape.moveTo(x + radius, y);
      shape.lineTo(x + width - radius, y);
      shape.quadraticCurveTo(x + width, y, x + width, y + radius);
      shape.lineTo(x + width, y + height - radius);
      shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      shape.lineTo(x + radius, y + height);
      shape.quadraticCurveTo(x, y + height, x, y + height - radius);
      shape.lineTo(x, y + radius);
      shape.quadraticCurveTo(x, y, x + radius, y);
      return shape;
    };

    const roundedPanelGeometry = (width: number, height: number, depth: number, radius: number, bevel: number) => {
      const geometry = new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
        depth,
        bevelEnabled: true,
        bevelSize: bevel,
        bevelThickness: bevel,
        bevelSegments: 8,
        curveSegments: 18,
      });
      geometry.center();
      return geometry;
    };

    // --- HEAD ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0);
    robotGroup.add(headGroup);

    headGroup.add(new THREE.Mesh(roundedPanelGeometry(0.9, 0.72, 0.48, 0.38, 0.054), whiteCeramicMat));

    const visor = new THREE.Mesh(roundedPanelGeometry(0.66, 0.38, 0.045, 0.21, 0.014), facePanelMat);
    visor.position.set(0, -0.04, 0.315);
    headGroup.add(visor);

    const visorSheenMat = new THREE.MeshBasicMaterial({ color: 0x9beafe, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });
    const visorSheen = new THREE.Mesh(roundedPanelGeometry(0.48, 0.1, 0.01, 0.05, 0.004), visorSheenMat);
    visorSheen.position.set(-0.07, 0.13, 0.345);
    visorSheen.rotation.z = 0.08;
    headGroup.add(visorSheen);

    const foreheadPanel = new THREE.Mesh(roundedPanelGeometry(0.28, 0.064, 0.02, 0.033, 0.006), armorPanelMat);
    foreheadPanel.position.set(0, 0.405, 0.285);
    headGroup.add(foreheadPanel);

    const headband = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.032, 12, 32, Math.PI), carbonMat);
    headband.position.set(0, 0.05, 0);
    headGroup.add(headband);

    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(0, 0.005, 0.355);
    headGroup.add(eyeGroup);

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.145, 0.012, 0.02);
    eyeGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.145, 0.012, 0.02);
    eyeGroup.add(rightEyeGroup);

    const happyEyeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.058, -0.008, 0),
      new THREE.Vector3(0, 0.064, 0),
      new THREE.Vector3(0.058, -0.008, 0),
    );
    const happyEyeGeo = new THREE.TubeGeometry(happyEyeCurve, 24, 0.015, 8, false);
    
    const leftHappyEye = new THREE.Mesh(happyEyeGeo, cyanGlowMat);
    leftHappyEye.position.set(0, 0.035, 0.018);
    leftEyeGroup.add(leftHappyEye);

    const rightHappyEye = new THREE.Mesh(happyEyeGeo, cyanGlowMat);
    rightHappyEye.position.set(0, 0.035, 0.018);
    rightEyeGroup.add(rightHappyEye);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16).scale(0.9, 0.62, 0.32), cyanGlowMat);
    nose.position.set(0, -0.055, 0.376);
    headGroup.add(nose);

    const mouthCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.076, 0, 0),
      new THREE.Vector3(0, -0.05, 0),
      new THREE.Vector3(0.076, 0, 0),
    );
    const mouth = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 24, 0.011, 8, false), cyanGlowMat);
    mouth.position.set(0, -0.14, 0.375);
    headGroup.add(mouth);

    const earGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 28);
    earGeo.rotateZ(Math.PI / 2);

    const leftEar = new THREE.Mesh(earGeo, whiteCeramicMat);
    leftEar.position.set(-0.515, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, whiteCeramicMat);
    rightEar.position.set(0.515, 0, 0);
    headGroup.add(rightEar);

    const leftEarJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.13, 24).rotateZ(Math.PI / 2), chromeJointMat);
    leftEarJoint.position.set(-0.505, 0, 0);
    headGroup.add(leftEarJoint);

    const rightEarJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.13, 24).rotateZ(Math.PI / 2), chromeJointMat);
    rightEarJoint.position.set(0.505, 0, 0);
    headGroup.add(rightEarJoint);

    const leftEarGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24).rotateZ(Math.PI / 2), softBlueGlowMat);
    leftEarGlow.position.set(-0.57, 0, 0);
    headGroup.add(leftEarGlow);

    const leftEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 28), cyanGlowMat);
    leftEarInnerGlow.position.set(-0.585, 0, 0);
    leftEarInnerGlow.rotation.y = Math.PI / 2;
    headGroup.add(leftEarInnerGlow);

    const rightEarGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24).rotateZ(Math.PI / 2), softBlueGlowMat);
    rightEarGlow.position.set(0.57, 0, 0);
    headGroup.add(rightEarGlow);

    const rightEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 28), cyanGlowMat);
    rightEarInnerGlow.position.set(0.585, 0, 0);
    rightEarInnerGlow.rotation.y = Math.PI / 2;
    headGroup.add(rightEarInnerGlow);

    const antennaGroup = new THREE.Group();
    antennaGroup.position.set(-0.35, 0.4, 0);
    antennaGroup.rotation.z = 0.28;
    headGroup.add(antennaGroup);

    const antennaRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), chromeJointMat);
    antennaRod.position.y = 0.13;
    antennaGroup.add(antennaRod);

    const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), antennaBallMat);
    antennaBall.position.y = 0.26;
    antennaGroup.add(antennaBall);

    // --- TORSO ---
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, -0.24, 0);
    robotGroup.add(torsoGroup);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.11, 16), carbonMat);
    collar.position.set(0, 0.42, 0);
    torsoGroup.add(collar);

    const bodyMesh = new THREE.Mesh(roundedPanelGeometry(0.5, 0.58, 0.28, 0.085, 0.028), whiteCeramicMat);
    bodyMesh.position.set(0, 0.02, 0);
    bodyMesh.castShadow = true;
    torsoGroup.add(bodyMesh);

    const leftTorsoPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.06), armorPanelMat);
    leftTorsoPanel.position.set(-0.28, 0.02, 0.045);
    leftTorsoPanel.rotation.z = -0.08;
    torsoGroup.add(leftTorsoPanel);

    const rightTorsoPanel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.06), armorPanelMat);
    rightTorsoPanel.position.set(0.28, 0.02, 0.045);
    rightTorsoPanel.rotation.z = 0.08;
    torsoGroup.add(rightTorsoPanel);

    const chestPlate = new THREE.Mesh(roundedPanelGeometry(0.28, 0.2, 0.032, 0.045, 0.01), armorPanelMat);
    chestPlate.position.set(0, 0.12, 0.16);
    torsoGroup.add(chestPlate);

    const chestCore = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.025, 24).rotateX(Math.PI / 2), carbonMat);
    chestCore.position.set(0, 0.11, 0.182);
    torsoGroup.add(chestCore);

    const triangleMesh = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.01, 3).rotateX(Math.PI / 2).rotateZ(Math.PI), chestGlowMat);
    triangleMesh.position.set(0, 0.11, 0.2);
    torsoGroup.add(triangleMesh);

    const chestRingMesh = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 24), softBlueGlowMat);
    chestRingMesh.position.set(0, 0.11, 0.2);
    torsoGroup.add(chestRingMesh);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.22, 0.085, 24), carbonMat);
    belt.position.set(0, -0.38, 0);
    torsoGroup.add(belt);

    const hips = new THREE.Mesh(roundedPanelGeometry(0.42, 0.16, 0.22, 0.045, 0.018), whiteCeramicMat);
    hips.position.set(0, -0.46, 0);
    hips.castShadow = true;
    torsoGroup.add(hips);

    // --- ARMS ---
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.42, 0.2, 0);
    torsoGroup.add(leftArmGroup);

    leftArmGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), chromeJointMat));

    const leftShoulderPad = new THREE.Mesh(roundedPanelGeometry(0.16, 0.12, 0.12, 0.03, 0.01), whiteCeramicMat);
    leftShoulderPad.position.set(0, 0.03, 0);
    leftArmGroup.add(leftShoulderPad);

    const upperArmGeo = roundedPanelGeometry(0.14, 0.24, 0.105, 0.024, 0.009).translate(0, -0.11, 0);
    leftArmGroup.add(new THREE.Mesh(upperArmGeo, whiteCeramicMat));

    const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.064, 16, 16), chromeJointMat);
    leftElbow.position.set(0, -0.22, 0);
    leftArmGroup.add(leftElbow);

    const leftForearm = new THREE.Mesh(roundedPanelGeometry(0.14, 0.24, 0.105, 0.024, 0.009).translate(0, -0.11, 0), whiteCeramicMat);
    leftForearm.position.set(0, -0.22, 0);
    leftArmGroup.add(leftForearm);

    const handGeo = roundedPanelGeometry(0.145, 0.12, 0.105, 0.032, 0.01);
    const fingerGeo = new THREE.CapsuleGeometry(0.015, 0.082, 4, 8);
    const leftHand = new THREE.Mesh(handGeo, whiteCeramicMat);
    leftHand.position.set(0, -0.46, 0);
    leftArmGroup.add(leftHand);

    [-0.05, -0.018, 0.018, 0.05].forEach((x, idx) => {
      const finger = new THREE.Mesh(fingerGeo, whiteCeramicMat);
      finger.position.set(x, -0.535, idx === 0 || idx === 3 ? 0.02 : 0.032);
      finger.rotation.z = x < 0 ? 0.18 : -0.18;
      leftArmGroup.add(finger);
    });

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.42, 0.2, 0);
    torsoGroup.add(rightArmGroup);

    rightArmGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), chromeJointMat));

    const rightShoulderPad = new THREE.Mesh(roundedPanelGeometry(0.16, 0.12, 0.12, 0.03, 0.01), whiteCeramicMat);
    rightShoulderPad.position.set(0, 0.03, 0);
    rightArmGroup.add(rightShoulderPad);

    rightArmGroup.add(new THREE.Mesh(upperArmGeo.clone(), whiteCeramicMat));

    const rightElbow = new THREE.Mesh(new THREE.SphereGeometry(0.064, 16, 16), chromeJointMat);
    rightElbow.position.set(0, -0.22, 0);
    rightArmGroup.add(rightElbow);

    const rightForearm = new THREE.Mesh(roundedPanelGeometry(0.14, 0.24, 0.105, 0.024, 0.009).translate(0, -0.11, 0), whiteCeramicMat);
    rightForearm.position.set(0, -0.22, 0);
    rightArmGroup.add(rightForearm);

    const rightHand = new THREE.Mesh(handGeo.clone(), whiteCeramicMat);
    rightHand.position.set(0, -0.46, 0);
    rightArmGroup.add(rightHand);

    // --- LEGS ---
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, -0.47, 0);
    torsoGroup.add(leftLegGroup);

    leftLegGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.074, 16, 16), chromeJointMat));

    const thighGeo = roundedPanelGeometry(0.16, 0.23, 0.115, 0.026, 0.01).translate(0, -0.11, 0);
    leftLegGroup.add(new THREE.Mesh(thighGeo, whiteCeramicMat));

    const leftKnee = new THREE.Mesh(new THREE.SphereGeometry(0.064, 16, 16), softBlueGlowMat);
    leftKnee.position.set(0, -0.22, 0);
    leftLegGroup.add(leftKnee);

    const leftShin = new THREE.Mesh(roundedPanelGeometry(0.16, 0.25, 0.125, 0.026, 0.01).translate(0, -0.11, 0), whiteCeramicMat);
    leftShin.position.set(0, -0.22, 0);
    leftLegGroup.add(leftShin);

    const leftFoot = new THREE.Mesh(roundedPanelGeometry(0.24, 0.11, 0.3, 0.032, 0.01), whiteCeramicMat);
    leftFoot.position.set(0, -0.44, 0.04);
    leftLegGroup.add(leftFoot);

    // Right Leg
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, -0.47, 0);
    torsoGroup.add(rightLegGroup);

    rightLegGroup.add(new THREE.Mesh(new THREE.SphereGeometry(0.074, 16, 16), chromeJointMat));
    rightLegGroup.add(new THREE.Mesh(thighGeo.clone(), whiteCeramicMat));

    const rightKnee = new THREE.Mesh(new THREE.SphereGeometry(0.064, 16, 16), softBlueGlowMat);
    rightKnee.position.set(0, -0.22, 0);
    rightLegGroup.add(rightKnee);

    const rightShin = new THREE.Mesh(roundedPanelGeometry(0.16, 0.25, 0.125, 0.026, 0.01).translate(0, -0.11, 0), whiteCeramicMat);
    rightShin.position.set(0, -0.22, 0);
    rightLegGroup.add(rightShin);

    const rightFoot = new THREE.Mesh(roundedPanelGeometry(0.24, 0.11, 0.3, 0.032, 0.01), whiteCeramicMat);
    rightFoot.position.set(0, -0.44, 0.04);
    rightLegGroup.add(rightFoot);

    // --- LASER SCANNER ---
    const laserConeGeo = new THREE.CylinderGeometry(0.005, 0.12, 1.6, 16, 1, true);
    laserConeGeo.rotateX(Math.PI / 2);
    laserConeGeo.translate(0, 0, 0.8);
    const laserConeMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const laserMesh = new THREE.Mesh(laserConeGeo, laserConeMat);
    laserMesh.position.set(0.3 * 0.26, 0.05 * 0.26, 0.35 * 0.26);
    robotGroup.add(laserMesh);

    const robotMaterials = [
      whiteCeramicMat, facePanelMat, chromeJointMat, carbonMat,
      armorPanelMat, cyanGlowMat, softBlueGlowMat, antennaBallMat,
      chestGlowMat, visorSheenMat
    ];


    // ─── PART B: 3D VOXEL LETTER V ───
    const vVoxelGroup = new THREE.Group();
    mascotGroup.add(vVoxelGroup);

    const vVoxelMat = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.85,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0, // initially invisible
    });

    const vCoords: Array<{ x: number; y: number; z: number }> = [];
    const path = [
      { x: -0.65, y: 0.75 }, { x: -0.52, y: 0.45 }, { x: -0.39, y: 0.15 }, { x: -0.26, y: -0.15 }, { x: -0.13, y: -0.45 },
      { x: 0.65, y: 0.75 }, { x: 0.52, y: 0.45 }, { x: 0.39, y: 0.15 }, { x: 0.26, y: -0.15 }, { x: 0.13, y: -0.45 },
      { x: 0.0, y: -0.75 }, { x: -0.08, y: -0.75 }, { x: 0.08, y: -0.75 }
    ];
    // Create thick 3D voxels for letter V
    path.forEach(p => {
      vCoords.push({ x: p.x, y: p.y, z: 0 });
      vCoords.push({ x: p.x, y: p.y, z: -0.12 });
      vCoords.push({ x: p.x, y: p.y, z: 0.12 });
    });

    const vVoxelSize = 0.08;
    const vVoxelBoxGeo = new THREE.BoxGeometry(vVoxelSize * 0.95, vVoxelSize * 0.95, vVoxelSize * 0.95);
    const vVoxelMeshes: THREE.Mesh[] = [];

    vCoords.forEach(c => {
      const mesh = new THREE.Mesh(vVoxelBoxGeo, vVoxelMat);
      mesh.position.set(c.x * 0.45, c.y * 0.45 + 0.05, c.z * 0.45); // offset y slightly to align center
      vVoxelGroup.add(mesh);
      vVoxelMeshes.push(mesh);
    });


    // --- PARTICLE SYSTEM ---
    const isMobile = width < 768;
    const particleCount = prefersReducedMotion ? 0 : isMobile ? 35 : 110;
    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);

    const pGeo = new THREE.BoxGeometry(0.022, 0.022, 0.022);
    const pMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
    });

    const particles: Array<{
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      targetPos: THREE.Vector3;
      assembling: boolean;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      const mesh = new THREE.Mesh(pGeo, pMat.clone());
      mesh.position.set(
        (Math.random() - 0.5) * 3.8,
        -1.6 + Math.random() * 2.2,
        (Math.random() - 0.5) * 2.5
      );
      particlesGroup.add(mesh);

      const targetPos = new THREE.Vector3(
        (Math.random() - 0.5) * 0.7,
        -0.5 + Math.random() * 1.2,
        (Math.random() - 0.5) * 0.5
      );

      particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.007,
          0.005 + Math.random() * 0.01,
          (Math.random() - 0.5) * 0.007
        ),
        targetPos,
        assembling: false,
      });
    }

    // Adjust group default values (starts large in center)
    mascotGroup.position.set(0, 0.15, 0);
    mascotGroup.scale.set(1.4, 1.4, 1.4);

    const handleResize = () => {
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Get screen position coordinates of mascot placeholder in header/title
    const getPlaceholderWorldPos = (targetVec: THREE.Vector3) => {
      const placeholder = document.getElementById('mascot-placeholder');
      if (!placeholder) {
        targetVec.set(-0.95, 0.05, 0);
        return;
      }
      const pRect = placeholder.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();

      const screenX = ((pRect.left + pRect.width / 2 - cRect.left) / cRect.width) * 2 - 1;
      const screenY = -((pRect.top + pRect.height / 2 - cRect.top) / cRect.height) * 2 + 1;

      const tempVec = new THREE.Vector3(screenX, screenY, 0.5);
      tempVec.unproject(camera);
      tempVec.sub(camera.position).normalize();
      const dist = -camera.position.z / tempVec.z;
      targetVec.copy(camera.position).add(tempVec.multiplyScalar(dist));
    };

    // Calculate target world scale to match the pixel height of the placeholder
    const getPlaceholderWorldScale = (): number => {
      const placeholder = document.getElementById('mascot-placeholder');
      if (!placeholder) return 0.32;
      const pRect = placeholder.getBoundingClientRect();
      const cRect = canvas.getBoundingClientRect();
      if (!cRect.height) return 0.32;
      const visibleHeightAtZ0 = 2 * Math.tan((camera.fov * Math.PI) / 360) * 4;
      const worldPlaceholderHeight = pRect.height * (visibleHeightAtZ0 / cRect.height);
      // The Voxel V local height is 1.5 units (from -0.75 to 0.75 in local space)
      // Scale factor of 1.10 provides a visually perfect matching text size
      return (worldPlaceholderHeight / 1.5) * 1.10;
    };

    const targetWorldPos = new THREE.Vector3();

    // Reduced motion handling: directly show the morphed voxel V mascot in title
    if (prefersReducedMotion) {
      stateRef.current = 'idle';
      if (onStateChange) onStateChange('idle');
      robotMaterials.forEach(mat => {
        mat.opacity = 0.0;
      });
      vVoxelMat.opacity = 1.0;
      vVoxelMeshes.forEach(mesh => mesh.visible = true);
      const targetScaleVal = getPlaceholderWorldScale();
      mascotGroup.scale.set(targetScaleVal, targetScaleVal, targetScaleVal);
    }

    const clock = new THREE.Clock();

    const animate = () => {
      const delta = deltaOverride ?? clock.getDelta();
      const elapsed = clock.getElapsedTime();
      timerRef.current += delta;

      const currentState = stateRef.current;

      // ─── STATE 1: INIT ───
      if (currentState === 'init') {
        particles.forEach((p) => {
          p.mesh.position.add(p.velocity);
          if (p.mesh.position.y > 1.9) {
            p.mesh.position.y = -1.6;
            p.mesh.position.x = (Math.random() - 0.5) * 3.8;
          }
        });

        if (timerRef.current > 1.2) {
          stateRef.current = 'assemble';
          if (onStateChange) onStateChange('assemble');
          particles.forEach(p => p.assembling = true);
        }
      }

      // ─── STATE 2: ASSEMBLE ───
      else if (currentState === 'assemble') {
        let allAssembled = true;
        const progress = Math.min((timerRef.current - 1.2) / 1.5, 1.0);

        robotMaterials.forEach(mat => {
          mat.opacity = progress;
        });
        visorSheenMat.opacity = progress * 0.15;

        particles.forEach((p) => {
          if (p.assembling) {
            const worldTarget = p.targetPos.clone().applyMatrix4(robotGroup.matrixWorld);
            p.mesh.position.lerp(worldTarget, 0.1);
            
            const dist = p.mesh.position.distanceTo(worldTarget);
            if (dist < 0.08) {
              p.mesh.visible = false;
              p.assembling = false;
            } else {
              allAssembled = false;
            }
          } else if (p.mesh.visible) {
            p.mesh.position.add(p.velocity);
          }
        });

        if (allAssembled || timerRef.current > 2.8) {
          robotMaterials.forEach(mat => {
            mat.opacity = 1.0;
          });
          visorSheenMat.opacity = 0.15;
          stateRef.current = 'showcase';
          if (onStateChange) onStateChange('showcase');
          timerRef.current = 0;
        }
      }

      // ─── STATE 3: SHOWCASE ───
      else if (currentState === 'showcase') {
        mascotGroup.position.y = 0.15 + Math.sin(elapsed * 2.4) * 0.08;
        mascotGroup.rotation.y = elapsed * 0.8;

        // Laser scan sweep
        if (timerRef.current > 0.4 && timerRef.current < 2.0) {
          laserConeMat.opacity = Math.sin((timerRef.current - 0.4) * Math.PI / 1.6) * 0.32;
          laserMesh.rotation.z = Math.sin(elapsed * 5.0) * 0.35;
        } else {
          laserConeMat.opacity = 0;
        }

        // Energy pulse emissive glows
        if (timerRef.current > 1.4 && timerRef.current < 2.2) {
          const pulse = 2.5 + Math.sin((timerRef.current - 1.4) * Math.PI / 0.8) * 4.5;
          cyanGlowMat.emissiveIntensity = pulse;
          antennaBallMat.emissiveIntensity = pulse;
          chestGlowMat.emissiveIntensity = pulse;
        } else {
          cyanGlowMat.emissiveIntensity = 2.5;
          antennaBallMat.emissiveIntensity = 2.5;
          chestGlowMat.emissiveIntensity = 3.0;
        }

        particles.forEach((p) => {
          if (p.mesh.visible) p.mesh.position.add(p.velocity);
        });

        if (timerRef.current > 2.6) {
          stateRef.current = 'docking';
          if (onStateChange) onStateChange('docking');
          timerRef.current = 0;
        }
      }

      // ─── STATE 4: DOCKING (Smooth Morphing to V letter) ───
      else if (currentState === 'docking') {
        getPlaceholderWorldPos(targetWorldPos);

        const progress = Math.min(timerRef.current / 1.5, 1.0);
        morphProgressRef.current = progress;

        // Lerp position, rotation, and size/scale to match text font sizing perfectly
        mascotGroup.position.lerp(targetWorldPos, 0.08);
        mascotGroup.rotation.y = THREE.MathUtils.lerp(mascotGroup.rotation.y, 0, 0.08);
        mascotGroup.rotation.x = THREE.MathUtils.lerp(mascotGroup.rotation.x, 0, 0.08);
        mascotGroup.rotation.z = THREE.MathUtils.lerp(mascotGroup.rotation.z, 0, 0.08);

        // Smoothly shrink mascot scale to match text height perfectly
        const targetScaleVal = getPlaceholderWorldScale();
        mascotGroup.scale.lerp(new THREE.Vector3(targetScaleVal, targetScaleVal, targetScaleVal), 0.08);

        // CROSS-FADE OPACITIES: Fade out robot, fade in voxel V
        robotMaterials.forEach(mat => {
          mat.opacity = (1.0 - progress);
        });
        visorSheenMat.opacity = (1.0 - progress) * 0.15;
        vVoxelMat.opacity = progress;

        particles.forEach((p) => {
          if (p.mesh.visible) {
            const mat = p.mesh.material as THREE.MeshBasicMaterial;
            mat.opacity -= 0.04;
            if (mat.opacity <= 0) p.mesh.visible = false;
          }
        });

        const dist = mascotGroup.position.distanceTo(targetWorldPos);
        if (dist < 0.02 || timerRef.current > 1.6) {
          mascotGroup.position.copy(targetWorldPos);
          mascotGroup.rotation.set(0, 0, 0);
          mascotGroup.scale.set(targetScaleVal, targetScaleVal, targetScaleVal);
          
          robotMaterials.forEach(mat => mat.opacity = 0.0);
          visorSheenMat.opacity = 0.0;
          vVoxelMat.opacity = 1.0;

          stateRef.current = 'idle';
          if (onStateChange) onStateChange('idle');
        }
      }

      // ─── STATE 5: DOCKED IDLE (Beautiful voxel V floating as first letter) ───
      else if (currentState === 'idle') {
        getPlaceholderWorldPos(targetWorldPos);
        mascotGroup.position.copy(targetWorldPos);

        const targetScaleVal = getPlaceholderWorldScale();
        mascotGroup.scale.set(targetScaleVal, targetScaleVal, targetScaleVal);

        // Micro-floating sway
        mascotGroup.position.y += Math.sin(elapsed * 2.2) * 0.015;
        mascotGroup.rotation.y = Math.sin(elapsed * 1.2) * 0.03;
        mascotGroup.rotation.z = Math.cos(elapsed * 1.5) * 0.01;

        // Subtle glow pulse
        vVoxelMat.emissiveIntensity = 2.4 + Math.sin(elapsed * 2.6) * 0.45;
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const deltaOverride: number | null = null;
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      scene.clear();
      renderer.dispose();
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      style={{ overflow: 'hidden' }}
    >
      <canvas ref={canvasRef} className="w-full h-full block bg-transparent" />
    </div>
  );
}
