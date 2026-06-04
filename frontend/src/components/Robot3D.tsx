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
  const raisedHandRef = useRef<THREE.Group | null>(null);
  const pedestalRef = useRef<THREE.Group | null>(null);
  const pedestalRing1Ref = useRef<THREE.Mesh | null>(null);
  const pedestalRing2Ref = useRef<THREE.Mesh | null>(null);
  const holoConeRef = useRef<THREE.Mesh | null>(null);
  const holoRingRef = useRef<THREE.Mesh | null>(null);

  // Material refs for pulsing emission
  const antennaBallMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const chestGlowMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  const prevIsOpen = useRef(isOpen);
  const isOpenRef = useRef(isOpen);

  // Animation states and timers (using lerping for smooth transitions)
  const stateRef = useRef({
    time: 0,
    mouse: { x: 0, y: 0, targetX: 0, targetY: 0 },
    currentAction: 'entrance', // 'entrance', 'idle', 'footTap', 'curiousScan', 'shoulderShimmy', 'happyNod', 'clickReaction', 'openReaction', 'closeReaction', 'attentionTilt'
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
      rightHandRotY: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      leftLegRotZ: 0,
      rightLegRotZ: 0,
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
      rightHandRotY: 0,
      leftLegRotX: 0,
      rightLegRotX: 0,
      leftLegRotZ: 0,
      rightLegRotZ: 0,
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
      stateRef.current.mouse.targetX = (clientX / innerWidth) * 2 - 1;
      stateRef.current.mouse.targetY = -(clientY / innerHeight) * 2 + 1;
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
      const fillLight = new THREE.DirectionalLight(0x4ddfff, 1.55);
      fillLight.position.set(-3.5, 0.5, 3.5);
      scene.add(fillLight);

      // Cool cyan rim light from top-back-right
      const rimLight = new THREE.DirectionalLight(0x66ccff, 2.6);
      rimLight.position.set(-1, 3.5, -4);
      scene.add(rimLight);

      // Cyber pedestal base glow
      const baseLight = new THREE.PointLight(0x00d9ff, 2.5, 3.0);
      baseLight.position.set(0, -0.85, 0.5);
      scene.add(baseLight);

      const particlePositions = new Float32Array(72);
      for (let i = 0; i < particlePositions.length; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 2.6;
        particlePositions[i + 1] = Math.random() * 2.1 - 0.85;
        particlePositions[i + 2] = -0.7 - Math.random() * 0.9;
      }
      const particlesGeo = new THREE.BufferGeometry();
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particlesMat = new THREE.PointsMaterial({
        color: 0x38dfff,
        size: 0.018,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particles);

      // 5. Build Robot Mesh
      const robotGroup = new THREE.Group();
      robotGroupRef.current = robotGroup;
      scene.add(robotGroup);

      // --- MATERIALS DEFINITION ---
      // MeshPhysicalMaterial gives a beautiful premium lacquer / glossy ceramic coating
      const whiteCeramicMat = new THREE.MeshPhysicalMaterial({
        color: 0xdce3ec,
        roughness: 0.1,
        metalness: 0.48,
        clearcoat: 1.0,
        clearcoatRoughness: 0.035,
        sheen: 0.32,
        sheenColor: new THREE.Color(0xffffff),
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
        color: 0xb8c2cf,
        roughness: 0.13,
        metalness: 0.62,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05,
      });

      const cyanGlowMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
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
      scene.add(pedestalGroup);
      pedestalRef.current = pedestalGroup;

      // Inner Glowing Ring
      const ring1Geo = new THREE.RingGeometry(0.56, 0.61, 32);
      const ring1 = new THREE.Mesh(ring1Geo, cyanGlowMat);
      ring1.rotation.x = -Math.PI / 2;
      ring1.position.y = 0.045;
      pedestalGroup.add(ring1);
      pedestalRing1Ref.current = ring1;

      // Outer Glowing Ring
      const ring2Geo = new THREE.RingGeometry(0.66, 0.69, 32);
      const ring2 = new THREE.Mesh(ring2Geo, softBlueGlowMat);
      ring2.rotation.x = -Math.PI / 2;
      ring2.position.y = 0.045;
      pedestalGroup.add(ring2);
      pedestalRing2Ref.current = ring2;

      const ring3Geo = new THREE.RingGeometry(0.28, 0.31, 32);
      const ring3 = new THREE.Mesh(ring3Geo, cyanGlowMat);
      ring3.rotation.x = -Math.PI / 2;
      ring3.position.y = 0.052;
      pedestalGroup.add(ring3);

      // Volumetric Hologram Projection Cone
      const holoConeGeo = new THREE.ConeGeometry(0.68, 1.45, 32, 1, true);
      holoConeGeo.translate(0, 0.725, 0); // shift pivot to base
      const holoCone = new THREE.Mesh(holoConeGeo, holoConeMat);
      holoCone.position.set(0, 0.04, 0);
      pedestalGroup.add(holoCone);
      holoConeRef.current = holoCone;

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
      headGroup.position.set(0, 0.44, 0);
      robotGroup.add(headGroup);
      headGroupRef.current = headGroup;

      // Large rounded-square helmet shell like the reference mascot.
      const helmetGeo = roundedPanelGeometry(0.92, 0.68, 0.5, 0.22, 0.06);
      const helmet = new THREE.Mesh(helmetGeo, whiteCeramicMat);
      helmet.castShadow = true;
      headGroup.add(helmet);

      // Front glossy rounded-square glass screen.
      const visorGeo = roundedPanelGeometry(0.68, 0.4, 0.05, 0.16, 0.014);
      const visor = new THREE.Mesh(visorGeo, facePanelMat);
      visor.position.set(0, -0.035, 0.325);
      headGroup.add(visor);

      const visorSheenGeo = roundedPanelGeometry(0.46, 0.09, 0.01, 0.045, 0.004);
      const visorSheenMat = new THREE.MeshBasicMaterial({
        color: 0x9beafe,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending,
      });
      const visorSheen = new THREE.Mesh(visorSheenGeo, visorSheenMat);
      visorSheen.position.set(-0.08, 0.13, 0.36);
      visorSheen.rotation.z = 0.08;
      headGroup.add(visorSheen);

      const foreheadPanelGeo = roundedPanelGeometry(0.3, 0.06, 0.02, 0.03, 0.006);
      const foreheadPanel = new THREE.Mesh(foreheadPanelGeo, armorPanelMat);
      foreheadPanel.position.set(0, 0.38, 0.3);
      headGroup.add(foreheadPanel);

      // Curved Headphones Band (Connects ear cups)
      const headbandGeo = new THREE.TorusGeometry(0.5, 0.028, 12, 32, Math.PI);
      const headband = new THREE.Mesh(headbandGeo, carbonMat);
      headband.position.set(0, 0.05, 0);
      headGroup.add(headband);

      // Minimal cyan smile-arc eyes on the glossy face screen.
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(0, 0.018, 0.372);
      headGroup.add(eyeGroup);

      // Left Eye Group
      const leftEyeGroup = new THREE.Group();
      leftEyeGroup.position.set(-0.15, 0.012, 0.02);
      eyeGroup.add(leftEyeGroup);
      leftEyeRef.current = leftEyeGroup;

      const invisiblePupilGeo = new THREE.SphereGeometry(0.001, 8, 8);
      const leftPupil = new THREE.Mesh(invisiblePupilGeo, eyeInkMat);
      leftPupilRef.current = leftPupil;

      // Right Eye Group
      const rightEyeGroup = new THREE.Group();
      rightEyeGroup.position.set(0.15, 0.012, 0.02);
      eyeGroup.add(rightEyeGroup);
      rightEyeRef.current = rightEyeGroup;

      const rightPupil = new THREE.Mesh(invisiblePupilGeo, eyeInkMat);
      rightPupilRef.current = rightPupil;

      const happyEyeCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-0.064, -0.008, 0),
        new THREE.Vector3(0, 0.066, 0),
        new THREE.Vector3(0.064, -0.008, 0),
      );
      const happyEyeGeo = new THREE.TubeGeometry(happyEyeCurve, 24, 0.017, 8, false);
      const leftHappyEye = new THREE.Mesh(happyEyeGeo, cyanGlowMat);
      leftHappyEye.position.set(0, 0.035, 0.018);
      leftEyeGroup.add(leftHappyEye);

      const rightHappyEye = new THREE.Mesh(happyEyeGeo, cyanGlowMat);
      rightHappyEye.position.set(0, 0.035, 0.018);
      rightEyeGroup.add(rightHappyEye);

      // Side Headphones/Ear Cups
      const earGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.13, 32);
      earGeo.rotateZ(Math.PI / 2);

      const leftEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      leftEar.position.set(-0.525, 0, 0);
      headGroup.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, whiteCeramicMat);
      rightEar.position.set(0.525, 0, 0);
      headGroup.add(rightEar);

      // Ear concentric joints
      const earJointGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.14, 28);
      earJointGeo.rotateZ(Math.PI / 2);

      const leftEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      leftEarJoint.position.set(-0.515, 0, 0);
      headGroup.add(leftEarJoint);

      const rightEarJoint = new THREE.Mesh(earJointGeo, chromeJointMat);
      rightEarJoint.position.set(0.515, 0, 0);
      headGroup.add(rightEarJoint);

      const earGlowGeo = new THREE.CylinderGeometry(0.088, 0.088, 0.02, 28);
      earGlowGeo.rotateZ(Math.PI / 2);

      const leftEarGlow = new THREE.Mesh(earGlowGeo, softBlueGlowMat);
      leftEarGlow.position.set(-0.592, 0, 0);
      headGroup.add(leftEarGlow);

      const leftEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.012, 8, 32), cyanGlowMat);
      leftEarInnerGlow.position.set(-0.608, 0, 0);
      leftEarInnerGlow.rotation.y = Math.PI / 2;
      headGroup.add(leftEarInnerGlow);

      const rightEarGlow = new THREE.Mesh(earGlowGeo, softBlueGlowMat);
      rightEarGlow.position.set(0.592, 0, 0);
      headGroup.add(rightEarGlow);

      const rightEarInnerGlow = new THREE.Mesh(new THREE.TorusGeometry(0.122, 0.012, 8, 32), cyanGlowMat);
      rightEarInnerGlow.position.set(0.608, 0, 0);
      rightEarInnerGlow.rotation.y = Math.PI / 2;
      headGroup.add(rightEarInnerGlow);

      // Temple structural panels
      const templeGeo = new THREE.BoxGeometry(0.03, 0.15, 0.27);
      const leftTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      leftTemple.position.set(-0.455, 0.05, 0.12);
      leftTemple.rotation.y = -0.1;
      headGroup.add(leftTemple);

      const rightTemple = new THREE.Mesh(templeGeo, chromeJointMat);
      rightTemple.position.set(0.455, 0.05, 0.12);
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

      // --- TORSO GROUP (Compact round chibi proportions) ---
      const torsoGroup = new THREE.Group();
      torsoGroup.position.set(0, -0.24, 0);
      robotGroup.add(torsoGroup);
      torsoRef.current = torsoGroup;

      // Dark neck collar joint
      const collarGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.1, 18);
      const collar = new THREE.Mesh(collarGeo, carbonMat);
      collar.position.set(0, 0.42, 0);
      torsoGroup.add(collar);

      // Armored rounded-rectangle torso shell: cute, but less spherical.
      const bodyGeo = roundedPanelGeometry(0.48, 0.52, 0.3, 0.14, 0.03);
      const bodyMesh = new THREE.Mesh(bodyGeo, whiteCeramicMat);
      bodyMesh.position.set(0, 0.025, 0);
      bodyMesh.castShadow = true;
      torsoGroup.add(bodyMesh);

      const torsoSidePanelGeo = new THREE.BoxGeometry(0.038, 0.32, 0.06);
      const leftTorsoPanel = new THREE.Mesh(torsoSidePanelGeo, armorPanelMat);
      leftTorsoPanel.position.set(-0.265, 0.015, 0.055);
      leftTorsoPanel.rotation.z = -0.08;
      torsoGroup.add(leftTorsoPanel);

      const rightTorsoPanel = new THREE.Mesh(torsoSidePanelGeo, armorPanelMat);
      rightTorsoPanel.position.set(0.265, 0.015, 0.055);
      rightTorsoPanel.rotation.z = 0.08;
      torsoGroup.add(rightTorsoPanel);

      const chestPlateGeo = roundedPanelGeometry(0.28, 0.2, 0.034, 0.075, 0.012);
      const chestPlate = new THREE.Mesh(chestPlateGeo, armorPanelMat);
      chestPlate.position.set(0, 0.12, 0.172);
      torsoGroup.add(chestPlate);

      // Chest emblem plate
      const chestCoreGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.026, 28);
      chestCoreGeo.rotateX(Math.PI / 2);
      const chestCore = new THREE.Mesh(chestCoreGeo, carbonMat);
      chestCore.position.set(0, 0.11, 0.196);
      torsoGroup.add(chestCore);

      // Glowing Triangle Symbol inside chestplate
      const triangleGeo = new THREE.ConeGeometry(0.055, 0.01, 3);
      triangleGeo.rotateX(Math.PI / 2);
      triangleGeo.rotateZ(Math.PI); // triangle pointing up
      const triangleMesh = new THREE.Mesh(triangleGeo, chestGlowMat);
      triangleMesh.position.set(0, 0.11, 0.214);
      torsoGroup.add(triangleMesh);

      // Glowing Outer Ring around triangle
      const chestRingGeo = new THREE.TorusGeometry(0.08, 0.01, 8, 24);
      const chestRingMesh = new THREE.Mesh(chestRingGeo, softBlueGlowMat);
      chestRingMesh.position.set(0, 0.11, 0.214);
      torsoGroup.add(chestRingMesh);

      // Belt / Waist joint
      const beltGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.08, 24);
      const belt = new THREE.Mesh(beltGeo, carbonMat);
      belt.position.set(0, -0.38, 0);
      torsoGroup.add(belt);

      // Hips pelvis armor
      const hipsGeo = roundedPanelGeometry(0.42, 0.15, 0.24, 0.075, 0.018);
      const hips = new THREE.Mesh(hipsGeo, whiteCeramicMat);
      hips.position.set(0, -0.46, 0);
      hips.castShadow = true;
      torsoGroup.add(hips);

      // --- LIMBS: ARMS ---
      // Left Arm
      const leftArmGroup = new THREE.Group();
      leftArmGroup.position.set(-0.405, 0.18, 0);
      torsoGroup.add(leftArmGroup);
      leftArmRef.current = leftArmGroup;

      const shoulderJointGeo = new THREE.SphereGeometry(0.082, 16, 16);
      const leftShoulder = new THREE.Mesh(shoulderJointGeo, chromeJointMat);
      leftArmGroup.add(leftShoulder);

      const shoulderPadGeo = roundedPanelGeometry(0.17, 0.13, 0.12, 0.055, 0.01);
      const leftShoulderPad = new THREE.Mesh(shoulderPadGeo, whiteCeramicMat);
      leftShoulderPad.position.set(0, 0.03, 0);
      leftArmGroup.add(leftShoulderPad);

      const upperArmGeo = roundedPanelGeometry(0.15, 0.235, 0.11, 0.055, 0.01);
      upperArmGeo.translate(0, -0.11, 0);
      const leftUpperArm = new THREE.Mesh(upperArmGeo, whiteCeramicMat);
      leftUpperArm.castShadow = true;
      leftArmGroup.add(leftUpperArm);

      const elbowJointGeo = new THREE.SphereGeometry(0.066, 16, 16);
      const leftElbow = new THREE.Mesh(elbowJointGeo, chromeJointMat);
      leftElbow.position.set(0, -0.22, 0);
      leftArmGroup.add(leftElbow);

      const forearmGeo = roundedPanelGeometry(0.155, 0.245, 0.11, 0.055, 0.01);
      forearmGeo.translate(0, -0.11, 0);
      const leftForearm = new THREE.Mesh(forearmGeo, whiteCeramicMat);
      leftForearm.position.set(0, -0.22, 0);
      leftForearm.castShadow = true;
      leftArmGroup.add(leftForearm);

      const handGeo = roundedPanelGeometry(0.15, 0.12, 0.11, 0.052, 0.01);
      const fingerGeo = new THREE.CapsuleGeometry(0.015, 0.086, 4, 8);
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
      rightArmGroup.position.set(0.405, 0.18, 0);
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
      leftLegGroup.position.set(-0.18, -0.46, 0);
      torsoGroup.add(leftLegGroup);
      leftLegRef.current = leftLegGroup;

      const hipJointGeo = new THREE.SphereGeometry(0.076, 16, 16);
      const leftHip = new THREE.Mesh(hipJointGeo, chromeJointMat);
      leftLegGroup.add(leftHip);

      const thighGeo = roundedPanelGeometry(0.17, 0.23, 0.12, 0.055, 0.01);
      thighGeo.translate(0, -0.11, 0);
      const leftThigh = new THREE.Mesh(thighGeo, whiteCeramicMat);
      leftThigh.castShadow = true;
      leftLegGroup.add(leftThigh);

      const kneeJointGeo = new THREE.SphereGeometry(0.066, 16, 16);
      const leftKnee = new THREE.Mesh(kneeJointGeo, softBlueGlowMat);
      leftKnee.position.set(0, -0.22, 0);
      leftLegGroup.add(leftKnee);

      const shinGeo = roundedPanelGeometry(0.175, 0.25, 0.13, 0.055, 0.01);
      shinGeo.translate(0, -0.11, 0);
      const leftShin = new THREE.Mesh(shinGeo, whiteCeramicMat);
      leftShin.position.set(0, -0.22, 0);
      leftShin.castShadow = true;
      leftLegGroup.add(leftShin);

      // Feet
      const footGeo = roundedPanelGeometry(0.265, 0.12, 0.31, 0.065, 0.012);
      const leftFoot = new THREE.Mesh(footGeo, whiteCeramicMat);
      leftFoot.position.set(0, -0.44, 0.04);
      leftFoot.castShadow = true;
      leftLegGroup.add(leftFoot);

      const soleGeo = new THREE.BoxGeometry(0.225, 0.024, 0.29);
      const leftSole = new THREE.Mesh(soleGeo, carbonMat);
      leftSole.position.set(0, -0.47, 0.04);
      leftLegGroup.add(leftSole);

      // Right Leg
      const rightLegGroup = new THREE.Group();
      rightLegGroup.position.set(0.18, -0.46, 0);
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

      // Floating data scan ring
      const scanRingGeo = new THREE.RingGeometry(0.68, 0.70, 32);
      const scanRing = new THREE.Mesh(scanRingGeo, softBlueGlowMat);
      scanRing.rotation.x = -Math.PI / 2;
      scanRing.position.y = -0.72;
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
        const cuteBounce = Math.sin(state.time * 2.4) * 0.018;
        const attentionWave = Math.max(0, Math.sin(state.time * 0.85));
        const smoothStep = (value: number) => value * value * (3 - 2 * value);
        const greetingCycle = (state.time * 0.22) % 1;
        let greetingLift = 0;
        if (greetingCycle < 0.18) {
          greetingLift = 0;
        } else if (greetingCycle < 0.42) {
          greetingLift = smoothStep((greetingCycle - 0.18) / 0.24);
        } else if (greetingCycle < 0.64) {
          greetingLift = 1;
        } else if (greetingCycle < 0.84) {
          greetingLift = 1 - smoothStep((greetingCycle - 0.64) / 0.2);
        }
        const waveWindow = greetingCycle >= 0.42 && greetingCycle < 0.64
          ? Math.sin(((greetingCycle - 0.42) / 0.22) * Math.PI * 4) * 0.13
          : 0;

        // Reset poses targets default
        const pose = state.pose;
        pose.robotY = float + cuteBounce - 0.08; 
        pose.robotX = lateralSway;
        pose.robotRotY = 0;
        pose.squashX = 1;
        pose.squashY = 1 + breathe * 0.012; 
        pose.squashZ = 1;
        pose.holoOpacity = 0.12 + Math.abs(float) * 0.8;

        // Mouse looking controls (expressive, friendly gaze tracking)
        const lookRange = isHovered ? 0.45 : 0.25;
        pose.headRotY = state.mouse.x * lookRange;
        pose.headRotX = -state.mouse.y * (lookRange * 0.35);
        pose.headRotZ = Math.sin(state.time * 1.4) * 0.025;
        pose.robotRotY = state.mouse.x * 0.08;

        // Playful arm sways
        pose.leftArmRotZ = -0.28 + Math.sin(state.time * 1.2) * 0.04;
        pose.leftArmRotX = Math.sin(state.time * 0.9) * 0.035;
        pose.rightArmRotZ = 0.28 + greetingLift * (Math.PI * 0.62 - 0.28) + waveWindow;
        pose.rightArmRotX = -0.03 + greetingLift * -0.16 + Math.sin(state.time * 0.9) * 0.025;
        pose.rightHandRotY = -0.22 + greetingLift * -0.48 + waveWindow * 0.9;
        pose.leftLegRotX = 0;
        pose.rightLegRotX = 0;
        pose.leftLegRotZ = Math.sin(state.time * 0.9) * 0.015;
        pose.rightLegRotZ = -Math.sin(state.time * 0.9) * 0.015;

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
          pose.holoOpacity = 0.1 + progress * 0.12;

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
          
          pose.leftArmRotZ = -0.22; 
        }
        else {
          // AUTONOMOUS STATE MACHINE: quiet standing motions that keep the assistant alive.
          if (state.actionTimer <= 0) {
            const roll = Math.random();
            if (roll < 0.34) {
              state.currentAction = 'idle';
              state.actionTimer = Math.random() * 4 + 3;
            } else if (roll < 0.62) {
              state.currentAction = 'attentionTilt';
              state.actionTimer = 2.3;
            } else if (roll < 0.82) {
              state.currentAction = 'curiousScan';
              state.actionTimer = 2.6;
            } else if (roll < 0.9) {
              state.currentAction = 'footTap';
              state.actionTimer = 2.4;
            } else if (roll < 0.97) {
              state.currentAction = 'happyNod';
              state.actionTimer = 1.9;
            } else {
              state.currentAction = 'shoulderShimmy';
              state.actionTimer = 1.8;
            }
          }

          if (state.currentAction === 'idle' && attentionWave > 0.86) {
            pose.headRotZ = Math.sin(state.time * 4) * 0.055;
          }
          else if (state.currentAction === 'attentionTilt') {
            const progress = (2.0 - state.actionTimer) / 2.0;
            const tiltAngle = Math.sin(progress * Math.PI * 2) * 0.15; // friendly tilt
            pose.headRotZ = tiltAngle;
            pose.headRotY = state.mouse.x * lookRange + tiltAngle * 0.3;
          }
          else if (state.currentAction === 'curiousScan') {
            const progress = Math.max(0, Math.min(1, (2.6 - state.actionTimer) / 2.6));
            const scan = Math.sin(progress * Math.PI * 2);
            pose.headRotY = scan * 0.42;
            pose.headRotX = -0.08 + Math.sin(progress * Math.PI) * 0.08;
            pose.robotRotY = scan * 0.12;
            pose.leftArmRotZ = -0.32 - Math.sin(progress * Math.PI) * 0.08;
          }
          else if (state.currentAction === 'footTap') {
            const tap = Math.max(0, Math.sin(state.time * 9));
            pose.robotY += tap * 0.018;
            pose.rightLegRotX = -tap * 0.24;
            pose.rightLegRotZ = -0.08 - tap * 0.05;
            pose.leftLegRotZ = 0.04;
            pose.headRotZ = -0.04 + Math.sin(state.time * 3) * 0.025;
          }
          else if (state.currentAction === 'happyNod') {
            const progress = Math.max(0, Math.min(1, (1.9 - state.actionTimer) / 1.9));
            const nod = Math.sin(progress * Math.PI * 3);
            const cheer = Math.sin(progress * Math.PI);
            pose.headRotX = -0.1 * cheer + nod * 0.045;
            pose.robotY += cheer * 0.045;
            pose.squashX = 1 + cheer * 0.025;
            pose.squashY = 1 - cheer * 0.025;
            pose.leftArmRotZ = -0.34 - cheer * 0.08;
          }
          else if (state.currentAction === 'shoulderShimmy') {
            const shimmy = Math.sin(state.time * 12);
            pose.robotX += shimmy * 0.018;
            pose.robotRotY = shimmy * 0.18;
            pose.leftArmRotZ = -0.28 - shimmy * 0.12;
            pose.headRotZ = -shimmy * 0.04;
          }
        }

        // Standard glowing pulses for antenna and core
        if (antennaBallMatRef.current) {
          antennaBallMatRef.current.emissiveIntensity = 2.5 + Math.sin(state.time * 4.0) * 0.8;
        }
        if (chestGlowMatRef.current) {
          chestGlowMatRef.current.emissiveIntensity = 3.0 + Math.sin(state.time * 2.0) * 0.8;
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
        current.rightHandRotY += (pose.rightHandRotY - current.rightHandRotY) * lerpFactor;
        current.leftLegRotX += (pose.leftLegRotX - current.leftLegRotX) * lerpFactor;
        current.rightLegRotX += (pose.rightLegRotX - current.rightLegRotX) * lerpFactor;
        current.leftLegRotZ += (pose.leftLegRotZ - current.leftLegRotZ) * lerpFactor;
        current.rightLegRotZ += (pose.rightLegRotZ - current.rightLegRotZ) * lerpFactor;
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
        if (raisedHandRef.current) {
          raisedHandRef.current.rotation.y = current.rightHandRotY;
        }

        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = current.leftLegRotX;
          leftLegRef.current.rotation.z = current.leftLegRotZ;
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = current.rightLegRotX;
          rightLegRef.current.rotation.z = current.rightLegRotZ;
        }

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
          holoRingRef.current.position.y = -0.72 + Math.sin(state.time * 2.5) * 0.04;
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
