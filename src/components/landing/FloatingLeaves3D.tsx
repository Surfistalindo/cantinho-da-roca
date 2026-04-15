import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function Leaf({ position, speed, rotationSpeed, scale, delay }: {
  position: [number, number, number];
  speed: number;
  rotationSpeed: [number, number, number];
  scale: number;
  delay: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const startTime = useRef(delay);

  // Create leaf shape
  const leafShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.15, 0.3, 0.4, 0.6, 0, 1.2);
    shape.bezierCurveTo(-0.4, 0.6, -0.15, 0.3, 0, 0);
    return shape;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(leafShape);
    return geo;
  }, [leafShape]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + startTime.current;

    // Floating orbital motion
    ref.current.position.x = position[0] + Math.sin(t * speed * 0.5) * 1.5;
    ref.current.position.y = position[1] + Math.sin(t * speed * 0.7) * 0.8;
    ref.current.position.z = position[2] + Math.cos(t * speed * 0.3) * 1.2;

    // Natural rotation
    ref.current.rotation.x = t * rotationSpeed[0];
    ref.current.rotation.y = t * rotationSpeed[1];
    ref.current.rotation.z = t * rotationSpeed[2];
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#2d7a3a"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Vein line */}
      <mesh position={[0, 0.6, 0.01]}>
        <planeGeometry args={[0.02, 1]} />
        <meshStandardMaterial color="#1a5c25" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function LeafCloud() {
  const leaves = useMemo(() => {
    const items = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 3 + Math.random() * 2.5;
      items.push({
        position: [
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 3,
          Math.sin(angle) * radius - 2,
        ] as [number, number, number],
        speed: 0.3 + Math.random() * 0.5,
        rotationSpeed: [
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 0.6,
        ] as [number, number, number],
        scale: 0.25 + Math.random() * 0.35,
        delay: Math.random() * 10,
      });
    }
    return items;
  }, []);

  return (
    <>
      {leaves.map((leaf, i) => (
        <Leaf key={i} {...leaf} />
      ))}
    </>
  );
}

const FloatingLeaves3D: React.FC = () => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ opacity: 0.7 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <directionalLight position={[-3, 3, -2]} intensity={0.3} color="#4ade80" />
        <LeafCloud />
      </Canvas>
    </div>
  );
};

export default FloatingLeaves3D;
