import { useEffect, useRef } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PORTFOLIO_ITEMS } from '../data/portfolio';

gsap.registerPlugin(ScrollTrigger);

const DARKROOM_IMAGES = [
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-couple-embrace-forest-portrait'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'portrait-woman-colorful-dress-full-length'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-ceremony-outdoor-arch-officiant'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'school-panorama-students-staff-assembly'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'studio-portrait-couple-elegant-headshot'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'wedding-reception-first-dance'),
  PORTFOLIO_ITEMS.find((i) => i.id === 'portrait-man-traditional-kaftan-headshot'),
].filter(Boolean) as typeof PORTFOLIO_ITEMS;

function GlassPane({
  url,
  position,
  rotation = [0, 0, 0] as [number, number, number],
  width = 2,
  height = 1.4,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <Float speed={0.4} rotationIntensity={0.02} floatIntensity={0.1}>
      <group position={position} rotation={rotation}>
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[width + 0.18, height + 0.18]} />
          <meshStandardMaterial color="#0c0a08" metalness={0.4} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[width + 0.08, height + 0.08]} />
          <meshStandardMaterial color="#f0ece6" emissive="#f0ece6" emissiveIntensity={0.1} />
        </mesh>
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
}

function CameraRig({ isMobile }: { isMobile: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const fov = isMobile ? 78 : 50;
  const startZ = isMobile ? -5.5 : -4;

  useEffect(() => {
    const g = group.current;
    const section = document.querySelector('.darkroom-section');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.5,
      },
    });

    tl.to(g.position, { z: 18, duration: 12, ease: 'none' }, 0);
    tl.to(g.position, { y: 0.4, duration: 6, ease: 'power1.inOut' }, 0);
    tl.to(g.position, { y: 0, duration: 6, ease: 'power1.inOut' }, 6);
    tl.to(g.rotation, { y: -0.08, duration: 6, ease: 'power1.inOut' }, 2);
    tl.to(g.rotation, { y: 0.06, duration: 6, ease: 'power1.inOut' }, 8);

    return () => { tl.kill(); };
  }, []);

  return (
    <group ref={group}>
      <PerspectiveCamera makeDefault position={[0, 0.8, startZ]} fov={fov} />
    </group>
  );
}

function DarkroomScene() {
  const { size } = useThree();
  const isMobile = size.width < 768;
  const xs = isMobile ? 0.5 : 1;
  const panes = DARKROOM_IMAGES;

  return (
    <>
      <CameraRig isMobile={isMobile} />
      <color attach="background" args={['#080604']} />
      <fog attach="fog" args={['#080604', 14, 28]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[0, 10, 4]} intensity={2.5} color="#f0e0cc" />
      <pointLight position={[-4, 3, 6]} intensity={1.2} color="#c8a882" distance={24} />
      <pointLight position={[4, 3, 10]} intensity={0.8} color="#eed8c0" distance={24} />

      <Sparkles
        count={isMobile ? 12 : 24}
        scale={[16, 6, 24]}
        size={1}
        speed={0.1}
        opacity={0.2}
        color="#c8a882"
      />

      {panes[0] && <GlassPane url={panes[0].src} position={[-2.8 * xs, 0.8, 0]} rotation={[0, 0.3, 0]} width={2.8} height={1.9} />}
      {panes[1] && <GlassPane url={panes[1].src} position={[2.2 * xs, 1.1, 2.5]} rotation={[0, -0.25, 0]} width={1.7} height={2.3} />}
      {panes[2] && <GlassPane url={panes[2].src} position={[-1.8 * xs, 0.6, 5.5]} rotation={[0, 0.15, 0]} width={2.4} height={1.6} />}
      {panes[3] && <GlassPane url={panes[3].src} position={[3 * xs, 0.9, 8]} rotation={[0, -0.35, 0]} width={2.5} height={1.7} />}
      {panes[4] && <GlassPane url={panes[4].src} position={[-2.5 * xs, 1.0, 10.5]} rotation={[0, 0.2, 0]} width={2.0} height={2.6} />}
      {panes[5] && <GlassPane url={panes[5].src} position={[1.8 * xs, 0.7, 13.5]} rotation={[0, -0.15, 0]} width={2.8} height={1.9} />}
      {panes[6] && <GlassPane url={panes[6].src} position={[-1.5 * xs, 1.2, 16]} rotation={[0, 0.28, 0]} width={1.8} height={2.4} />}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 6]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0908" metalness={0.6} roughness={0.35} />
      </mesh>
    </>
  );
}

export default function DarkroomCanvas() {
  return (
    <Canvas
      dpr={[1, 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: 'default' }}
      frameloop="always"
    >
      <DarkroomScene />
    </Canvas>
  );
}
