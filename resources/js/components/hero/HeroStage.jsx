import { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

/**
 * The hero stage: a semi-polished bronze horse on a dark navy set, lit with a
 * hard key / cyan rim / soft fill rig, surrounded by rising forge sparks, over a
 * slow liquid-metal wave field.
 *
 * Built on the project's existing @react-three/fiber + drei setup. The camera
 * orbits the statue continuously and scroll pushes it further around the arc.
 */

const MODEL_URL = '/models/bronze_horse.glb';

// Shared scroll + pointer state, written once per frame instead of per component.
const useStageInput = () => {
  const state = useRef({ scroll: 0, targetScroll: 0, mouseX: 0, mouseY: 0, targetMouseX: 0, targetMouseY: 0 });

  useEffect(() => {
    const onMove = (e) => {
      state.current.targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      state.current.targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    const s = state.current;
    // Hero-local progress: 0 at the top of the page, 1 once the hero has
    // scrolled a full viewport away.
    s.targetScroll = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
    s.scroll += (s.targetScroll - s.scroll) * 0.025;
    s.mouseX += (s.targetMouseX - s.mouseX) * 0.05;
    s.mouseY += (s.targetMouseY - s.mouseY) * 0.05;
  });

  return state;
};

/* ────────────────────────────── Background wave ───────────────────────────── */

const WAVE_VERT = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WAVE_FRAG = `
varying vec2 vUv;
uniform float uTime;
uniform vec2  uResolution;
uniform vec2  uMouse;
uniform float uScroll;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    float aspect = uResolution.x / uResolution.y;

    float time = uTime * 0.08;   // extremely slow, calm breathing speed
    float scroll = uScroll;

    // Constant frequencies/angles keep the field stable while scrolling.
    float angle1 = 0.6;
    float angle2 = -0.7;
    float angle3 = 1.2;
    float freq1 = 2.4;
    float freq2 = 3.2;
    float freq3 = 4.0;

    // Smooth rounded arcs; scroll shifts the phase of the distortion.
    vec2 warpedUv = uv;
    float scrollDeform = scroll * 5.0;

    warpedUv.x += sin(uv.y * 2.5 + time * 0.2 + scrollDeform) * 0.35;
    warpedUv.y += cos(uv.x * 2.5 - time * 0.15 - scrollDeform * 0.8) * 0.35;
    warpedUv.x += sin(uv.y * 1.2 - time * 0.1 - scrollDeform * 1.5) * 0.25;
    warpedUv.y += cos(uv.x * 1.2 + time * 0.18 + scrollDeform * 1.2) * 0.25;

    warpedUv += vec2(scroll * 0.04, -scroll * 0.02);
    warpedUv += vec2(uMouse.x * aspect * 0.05, uMouse.y * 0.05);

    vec2 dir1 = vec2(cos(angle1), sin(angle1));
    vec2 dir2 = vec2(cos(angle2), sin(angle2));
    vec2 dir3 = vec2(cos(angle3), sin(angle3));

    float w1 = sin(dot(warpedUv, dir1) * freq1 + time * 1.0);
    float w2 = cos(dot(warpedUv, dir2) * freq2 - time * 1.4 + w1 * 0.4);
    float w3 = sin(dot(warpedUv, dir3) * freq3 + time * 1.8 + w2 * 0.5);

    float waveField = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

    float wideSheen     = pow(max(0.0, 1.0 - abs(waveField - 0.1)), 2.5);
    float crispSpecular = pow(max(0.0, 1.0 - abs(waveField - 0.15)), 8.0);
    float crest = wideSheen * 0.5 + crispSpecular * 0.9;

    // Palette: the site's deep navy stage → brand cyan as the page scrolls.
    vec3 c0_shadow = vec3(0.0006, 0.0010, 0.0014);
    vec3 c0_wave2  = vec3(0.008,  0.026,  0.036);
    vec3 c0_wave1  = vec3(0.016,  0.050,  0.068);
    vec3 c0_crest  = vec3(0.075,  0.285,  0.355);

    vec3 c1_shadow = vec3(0.0008, 0.0014, 0.0020);
    vec3 c1_wave2  = vec3(0.010,  0.038,  0.052);
    vec3 c1_wave1  = vec3(0.020,  0.068,  0.092);
    vec3 c1_crest  = vec3(0.105,  0.400,  0.490);

    float t = smoothstep(0.0, 1.0, scroll);
    vec3 colShadow = mix(c0_shadow, c1_shadow, t);
    vec3 colWave1  = mix(c0_wave1,  c1_wave1,  t);
    vec3 colWave2  = mix(c0_wave2,  c1_wave2,  t);
    vec3 colCrest  = mix(c0_crest,  c1_crest,  t);

    vec3 color = colShadow;
    color = mix(color, colWave2, smoothstep(-0.6, 0.2, waveField));
    color = mix(color, colWave1, smoothstep(0.0, 0.8, waveField));
    color += colCrest * crest * 1.4;

    color *= 1.0 - dot(uv, uv) * 0.12;   // gentle cinematic vignette

    gl_FragColor = vec4(color, 1.0);
}
`;

/** Full-frame wave plane parented to the camera so it always fills the view. */
function BackgroundWave({ input }) {
  const meshRef = useRef();
  const { camera, size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime:       { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse:      { value: new THREE.Vector2(0, 0) },
      uScroll:     { value: 0 },
    }),
    []
  );

  // Reparent to the camera — the statue is orbited, and the backdrop has to
  // travel with the lens rather than stay put in world space.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    camera.add(mesh);
    return () => camera.remove(mesh);
  }, [camera]);

  useEffect(() => {
    uniforms.uResolution.value.set(size.width * viewport.dpr, size.height * viewport.dpr);
  }, [size, viewport.dpr, uniforms]);

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uMouse.value.set(input.current.mouseX, -input.current.mouseY);
    uniforms.uScroll.value = input.current.scroll;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -8]} renderOrder={-10}>
      <planeGeometry args={[30, 30]} />
      <shaderMaterial
        vertexShader={WAVE_VERT}
        fragmentShader={WAVE_FRAG}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/* ──────────────────────────────── Forge sparks ────────────────────────────── */

