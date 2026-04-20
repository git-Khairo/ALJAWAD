import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

const TEAL = '#2ba3c4';
const TEAL_LIGHT = '#6ccfe6';

function Coin({ hovered }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (!ref.current) return;
    const target = hovered?.current ? 1 : 0.4;
    ref.current.rotation.y += delta * (0.4 + target);
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6) * 0.08;
  });
  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.1}>
      <group ref={ref}>
        <mesh>
          <cylinderGeometry args={[1.25, 1.25, 0.18, 72]} />
          <meshStandardMaterial color={TEAL} metalness={0.85} roughness={0.18} emissive={TEAL} emissiveIntensity={0.12} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <torusGeometry args={[1.08, 0.03, 16, 120]} />
          <meshStandardMaterial color={TEAL_LIGHT} metalness={1} roughness={0.1} emissive={TEAL_LIGHT} emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <torusGeometry args={[1.08, 0.03, 16, 120]} />
          <meshStandardMaterial color={TEAL_LIGHT} metalness={1} roughness={0.1} emissive={TEAL_LIGHT} emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.02, 48]} />
          <meshStandardMaterial color={TEAL_LIGHT} metalness={1} roughness={0.15} />
        </mesh>
      </group>
    </Float>
  );
}

function BarChart() {
  const g = useRef();
  useFrame((state) => {
    if (!g.current) return;
    const t = state.clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.scale.y = 0.6 + Math.sin(t * 1.5 + i * 0.6) * 0.4 + 0.4;
      c.position.y = c.scale.y / 2 - 0.3;
    });
  });
  const bars = [-0.6, -0.2, 0.2, 0.6];
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.9} position={[2.2, -0.8, -1]}>
      <group ref={g}>
        {bars.map((x, i) => (
          <mesh key={i} position={[x, 0, 0]}>
            <boxGeometry args={[0.22, 1, 0.22]} />
            <meshStandardMaterial color={i === 1 ? TEAL_LIGHT : TEAL} emissive={TEAL} emissiveIntensity={0.25} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Candle({ position, up = true }) {
  return (
    <Float speed={1.4} rotationIntensity={0.3} floatIntensity={0.9}>
      <group position={position}>
        <mesh>
          <boxGeometry args={[0.18, 0.8, 0.18]} />
          <meshStandardMaterial color={up ? '#2fc97a' : '#e4574f'} emissive={up ? '#2fc97a' : '#e4574f'} emissiveIntensity={0.25} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 1.2, 8]} />
          <meshBasicMaterial color={up ? '#2fc97a' : '#e4574f'} />
        </mesh>
      </group>
    </Float>
  );
}

export default function FloatingLogo3D({ hovered, className = '' }) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 4.5], fov: 48 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.45} />
          <directionalLight position={[4, 5, 4]} intensity={1} color={TEAL_LIGHT} />
          <pointLight position={[-3, -2, -3]} intensity={0.8} color={TEAL} />
          <Coin hovered={hovered} />
          <BarChart />
          <Candle position={[-2.2, -0.8, -1]} up />
          <Candle position={[-1.7, 1.2, -1.2]} up={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}
