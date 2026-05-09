import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, DepthOfField, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import heroImg from '../assets/hero.jpg';
import weddingImg from '../assets/wedding.jpg';
import galleryPortrait from '../assets/gallery_portrait.png';
import galleryWedding from '../assets/gallery_wedding.png';
import galleryEvent from '../assets/gallery_event.png';

gsap.registerPlugin(ScrollTrigger);

/* ── Z positions of all glass panes (for DOF focal tracking) ── */
const PANE_Z_POSITIONS = [0, 2.5, 5.5, 8, 10.5, 13.5, 16];

/* ── Glass pane with photo ── */
function GlassPane({ url, position, rotation = [0, 0, 0] as [number, number, number], width = 2, height = 1.4 }: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <Float speed={0.6} rotationIntensity={0.03} floatIntensity={0.15}>
      <group position={position} rotation={rotation}>
        {/* Dark backing / frame */}
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[width + 0.18, height + 0.18]} />
          <meshStandardMaterial color="#0c0a08" metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Cream mat */}
        <mesh position={[0, 0, -0.015]}>
          <planeGeometry args={[width + 0.08, height + 0.08]} />
          <meshStandardMaterial color="#f0ece6" emissive="#f0ece6" emissiveIntensity={0.15} roughness={0.9} />
        </mesh>
        {/* The photo */}
        <mesh>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* Accent light */}
        <pointLight position={[0, 0, 0.8]} intensity={1.5} color="#f0e0cc" distance={4} decay={2} />
        {/* Glass overlay */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[width + 0.18, height + 0.18]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.06}
            color="#c8ddef"
            roughness={0}
            metalness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
      </group>
    </Float>
  );
}

/* ── Floating bokeh spheres in the 3D scene ── */
function BokehOrb({ position, size = 0.15, color = '#c8a882' }: {
  position: [number, number, number];
  size?: number;
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.position.y += Math.sin(t * 0.3 + position[0]) * 0.0008;
    ref.current.position.x += Math.cos(t * 0.2 + position[2]) * 0.0005;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} />
    </mesh>
  );
}

/* ── Reflective floor ── */
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 6]} receiveShadow>
      <planeGeometry args={[40, 40]} />
      <meshPhysicalMaterial
        color="#0a0908"
        metalness={0.95}
        roughness={0.15}
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </mesh>
  );
}

/*
 * ── Dynamic DOF controller ──
 * Reads the camera's Z position every frame and calculates
 * the correct focusDistance so the nearest glass pane is sharp.
 * Panes behind the camera and far ahead both blur — like a
 * real lens with shallow depth of field.
 */
function DynamicDOF() {
  const dofRef = useRef<any>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!dofRef.current) return;

    const camZ = camera.position.z;

    // Find the Z of the nearest pane to the camera
    let nearestDist = Infinity;
    for (const pz of PANE_Z_POSITIONS) {
      const dist = Math.abs(pz - camZ);
      if (dist < nearestDist) nearestDist = dist;
    }

    // Convert world-space distance to a normalized focus distance.
    // The camera far is 2000 (default). We map the nearest pane
    // distance to a 0–1 range. Closer panes → lower focusDistance.
    const normalizedFocus = THREE.MathUtils.clamp(nearestDist / 30, 0.001, 0.15);

    // Smoothly interpolate to avoid jumps when switching focal targets
    const effect = dofRef.current;
    if (effect.circleOfConfusionMaterial) {
      const uniforms = effect.circleOfConfusionMaterial.uniforms;
      if (uniforms.focusDistance) {
        uniforms.focusDistance.value = THREE.MathUtils.lerp(
          uniforms.focusDistance.value,
          normalizedFocus,
          0.08 // smooth interpolation speed
        );
      }
    }
  });

  return (
    <DepthOfField
      ref={dofRef}
      focusDistance={0.02}
      focalLength={0.065}
      bokehScale={2}
    />
  );
}

/* ── Camera rig driven by scroll ── */
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

    // Drift through the photo forest along Z
    tl.to(g.position, { z: 18, duration: 12, ease: 'none' }, 0);
    // Gentle vertical sway
    tl.to(g.position, { y: 0.4, duration: 6, ease: 'power1.inOut' }, 0);
    tl.to(g.position, { y: 0, duration: 6, ease: 'power1.inOut' }, 6);
    // Subtle lateral look
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

