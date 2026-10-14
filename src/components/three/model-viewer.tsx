"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, ContactShadows, Html, OrbitControls, useGLTF } from "@react-three/drei";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

/** Product "View in 3D": drag to rotate, scroll/pinch to zoom. */
export default function ModelViewer({ url, label }: { url: string; label: string }) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [2.5, 1.6, 2.5], fov: 40 }} aria-label={`3D model of ${label}`} role="img">
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 3]} intensity={2} />
      <directionalLight position={[-3, 2, -2]} intensity={0.7} />
      <Suspense
        fallback={
          <Html center>
            <span className="rounded-full bg-background px-4 py-2 font-medium shadow">Loading 3D model…</span>
          </Html>
        }
      >
        <Model url={url} />
      </Suspense>
      <ContactShadows position={[0, -0.8, 0]} opacity={0.35} scale={6} blur={2.4} />
      <OrbitControls enablePan={false} minDistance={1.2} maxDistance={8} autoRotate autoRotateSpeed={0.8} />
    </Canvas>
  );
}
