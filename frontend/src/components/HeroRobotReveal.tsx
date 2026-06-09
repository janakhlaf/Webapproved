import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface HeroRobotRevealProps {
  phase: 'entrance' | 'scan' | 'merge' | 'final';
}

export function HeroRobotReveal({ phase }: HeroRobotRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const phaseRef = useRef(phase);

  // References for animating parts inside the render loop
  const requestRef = useRef<number | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const raisedHandRef = useRef<THREE.Group | null>(null);

  // Material refs for pulsing emission
  const antennaBallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const chestGlowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Particle tracking
  const voxelGroupRef = useRef<THREE.Group | null>(null);

  const stateRef = useRef({
    time: 0,
    robotX: 0,
    robotY: -0.24,
    robotRotY: 0,
    headRotX: 0,
    headRotY: 0,
    headRotZ: 0,
    leftArmRotX: 0,
    leftArmRotZ: 0,
    rightArmRotX: 0,
    rightArmRotZ: 0,
    rightHandRotY: 0,
    leftLegRotX: 0,
    rightLegRotX: 0,
    leftLegRotZ: 0,
    rightLegRotZ: 0,
    squashY: 1,
    beamOpacity: 0,
  });

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (hasError || !containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    const container = containerRef.current;
    const width = container.clientWidth || 120;
    const height = container.clientHeight || 120;

    try {
      // 1. Scene setup
      scene = new THREE.Scene();

      // 2. Camera Setup (Optimized for small close-up inline/reveal view)
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.08, 3.4); // slightly closer for details

      // 3. Renderer with high performance properties
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.65;
      container.appendChild(renderer.domElement);

      // 4. Premium lighting layout (Identical to original Robot3D)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(4, 9, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 512; // optimized size
      keyLight.shadow.mapSize.height = 512;
      keyLight.shadow.bias = -0.0008;
      keyLight.shadow.radius = 4;
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x4ddfff, 1.55);
      fillLight.position.set(-3.5, 0.5, 3.5);
      scene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0x66ccff, 2.6);
      rimLight.position.set(-1, 3.5, -4);
      scene.add(rimLight);

      const baseLight = new THREE.PointLight(0x00d9ff, 2.5, 3.0);
      baseLight.position.set(0, -0.85, 0.5);
      scene.add(baseLight);

      // 5. Build Robot Mesh (100% Identical to original Robot3D)
      const robotGroup = new THREE.Group();
      robotGroupRef.current = robotGroup;
      scene.add(robotGroup);

      // --- MATERIALS DEFINITION ---
      const whiteCeramicMat = new THREE.MeshPhysicalMaterial({
        color: 0x8f99a6,
        roughness: 0.13,
        metalness: 0.72,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        sheen: 0.2,
        sheenColor: new THREE.Color(0xb8c4d0),
      });

      const facePanelMat = new THREE.MeshPhysicalMaterial({
        color: 0x030712,
        roughness: 0.06,
        metalness: 0.88,
        clearcoat: 1.0,
        clearcoatRoughness: 0.015,
      });

      const eyeInkMat = new THREE.MeshStandardMaterial({
        color: 0x07111f,
        emissive: 0x28dfff,
        emissiveIntensity: 0.45,
        roughness: 0.16,
        metalness: 0.25,
      });

      const chromeJointMat = new THREE.MeshStandardMaterial({
        color: 0x9ca9ba,
        roughness: 0.16,
        metalness: 0.92,
      });

      const carbonMat = new THREE.MeshPhysicalMaterial({
        color: 0x111827,
        roughness: 0.18,
        metalness: 0.85,
        clearcoat: 0.7,
        clearcoatRoughness: 0.08,
      });

      const armorPanelMat = new THREE.MeshPhysicalMaterial({
        color: 0x7f8a98,
        roughness: 0.16,
        metalness: 0.66,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05,
      });

      const cyanGlowMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });

      const purpleGlowMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });

      const softBlueGlowMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x67e8f9,
        emissiveIntensity: 1.7,
        roughness: 0.1,
      });

      const antennaBallMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });
      antennaBallMatRef.current = antennaBallMat;

      const chestGlowMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });
      chestGlowMatRef.current = chestGlowMat;

      // Group to hold voxel building blocks
      const voxelGroup = new THREE.Group();
      voxelGroupRef.current = voxelGroup;
      scene.add(voxelGroup);

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

      // --- HEAD GROUP ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.42, 0);
      robotGroup.add(headGroup);
      headGroupRef.current = headGroup;

      const helmetGeo = roundedPanelGeometry(0.9, 0.72, 0.48, 0.38, 0.054);
      const helmet = new THREE.Mesh(helmetGeo, whiteCeramicMat);
      helmet.castShadow = true;
      headGroup.add(helmet);

      const visorGeo = roundedPanelGeometry(0.66, 0.38, 0.045, 0.21, 0.014);
      const visor = new THREE.Mesh(visorGeo, facePanelMat);
      visor.position.set(0, -0.04, 0.315);
      headGroup.add(visor);

      const visorSheenGeo = roundedPanelGeometry(0.48, 0.1, 0.01, 0.05, 0.004);
      const visorSheenMat = new THREE.MeshBasicMaterial({
        color: 0x9beafe,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      const visorSheen = new THREE.Mesh(visorSheenGeo, visorSheenMat);
      visorSheen.position.set(-0.07, 0.13, 0.345);
      visorSheen.rotation.z = 0.08;
      headGroup.add(visorSheen);

      const foreheadPanelGeo = roundedPanelGeometry(0.28, 0.064, 0.02, 0.033, 0.006);
      const foreheadPanel = new THREE.Mesh(foreheadPanelGeo, armorPanelMat);
      foreheadPanel.position.set(0, 0.405, 0.285);
      headGroup.add(foreheadPanel);

      const headbandGeo = new THREE.TorusGeometry(0.49, 0.032, 12, 32, Math.PI);
      const headband = new THREE.Mesh(headbandGeo, carbonMat);
      headband.position.set(0, 0.05, 0);
      headGroup.add(headband);

      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, 0.005, 0.355);
      headGroup.add(eyeGroup);

      // Left Eye
      const leftEyeGroup = new THREE.Group();
      leftEyeGroup.position.set(-0.145, 0.012, 0.02);
      eyeGroup.add(leftEyeGroup);
      leftEyeRef.current = leftEyeGroup;

      const invisiblePupilGeo = new THREE.SphereGeometry(0.001, 8, 8);
      const leftPupil = new THREE.Mesh(invisiblePupilGeo, eyeInkMat);
      leftPupilRef.current = leftPupil;

      // Right Eye
      const rightEyeGroup = new THREE.Group();
      rightEyeGroup.position.set(0.145, 0.012, 0.02);
      eyeGroup.add(rightEyeGroup);
      rightEyeRef.current = rightEyeGroup;

      const rightPupil = new THREE.Mesh(invisiblePupilGeo, eyeInkMat);
      rightPupilRef.current = rightPupil;

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

      const noseGeo = new THREE.SphereGeometry(0.03, 16, 16);
      noseGeo.scale(0.9, 0.62, 0.32);
      const nose = new THREE.Mesh(noseGeo, cyanGlowMat);
      nose.position.set(0, -0.055, 0.376);
      headGroup.add(nose);

      const mouthCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.076, 0, 0),
        new THREE.Vector3(0, -0.05, 0),
        new THREE.Vector3(0.076, 0, 0),
      );
      const mouthGeo = new THREE.TubeGeometry(mouthCurve, 24, 0.011, 8, false);
      const mouth = new THREE.Mesh(mouthGeo, cyanGlowMat);
      mouth.position.set(0, -0.14, 0.375);
      headGroup.add(mouth);

      // Ear Cups
      const earGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 28);
      earGeo.rotateZ(Math.PI / 2);

      const leftEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      leftEar.position.set(-0.515, 0, 0);
      headGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      rightEar.position.set(0.515, 0, 0);
      headGroup.add(rightEar);

      const earJointGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.13, 24);
      earJointGeo.rotateZ(Math.PI / 2);

      const leftEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      leftEarJoint.position.set(-0.505, 0, 0);
      headGroup.add(leftEarJoint);

      const rightEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      rightEarJoint.position.set(0.505, 0, 0);
      headGroup.add(rightEarJoint);

      const earGlowGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24);
      earGlowGeo.rotateZ(Math.PI / 2);

      const leftEarGlow = new THREE.Mesh(earGlowGeo, softBlueGlowMat);
      leftEarGlow.position.set(-0.57, 0, 0);
      headGroup.add(leftEarGlow);

      const leftEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 28), cyanGlowMat);
      leftEarInnerGlow.position.set(-0.585, 0, 0);
      leftEarInnerGlow.rotation.y = Math.PI / 2;
      headGroup.add(leftEarInnerGlow);

      const rightEarGlow = new THREE.Mesh(earGlowGeo, softBlueGlowMat);
      rightEarGlow.position.set(0.57, 0, 0);
      headGroup.add(rightEarGlow);

      const rightEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 8, 28), cyanGlowMat);
      rightEarInnerGlow.position.set(0.585, 0, 0);
      rightEarInnerGlow.rotation.y = Math.PI / 2;
      headGroup.add(rightEarInnerGlow);

      // Temple panels
      const templeGeo = new THREE.BoxGeometry(0.03, 0.16, 0.28);
      const leftTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      leftTemple.position.set(-0.445, 0.06, 0.12);
      leftTemple.rotation.y = -0.1;
      headGroup.add(leftTemple);

      const rightTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      rightTemple.position.set(0.445, 0.06, 0.12);
      rightTemple.rotation.y = 0.1;
      headGroup.add(rightTemple);

      // Antenna on Left Ear
      const antennaGroup = new THREE.Group();
      antennaGroup.position.set(-0.35, 0.4, 0);
      antennaGroup.rotation.z = 0.28;
      headGroup.add(antennaGroup);

      const antennaRodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8);
      const antennaRod = new THREE.Mesh(antennaRodGeo, chromeJointMat);
      antennaRod.position.y = 0.13;
      antennaGroup.add(antennaRod);

      const antennaBallGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const antennaBall = new THREE.Mesh(antennaBallGeo, antennaBallMat);
      antennaBall.position.y = 0.26;
      antennaGroup.add(antennaBall);

      // --- TORSO GROUP ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, -0.24, 0);
      robotGroup.add(torsoGroup);

      const collarGeo = new THREE.CylinderGeometry(0.11, 0.15, 0.11, 16);
      const collar = new THREE.Mesh(collarGeo, carbonMat);
      collar.position.set(0, 0.42, 0);
      torsoGroup.add(collar);

      const bodyGeo = roundedPanelGeometry(0.5, 0.58, 0.28, 0.085, 0.028);
      const bodyMesh = new THREE.Mesh(bodyGeo, whiteCeramicMat);
      bodyMesh.position.set(0, 0.02, 0);
      bodyMesh.castShadow = true;
      torsoGroup.add(bodyMesh);

      const torsoSidePanelGeo = new THREE.BoxGeometry(0.04, 0.36, 0.06);
      const leftTorsoPanel = new THREE.Mesh(torsoSidePanelGeo, armorPanelMat);
      leftTorsoPanel.position.set(-0.28, 0.02, 0.045);
      leftTorsoPanel.rotation.z = -0.08;
      torsoGroup.add(leftTorsoPanel);

      const rightTorsoPanel = new THREE.Mesh(torsoSidePanelGeo, armorPanelMat);
      rightTorsoPanel.position.set(0.28, 0.02, 0.045);
      rightTorsoPanel.rotation.z = 0.08;
      torsoGroup.add(rightTorsoPanel);

      const chestPlateGeo = roundedPanelGeometry(0.28, 0.2, 0.032, 0.045, 0.01);
      const chestPlate = new THREE.Mesh(chestPlateGeo, armorPanelMat);
      chestPlate.position.set(0, 0.12, 0.16);
      torsoGroup.add(chestPlate);

      const chestCoreGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.025, 24);
      chestCoreGeo.rotateX(Math.PI / 2);
      const chestCore = new THREE.Mesh(chestCoreGeo, carbonMat);
      chestCore.position.set(0, 0.11, 0.182);
      torsoGroup.add(chestCore);

      // Glowing Triangle
      const triangleGeo = new THREE.ConeGeometry(0.055, 0.01, 3);
      triangleGeo.rotateX(Math.PI / 2);
      triangleGeo.rotateZ(Math.PI);
      const triangleMesh = new THREE.Mesh(triangleGeo, chestGlowMat);
      triangleMesh.position.set(0, 0.11, 0.2);
      torsoGroup.add(triangleMesh);

      // Glowing Outer Ring
      const chestRingGeo = new THREE.TorusGeometry(0.08, 0.01, 8, 24);
      const chestRingMesh = new THREE.Mesh(chestRingGeo, softBlueGlowMat);
      chestRingMesh.position.set(0, 0.11, 0.2);
      torsoGroup.add(chestRingMesh);

      const beltGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.085, 24);
      const belt = new THREE.Mesh(beltGeo, carbonMat);
      belt.position.set(0, -0.38, 0);
      torsoGroup.add(belt);

      const hipsGeo = roundedPanelGeometry(0.42, 0.16, 0.22, 0.045, 0.018);
      const hips = new THREE.Mesh(hipsGeo, whiteCeramicMat);
      hips.position.set(0, -0.46, 0);
      hips.castShadow = true;
      torsoGroup.add(hips);

      // --- LIMBS: ARMS ---
      // Left Arm
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.42, 0.2, 0);
      torsoGroup.add(leftArmGroup);
      leftArmRef.current = leftArmGroup;

      const shoulderJointGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const leftShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      leftArmGroup.add(leftShoulder);

      const shoulderPadGeo = roundedPanelGeometry(0.16, 0.12, 0.12, 0.03, 0.01);
      const leftShoulderPad = new THREE.Mesh(shoulderPadGeo, whiteCeramicMat);
      leftShoulderPad.position.set(0, 0.03, 0);
      leftArmGroup.add(leftShoulderPad);

      const upperArmGeo = roundedPanelGeometry(0.14, 0.24, 0.105, 0.024, 0.009);
      upperArmGeo.translate(0, -0.11, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, whiteCeramicMat);
      leftUpperArm.castShadow = true;
      leftArmGroup.add(leftUpperArm);

      const elbowJointGeo = new THREE.SphereGeometry(0.064, 16, 16);
      const leftElbow = new THREE.Mesh(elbowJointGeo, chromeJointMat);
      leftElbow.position.set(0, -0.22, 0);
      leftArmGroup.add(leftElbow);

      const forearmGeo = roundedPanelGeometry(0.14, 0.24, 0.105, 0.024, 0.009);
      forearmGeo.translate(0, -0.11, 0);
      const leftForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      leftForearm.position.set(0, -0.22, 0);
      leftForearm.castShadow = true;
      leftArmGroup.add(leftForearm);

      const handGeo = roundedPanelGeometry(0.145, 0.12, 0.105, 0.032, 0.01);
      const fingerGeo = new THREE.CapsuleGeometry(0.015, 0.082, 4, 8);
      const leftHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      leftHand.position.set(0, -0.46, 0);
      leftArmGroup.add(leftHand);

      [-0.05, -0.018, 0.018, 0.05].forEach((x, index) => {
        const finger = new THREE.Mesh(fingerGeo, whiteCeramicMat);
        finger.position.set(x, -0.535, index === 0 || index === 3 ? 0.02 : 0.032);
        finger.rotation.z = (x < 0 ? 0.18 : -0.18);
        leftArmGroup.add(finger);
      });
      const leftThumb = new THREE.Mesh(fingerGeo, whiteCeramicMat);
      leftThumb.position.set(0.085, -0.498, 0.016);
      leftThumb.rotation.z = -0.9;
      leftThumb.rotation.x = 0.25;
      leftArmGroup.add(leftThumb);

      const handGlowGeo = new THREE.SphereGeometry(0.034, 8, 8);
      const leftHandGlow = new THREE.Mesh(handGlowGeo, cyanGlowMat);
      leftHandGlow.position.set(0, -0.5, 0);
      leftArmGroup.add(leftHandGlow);

      // Right Arm
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.42, 0.2, 0);
      torsoGroup.add(rightArmGroup);
      rightArmRef.current = rightArmGroup;

      const rightShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      rightArmGroup.add(rightShoulder);

      const rightShoulderPad = new THREE.Mesh(shoulderPadGeo, whiteCeramicMat);
      rightShoulderPad.position.set(0, 0.03, 0);
      rightArmGroup.add(rightShoulderPad);

      const rightUpperArm = new THREE.Mesh(upperArmGeo, whiteCeramicMat);
      rightUpperArm.castShadow = true;
      rightArmGroup.add(rightUpperArm);

      const rightElbow = new THREE.Mesh(elbowJointGeo, chromeJointMat);
      rightElbow.position.set(0, -0.22, 0);
      rightArmGroup.add(rightElbow);

      const rightForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      rightForearm.position.set(0, -0.22, 0);
      rightForearm.castShadow = true;
      rightArmGroup.add(rightForearm);

      const rightHandGroup = new THREE.Group();
      rightHandGroup.position.set(0, -0.46, 0);
      rightHandGroup.rotation.y = -0.65;
      raisedHandRef.current = rightHandGroup;
      rightArmGroup.add(rightHandGroup);

      const rightHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      rightHandGroup.add(rightHand);

      [-0.05, -0.018, 0.018, 0.05].forEach((x, index) => {
        const finger = new THREE.Mesh(fingerGeo, whiteCeramicMat);
        finger.position.set(x, -0.072, index === 0 || index === 3 ? 0.02 : 0.032);
        finger.rotation.z = (x < 0 ? 0.18 : -0.18);
        rightHandGroup.add(finger);
      });
      const rightThumb = new THREE.Mesh(fingerGeo, whiteCeramicMat);
      rightThumb.position.set(-0.09, -0.028, 0.02);
      rightThumb.rotation.z = 0.92;
      rightThumb.rotation.x = -0.22;
      rightHandGroup.add(rightThumb);

      const rightHandGlow = new THREE.Mesh(handGlowGeo, cyanGlowMat);
      rightHandGlow.position.set(0, -0.04, 0.045);
      rightHandGroup.add(rightHandGlow);

      // --- LIMBS: LEGS ---
      // Left Leg
      const leftLegGroup = new THREE.Group();
      leftLegGroup.position.set(-0.18, -0.47, 0);
      torsoGroup.add(leftLegGroup);
      leftLegRef.current = leftLegGroup;

      const hipJointGeo = new THREE.SphereGeometry(0.074, 16, 16);
      const leftHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      leftLegGroup.add(leftHip);

      const thighGeo = roundedPanelGeometry(0.16, 0.23, 0.115, 0.026, 0.01);
      thighGeo.translate(0, -0.11, 0);
      const leftThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      leftThigh.castShadow = true;
      leftLegGroup.add(leftThigh);

      const kneeJointGeo = new THREE.SphereGeometry(0.064, 16, 16);
      const leftKnee = new THREE.Mesh(kneeJointGeo, softBlueGlowMat);
      leftKnee.position.set(0, -0.22, 0);
      leftLegGroup.add(leftKnee);

      const shinGeo = roundedPanelGeometry(0.16, 0.25, 0.125, 0.026, 0.01);
      shinGeo.translate(0, -0.11, 0);
      const leftShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      leftShin.position.set(0, -0.22, 0);
      leftShin.castShadow = true;
      leftLegGroup.add(leftShin);

      // Feet
      const footGeo = roundedPanelGeometry(0.24, 0.11, 0.3, 0.032, 0.01);
      const leftFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      leftFoot.position.set(0, -0.44, 0.04);
      leftFoot.castShadow = true;
      leftLegGroup.add(leftFoot);

      const soleGeo = new THREE.BoxGeometry(0.2, 0.024, 0.29);
      const leftSole = new THREE.Mesh(soleGeo, carbonMat);
      leftSole.position.set(0, -0.47, 0.04);
      leftLegGroup.add(leftSole);

      // Right Leg
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.18, -0.47, 0);
      torsoGroup.add(rightLegGroup);
      rightLegRef.current = rightLegGroup;

      const rightHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      rightLegGroup.add(rightHip);

      const rightThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      rightThigh.castShadow = true;
      rightLegGroup.add(rightThigh);

      const rightKnee = new THREE.Mesh(kneeJointGeo, softBlueGlowMat);
      rightKnee.position.set(0, -0.22, 0);
      rightLegGroup.add(rightKnee);

      const rightShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      rightShin.position.set(0, -0.22, 0);
      rightShin.castShadow = true;
      rightLegGroup.add(rightShin);

      const rightFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      rightFoot.position.set(0, -0.44, 0.04);
      rightFoot.castShadow = true;
      rightLegGroup.add(rightFoot);

      const rightSole = new THREE.Mesh(soleGeo, carbonMat);
      rightSole.position.set(0, -0.47, 0.04);
      rightLegGroup.add(rightSole);

      // --- SCANNED VOXEL BLOCKS PRE-CREATION ---
      const activeVoxels: Array<{
        mesh: THREE.Mesh;
        velocity: THREE.Vector3;
        rotSpeed: THREE.Vector3;
        life: number;
        maxLife: number;
      }> = [];

      // Add a laser beam visual helper
      const laserGeo = new THREE.CylinderGeometry(0.005, 0.04, 1.8, 8, 1, true);
      laserGeo.rotateX(Math.PI / 2);
      laserGeo.translate(0, 0, 0.9); // offset pivot to base
      const laserMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      const laserMesh = new THREE.Mesh(laserGeo, laserMat);
      scene.add(laserMesh);

      // --- ANIMATION LOOP ---
      const animate = () => {
        const state = stateRef.current;
        state.time += 0.016; // 60fps pacing

        const currentPhase = phaseRef.current;

        // Lerp targets based on phase
        let targetX = 0;
        let targetY = -0.24;
        let targetRotY = 0;
        let targetLeftLegRotX = 0;
        let targetRightLegRotX = 0;
        let targetLeftArmRotZ = -0.22;
        let targetRightArmRotZ = 0.22;
        let targetRightArmRotX = 0;
        let targetHeadRotY = 0;
        let targetHeadRotX = 0;
        let targetHeadRotZ = 0;
        let targetSquashY = 1.0;
        let targetBeamOpacity = 0;

        if (currentPhase === 'entrance') {
          targetX = 0;
          targetY = -0.24 + Math.sin(state.time * 1.4) * 0.025;
          targetLeftLegRotX = 0;
          targetRightLegRotX = 0;
          targetLeftArmRotZ = -0.2;
          targetRightArmRotZ = 0.2;
          targetHeadRotY = -0.1;
          targetHeadRotX = 0.04;
        } 
        else if (currentPhase === 'scan') {
          targetX = 0;
          targetY = -0.24 + Math.sin(state.time * 1.2) * 0.032;
          targetRotY = -0.12;
          targetLeftLegRotX = 0;
          targetRightLegRotX = 0;
          targetLeftArmRotZ = -0.2;
          targetRightArmRotZ = 0.34;
          targetRightArmRotX = -0.08;
          targetHeadRotY = -0.18;
          targetHeadRotX = 0.08;
          targetBeamOpacity = 0.12 + Math.sin(state.time * 2.5) * 0.04;

          if (Math.random() < 0.035) {
            const size = 0.025 + Math.random() * 0.045;
            const geo = new THREE.BoxGeometry(size, size, size);
            const mat = Math.random() < 0.5 ? cyanGlowMat : purpleGlowMat;
            const voxel = new THREE.Mesh(geo, mat);

            // Start at scaled hand position
            const handPos = new THREE.Vector3(0.3 * 0.26, 0.05 * 0.26, 0.35 * 0.26);
            voxel.position.copy(handPos);

            voxelGroup.add(voxel);

            activeVoxels.push({
              mesh: voxel,
              velocity: new THREE.Vector3(
                0.18 + Math.random() * 0.28,
                -0.08 + Math.random() * 0.18,
                -0.4 + Math.random() * 0.8
              ),
              rotSpeed: new THREE.Vector3(
                Math.random() * 8,
                Math.random() * 8,
                Math.random() * 8
              ),
              life: 0,
              maxLife: 1.0 + Math.random() * 0.6,
            });
          }
        } 
        else if (currentPhase === 'merge') {
          targetX = 0;
          targetY = -0.24 + Math.sin(state.time * 1.15) * 0.038;
          targetRotY = -0.16;
          targetLeftLegRotX = 0;
          targetRightLegRotX = 0;
          targetLeftArmRotZ = -0.22;
          targetRightArmRotZ = 0.22;
        } 
        else if (currentPhase === 'final') {
          targetX = 0;
          targetY = -0.24 + Math.sin(state.time * 1.08) * 0.052;
          targetRotY = -0.18;
          targetLeftLegRotX = 0;
          targetRightLegRotX = 0;
          targetLeftArmRotZ = -0.18 + Math.sin(state.time * 0.95) * 0.018;
          targetRightArmRotZ = 0.18 - Math.sin(state.time * 1.0) * 0.02;
          targetHeadRotY = -0.15 + Math.sin(state.time * 0.58) * 0.028;
          targetHeadRotX = 0.05 + Math.cos(state.time * 0.58) * 0.018;
          targetHeadRotZ = Math.sin(state.time * 0.42) * 0.018;
          targetSquashY = 1.0 + Math.sin(state.time * 1.35) * 0.012;
        }

        // Lerp variables for fluid animation transitions
        const lerpFactor = 0.07;
        state.robotX += (targetX - state.robotX) * lerpFactor;
        state.robotY += (targetY - state.robotY) * lerpFactor;
        state.robotRotY += (targetRotY - state.robotRotY) * lerpFactor;
        state.leftLegRotX += (targetLeftLegRotX - state.leftLegRotX) * lerpFactor;
        state.rightLegRotX += (targetRightLegRotX - state.rightLegRotX) * lerpFactor;
        state.leftArmRotZ += (targetLeftArmRotZ - state.leftArmRotZ) * lerpFactor;
        state.rightArmRotZ += (targetRightArmRotZ - state.rightArmRotZ) * lerpFactor;
        state.rightArmRotX += (targetRightArmRotX - state.rightArmRotX) * lerpFactor;
        state.headRotY += (targetHeadRotY - state.headRotY) * lerpFactor;
        state.headRotX += (targetHeadRotX - state.headRotX) * lerpFactor;
        state.headRotZ += (targetHeadRotZ - state.headRotZ) * lerpFactor;
        state.squashY += (targetSquashY - state.squashY) * lerpFactor;
        state.beamOpacity += (targetBeamOpacity - state.beamOpacity) * 0.15;

        // Apply to robot (small companion scale)
        if (robotGroupRef.current) {
          robotGroupRef.current.position.x = state.robotX;
          robotGroupRef.current.position.y = state.robotY;
          robotGroupRef.current.rotation.y = state.robotRotY;
          robotGroupRef.current.scale.set(0.34, 0.34 * state.squashY, 0.34);
        }

        if (headGroupRef.current) {
          headGroupRef.current.rotation.y = state.headRotY;
          headGroupRef.current.rotation.x = state.headRotX;
          headGroupRef.current.rotation.z = state.headRotZ;
        }

        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = state.leftArmRotZ;
        }

        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = state.rightArmRotZ;
          rightArmRef.current.rotation.x = state.rightArmRotX;
        }

        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = state.leftLegRotX;
        }

        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = state.rightLegRotX;
        }

        // Blinking
        if (leftEyeRef.current && rightEyeRef.current) {
          const blinkCycle = state.time % 4.0;
          if (blinkCycle < 0.1) {
            leftEyeRef.current.scale.y = 0.1;
            rightEyeRef.current.scale.y = 0.1;
          } else {
            leftEyeRef.current.scale.y = 1;
            rightEyeRef.current.scale.y = 1;
          }
        }

        // Pulse emission
        if (antennaBallMatRef.current) {
          antennaBallMatRef.current.emissiveIntensity = 2.5 + Math.sin(state.time * 5.0) * 0.8;
        }
        if (chestGlowMatRef.current) {
          chestGlowMatRef.current.emissiveIntensity = 3.0 + Math.sin(state.time * 2.5) * 0.8;
        }

        // Laser beam visualization starting at scaled hand
        if (laserMesh) {
          laserMat.opacity = state.beamOpacity * 0.6;
          // Set starting position at right hand
          laserMesh.position.set(0.3 * 0.26, (0.05 + Math.sin(state.time * 15) * 0.02) * 0.26, 0.35 * 0.26);
          laserMesh.rotation.set(0.1, state.headRotY + 0.2, 0);
        }

        // Update voxel particles
        for (let i = activeVoxels.length - 1; i >= 0; i--) {
          const v = activeVoxels[i];
          v.life += 0.016;

          if (v.life >= v.maxLife) {
            voxelGroup.remove(v.mesh);
            v.mesh.geometry.dispose();
            activeVoxels.splice(i, 1);
          } else {
            // Apply velocity
            v.mesh.position.addScaledVector(v.velocity, 0.016);
            v.mesh.rotation.x += v.rotSpeed.x * 0.016;
            v.mesh.rotation.y += v.rotSpeed.y * 0.016;
            v.mesh.rotation.z += v.rotSpeed.z * 0.016;

            // Fade out near end of life
            const ratio = v.life / v.maxLife;
            if (ratio > 0.7) {
              const scale = (1.0 - ratio) / 0.3;
              v.mesh.scale.set(scale, scale, scale);
            }
          }
        }

        renderer.render(scene, camera);
        requestRef.current = requestAnimationFrame(animate);
      };

      animate();

    } catch (err) {
      console.error("Hero robot WebGL failed.", err);
      setHasError(true);
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [hasError]);

  if (hasError) {
    // Elegant fallback to clean letter "I" if WebGL fails
    return (
      <div className="flex items-center justify-center font-extrabold text-6xl md:text-8xl tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
        I
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
}