const SPARK_COUNT = 450;

/** White-core radial dot, generated once — no texture file to ship. */
function createSparkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(canvas);
}

function Sparks({ input }) {
  const pointsRef = useRef();

  const { geometry, texture, data } = useMemo(() => {
    const positions = new Float32Array(SPARK_COUNT * 3);
    const colors = new Float32Array(SPARK_COUNT * 3);
    const data = [];

    for (let i = 0; i < SPARK_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 6.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5.0 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6.5;

      // 60% brand cyan / 40% pale ice — the reference's molten-orange split,
      // re-keyed to the site palette.
      if (Math.random() < 0.6) {
        colors[i * 3]     = 0.10 + Math.random() * 0.10;
        colors[i * 3 + 1] = 0.62 + Math.random() * 0.18;
        colors[i * 3 + 2] = 0.80 + Math.random() * 0.20;
      } else {
        colors[i * 3]     = 0.72 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.88 + Math.random() * 0.10;
        colors[i * 3 + 2] = 1.0;
      }

      data.push({
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: 0.15 + Math.random() * 0.3,
        speedZ: (Math.random() - 0.5) * 0.4,
        swaySpeed: 0.5 + Math.random() * 1.5,
        swayRadius: 0.05 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry, texture: createSparkTexture(), data };
  }, []);

  useEffect(() => () => {
    geometry.dispose();
    texture.dispose();
  }, [geometry, texture]);

  useFrame((state, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const positions = points.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();
    // Fast scrolling stirs the sparks up.
    const scrollVelocity = Math.abs(input.current.targetScroll - input.current.scroll);
    const speedMultiplier = 1.0 + scrollVelocity * 9.0;
    const turbulence = scrollVelocity * 0.8;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < SPARK_COUNT; i++) {
      const idx = i * 3;
      const d = data[i];
      positions[idx]     += d.speedX * dt * speedMultiplier;
      positions[idx + 1] += d.speedY * dt * speedMultiplier;
      positions[idx + 2] += d.speedZ * dt * speedMultiplier;

      const sway = d.swayRadius * (1.0 + turbulence * 4.0);
      positions[idx]     += Math.sin(time * d.swaySpeed + d.phase) * sway * dt;
      positions[idx + 2] += Math.cos(time * d.swaySpeed + d.phase) * sway * dt;

      if (positions[idx + 1] > 3.0 || Math.abs(positions[idx]) > 3.5 || Math.abs(positions[idx + 2]) > 3.5) {
        positions[idx + 1] = -2.5;
        positions[idx]     = (Math.random() - 0.5) * 3.0;
        positions[idx + 2] = (Math.random() - 0.5) * 3.0;
      }
    }
    points.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.025}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        map={texture}
      />
    </points>
  );
}

/* ──────────────────────────────── The statue ──────────────────────────────── */

function BronzeHorse({ input }) {
  const { scene } = useGLTF(MODEL_URL);
  const pivotRef = useRef();

  // Clone so the cached GLTF isn't mutated, then re-key the material to a
  // semi-polished bronze and centre the mesh on the pivot.
  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material) {
        child.material = child.material.clone();
        child.material.roughness = 0.42;   // semi-matte, noble highlights
        child.material.metalness = 0.92;   // high satin-bronze sheen
        child.material.flatShading = false;
        if (child.material.map) child.material.map.anisotropy = 16;
      }
    });

    // Scale so the largest dimension is 3.5 units…
    const boxInitial = new THREE.Box3().setFromObject(clone);
    const sizeInitial = boxInitial.getSize(new THREE.Vector3());
    const maxDim = Math.max(sizeInitial.x, sizeInitial.y, sizeInitial.z);
    clone.scale.setScalar(3.5 / (maxDim > 0.0001 ? maxDim : 1));

    // …then recentre using the *scaled* bounding box so the pivot sits at the
    // exact geometric centre and the orbit stays true.
    clone.updateMatrixWorld(true);
    const centerScaled = new THREE.Box3().setFromObject(clone).getCenter(new THREE.Vector3());
    clone.position.sub(centerScaled);

    return clone;
  }, [scene]);

  useFrame(() => {
    const pivot = pivotRef.current;
    if (!pivot) return;
    // Gentle interactive tilt toward the pointer.
    pivot.rotation.y = input.current.mouseX * 0.25;
    pivot.rotation.x = input.current.mouseY * 0.15;
  });

  return (
    <group ref={pivotRef} position={[0, -0.4, 0]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);

/* ─────────────────────────────── Orbiting camera ──────────────────────────── */

/**
 * Slow continuous orbit around the statue, pushed further along the arc by
 * scroll. `lookAtOffset` shifts the framing sideways to clear room for the
 * headline column (mirrored for RTL).
 */
function OrbitCamera({ input, lookAtOffset }) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const desired = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const scroll = input.current.scroll;
    const phi = state.clock.getElapsedTime() * 0.08 + scroll * Math.PI * 2.0;
    const y = 0.35 + Math.sin(scroll * Math.PI) * 0.8;
    // Pulled back from the reference's 4.2: this hero shares the frame with a
    // headline column, so the statue has to sit inside half the stage.
    const radius = 5.6 - Math.sin(scroll * Math.PI) * 0.6;

    desired.set(radius * Math.sin(phi), y, radius * Math.cos(phi));
    camera.position.lerp(desired, 0.025);

    target.set(lookAtOffset, -0.15, 0);
    camera.lookAt(target);
  });

  return null;
}

