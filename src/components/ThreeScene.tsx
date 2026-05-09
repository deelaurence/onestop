import { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* Helper: ribbed ring texture (fine parallel grooves) */
function RibbedRing({ position, radius, width, count = 60 }: { position: [number, number, number]; radius: number; width: number; count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const boxGeom = useMemo(() => new THREE.BoxGeometry(0.008, width * 0.9, 0.008), [width]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a' }), []);

  useEffect(() => {
    const tempObject = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      tempObject.position.set(0, 0, 0);
      tempObject.rotation.set(Math.PI / 2, angle, 0);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[radius, radius, width, 64]} />
        <meshPhysicalMaterial color="#0e0e0e" roughness={0.85} metalness={0} />
      </mesh>
      <instancedMesh ref={meshRef} args={[boxGeom, material, count]} />
    </group>
  );
}

function ModernCamera() {
  const group = useRef<THREE.Group>(null!);
  const innerGroup = useRef<THREE.Group>(null!);
  const mouse = useRef({ x: 0, y: 0 });

  // Mouse parallax tracking
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // Inner group: idle float + mouse follow (runs per frame, additive)
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (innerGroup.current) {
      // very gentle breathing float
      innerGroup.current.position.y = Math.sin(t * 0.4) * 0.02;
      innerGroup.current.position.x = Math.sin(t * 0.2) * 0.008;
      // very subtle mouse parallax
      innerGroup.current.rotation.y += (mouse.current.x * 0.04 - innerGroup.current.rotation.y) * 0.03;
      innerGroup.current.rotation.x += (mouse.current.y * -0.02 - innerGroup.current.rotation.x) * 0.03;
    }
  });

  // Outer group: GSAP scroll-driven choreography — calm, continuous drift
  useEffect(() => {
    const g = group.current;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    });

    // Single continuous slow drift across the page — no warp, no elastic pop.
    // Stays on the right side of the viewport, scale almost constant,
    // single half-rotation total.
    tl.fromTo(
      g.position,
      { x: 1.6, y: 0.2, z: 0 },
      { x: 1.9, y: -0.1, z: 0, duration: 10, ease: 'none' },
      0
    );
    tl.fromTo(
      g.rotation,
      { y: -0.2 },
      { y: 0.4, duration: 10, ease: 'none' },
      0
    );
    tl.fromTo(
      g.scale,
      { x: 0.4, y: 0.4, z: 0.4 },
      { x: 0.42, y: 0.42, z: 0.42, duration: 10, ease: 'none' },
      0
    );

    return () => { tl.kill(); };
  }, []);

  const lensBlack = { color: '#0c0c0c', metalness: 0.85, roughness: 0.08, clearcoat: 0.6 };

  return (
    <group ref={group} position={[1.6, 0.2, 0]} scale={0.4} rotation={[0, -0.2, 0]}>

      {/* ========================================
          CAMERA BODY (Modern mirrorless - compact)
          ======================================== */}
      <group position={[0, 0, -0.3]}>
        {/* Main body */}
        <RoundedBox args={[2.2, 1.5, 1.1]} radius={0.15} smoothness={8} castShadow>
          <meshPhysicalMaterial color="#1a1816" roughness={0.12} metalness={0.6} clearcoat={1} clearcoatRoughness={0.05} />
        </RoundedBox>

        {/* Ergonomic grip */}
        <RoundedBox args={[0.5, 1.6, 1.2]} radius={0.2} smoothness={6} position={[-1.1, -0.05, 0]} castShadow>
          <meshPhysicalMaterial color="#0a0a0a" roughness={0.9} metalness={0} />
        </RoundedBox>

        {/* Top plate */}
        <RoundedBox args={[2.2, 0.15, 1.1]} radius={0.06} smoothness={4} position={[0, 0.82, 0]}>
          <meshPhysicalMaterial color="#111" roughness={0.08} metalness={0.8} />
        </RoundedBox>

        {/* Viewfinder bump */}
        <RoundedBox args={[0.6, 0.35, 0.5]} radius={0.08} smoothness={4} position={[0, 1.05, -0.3]}>
          <meshPhysicalMaterial color="#1a1816" roughness={0.12} metalness={0.6} clearcoat={1} />
        </RoundedBox>

        {/* EVF eyepiece */}
        <mesh position={[0, 1.05, -0.58]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.1, 32]} />
          <meshPhysicalMaterial color="#050505" roughness={0.9} />
        </mesh>

        {/* Shutter button */}
        <mesh position={[-0.6, 1.02, 0.1]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 32]} />
          <meshPhysicalMaterial {...lensBlack} />
        </mesh>

        {/* Top LCD (dark glass) */}
        <mesh position={[0.3, 0.91, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.7, 0.4]} />
          <meshPhysicalMaterial color="#050510" roughness={0} metalness={0.3} />
        </mesh>

        {/* Lens mount ring */}
        <mesh position={[0, 0, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.04, 16, 64]} />
          <meshPhysicalMaterial color="#222" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      {/* ========================================
          TELEPHOTO LENS (Nikkor Z 120-300mm style)
          ======================================== */}
      <group position={[0, 0, 0.3]}>

        {/* Rear barrel */}
        <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.52, 0.8, 64]} />
          <meshPhysicalMaterial {...lensBlack} />
        </mesh>

        {/* Tripod Collar */}
        <group position={[0, 0, 0.7]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.68, 0.68, 0.3, 64]} />
            <meshPhysicalMaterial color="#151515" roughness={0.4} metalness={0.5} />
          </mesh>
          <RoundedBox args={[0.35, 0.5, 0.3]} radius={0.05} smoothness={4} position={[0, -0.85, 0]}>
            <meshPhysicalMaterial color="#151515" roughness={0.3} metalness={0.6} />
          </RoundedBox>
          <RoundedBox args={[0.5, 0.06, 0.5]} radius={0.02} smoothness={4} position={[0, -1.12, 0]}>
            <meshPhysicalMaterial color="#1a1a1a" roughness={0.3} metalness={0.7} />
          </RoundedBox>
          <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[0.12, 0.5, 0.15]} />
            <meshPhysicalMaterial color="#151515" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0.22, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
            <meshPhysicalMaterial color="#0e0e0e" roughness={0.8} />
          </mesh>
        </group>

        {/* Switch panel */}
        <group position={[0.58, 0, 1.4]} rotation={[0, Math.PI / 2, 0]}>
          <RoundedBox args={[0.6, 0.4, 0.06]} radius={0.03} smoothness={4}>
            <meshPhysicalMaterial color="#1a1a1a" roughness={0.5} metalness={0.3} />
          </RoundedBox>
          {[0, 1, 2].map((i) => (
            <mesh key={`sw-${i}`} position={[(-0.15 + i * 0.15), 0, 0.04]}>
              <boxGeometry args={[0.06, 0.12, 0.03]} />
              <meshPhysicalMaterial color="#222" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Main zoom ring */}
        <RibbedRing position={[0, 0, 1.4]} radius={0.72} width={1.2} count={80} />

        {/* Mid barrel */}
        <mesh position={[0, 0, 2.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.78, 0.72, 0.6, 64]} />
          <meshPhysicalMaterial {...lensBlack} />
        </mesh>

        {/* Info band */}
        <mesh position={[0, 0, 2.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.785, 0.785, 0.12, 64]} />
          <meshPhysicalMaterial color="#888" roughness={0.2} metalness={0.8} />
        </mesh>

        {/* Focus ring */}
        <RibbedRing position={[0, 0, 2.9]} radius={0.8} width={0.4} count={50} />

        {/* Front barrel */}
        <mesh position={[0, 0, 3.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.88, 0.82, 0.7, 64]} />
          <meshPhysicalMaterial {...lensBlack} />
        </mesh>

        {/* Gold accent ring */}
        <mesh position={[0, 0, 3.78]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.885, 0.018, 16, 64]} />
          <meshStandardMaterial color="#daa520" emissive="#daa520" emissiveIntensity={2} />
        </mesh>

        {/* Front element housing */}
        <mesh position={[0, 0, 4.0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.92, 0.88, 0.35, 64]} />
          <meshPhysicalMaterial {...lensBlack} />
        </mesh>

        {/* Filter thread rim */}
        <mesh position={[0, 0, 4.2]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.02, 16, 64]} />
          <meshPhysicalMaterial color="#222" metalness={0.95} roughness={0.05} />
        </mesh>

        {/* Front glass (multi-coated look) */}
        <mesh position={[0, 0, 4.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.04, 64]} />
          <meshPhysicalMaterial
            color="#081828"
            transmission={0.7}
            thickness={3}
            roughness={0}
            ior={2.5}
            reflectivity={1}
          />
        </mesh>

        {/* Inner lens elements */}
        <mesh position={[0, 0, 4.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 0.02, 64]} />
          <meshPhysicalMaterial color="#050510" roughness={0} metalness={0.5} />
        </mesh>
      </group>

      {/* ========================================
          TRIPOD
          ======================================== */}
      <group position={[0, -1.12, 1.0]}>
        {/* Ball head */}
        <group position={[0, 0, 0]}>
          <mesh>
            <sphereGeometry args={[0.2, 32, 32]} />
            <meshPhysicalMaterial color="#1a1714" metalness={0.92} roughness={0.06} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.18, 0.25, 0.2, 32]} />
            <meshPhysicalMaterial color="#1a1714" metalness={0.92} roughness={0.06} />
          </mesh>
        </group>

        {/* Center column */}
        <mesh position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.5, 16]} />
          <meshPhysicalMaterial color="#1a1714" metalness={0.92} roughness={0.06} />
        </mesh>

        {/* Hub */}
        <mesh position={[0, -1.8, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.2, 32]} />
          <meshPhysicalMaterial color="#1a1714" metalness={0.92} roughness={0.06} />
        </mesh>

        {/* Tripod legs */}
        {[0, 1, 2].map((i) => {
          const angle = (i * Math.PI * 2) / 3;
          const spread = 1.4;
          const hubY = -1.8;
          const footY = -4.2;
          const vertDrop = hubY - footY;
          const legLength = Math.sqrt(spread * spread + vertDrop * vertDrop);
          const tiltAngle = Math.atan2(spread, vertDrop);

          return (
            <group key={`leg-${i}`} position={[0, hubY, 0]} rotation={[0, angle, 0]}>
              <group rotation={[-tiltAngle, 0, 0]}>
                <mesh position={[0, -legLength * 0.3, 0]}>
                  <cylinderGeometry args={[0.05, 0.04, legLength * 0.6, 12]} />
                  <meshPhysicalMaterial color="#1a1714" metalness={0.92} roughness={0.06} />
                </mesh>
                <mesh position={[0, -legLength * 0.72, 0]}>
                  <cylinderGeometry args={[0.04, 0.03, legLength * 0.45, 12]} />
                  <meshPhysicalMaterial color="#252118" metalness={0.85} roughness={0.1} />
                </mesh>
                <mesh position={[0, -legLength + 0.04, 0]}>
                  <sphereGeometry args={[0.06, 16, 16]} />
                  <meshPhysicalMaterial color="#0e0e0e" roughness={0.9} metalness={0} />
                </mesh>
                <mesh position={[0, -legLength * 0.52, 0]}>
                  <cylinderGeometry args={[0.065, 0.065, 0.08, 16]} />
                  <meshPhysicalMaterial color="#0e0e0e" roughness={0.9} metalness={0} />
                </mesh>
              </group>
            </group>
          );
        })}
      </group>

    </group>
  );
}

export default function ThreeScene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[2, 1.5, 8]} />
      <Environment preset="apartment" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={3} castShadow />
      <pointLight position={[-4, 4, 2]} intensity={1} color="#c8a882" />
      <spotLight position={[0, 10, 2]} angle={0.25} penumbra={1} intensity={2} />
      <ModernCamera />
      <ContactShadows position={[0, -3.5, 0]} opacity={0.35} scale={20} blur={3} far={10} />
    </>
  );
}
