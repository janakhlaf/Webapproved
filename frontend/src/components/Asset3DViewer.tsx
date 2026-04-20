import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Asset3DViewerProps {
  modelType: string;
  className?: string;
}

export function Asset3DViewer({ modelType, className = '' }: Asset3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 2, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(5, 10, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 50;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00d9ff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa855f7, 0.4);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (modelType.toLowerCase()) {
      case 'character':
        geometry = new THREE.CapsuleGeometry(0.5, 1.5, 16, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0x00d9ff,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x00d9ff,
          emissiveIntensity: 0.1,
        });
        break;
      case 'vehicle':
        geometry = new THREE.BoxGeometry(2, 0.8, 1);
        material = new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          metalness: 0.9,
          roughness: 0.1,
          emissive: 0xa855f7,
          emissiveIntensity: 0.15,
        });
        break;
      case 'environment':
        geometry = new THREE.TorusKnotGeometry(0.8, 0.3, 128, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0x0ea5e9,
          metalness: 0.7,
          roughness: 0.3,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.12,
        });
        break;
      case 'prop':
        geometry = new THREE.IcosahedronGeometry(1, 1);
        material = new THREE.MeshStandardMaterial({
          color: 0xec4899,
          metalness: 0.6,
          roughness: 0.4,
          emissive: 0xec4899,
          emissiveIntensity: 0.1,
        });
        break;
      default:
        geometry = new THREE.SphereGeometry(1, 32, 32);
        material = new THREE.MeshStandardMaterial({
          color: 0x00d9ff,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x00d9ff,
          emissiveIntensity: 0.1,
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    ground.receiveShadow = true;
    scene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelType]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[300px] rounded-lg overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, oklch(0.08 0.015 240) 0%, oklch(0.12 0.02 240) 100%)',
      }}
    />
  );
}