/* ── The full darkroom 3D scene ── */
function DarkroomScene() {
  const { size } = useThree();
  const isMobile = size.width < 768;
  // Pull panes inward on mobile so the narrow portrait viewport still sees them.
  const xs = isMobile ? 0.5 : 1;

  return (
    <>
      <CameraRig isMobile={isMobile} />
      <color attach="background" args={['#080604']} />
      <fog attach="fog" args={['#080604', 14, 28]} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[0, 10, 4]}
        angle={0.6}
        penumbra={0.8}
        intensity={5}
        color="#f0e0cc"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <spotLight
        position={[0, 8, 12]}
        angle={0.7}
        penumbra={0.9}
        intensity={4}
        color="#eed8c0"
      />
      <pointLight position={[-4, 3, 0]} intensity={2} color="#c8a882" distance={20} />
      <pointLight position={[4, 3, 8]} intensity={1.5} color="#8ab4c8" distance={20} />
      <pointLight position={[0, 3, 14]} intensity={2} color="#c8a882" distance={18} />

      {/* Dust particles */}
      <Sparkles
        count={60}
        scale={[16, 6, 24]}
        size={1.2}
        speed={0.15}
        opacity={0.25}
        color="#c8a882"
      />

      {/* ── Glass panes — staggered along Z ── */}
      <GlassPane url={heroImg}          position={[-2.8 * xs, 0.8, 0]}    rotation={[0, 0.3, 0]}    width={2.8} height={1.9} />
      <GlassPane url={galleryPortrait}  position={[2.2 * xs, 1.1, 2.5]}   rotation={[0, -0.25, 0]}  width={1.7} height={2.3} />
      <GlassPane url={weddingImg}       position={[-1.8 * xs, 0.6, 5.5]}  rotation={[0, 0.15, 0]}   width={2.4} height={1.6} />
      <GlassPane url={galleryEvent}     position={[3 * xs, 0.9, 8]}       rotation={[0, -0.35, 0]}  width={2.5} height={1.7} />
      <GlassPane url={galleryWedding}   position={[-2.5 * xs, 1.0, 10.5]} rotation={[0, 0.2, 0]}    width={2.0} height={2.6} />
      <GlassPane url={heroImg}          position={[1.8 * xs, 0.7, 13.5]}  rotation={[0, -0.15, 0]}  width={2.8} height={1.9} />
      <GlassPane url={galleryPortrait}  position={[-1.5 * xs, 1.2, 16]}   rotation={[0, 0.28, 0]}   width={1.8} height={2.4} />

      {/* ── Bokeh orbs — floating blurred light balls ── */}
      <BokehOrb position={[-3.5 * xs, 2.0, 1.5]} size={0.12} color="#c8a882" />
      <BokehOrb position={[3.8 * xs, 1.5, 4]}    size={0.18} color="#f0e0cc" />
      <BokehOrb position={[-1.0 * xs, 2.5, 7]}   size={0.1}  color="#c8a882" />
      <BokehOrb position={[2.5 * xs, 0.3, 9.5]}  size={0.22} color="#eed8c0" />
      <BokehOrb position={[-3.0 * xs, 1.8, 12]}  size={0.14} color="#c8a882" />
      <BokehOrb position={[1.0 * xs, 2.8, 15]}   size={0.16} color="#f0e0cc" />

      {/* Reflective floor */}
      <ReflectiveFloor />

      {/* ── Dynamic DOF + Vignette postprocessing ── */}
      <EffectComposer>
        <DynamicDOF />
        <Vignette eskil={false} offset={0.25} darkness={0.4} />
      </EffectComposer>
    </>
  );
}

/* ── Main exported component ── */
export default function DarkroomGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const overlay = overlayRef.current;
    if (!section || !overlay) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 2,
          pin: '.darkroom-viewport',
          anticipatePin: 1,
        },
      });

      // Title fades in then out
      tl.fromTo(overlay,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 2, ease: 'power2.out' },
        0
      );
      tl.to(overlay,
        { opacity: 0, y: -20, duration: 2, ease: 'power1.in' },
        3
      );
    }, section);

    return () => { ctx.revert(); };
  }, []);

  return (
    <section className="darkroom-section" ref={sectionRef}>
      <div className="darkroom-viewport">
        <Canvas
          dpr={[1, 1.5]}
          shadows
          gl={{ antialias: true, alpha: false }}
        >
          <DarkroomScene />
        </Canvas>

        {/* Overlay title */}
        <div className="darkroom-overlay" ref={overlayRef}>
          <span className="darkroom-label">The Darkroom</span>
          <h2>Capturing a <em>Global</em> Narrative</h2>
        </div>

        {/* Scroll hint */}
        <div className="darkroom-scroll-hint">
          <span>Scroll to drift</span>
          <div className="darkroom-scroll-line" />
        </div>
      </div>
    </section>
  );
}
