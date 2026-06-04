import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Asset3DViewerProps {
  modelType: string;
  modelUrl?: string;
  className?: string;
  viewMode?: 'card' | 'modal';
}

export function Asset3DViewer({
  modelType,
  modelUrl,
  className = '',
  viewMode = 'modal',
}: Asset3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1, 4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: viewMode === 'modal',
      powerPreference: viewMode === 'card' ? 'low-power' : 'high-performance',
    });

    renderer.setSize(width, height);

    renderer.setPixelRatio(
      viewMode === 'card'
        ? Math.min(window.devicePixelRatio, 1)
        : Math.min(window.devicePixelRatio, 1.5)
    );

    renderer.shadowMap.enabled = viewMode === 'modal';
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    // 🔥 رفع الإضاءة العامة
    renderer.toneMappingExposure = 1.8;

    container.appendChild(renderer.domElement);

    // 🔥 إضاءة قوية ومتوازنة
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00d9ff, 0.5);
    rimLight.position.set(0, 5, -10);
    scene.add(rimLight);

    let fallbackGeometry: THREE.BufferGeometry | null = null;
    let fallbackMaterial: THREE.Material | null = null;

    const fitModel = (model: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = viewMode === 'card' ? 2.4 / maxDim : 2.2 / maxDim;

      model.scale.setScalar(scale);
      model.position.set(
        -center.x * scale,
        -center.y * scale + (viewMode === 'card' ? -0.15 : -0.1),
        -center.z * scale
      );
    };

    const addFallbackShape = () => {
      fallbackGeometry = new THREE.SphereGeometry(1, 32, 32);
      fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d9ff,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x00d9ff,
        emissiveIntensity: 0.1,
      });

      scene.add(new THREE.Mesh(fallbackGeometry, fallbackMaterial));
    };

    if (modelType.toLowerCase() === 'glb' && modelUrl) {
      const loader = new GLTFLoader();

      loader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;

              mesh.castShadow = viewMode === 'modal';
              mesh.receiveShadow = viewMode === 'modal';

              // 🔥 تحسين إضاءة الماتيريال
              if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach((mat) => {
                    mat.needsUpdate = true;
                  });
                } else {
                  mesh.material.needsUpdate = true;
                }
              }
            }
          });

          fitModel(model);
          scene.add(model);
        },
        undefined,
        (error) => {
          console.error('Error loading GLB:', error);
          addFallbackShape();
        }
      );
    } else {
      addFallbackShape();
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.minDistance = 2;
    controls.maxDistance = 10;

    if (viewMode === 'card') {
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableRotate = false;
      controls.autoRotate = false;
    } else {
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1.2;
    }

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }

      container.innerHTML = '';
    };
  }, [modelType, modelUrl, viewMode]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[300px] rounded-lg overflow-hidden ${className}`}
      style={{
        background:
          'linear-gradient(135deg, oklch(0.08 0.015 240) 0%, oklch(0.12 0.02 240) 100%)',
      }}
    />
  );
}