/* ──────────────────────────────── Composition ─────────────────────────────── */

function StageContents({ lookAtOffset }) {
  const input = useStageInput();

  return (
    <>
      <BackgroundWave input={input} />
      <OrbitCamera input={input} lookAtOffset={lookAtOffset} />

      {/* Chiaroscuro rig: hard white key, cyan rim, soft cool fill. */}
      <ambientLight color="#ffffff" intensity={0.1} />
      <spotLight
        color="#ffffff"
        intensity={18}
        position={[4, 6, 3]}
        angle={Math.PI / 4}
        penumbra={0.9}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={15}
        shadow-bias={-0.001}
      />
      <directionalLight color="#7ff0ff" intensity={10} position={[-5, 3, -4]} />
      <directionalLight color="#dbeafe" intensity={0.8} position={[-2, -4, 2]} />

      <Sparks input={input} />
      <Suspense fallback={null}>
        <BronzeHorse input={input} />
      </Suspense>
    </>
  );
}

export const HeroStage = ({ className = '', lookAtOffset = -0.9 }) => (
  <div className={className} aria-hidden="true">
    <Canvas
      dpr={[1, 2]}
      shadows="soft"
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0.35, 5.6] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 2.2;
        scene.fog = new THREE.FogExp2('#10171F', 0.01);
      }}
    >
      <StageContents lookAtOffset={lookAtOffset} />
    </Canvas>
  </div>
);

export default HeroStage;
