import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Robot3DProps {
  isOpen: boolean;
  onClick: () => void;
}

const BUBBLE_PHRASES = [
  "Hello! 👋",
  "Need help?",
  "Ask me anything.",
  "I'm here to assist! 🚀",
  "How can I help you? ✨"
];

export function Robot3D({ isOpen, onClick }: Robot3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [bubbleText, setBubbleText] = useState<string | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // References for animating parts inside the render loop
  const requestRef = useRef<number | null>(null);
  const robotGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const torsoRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);
  const pedestalRing1Ref = useRef<THREE.Mesh | null>(null);
  const pedestalRing2Ref = useRef<THREE.Mesh | null>(null);
  const holoConeRef = useRef<THREE.Mesh | null>(null);

  // Animation states and timers (using lerping for smooth transitions)
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    currentAction: 'idle', // 'idle', 'waving', 'hopping', 'walking', 'hoverActive', 'clickReaction'
    actionTimer: 0,
    actionProgress: 0, // for multi-step animations
    clickActionPending: false,
    clickTimer: 0,
    // Target and current values for lerping
    pose: {
      robotY: 0,
      robotX: 0,
      robotRotY: 0,
      headRotX: 0,
      headRotY: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      squashX: 1,
      squashY: 1,
      squashZ: 1,
      holoOpacity: 0.12,
    },
    currentPose: {
      robotY: 0,
      robotX: 0,
      robotRotY: 0,
      headRotX: 0,
      headRotY: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      squashX: 1,
      squashY: 1,
      squashZ: 1,
      holoOpacity: 0.12,
    }
  });

  // Track mouse coordinates
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      const { innerWidth, innerHeight } = window;
      // Normalised coordinates [-1, 1]
      stateRef.current.targetX = (clientX / innerWidth) * 2 - 1;
      stateRef.current.targetY = -(clientY / innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Speech bubble timing
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      return;
    }

    const triggerBubble = () => {
      const randomPhrase = BUBBLE_PHRASES[Math.floor(Math.random() * BUBBLE_PHRASES.length)];
      setBubbleText(randomPhrase);
      setShowBubble(true);

      setTimeout(() => {
        setShowBubble(false);
      }, 4500);
    };

    const initialDelay = setTimeout(triggerBubble, 4000);
    const interval = setInterval(triggerBubble, 24000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [isOpen]);

  // Click gesture handling: make robot jump & wave before opening chat window
  const handleRobotClick = () => {
    if (isOpen) {
      // If already open, close immediately
      onClick();
      return;
    }

    const state = stateRef.current;
    if (state.currentAction === 'clickReaction') return;

    // Trigger click reaction animation
    state.currentAction = 'clickReaction';
    state.clickTimer = 0.55; // 550ms animation duration
    state.actionTimer = 0.55;

    // Open chat after animation finishes
    setTimeout(() => {
      onClick();
    }, 740); // Matches slowed down animation
  };

  useEffect(() => {
    if (hasError || !containerRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    const container = containerRef.current;
    const width = container.clientWidth || 112;
    const height = container.clientHeight || 112;

    try {
      // 1. Scene setup
      scene = new THREE.Scene();

      // 2. Camera Setup
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.02, 4.3);

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
      renderer.toneMappingExposure = 1.6;
      container.appendChild(renderer.domElement);

      // 4. Premium lighting layout
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
      scene.add(ambientLight);

      // High key light casting shadows
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
      keyLight.position.set(4, 9, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0008;
      keyLight.shadow.radius = 4;
      scene.add(keyLight);

      // Cyber cyan fill light from front-left
      const fillLight = new THREE.DirectionalLight(0x00f0ff, 1.1);
      fillLight.position.set(-3.5, 0.5, 3.5);
      scene.add(fillLight);

      // Purple-magenta rim light from top-back-right
      const rimLight = new THREE.DirectionalLight(0x7c3aed, 2.5);
      rimLight.position.set(-1, 3.5, -4);
      scene.add(rimLight);

      // Cyber pedestal base glow
      const baseLight = new THREE.PointLight(0x00d9ff, 2.0, 3.0);
      baseLight.position.set(0, -0.85, 0.5);
      scene.add(baseLight);

      // 5. Build Robot Mesh
      const robotGroup = new THREE.Group();
      robotGroupRef.current = robotGroup;
      scene.add(robotGroup);

      // --- MATERIALS DEFINITION ---
      const whiteCeramicMat = new THREE.MeshStandardMaterial({
        color: 0xf9fafb,
        roughness: 0.18,
        metalness: 0.12,
      });

      const darkVisorMat = new THREE.MeshStandardMaterial({
        color: 0x070b12,
        roughness: 0.08,
        metalness: 0.9,
      });

      const chromeJointMat = new THREE.MeshStandardMaterial({
        color: 0x242830,
        roughness: 0.35,
        metalness: 0.8,
      });

      const neonGlowMat = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 4.5,
        roughness: 0.05,
      });

      const holoConeMat = new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      // --- PEDESTAL (Stage Base) ---
      const pedestalGroup = new THREE.Group();
      pedestalGroup.position.y = -0.92;
      robotGroup.add(pedestalGroup);
      pedestalRef.current = pedestalGroup;

      // Base Disk
      const baseGeo = new THREE.CylinderGeometry(0.72, 0.78, 0.08, 32);
      const baseMesh = new THREE.Mesh(baseGeo, chromeJointMat);
      baseMesh.receiveShadow = true;
      pedestalGroup.add(baseMesh);

      // Inner Glowing Ring
      const ring1Geo = new THREE.RingGeometry(0.56, 0.61, 32);
      const ring1 = new THREE.Mesh(ring1Geo, new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }));
      ring1.rotation.x = -Math.PI / 2;
      ring1.position.y = 0.045;
      pedestalGroup.add(ring1);
      pedestalRing1Ref.current = ring1;

      // Outer Glowing Ring
      const ring2Geo = new THREE.RingGeometry(0.66, 0.69, 32);
      const ring2 = new THREE.Mesh(ring2Geo, new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      }));
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = 0.045;
      pedestalGroup.add(ring2);
      pedestalRing2Ref.current = ring2;

      // Volumetric Hologram Projection Cone
      const holoConeGeo = new THREE.ConeGeometry(0.68, 1.45, 32, 1, true);
      holoConeGeo.translate(0, 0.725, 0); // shift pivot to base
      const holoCone = new THREE.Mesh(holoConeGeo, holoConeMat);
      holoCone.position.set(0, 0.04, 0);
      pedestalGroup.add(holoCone);
      holoConeRef.current = holoCone;

      // --- HEAD GROUP ---
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.38, 0);
      robotGroup.add(headGroup);
      headGroupRef.current = headGroup;

      // Outer Helmet shell
      const helmetGeo = new THREE.SphereGeometry(0.59, 32, 32);
      helmetGeo.scale(1.05, 0.96, 1.0);
      const helmet = new THREE.Mesh(helmetGeo, whiteCeramicMat);
      helmet.castShadow = true;
      headGroup.add(helmet);

      // Front Glossy Visor Screen
      const visorGeo = new THREE.SphereGeometry(0.55, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
      visorGeo.scale(1.02, 0.88, 0.88);
      visorGeo.rotateX(Math.PI / 2); // face forward
      const visor = new THREE.Mesh(visorGeo, darkVisorMat);
      visor.position.set(0, -0.02, 0.1);
      headGroup.add(visor);

      // Smiling Emissive Eyes (^ ^)
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, -0.02, 0.57);
      headGroup.add(eyeGroup);

      const eyeGeo = new THREE.TorusGeometry(0.08, 0.02, 8, 24, Math.PI);

      const leftEye = new THREE.Mesh(eyeGeo, neonGlowMat);
      leftEye.position.set(-0.21, -0.03, -0.04);
      leftEye.rotation.set(0, 0.08, 0);
      eyeGroup.add(leftEye);
      leftEyeRef.current = leftEye;

      const rightEye = new THREE.Mesh(eyeGeo, neonGlowMat);
      rightEye.position.set(0.21, -0.03, -0.04);
      rightEye.rotation.set(0, -0.08, 0);
      eyeGroup.add(rightEye);
      rightEyeRef.current = rightEye;

      // Side Headphones/Ear Cups
      const earGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24);
      earGeo.rotateZ(Math.PI / 2);

      const leftEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      leftEar.position.set(-0.61, 0, 0);
      headGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      rightEar.position.set(0.61, 0, 0);
      headGroup.add(rightEar);

      // Ear concentric joints (Chrome and glowing blue disc)
      const earJointGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.13, 24);
      earJointGeo.rotateZ(Math.PI / 2);

      const leftEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      leftEarJoint.position.set(-0.61, 0, 0);
      headGroup.add(leftEarJoint);

      const rightEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      rightEarJoint.position.set(0.61, 0, 0);
      headGroup.add(rightEarJoint);

      const earGlowGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24);
      earGlowGeo.rotateZ(Math.PI / 2);

      const leftEarGlow = new THREE.Mesh(earGlowGeo, neonGlowMat);
      leftEarGlow.position.set(-0.68, 0, 0);
      headGroup.add(leftEarGlow);

      const rightEarGlow = new THREE.Mesh(earGlowGeo, neonGlowMat);
      rightEarGlow.position.set(0.68, 0, 0);
      headGroup.add(rightEarGlow);

      // Antenna on Left Ear
      const antennaGroup = new THREE.Group();
      antennaGroup.position.set(-0.42, 0.44, 0);
      antennaGroup.rotation.z = 0.28;
      headGroup.add(antennaGroup);

      const antennaRodGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8);
      const antennaRod = new THREE.Mesh(antennaRodGeo, chromeJointMat);
      antennaRod.position.y = 0.13;
      antennaGroup.add(antennaRod);

      const antennaBallGeo = new THREE.SphereGeometry(0.045, 16, 16);
      const antennaBall = new THREE.Mesh(antennaBallGeo, neonGlowMat);
      antennaBall.position.y = 0.26;
      antennaGroup.add(antennaBall);

      // --- TORSO GROUP ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, -0.2, 0);
      robotGroup.add(torsoGroup);
      torsoRef.current = torsoGroup;

      // Dark neck collar joint
      const collarGeo = new THREE.CylinderGeometry(0.13, 0.17, 0.13, 16);
      const collar = new THREE.Mesh(collarGeo, chromeJointMat);
      collar.position.set(0, 0.45, 0);
      torsoGroup.add(collar);

      // White Torso Shell
      const bodyGeo = new THREE.SphereGeometry(0.37, 32, 32);
      bodyGeo.scale(1, 1.16, 0.94);
      const bodyMesh = new THREE.Mesh(bodyGeo, whiteCeramicMat);
      bodyMesh.castShadow = true;
      torsoGroup.add(bodyMesh);

      // Chest emblem plate (metallic circle)
      const chestPlateGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.025, 24);
      chestPlateGeo.rotateX(Math.PI / 2);
      const chestPlate = new THREE.Mesh(chestPlateGeo, chromeJointMat);
      chestPlate.position.set(0, 0.12, 0.32);
      torsoGroup.add(chestPlate);

      // Glowing Triangle Symbol inside chestplate
      const triangleGeo = new THREE.ConeGeometry(0.065, 0.01, 3);
      triangleGeo.rotateX(Math.PI / 2);
      triangleGeo.rotateZ(Math.PI); // triangle pointing up
      const triangleMesh = new THREE.Mesh(triangleGeo, neonGlowMat);
      triangleMesh.position.set(0, 0.12, 0.336);
      torsoGroup.add(triangleMesh);

      // Glowing Outer Ring around triangle
      const chestRingGeo = new THREE.TorusGeometry(0.09, 0.012, 8, 24);
      const chestRingMesh = new THREE.Mesh(chestRingGeo, neonGlowMat);
      chestRingMesh.position.set(0, 0.12, 0.336);
      torsoGroup.add(chestRingMesh);

      // Belt / Waist joint
      const beltGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.09, 24);
      const belt = new THREE.Mesh(beltGeo, chromeJointMat);
      belt.position.set(0, -0.4, 0);
      torsoGroup.add(belt);

      // Hips pelvis armor
      const hipsGeo = new THREE.SphereGeometry(0.28, 24, 24);
      hipsGeo.scale(1, 0.48, 0.95);
      const hips = new THREE.Mesh(hipsGeo, whiteCeramicMat);
      hips.position.set(0, -0.48, 0);
      hips.castShadow = true;
      torsoGroup.add(hips);

      // --- LIMBS: ARMS ---
      // Left Arm (Robot's right arm)
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.43, 0.18, 0);
      torsoGroup.add(leftArmGroup);
      leftArmRef.current = leftArmGroup;

      const shoulderJointGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const leftShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      leftArmGroup.add(leftShoulder);

      const upperArmGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.22, 16);
      upperArmGeo.translate(0, -0.11, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, whiteCeramicMat);
      leftUpperArm.castShadow = true;
      leftArmGroup.add(leftUpperArm);

      const elbowJointGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const leftElbow = new THREE.Mesh(elbowJointGeo, chromeJointMat);
      leftElbow.position.set(0, -0.22, 0);
      leftArmGroup.add(leftElbow);

      const forearmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.22, 16);
      forearmGeo.translate(0, -0.11, 0);
      const leftForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      leftForearm.position.set(0, -0.22, 0);
      leftForearm.castShadow = true;
      leftArmGroup.add(leftForearm);

      const handGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const leftHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      leftHand.position.set(0, -0.46, 0);
      leftArmGroup.add(leftHand);

      const handGlowGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const leftHandGlow = new THREE.Mesh(handGlowGeo, neonGlowMat);
      leftHandGlow.position.set(0, -0.51, 0);
      leftArmGroup.add(leftHandGlow);

      // Right Arm (Robot's left arm - Waving arm on our right)
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.43, 0.18, 0);
      torsoGroup.add(rightArmGroup);
      rightArmRef.current = rightArmGroup;

      const rightShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      rightArmGroup.add(rightShoulder);

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

      const rightHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      rightHand.position.set(0, -0.46, 0);
      rightArmGroup.add(rightHand);

      const rightHandGlow = new THREE.Mesh(handGlowGeo, neonGlowMat);
      rightHandGlow.position.set(0, -0.51, 0);
      rightArmGroup.add(rightHandGlow);

      // --- LIMBS: LEGS ---
      // Left Leg
      const leftLegGroup = new THREE.Group();
      leftLegGroup.position.set(-0.19, -0.48, 0);
      torsoGroup.add(leftLegGroup);
      leftLegRef.current = leftLegGroup;

      const hipJointGeo = new THREE.SphereGeometry(0.075, 16, 16);
      const leftHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      leftLegGroup.add(leftHip);

      const thighGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.22, 16);
      thighGeo.translate(0, -0.11, 0);
      const leftThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      leftThigh.castShadow = true;
      leftLegGroup.add(leftThigh);

      const kneeJointGeo = new THREE.SphereGeometry(0.062, 16, 16);
      const leftKnee = new THREE.Mesh(kneeJointGeo, neonGlowMat);
      leftKnee.position.set(0, -0.22, 0);
      leftLegGroup.add(leftKnee);

      const shinGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.22, 16);
      shinGeo.translate(0, -0.11, 0);
      const leftShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      leftShin.position.set(0, -0.22, 0);
      leftShin.castShadow = true;
      leftLegGroup.add(leftShin);

      // Feet with black soles and glowing blue highlights
      const footGeo = new THREE.SphereGeometry(0.09, 16, 16);
      footGeo.scale(1.1, 0.6, 1.45);
      const leftFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      leftFoot.position.set(0, -0.45, 0.05);
      leftFoot.castShadow = true;
      leftLegGroup.add(leftFoot);

      const soleGeo = new THREE.BoxGeometry(0.18, 0.02, 0.28);
      const leftSole = new THREE.Mesh(soleGeo, chromeJointMat);
      leftSole.position.set(0, -0.48, 0.05);
      leftLegGroup.add(leftSole);

      // Right Leg
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.19, -0.48, 0);
      torsoGroup.add(rightLegGroup);
      rightLegRef.current = rightLegGroup;

      const rightHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      rightLegGroup.add(rightHip);

      const rightThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      rightThigh.castShadow = true;
      rightLegGroup.add(rightThigh);

      const rightKnee = new THREE.Mesh(kneeJointGeo, neonGlowMat);
      rightKnee.position.set(0, -0.22, 0);
      rightLegGroup.add(rightKnee);

      const rightShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      rightShin.position.set(0, -0.22, 0);
      rightShin.castShadow = true;
      rightLegGroup.add(rightShin);

      const rightFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      rightFoot.position.set(0, -0.45, 0.05);
      rightFoot.castShadow = true;
      rightLegGroup.add(rightFoot);

      const rightSole = new THREE.Mesh(soleGeo, chromeJointMat);
      rightSole.position.set(0, -0.48, 0.05);
      rightLegGroup.add(rightSole);

      // --- ANIMATION LOOP ---
      const animate = () => {
        const state = stateRef.current;
        state.time += 0.0125; // Increment by ~1 frame delta (slowed down by 22%)

        // Lerp mouse variables
        state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.08;
        state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.08;

        // Base floats & breathing (slightly amplified for presence)
        const breathe = Math.sin(state.time * 2.2);
        const float = Math.sin(state.time * 1.6);
        const lateralSway = Math.sin(state.time * 0.8) * 0.05;

        // Reset poses targets default
        const pose = state.pose;
        pose.robotY = float * 0.09 - 0.08; // Amplified float
        pose.robotX = lateralSway;
        pose.robotRotY = 0;
        pose.squashX = 1;
        pose.squashY = 1 + breathe * 0.01; // Amplified breathing
        pose.squashZ = 1;
        pose.holoOpacity = 0.12 + float * 0.04;

        // Mouse looking controls (if hovered, look more directly; else turn slightly)
        const lookRange = isHovered ? 0.65 : 0.35;
        pose.headRotY = state.mouse.x * lookRange;
        pose.headRotX = -state.mouse.y * (lookRange * 0.45);
        pose.robotRotY = state.mouse.x * 0.1;

        // Default arm/leg idle poses
        pose.leftArmRotZ = -0.16 + Math.sin(state.time * 1.2) * 0.03;
        pose.leftArmRotX = Math.sin(state.time * 0.9) * 0.03;
        pose.rightArmRotZ = 0.16 - Math.sin(state.time * 1.2) * 0.03;
        pose.rightArmRotX = -Math.sin(state.time * 0.9) * 0.03;
        pose.leftLegRotX = 0;
        pose.rightLegRotX = 0;

        // Handle eye blinking timer
        if (leftEyeRef.current && rightEyeRef.current) {
          const blinkCycle = state.time % 3.6;
          if (blinkCycle < 0.12) {
            leftEyeRef.current.scale.y = 0;
            rightEyeRef.current.scale.y = 0;
          } else {
            leftEyeRef.current.scale.y = 1;
            rightEyeRef.current.scale.y = 1;
          }
        }

        // Action timer update
        state.actionTimer -= 0.0125;

        // Override poses if special action is active
        if (state.currentAction === 'clickReaction') {
          // Click Reaction Animation (delayed click triggers this)
          state.clickTimer -= 0.0125;
          
          // Happy jump & quick arm wave
          const progress = 1 - (state.clickTimer / 0.55); // 0 to 1
          const hopHeight = Math.sin(progress * Math.PI) * 0.45;
          pose.robotY += hopHeight;
          pose.squashY = 1 + Math.cos(progress * Math.PI * 2) * 0.1;

          // Wave left & right arm during hop
          pose.rightArmRotZ = Math.PI * 0.65 + Math.sin(state.time * 18) * 0.35;
          pose.rightArmRotX = Math.sin(state.time * 9) * 0.2;
          pose.leftArmRotZ = -Math.PI * 0.4 - Math.sin(state.time * 18) * 0.15;
          
          // Rotate head down/up
          pose.headRotX = -0.15 + Math.sin(progress * Math.PI) * 0.3;

          if (state.clickTimer <= 0) {
            state.currentAction = 'idle';
            state.actionTimer = 3.0; // Rest idle
          }
        }
        else if (isHovered) {
          // HOVER STATE (tenses and waves right arm to welcome user)
          pose.robotY += 0.06; // floats slightly higher
          pose.holoOpacity = 0.20; // hologram glows stronger
          
          // Wave right arm smoothly
          pose.rightArmRotZ = Math.PI * 0.72 + Math.sin(state.time * 10) * 0.22;
          pose.rightArmRotX = Math.sin(state.time * 5) * 0.1;
          pose.leftArmRotZ = -0.22; // keep left arm stable
        }
        else {
          // AUTONOMOUS STATE MACHINE (Idle, periodic wave, walk, hop)
          if (state.actionTimer <= 0) {
            const roll = Math.random();
            if (roll < 0.4) {
              state.currentAction = 'idle';
              state.actionTimer = Math.random() * 6 + 5;
            } else if (roll < 0.65) {
              state.currentAction = 'waving';
              state.actionTimer = 2.4;
            } else if (roll < 0.85) {
              state.currentAction = 'walking';
              state.actionTimer = 4.2;
              state.walkTime = 0;
            } else {
              state.currentAction = 'hopping';
              state.actionTimer = 1.6;
              state.hopTime = 0;
            }
          }

          if (state.currentAction === 'waving') {
            // Periodic wave
            pose.rightArmRotZ = Math.PI * 0.68 + Math.sin(state.time * 9) * 0.25;
            pose.rightArmRotX = Math.sin(state.time * 4) * 0.1;
          }
          else if (state.currentAction === 'walking') {
            state.walkTime += 0.0125;
            // Slide forward and backward on the pedestal
            const slideCycle = Math.sin(state.walkTime * 1.5);
            pose.robotY += 0.02;
            pose.robotX = slideCycle * 0.18;
            pose.robotRotY = -Math.cos(state.walkTime * 1.5) * 0.22;

            // Leg swings
            const legSwing = Math.sin(state.walkTime * 8.0) * 0.35;
            pose.leftLegRotX = legSwing;
            pose.rightLegRotX = -legSwing;
            pose.leftArmRotX = -legSwing * 0.7;
            pose.rightArmRotX = legSwing * 0.7;
          }
          else if (state.currentAction === 'hopping') {
            state.hopTime += 0.0125;
            // Cute tiny double hop
            const progress = (state.hopTime * 1.65) % Math.PI;
            const hopHeight = Math.sin(progress) * 0.34;
            pose.robotY += hopHeight;
            pose.squashY = 1 + Math.cos(progress * 2) * 0.075;

            pose.leftArmRotZ = -0.38 - Math.sin(state.time * 8) * 0.12;
            pose.rightArmRotZ = 0.38 + Math.sin(state.time * 8) * 0.12;
          }
        }

        // LERP current pose coordinates to targets for smooth transitions
        const current = state.currentPose;
        const lerpFactor = 0.075; // Lower value = smoother transitions (increased damping for premium flow)

        current.robotY += (pose.robotY - current.robotY) * lerpFactor;
        current.robotX += (pose.robotX - current.robotX) * lerpFactor;
        current.robotRotY += (pose.robotRotY - current.robotRotY) * lerpFactor;
        current.headRotX += (pose.headRotX - current.headRotX) * lerpFactor;
        current.headRotY += (pose.headRotY - current.headRotY) * lerpFactor;
        current.leftArmRotX += (pose.leftArmRotX - current.leftArmRotX) * lerpFactor;
        current.leftArmRotZ += (pose.leftArmRotZ - current.leftArmRotZ) * lerpFactor;
        current.rightArmRotX += (pose.rightArmRotX - current.rightArmRotX) * lerpFactor;
        current.rightArmRotZ += (pose.rightArmRotZ - current.rightArmRotZ) * lerpFactor;
        current.leftLegRotX += (pose.leftLegRotX - current.leftLegRotX) * lerpFactor;
        current.rightLegRotX += (pose.rightLegRotX - current.rightLegRotX) * lerpFactor;
        current.squashX += (pose.squashX - current.squashX) * lerpFactor;
        current.squashY += (pose.squashY - current.squashY) * lerpFactor;
        current.squashZ += (pose.squashZ - current.squashZ) * lerpFactor;
        current.holoOpacity += (pose.holoOpacity - current.holoOpacity) * lerpFactor;

        // Apply interpolated transformations to meshes
        if (robotGroupRef.current) {
          robotGroupRef.current.position.y = current.robotY;
          robotGroupRef.current.position.x = current.robotX;
          robotGroupRef.current.rotation.y = current.robotRotY;
          robotGroupRef.current.scale.set(current.squashX, current.squashY, current.squashZ);
        }

        if (headGroupRef.current) {
          headGroupRef.current.rotation.y = current.headRotY;
          headGroupRef.current.rotation.x = current.headRotX;
        }

        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = current.leftArmRotX;
          leftArmRef.current.rotation.z = current.leftArmRotZ;
        }

        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = current.rightArmRotX;
          rightArmRef.current.rotation.z = current.rightArmRotZ;
        }

        if (leftLegRef.current) leftLegRef.current.rotation.x = current.leftLegRotX;
        if (rightLegRef.current) rightLegRef.current.rotation.x = current.rightLegRotX;

        // Adjust hologram cone opacity
        if (holoConeRef.current) {
          holoConeMat.opacity = current.holoOpacity;
          holoConeRef.current.rotation.y += 0.005; // slowly rotate cone waves
        }

        // Spin pedestal rings
        if (pedestalRing1Ref.current) pedestalRing1Ref.current.rotation.z += 0.006;
        if (pedestalRing2Ref.current) pedestalRing2Ref.current.rotation.z -= 0.003;

        renderer.render(scene, camera);
        requestRef.current = requestAnimationFrame(animate);
      };

      animate();

    } catch (err) {
      console.error("Three.js/WebGL initialization failed, falling back to icon.", err);
      setHasError(true);
    }

    // Cleanup
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
  }, [hasError, isHovered]);

  if (hasError) {
    return (
      <button
        onClick={onClick}
        className="h-14 w-14 rounded-full bg-primary/90 backdrop-blur-sm hover:bg-primary shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-300 hover:scale-110 flex items-center justify-center text-white"
        aria-label="Toggle chat window"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div 
      className="relative flex items-center justify-center pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Speech bubble overlay */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="absolute right-full mr-4 bottom-8 z-50 whitespace-nowrap bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-white font-medium text-xs px-4 py-2.5 rounded-2xl shadow-xl shadow-cyan-950/20"
            style={{
              boxShadow: '0 10px 25px -5px rgba(6, 182, 212, 0.15)',
            }}
          >
            {bubbleText}
            {/* Speech bubble pointer */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-[5px] w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[5px] border-l-slate-950/85 border-l-cyan-500/30"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robot Canvas Container */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRobotClick}
        className="cursor-pointer select-none rounded-full"
        style={{
          width: '112px',
          height: '112px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(0,0,0,0) 65%)',
        }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </motion.div>
    </div>
  );
}
