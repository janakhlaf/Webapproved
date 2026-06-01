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
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftPupilRef = useRef<THREE.Mesh | null>(null);
  const rightPupilRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const torsoRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);
  const pedestalRing1Ref = useRef<THREE.Mesh | null>(null);
  const pedestalRing2Ref = useRef<THREE.Mesh | null>(null);
  const holoConeRef = useRef<THREE.Mesh | null>(null);
  const holoRingRef = useRef<THREE.Mesh | null>(null);

  // Material refs for pulsing emission
  const antennaBallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const chestGlowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const blushMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);

  const prevIsOpen = useRef(isOpen);
  const isOpenRef = useRef(isOpen);

  // Animation states and timers (using lerping for smooth transitions)
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    currentAction: 'entrance', // 'entrance', 'idle', 'waving', 'hopping', 'walking', 'clickReaction', 'openReaction', 'closeReaction', 'attentionTilt', 'attentionSpin', 'attentionFlash'
    actionTimer: 2.0, // 2 seconds entrance animation
    actionProgress: 0,
    clickActionPending: false,
    clickTimer: 0,
    walkTime: 0,
    hopTime: 0,
    // Target and current values for lerping
    pose: {
      robotY: -0.92,
      robotX: 0,
      robotRotY: 0,
      headRotX: 0,
      headRotY: 0,
      headRotZ: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      squashX: 0,
      squashY: 0,
      squashZ: 0,
      holoOpacity: 0.0,
    },
    currentPose: {
      robotY: -0.92,
      robotX: 0,
      robotRotY: 0,
      headRotX: 0,
      headRotY: 0,
      headRotZ: 0,
      leftArmRotX: 0,
      leftArmRotZ: 0,
      rightArmRotX: 0,
      rightArmRotZ: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      squashX: 0,
      squashY: 0,
      squashZ: 0,
      holoOpacity: 0.0,
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

  // Track isOpen transitions
  useEffect(() => {
    if (prevIsOpen.current !== isOpen) {
      if (isOpen) {
        stateRef.current.currentAction = 'openReaction';
        stateRef.current.actionTimer = 1.2;
      } else {
        stateRef.current.currentAction = 'closeReaction';
        stateRef.current.actionTimer = 1.0;
      }
      prevIsOpen.current = isOpen;
    }
    isOpenRef.current = isOpen;
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
    const width = container.clientWidth || 160;
    const height = container.clientHeight || 160;

    try {
      // 1. Scene setup
      scene = new THREE.Scene();

      // 2. Camera Setup (Optimized for larger close-up avatar view)
      camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
      camera.position.set(0, 0.08, 3.8);

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

      // 4. Premium lighting layout
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      // High key light casting shadows
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
      keyLight.position.set(4, 9, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0008;
      keyLight.shadow.radius = 4;
      scene.add(keyLight);

      // Cyber cyan fill light from front-left
      const fillLight = new THREE.DirectionalLight(0x00f0ff, 1.3);
      fillLight.position.set(-3.5, 0.5, 3.5);
      scene.add(fillLight);

      // Purple-magenta rim light from top-back-right
      const rimLight = new THREE.DirectionalLight(0x7c3aed, 2.8);
      rimLight.position.set(-1, 3.5, -4);
      scene.add(rimLight);

      // Cyber pedestal base glow
      const baseLight = new THREE.PointLight(0x00d9ff, 2.5, 3.0);
      baseLight.position.set(0, -0.85, 0.5);
      scene.add(baseLight);

      // 5. Build Robot Mesh
      const robotGroup = new THREE.Group();
      robotGroupRef.current = robotGroup;
      scene.add(robotGroup);

      // --- MATERIALS DEFINITION ---
      // MeshPhysicalMaterial gives a beautiful premium lacquer / glossy ceramic coating
      const whiteCeramicMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.12,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
      });

      const darkVisorMat = new THREE.MeshPhysicalMaterial({
        color: 0x030712,
        roughness: 0.02,
        metalness: 0.98,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
      });

      const chromeJointMat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed, // Metallic brand purple joint/accent
        roughness: 0.18,
        metalness: 0.92,
      });

      const carbonMat = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a, // Premium dark slate casing accent
        roughness: 0.25,
        metalness: 0.8,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
      });

      const cyanGlowMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.5,
        roughness: 0.1,
      });

      const violetGlowMat = new THREE.MeshStandardMaterial({
        color: 0x8b5cf6,
        emissive: 0x8b5cf6,
        emissiveIntensity: 2.5,
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

      const blushMat = new THREE.MeshStandardMaterial({
        color: 0xff4d7d,
        emissive: 0xff4d7d,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.45,
        roughness: 0.5,
      });
      blushMatRef.current = blushMat;

      const holoConeMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.08,
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
      const ring1 = new THREE.Mesh(ring1Geo, cyanGlowMat);
      ring1.rotation.x = -Math.PI / 2;
      ring1.position.y = 0.045;
      pedestalGroup.add(ring1);
      pedestalRing1Ref.current = ring1;

      // Outer Glowing Ring
      const ring2Geo = new THREE.RingGeometry(0.66, 0.69, 32);
      const ring2 = new THREE.Mesh(ring2Geo, violetGlowMat);
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
      headGroup.position.set(0, 0.40, 0); // Slightly adjusted upward
      robotGroup.add(headGroup);
      headGroupRef.current = headGroup;

      // Outer Helmet shell - Oval profile for humanoid look
      const helmetGeo = new THREE.SphereGeometry(0.56, 32, 32);
      helmetGeo.scale(1.02, 1.06, 1.0);
      const helmet = new THREE.Mesh(helmetGeo, whiteCeramicMat);
      helmet.castShadow = true;
      headGroup.add(helmet);

      // Front Glossy Visor Screen
      const visorGeo = new THREE.SphereGeometry(0.53, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.52);
      visorGeo.scale(1.03, 0.88, 0.88);
      visorGeo.rotateX(Math.PI / 2); // face forward
      const visor = new THREE.Mesh(visorGeo, darkVisorMat);
      visor.position.set(0, -0.02, 0.1);
      headGroup.add(visor);

      // Curved Headphones Band (Connects ear cups)
      const headbandGeo = new THREE.TorusGeometry(0.58, 0.035, 12, 32, Math.PI);
      const headband = new THREE.Mesh(headbandGeo, carbonMat);
      headband.position.set(0, 0.05, 0);
      headGroup.add(headband);

      // Detailed Human-like Expressive Eye System
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, -0.01, 0.55);
      headGroup.add(eyeGroup);

      const eyeBackGeo = new THREE.SphereGeometry(0.09, 32, 16);
      eyeBackGeo.scale(1.0, 1.25, 0.15);

      const irisGeo = new THREE.SphereGeometry(0.07, 32, 16);
      irisGeo.scale(1.0, 1.1, 0.2);

      const pupilGeo = new THREE.SphereGeometry(0.04, 16, 16);
      pupilGeo.scale(1.0, 1.0, 0.4);

      const highlight1Geo = new THREE.SphereGeometry(0.018, 12, 12);
      const highlight2Geo = new THREE.SphereGeometry(0.009, 12, 12);
      const whiteHighlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

      // Left Eye Group
      const leftEyeGroup = new THREE.Group();
      leftEyeGroup.position.set(-0.19, -0.02, 0.02);
      eyeGroup.add(leftEyeGroup);
      leftEyeRef.current = leftEyeGroup;

      const leftEyeBack = new THREE.Mesh(eyeBackGeo, new THREE.MeshStandardMaterial({
        color: 0x020306,
        roughness: 0.1,
        metalness: 0.9,
      }));
      leftEyeGroup.add(leftEyeBack);

      const leftIris = new THREE.Mesh(irisGeo, violetGlowMat);
      leftIris.position.set(0, 0, 0.01);
      leftEyeGroup.add(leftIris);

      const leftPupil = new THREE.Mesh(pupilGeo, cyanGlowMat);
      leftPupil.position.set(0, 0, 0.02);
      leftEyeGroup.add(leftPupil);
      leftPupilRef.current = leftPupil;

      const leftHighlight1 = new THREE.Mesh(highlight1Geo, whiteHighlightMat);
      leftHighlight1.position.set(0.025, 0.025, 0.055);
      leftEyeGroup.add(leftHighlight1);

      const leftHighlight2 = new THREE.Mesh(highlight2Geo, whiteHighlightMat);
      leftHighlight2.position.set(-0.015, -0.015, 0.055);
      leftEyeGroup.add(leftHighlight2);

      // Right Eye Group
      const rightEyeGroup = new THREE.Group();
      rightEyeGroup.position.set(0.19, -0.02, 0.02);
      eyeGroup.add(rightEyeGroup);
      rightEyeRef.current = rightEyeGroup;

      const rightEyeBack = new THREE.Mesh(eyeBackGeo, new THREE.MeshStandardMaterial({
        color: 0x020306,
        roughness: 0.1,
        metalness: 0.9,
      }));
      rightEyeGroup.add(rightEyeBack);

      const rightIris = new THREE.Mesh(irisGeo, violetGlowMat);
      rightIris.position.set(0, 0, 0.01);
      rightEyeGroup.add(rightIris);

      const rightPupil = new THREE.Mesh(pupilGeo, cyanGlowMat);
      rightPupil.position.set(0, 0, 0.02);
      rightEyeGroup.add(rightPupil);
      rightPupilRef.current = rightPupil;

      const rightHighlight1 = new THREE.Mesh(highlight1Geo, whiteHighlightMat);
      rightHighlight1.position.set(0.025, 0.025, 0.055);
      rightEyeGroup.add(rightHighlight1);

      const rightHighlight2 = new THREE.Mesh(highlight2Geo, whiteHighlightMat);
      rightHighlight2.position.set(-0.015, -0.015, 0.055);
      rightEyeGroup.add(rightHighlight2);

      // Cute blush cheeks under the eyes
      const blushGeo = new THREE.SphereGeometry(0.04, 16, 16);
      blushGeo.scale(1.2, 0.6, 0.2);

      const leftBlush = new THREE.Mesh(blushGeo, blushMat);
      leftBlush.position.set(-0.19, -0.15, 0.52);
      headGroup.add(leftBlush);

      const rightBlush = new THREE.Mesh(blushGeo, blushMat);
      rightBlush.position.set(0.19, -0.15, 0.52);
      headGroup.add(rightBlush);

      // Micro-details: Brow Plates for welcoming expression (slightly raised outer edges for happiness)
      const leftBrowGeo = new THREE.BoxGeometry(0.12, 0.016, 0.03);
      const leftBrow = new THREE.Mesh(leftBrowGeo, carbonMat);
      leftBrow.position.set(-0.19, 0.11, 0.52);
      leftBrow.rotation.z = -0.05;
      headGroup.add(leftBrow);

      const rightBrowGeo = new THREE.BoxGeometry(0.12, 0.016, 0.03);
      const rightBrow = new THREE.Mesh(rightBrowGeo, carbonMat);
      rightBrow.position.set(0.19, 0.11, 0.52);
      rightBrow.rotation.z = 0.05;
      headGroup.add(rightBrow);

      // Forehead Camera/Sensor Node
      const sensorCoreGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
      sensorCoreGeo.rotateX(Math.PI / 2);
      const foreheadSensor = new THREE.Mesh(sensorCoreGeo, cyanGlowMat);
      foreheadSensor.position.set(0, 0.22, 0.47);
      headGroup.add(foreheadSensor);

      // Happy Smiling Visor Plate Detail (larger, highly visible and welcoming)
      const mouthGeo = new THREE.TorusGeometry(0.075, 0.008, 10, 32, Math.PI * 0.85);
      mouthGeo.rotateX(Math.PI);
      const mouth = new THREE.Mesh(mouthGeo, cyanGlowMat);
      mouth.position.set(0, -0.16, 0.52);
      headGroup.add(mouth);
      mouthRef.current = mouth;

      // Defined Chin Panel for defined humanoid facial proportions
      const chinGeo = new THREE.SphereGeometry(0.08, 16, 16);
      chinGeo.scale(1.2, 0.6, 0.8);
      const chin = new THREE.Mesh(chinGeo, whiteCeramicMat);
      chin.position.set(0, -0.28, 0.44);
      headGroup.add(chin);

      // Side Headphones/Ear Cups
      const earGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 24);
      earGeo.rotateZ(Math.PI / 2);

      const leftEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      leftEar.position.set(-0.58, 0, 0);
      headGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      rightEar.position.set(0.58, 0, 0);
      headGroup.add(rightEar);

      // Ear concentric joints
      const earJointGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.13, 24);
      earJointGeo.rotateZ(Math.PI / 2);

      const leftEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      leftEarJoint.position.set(-0.58, 0, 0);
      headGroup.add(leftEarJoint);

      const rightEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      rightEarJoint.position.set(0.58, 0, 0);
      headGroup.add(rightEarJoint);

      const earGlowGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24);
      earGlowGeo.rotateZ(Math.PI / 2);

      const leftEarGlow = new THREE.Mesh(earGlowGeo, violetGlowMat);
      leftEarGlow.position.set(-0.65, 0, 0);
      headGroup.add(leftEarGlow);

      const rightEarGlow = new THREE.Mesh(earGlowGeo, violetGlowMat);
      rightEarGlow.position.set(0.65, 0, 0);
      headGroup.add(rightEarGlow);

      // Temple structural panels
      const templeGeo = new THREE.BoxGeometry(0.03, 0.16, 0.28);
      const leftTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      leftTemple.position.set(-0.52, 0.06, 0.12);
      leftTemple.rotation.y = -0.1;
      headGroup.add(leftTemple);

      const rightTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      rightTemple.position.set(0.52, 0.06, 0.12);
      rightTemple.rotation.y = 0.1;
      headGroup.add(rightTemple);

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
      const antennaBall = new THREE.Mesh(antennaBallGeo, antennaBallMat);
      antennaBall.position.y = 0.26;
      antennaGroup.add(antennaBall);

      // --- TORSO GROUP (Compact round chibi proportions) ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, -0.2, 0);
      robotGroup.add(torsoGroup);
      torsoRef.current = torsoGroup;

      // Dark neck collar joint
      const collarGeo = new THREE.CylinderGeometry(0.11, 0.15, 0.11, 16);
      const collar = new THREE.Mesh(collarGeo, carbonMat);
      collar.position.set(0, 0.42, 0);
      torsoGroup.add(collar);

      // White Torso Shell (Slightly smaller for cuter balance)
      const bodyGeo = new THREE.SphereGeometry(0.33, 32, 32);
      bodyGeo.scale(1, 1.12, 0.94);
      const bodyMesh = new THREE.Mesh(bodyGeo, whiteCeramicMat);
      bodyMesh.castShadow = true;
      torsoGroup.add(bodyMesh);

      // Chest emblem plate (metallic circle)
      const chestPlateGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.025, 24);
      chestPlateGeo.rotateX(Math.PI / 2);
      const chestPlate = new THREE.Mesh(chestPlateGeo, carbonMat);
      chestPlate.position.set(0, 0.10, 0.28);
      torsoGroup.add(chestPlate);

      // Glowing Triangle Symbol inside chestplate
      const triangleGeo = new THREE.ConeGeometry(0.055, 0.01, 3);
      triangleGeo.rotateX(Math.PI / 2);
      triangleGeo.rotateZ(Math.PI); // triangle pointing up
      const triangleMesh = new THREE.Mesh(triangleGeo, chestGlowMat);
      triangleMesh.position.set(0, 0.10, 0.296);
      torsoGroup.add(triangleMesh);

      // Glowing Outer Ring around triangle
      const chestRingGeo = new THREE.TorusGeometry(0.08, 0.01, 8, 24);
      const chestRingMesh = new THREE.Mesh(chestRingGeo, violetGlowMat);
      chestRingMesh.position.set(0, 0.10, 0.296);
      torsoGroup.add(chestRingMesh);

      // Belt / Waist joint
      const beltGeo = new THREE.CylinderGeometry(0.22, 0.20, 0.09, 24);
      const belt = new THREE.Mesh(beltGeo, carbonMat);
      belt.position.set(0, -0.38, 0);
      torsoGroup.add(belt);

      // Hips pelvis armor
      const hipsGeo = new THREE.SphereGeometry(0.25, 24, 24);
      hipsGeo.scale(1, 0.48, 0.95);
      const hips = new THREE.Mesh(hipsGeo, whiteCeramicMat);
      hips.position.set(0, -0.45, 0);
      hips.castShadow = true;
      torsoGroup.add(hips);

      // --- LIMBS: ARMS ---
      // Left Arm
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.39, 0.18, 0);
      torsoGroup.add(leftArmGroup);
      leftArmRef.current = leftArmGroup;

      const shoulderJointGeo = new THREE.SphereGeometry(0.075, 16, 16);
      const leftShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      leftArmGroup.add(leftShoulder);

      const shoulderPadGeo = new THREE.SphereGeometry(0.095, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      shoulderPadGeo.rotateX(-Math.PI / 2);
      const leftShoulderPad = new THREE.Mesh(shoulderPadGeo, whiteCeramicMat);
      leftShoulderPad.position.set(0, 0.03, 0);
      leftArmGroup.add(leftShoulderPad);

      const upperArmGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.20, 16);
      upperArmGeo.translate(0, -0.10, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, whiteCeramicMat);
      leftUpperArm.castShadow = true;
      leftArmGroup.add(leftUpperArm);

      const elbowJointGeo = new THREE.SphereGeometry(0.055, 16, 16);
      const leftElbow = new THREE.Mesh(elbowJointGeo, chromeJointMat);
      leftElbow.position.set(0, -0.20, 0);
      leftArmGroup.add(leftElbow);

      const forearmGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.20, 16);
      forearmGeo.translate(0, -0.10, 0);
      const leftForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      leftForearm.position.set(0, -0.20, 0);
      leftForearm.castShadow = true;
      leftArmGroup.add(leftForearm);

      const handGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const leftHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      leftHand.position.set(0, -0.42, 0);
      leftArmGroup.add(leftHand);

      const handGlowGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const leftHandGlow = new THREE.Mesh(handGlowGeo, cyanGlowMat);
      leftHandGlow.position.set(0, -0.46, 0);
      leftArmGroup.add(leftHandGlow);

      // Right Arm
      const rightArmGroup = new THREE.Group();
      rightArmGroup.position.set(0.39, 0.18, 0);
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
      rightElbow.position.set(0, -0.20, 0);
      rightArmGroup.add(rightElbow);

      const rightForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      rightForearm.position.set(0, -0.20, 0);
      rightForearm.castShadow = true;
      rightArmGroup.add(rightForearm);

      const rightHand = new THREE.Mesh(handGeo, whiteCeramicMat);
      rightHand.position.set(0, -0.42, 0);
      rightArmGroup.add(rightHand);

      const rightHandGlow = new THREE.Mesh(handGlowGeo, cyanGlowMat);
      rightHandGlow.position.set(0, -0.46, 0);
      rightArmGroup.add(rightHandGlow);

      // --- LIMBS: LEGS ---
      // Left Leg
      const leftLegGroup = new THREE.Group();
      leftLegGroup.position.set(-0.17, -0.45, 0);
      torsoGroup.add(leftLegGroup);
      leftLegRef.current = leftLegGroup;

      const hipJointGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const leftHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      leftLegGroup.add(leftHip);

      const thighGeo = new THREE.CylinderGeometry(0.07, 0.06, 0.20, 16);
      thighGeo.translate(0, -0.10, 0);
      const leftThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      leftThigh.castShadow = true;
      leftLegGroup.add(leftThigh);

      const kneeJointGeo = new THREE.SphereGeometry(0.055, 16, 16);
      const leftKnee = new THREE.Mesh(kneeJointGeo, violetGlowMat);
      leftKnee.position.set(0, -0.20, 0);
      leftLegGroup.add(leftKnee);

      const shinGeo = new THREE.CylinderGeometry(0.06, 0.075, 0.20, 16);
      shinGeo.translate(0, -0.10, 0);
      const leftShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      leftShin.position.set(0, -0.20, 0);
      leftShin.castShadow = true;
      leftLegGroup.add(leftShin);

      // Feet
      const footGeo = new THREE.SphereGeometry(0.08, 16, 16);
      footGeo.scale(1.1, 0.6, 1.45);
      const leftFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      leftFoot.position.set(0, -0.40, 0.04);
      leftFoot.castShadow = true;
      leftLegGroup.add(leftFoot);

      const soleGeo = new THREE.BoxGeometry(0.16, 0.02, 0.26);
      const leftSole = new THREE.Mesh(soleGeo, carbonMat);
      leftSole.position.set(0, -0.43, 0.04);
      leftLegGroup.add(leftSole);

      // Right Leg
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.17, -0.45, 0);
      torsoGroup.add(rightLegGroup);
      rightLegRef.current = rightLegGroup;

      const rightHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      rightLegGroup.add(rightHip);

      const rightThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      rightThigh.castShadow = true;
      rightLegGroup.add(rightThigh);

      const rightKnee = new THREE.Mesh(kneeJointGeo, violetGlowMat);
      rightKnee.position.set(0, -0.20, 0);
      rightLegGroup.add(rightKnee);

      const rightShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      rightShin.position.set(0, -0.20, 0);
      rightShin.castShadow = true;
      rightLegGroup.add(rightShin);

      const rightFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      rightFoot.position.set(0, -0.40, 0.04);
      rightFoot.castShadow = true;
      rightLegGroup.add(rightFoot);

      const rightSole = new THREE.Mesh(soleGeo, carbonMat);
      rightSole.position.set(0, -0.43, 0.04);
      rightLegGroup.add(rightSole);

      // Floating data scan ring
      const scanRingGeo = new THREE.RingGeometry(0.68, 0.70, 32);
      const scanRing = new THREE.Mesh(scanRingGeo, violetGlowMat);
      scanRing.rotation.x = -Math.PI / 2;
      scanRing.position.y = -0.45;
      robotGroup.add(scanRing);
      holoRingRef.current = scanRing;

      // --- ANIMATION LOOP ---
      const animate = () => {
        const state = stateRef.current;
        state.time += 0.012; // Natural, fluid time step for warm interaction speed

        // Lerp mouse variables
        state.mouse.x += (state.mouse.targetX - state.mouse.x) * 0.07;
        state.mouse.y += (state.mouse.targetY - state.mouse.y) * 0.07;

        // Base floats & breathing (welcoming, organic AI assistant breathing)
        const breathe = Math.sin(state.time * 1.8) * 0.5;
        const float = Math.sin(state.time * 1.2) * 0.045;
        const lateralSway = Math.sin(state.time * 0.6) * 0.02;

        // Reset poses targets default
        const pose = state.pose;
        pose.robotY = float - 0.08; 
        pose.robotX = lateralSway;
        pose.robotRotY = 0;
        pose.squashX = 1;
        pose.squashY = 1 + breathe * 0.012; 
        pose.squashZ = 1;
        pose.holoOpacity = 0.10 + float * 0.03;

        // Mouse looking controls (expressive, friendly gaze tracking)
        const lookRange = isHovered ? 0.45 : 0.25;
        pose.headRotY = state.mouse.x * lookRange;
        pose.headRotX = -state.mouse.y * (lookRange * 0.35);
        pose.headRotZ = 0;
        pose.robotRotY = state.mouse.x * 0.08;

        // Playful arm sways
        pose.leftArmRotZ = -0.22 + Math.sin(state.time * 1.0) * 0.04;
        pose.leftArmRotX = Math.sin(state.time * 0.8) * 0.04;
        pose.rightArmRotZ = 0.22 - Math.sin(state.time * 1.0) * 0.04;
        pose.rightArmRotX = -Math.sin(state.time * 0.8) * 0.04;
        pose.leftLegRotX = 0;
        pose.rightLegRotX = 0;

        // Eye movement tracking: pupils track coordinates + organic focus jitter (playful intelligence)
        const eyeJitterX = Math.sin(state.time * 8.0) * 0.003;
        const eyeJitterY = Math.cos(state.time * 7.0) * 0.003;
        if (leftPupilRef.current && rightPupilRef.current) {
          const eyeLookFactor = 0.03;
          leftPupilRef.current.position.x = state.mouse.x * eyeLookFactor + eyeJitterX;
          leftPupilRef.current.position.y = state.mouse.y * eyeLookFactor * 0.8 + eyeJitterY;
          rightPupilRef.current.position.x = state.mouse.x * eyeLookFactor + eyeJitterX;
          rightPupilRef.current.position.y = state.mouse.y * eyeLookFactor * 0.8 + eyeJitterY;
        }

        // Handle eye blinking timer (less frequent, shorter duration)
        if (leftEyeRef.current && rightEyeRef.current) {
          const blinkCycle = state.time % 4.5;
          if (blinkCycle < 0.08) {
            leftEyeRef.current.scale.y = 0.1; // soft blink, looks friendly and warm
            rightEyeRef.current.scale.y = 0.1;
          } else {
            leftEyeRef.current.scale.y = 1;
            rightEyeRef.current.scale.y = 1;
          }
        }

        // Action timer update
        state.actionTimer -= 0.012;

        // Special actions / animations state machine (warm, playful, friendly AI chatbot reactions)
        if (state.currentAction === 'entrance') {
          const progress = (2.0 - state.actionTimer) / 2.0; // 0 to 1
          const s = Math.min(1.0, progress * 1.25);
          pose.squashX = s;
          pose.squashY = s;
          pose.squashZ = s;
          pose.robotY = -0.92 + progress * 0.84 + float * 0.05;
          pose.robotRotY = (1.0 - progress) * Math.PI * 2;
          pose.holoOpacity = progress * 0.12;

          if (state.actionTimer <= 0) {
            state.currentAction = 'idle';
            state.actionTimer = Math.random() * 8 + 6;
          }
        }
        else if (state.currentAction === 'openReaction') {
          const progress = (1.2 - state.actionTimer) / 1.2;
          const jumpHeight = Math.sin(progress * Math.PI) * 0.20; // Cheerful hop
          pose.robotY += jumpHeight;
          pose.squashY = 1.0 + Math.cos(progress * Math.PI * 2) * 0.06;
          pose.robotRotY = progress * Math.PI * 0.5; // Welcoming pivot
          pose.leftArmRotZ = -0.3 + Math.sin(state.time * 6) * 0.08;
          pose.rightArmRotZ = 0.3 + Math.sin(state.time * 6) * 0.08;
          pose.headRotX = -0.08;

          if (state.actionTimer <= 0) {
            state.currentAction = 'idle';
            state.actionTimer = Math.random() * 8 + 6;
          }
        }
        else if (state.currentAction === 'closeReaction') {
          const progress = (1.0 - state.actionTimer) / 1.0;
          const bowFactor = Math.sin(progress * Math.PI);
          pose.headRotX = bowFactor * 0.15; // Friendly nod
          pose.headRotY = 0;
          pose.leftArmRotZ = -0.16;
          pose.rightArmRotZ = 0.16;

          if (state.actionTimer <= 0) {
            state.currentAction = 'idle';
            state.actionTimer = Math.random() * 8 + 6;
          }
        }
        else if (state.currentAction === 'clickReaction') {
          state.clickTimer -= 0.012;
          const progress = 1 - (state.clickTimer / 0.55);
          const hopHeight = Math.sin(progress * Math.PI) * 0.18; // Playful hop
          pose.robotY += hopHeight;
          pose.squashY = 1 + Math.cos(progress * Math.PI * 2) * 0.06;
          pose.rightArmRotZ = Math.PI * 0.45 + Math.sin(state.time * 8) * 0.15;
          pose.leftArmRotZ = -Math.PI * 0.2;
          pose.headRotX = -0.05;

          if (state.clickTimer <= 0) {
            state.currentAction = 'idle';
            state.actionTimer = 3.0;
          }
        }
        else if (isHovered) {
          // HOVER STATE (playful micro-interaction, cheerful waving and float)
          pose.robotY += 0.05;
          pose.holoOpacity = 0.22;
          
          pose.headRotZ = 0.06 * Math.sin(state.time * 3); // playful head swaying
          pose.headRotY = state.mouse.x * 0.4;
          pose.headRotX = -state.mouse.y * 0.2;
          
          // Cheerful welcoming wave
          pose.rightArmRotZ = Math.PI * 0.65 + Math.sin(state.time * 10) * 0.22;
          pose.rightArmRotX = Math.sin(state.time * 5) * 0.08;
          pose.leftArmRotZ = -0.22; 
        }
        else {
          // AUTONOMOUS STATE MACHINE (Restore playful choices: idle, waving, and head tilts)
          if (state.actionTimer <= 0) {
            const roll = Math.random();
            if (roll < 0.6) {
              state.currentAction = 'idle';
              state.actionTimer = Math.random() * 8 + 6;
            } else if (roll < 0.85) {
              state.currentAction = 'waving';
              state.actionTimer = 2.4;
            } else {
              state.currentAction = 'attentionTilt';
              state.actionTimer = 2.0;
            }
          }

          if (state.currentAction === 'waving') {
            pose.rightArmRotZ = Math.PI * 0.65 + Math.sin(state.time * 8) * 0.20; // Cheerful waving
            pose.rightArmRotX = Math.sin(state.time * 4) * 0.08;
            pose.headRotZ = 0.04 * Math.sin(state.time * 4); // happy head nod
          }
          else if (state.currentAction === 'attentionTilt') {
            const progress = (2.0 - state.actionTimer) / 2.0;
            const tiltAngle = Math.sin(progress * Math.PI * 2) * 0.15; // friendly tilt
            pose.headRotZ = tiltAngle;
            pose.headRotY = state.mouse.x * lookRange + tiltAngle * 0.3;
          }
        }

        // Standard glowing pulses for antenna and core
        if (antennaBallMatRef.current) {
          antennaBallMatRef.current.emissiveIntensity = 2.5 + Math.sin(state.time * 4.0) * 0.8;
        }
        if (blushMatRef.current) {
          const targetOpacity = isHovered ? 0.90 : 0.50;
          const targetIntensity = isHovered ? 2.5 : 1.5;
          blushMatRef.current.opacity += (targetOpacity - blushMatRef.current.opacity) * 0.1;
          blushMatRef.current.emissiveIntensity += (targetIntensity - blushMatRef.current.emissiveIntensity) * 0.1;
        }
        if (chestGlowMatRef.current) {
          chestGlowMatRef.current.emissiveIntensity = 3.0 + Math.sin(state.time * 2.0) * 0.8;
        }

        // Playful smile micro-movements (pulsing scale and dynamic emission based on breathing/hover)
        if (mouthRef.current) {
          const mouthPulseX = 1.0 + Math.sin(state.time * 2.5) * 0.08;
          const mouthPulseY = 1.0 + Math.cos(state.time * 2.5) * 0.04;
          mouthRef.current.scale.set(mouthPulseX, mouthPulseY, 1.0);
        }

        // LERP current pose coordinates to targets for smooth transitions
        const current = state.currentPose;
        const lerpFactor = 0.045; // Smooth transitions with increased damping

        current.robotY += (pose.robotY - current.robotY) * lerpFactor;
        current.robotX += (pose.robotX - current.robotX) * lerpFactor;
        current.robotRotY += (pose.robotRotY - current.robotRotY) * lerpFactor;
        current.headRotX += (pose.headRotX - current.headRotX) * lerpFactor;
        current.headRotY += (pose.headRotY - current.headRotY) * lerpFactor;
        current.headRotZ += (pose.headRotZ - current.headRotZ) * lerpFactor;
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
          headGroupRef.current.rotation.z = current.headRotZ;
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

        // Animate floating scan ring
        if (holoRingRef.current) {
          holoRingRef.current.position.y = -0.45 + Math.sin(state.time * 2.5) * 0.15;
          holoRingRef.current.rotation.z += 0.015;
          const ringScale = 1.0 + Math.sin(state.time * 1.8) * 0.08;
          holoRingRef.current.scale.set(ringScale, ringScale, 1.0);
          // Sync scan ring opacity with holoOpacity
          if (Array.isArray(holoRingRef.current.material)) {
            // Should not be array material in this case, but good practice to handle
          } else {
            (holoRingRef.current.material as THREE.Material).opacity = current.holoOpacity * 2.0;
          }
        }

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

      {/* Robot Canvas Container (Enlarged to 160px for Noticeable Sizing and Premium Visibility) */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRobotClick}
        className="cursor-pointer select-none rounded-full"
        style={{
          width: '160px',
          height: '160px',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(0,0,0,0) 65%)',
        }}
      >
        <div ref={containerRef} className="w-full h-full" />
      </motion.div>
    </div>
  );
}
