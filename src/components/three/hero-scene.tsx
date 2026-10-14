"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, RoundedBox, useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

/**
 * Procedural low-poly quadcopter built from primitives - no downloads needed.
 * Spins slowly, leans toward the mouse and rises a little as you scroll.
 */
function Drone({ accent }: { accent: string }) {
  const group = useRef<THREE.Group>(null);
  const props = useRef<THREE.Group[]>([]);
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#26262b", roughness: 0.45, metalness: 0.35 }), []);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.6, metalness: 0.2 }), []);
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a1a1aa", roughness: 0.25, metalness: 0.9 }), []);
  const brand = useMemo(() => new THREE.MeshStandardMaterial({ color: accent, roughness: 0.35, metalness: 0.2 }), [accent]);
  const blade = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3f3f46", roughness: 0.5, transparent: true, opacity: 0.92 }), []);
  const disc = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }),
    [],
  );

  const arms: [number, number][] = [
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const scroll = typeof window !== "undefined" ? Math.min(1, window.scrollY / 700) : 0;
    // Slow turn + gentle lean toward the pointer.
    g.rotation.y += delta * 0.22;
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.25 + scroll * 0.35, 0.05);
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, -state.pointer.x * 0.25, 0.05);
    g.position.y = Math.sin(t * 1.2) * 0.08 + scroll * 0.6;
    for (const [i, p] of props.current.entries()) if (p) p.rotation.y += delta * (i % 2 ? -26 : 26);
  });

  return (
    <group ref={group} scale={1.05}>
      {/* Main body */}
      <RoundedBox args={[1.1, 0.32, 1.5]} radius={0.12} smoothness={3} material={body} castShadow />
      <RoundedBox args={[0.8, 0.12, 0.9]} radius={0.05} position={[0, 0.2, -0.05]} material={dark} />
      <mesh position={[0, 0.27, 0.35]} material={brand}>
        <boxGeometry args={[0.5, 0.04, 0.22]} />
      </mesh>
      {/* Battery */}
      <RoundedBox args={[0.6, 0.18, 0.9]} radius={0.06} position={[0, -0.24, -0.1]} material={dark} />
      {/* Camera gimbal */}
      <group position={[0, -0.12, 0.82]}>
        <mesh material={metal}>
          <boxGeometry args={[0.28, 0.12, 0.12]} />
        </mesh>
        <mesh position={[0, -0.13, 0.04]} material={dark}>
          <sphereGeometry args={[0.13, 20, 16]} />
        </mesh>
        <mesh position={[0, -0.13, 0.16]} rotation={[Math.PI / 2, 0, 0]} material={brand}>
          <cylinderGeometry args={[0.06, 0.06, 0.04, 20]} />
        </mesh>
      </group>
      {/* Arms, motors and propellers */}
      {arms.map(([x, z], i) => {
        const angle = Math.atan2(x, z);
        const end: [number, number, number] = [x * 1.05, 0.05, z * 1.05];
        return (
          <group key={i}>
            <mesh position={[x * 0.55, 0.02, z * 0.55]} rotation={[0, angle, 0]} material={body} castShadow>
              <boxGeometry args={[0.14, 0.09, 1.25]} />
            </mesh>
            <mesh position={end} material={metal} castShadow>
              <cylinderGeometry args={[0.12, 0.14, 0.2, 20]} />
            </mesh>
            <mesh position={[end[0], end[1] + 0.11, end[2]]} material={z > 0 ? brand : dark}>
              <cylinderGeometry args={[0.13, 0.13, 0.03, 20]} />
            </mesh>
            <group
              position={[end[0], end[1] + 0.16, end[2]]}
              ref={(el) => {
                if (el) props.current[i] = el;
              }}
            >
              <mesh material={blade} rotation={[0.08, 0, 0]}>
                <boxGeometry args={[0.95, 0.012, 0.09]} />
              </mesh>
              <mesh material={blade} rotation={[0.08, Math.PI / 2, 0]}>
                <boxGeometry args={[0.95, 0.012, 0.09]} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} material={disc}>
                <circleGeometry args={[0.5, 32]} />
              </mesh>
            </group>
            {/* Landing leg */}
            <mesh position={[x * 0.85, -0.22, z * 0.85]} material={dark}>
              <cylinderGeometry args={[0.025, 0.035, 0.42, 8]} />
            </mesh>
          </group>
        );
      })}
      {/* Navigation LEDs */}
      <mesh position={[0.32, 0, 0.76]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[-0.32, 0, 0.76]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
    </group>
  );
}

function UploadedModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.22;
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -state.pointer.y * 0.2, 0.05);
  });
  return (
    <group ref={ref}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

export default function HeroScene({ accent, modelUrl, active }: { accent: string; modelUrl?: string; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.1, 6.4], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      aria-hidden
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} />
      <directionalLight position={[-4, 2, -3]} intensity={0.8} color="#cbd5e1" />
      <pointLight position={[0, -1, 3]} intensity={6} color={accent} distance={6} />
      <Suspense fallback={null}>{modelUrl ? <UploadedModel url={modelUrl} /> : <Drone accent={accent} />}</Suspense>
      <ContactShadows position={[0, -1.15, 0]} opacity={0.35} scale={8} blur={2.6} far={3} resolution={256} frames={active ? Infinity : 1} />
    </Canvas>
  );
}
