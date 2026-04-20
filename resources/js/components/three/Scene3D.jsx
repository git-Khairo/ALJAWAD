import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Icosahedron, Torus } from '@react-three/drei';

// Brand-teal palette kept consistent with the CSS tokens.
const TEAL = '#2ba3c4';
const TEAL_LIGHT = '#6ccfe6';
const TEAL_NEON = '#7ff0ff';
const BG_DEEP = '#10171F';

// Bitcoin palette for the coin centerpiece.
const BTC_ORANGE = '#F7931A';

/**
 * Animated particle field (mouse + scroll reactive).
 */
function ParticleField({ count = 700, scroll }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.04;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.12;
    const s = scroll?.current ?? 0;
    ref.current.position.y = -s * 3;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color={TEAL_NEON} sizeAttenuation transparent opacity={0.95} depthWrite={false} />
    </points>
  );
}

/**
 * Builds the ₿ coin face:
 *  - base gold radial gradient
 *  - fine concentric engraved rings
 *  - brushed-metal radial streaks
 *  - embossed ₿ symbol (inner shadow + upper-left highlight for real 3D feel)
 * Returns the color map (also reused as bump for subtle surface variation).
 */
function makeBitcoinFaceTexture(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Flat orange base — no highlight gradient (the "shine" was baked-in).
  ctx.fillStyle = BTC_ORANGE;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle darker rim (engraved coin edge).
  ctx.strokeStyle = 'rgba(90,40,0,0.35)';
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.965, 0, Math.PI * 2);
  ctx.stroke();

  // Flat white ₿ — no shadow, no highlight, no gradient. Pure matte logo.
  const fontSize = size * 0.72;
  ctx.font = `bold ${fontSize}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('₿', cx, cy + size * 0.005);

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Side strip: vertical ridges that wrap around the cylinder rim.
 * The texture repeats horizontally so ridges look continuous.
 */
function makeBitcoinRimTexture(w = 2048, h = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Flat matte orange rim — no vertical highlight gradient.
  ctx.fillStyle = BTC_ORANGE;
  ctx.fillRect(0, 0, w, h);

  // Very subtle darkening at top/bottom edges only (engraved feel).
  const edge = ctx.createLinearGradient(0, 0, 0, h);
  edge.addColorStop(0, 'rgba(70,30,0,0.35)');
  edge.addColorStop(0.12, 'rgba(0,0,0,0)');
  edge.addColorStop(0.88, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(70,30,0,0.35)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, w, h);

  // Faint milled ridges — only dark lines, no bright highlights.
  const ridgeW = 4;
  for (let x = 0; x < w; x += ridgeW * 2) {
    ctx.fillStyle = 'rgba(60,28,0,0.18)';
    ctx.fillRect(x, 0, ridgeW, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Realistic 3D Bitcoin coin — MeshPhysicalMaterial with clearcoat,
 * brushed gold faces, milled ridges on the rim. Reacts to scroll + cursor.
 */
function BitcoinCoin({ scroll, mouse }) {
  const ref = useRef();

  const faceTex = useMemo(() => makeBitcoinFaceTexture(1024), []);
  const rimTex = useMemo(() => makeBitcoinRimTexture(2048, 128), []);

  // Three materials for cylinder geometry: [side, top, bottom].
  // Lambert = pure diffuse, zero specular highlights. Fully matte.
  const materials = useMemo(
    () => [
      new THREE.MeshLambertMaterial({ map: rimTex }),
      new THREE.MeshLambertMaterial({ map: faceTex }),
      new THREE.MeshLambertMaterial({ map: faceTex }),
    ],
    [faceTex, rimTex],
  );

  useEffect(() => {
    return () => {
      faceTex.dispose();
      rimTex.dispose();
      materials.forEach((m) => m.dispose());
    };
  }, [faceTex, rimTex, materials]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const s = scroll?.current ?? 0;
    ref.current.rotation.y = t * 0.55 + (mouse?.current?.x ?? 0) * 0.4;
    ref.current.rotation.x =
      Math.PI / 2 + Math.sin(t * 0.35) * 0.12 + (mouse?.current?.y ?? 0) * 0.35;
    ref.current.scale.setScalar(1 + Math.sin(t * 0.6) * 0.015 - s * 0.1);
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
      <mesh ref={ref} material={materials} castShadow receiveShadow>
        {/* 96 side segments keeps the ridges crisp without going overboard */}
        <cylinderGeometry args={[1.45, 1.45, 0.3, 96, 1]} />
      </mesh>
    </Float>
  );
}

/**
 * Orbiting decorative rings.
 */
function OrbitingRings() {
  const g = useRef();
  useFrame((state, delta) => {
    if (!g.current) return;
    g.current.rotation.y += delta * 0.1;
    g.current.rotation.x += delta * 0.04;
  });
  return (
    <group ref={g}>
      <Torus args={[2.4, 0.018, 12, 120]} rotation={[Math.PI / 2.3, 0, 0]}>
        <meshBasicMaterial color={TEAL_NEON} transparent opacity={0.9} toneMapped={false} />
      </Torus>
      <Torus args={[2.9, 0.012, 12, 120]} rotation={[Math.PI / 1.8, 0.6, 0]}>
        <meshBasicMaterial color={TEAL_LIGHT} transparent opacity={0.7} toneMapped={false} />
      </Torus>
      <Torus args={[3.4, 0.009, 12, 120]} rotation={[Math.PI / 3.2, -0.4, 0.5]}>
        <meshBasicMaterial color={TEAL_NEON} transparent opacity={0.5} toneMapped={false} />
      </Torus>
    </group>
  );
}

/**
 * Floating wireframe icosahedrons — used as accent geometry in the hero.
 */
function AccentGeometry() {
  return (
    <>
      <Float speed={2.2} rotationIntensity={2} floatIntensity={2.4}>
        <Icosahedron args={[0.3, 0]} position={[-3, 1.6, -1.5]}>
          <meshBasicMaterial color={TEAL_NEON} wireframe transparent opacity={0.9} toneMapped={false} />
        </Icosahedron>
      </Float>
      <Float speed={1.6} rotationIntensity={1.5} floatIntensity={2}>
        <Icosahedron args={[0.22, 0]} position={[2.8, -1.6, -1.2]}>
          <meshBasicMaterial color={TEAL_LIGHT} wireframe transparent opacity={0.9} toneMapped={false} />
        </Icosahedron>
      </Float>
      <Float speed={1.2} rotationIntensity={1} floatIntensity={1.6}>
        <Icosahedron args={[0.18, 0]} position={[3.4, 1.9, 0.2]}>
          <meshBasicMaterial color={TEAL_NEON} wireframe transparent opacity={0.8} toneMapped={false} />
        </Icosahedron>
      </Float>
      <Float speed={1.9} rotationIntensity={1.2} floatIntensity={1.8}>
        <Icosahedron args={[0.26, 0]} position={[-3.4, -1.9, 0.4]}>
          <meshBasicMaterial color={TEAL_LIGHT} wireframe transparent opacity={0.8} toneMapped={false} />
        </Icosahedron>
      </Float>
    </>
  );
}

/**
 * Drop-in 3D scene used in the hero. Interactive with scroll + cursor.
 * Props:
 *  - scroll: ref holding a 0..1 scroll value (optional)
 *  - mouse:  ref holding normalized mouse vector { x, y } (optional)
 */
export default function Scene3D({ scroll, mouse, className = '' }) {
  // Detect low-power / coarse-pointer (mobile, tablets) — skip the 3D scene there.
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const narrow = window.innerWidth < 768;
    const lowCore = (navigator.hardwareConcurrency || 8) < 4;
    setEnabled(!(coarse || reduced || narrow || lowCore));
  }, []);

  if (!enabled) {
    return (
      <div className={`absolute inset-0 ${className}`} aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 45% at 50% 45%, hsl(195 65% 47% / 0.35), transparent 70%)',
          }}
        />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        performance={{ min: 0.5 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#00000000']} />
          <fog attach="fog" args={[BG_DEEP, 6, 20]} />
          <ambientLight intensity={1.1} />
          <hemisphereLight args={['#ffffff', '#1a2330', 0.6]} />
          <directionalLight position={[3, 4, 5]} intensity={0.5} color={'#ffffff'} />
          <pointLight position={[-4, -3, -2]} intensity={0.7} color={TEAL} />
          <BitcoinCoin scroll={scroll} mouse={mouse} />
          <OrbitingRings />
          <AccentGeometry />
          <ParticleField scroll={scroll} />
        </Suspense>
      </Canvas>
    </div>
  );
}
