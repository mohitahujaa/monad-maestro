"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo, useState } from "react";

function RobotHead() {
  const groupRef = useRef<THREE.Group>(null);

  // Animate the head looking around slightly
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.3;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.1;
      groupRef.current.position.y = Math.sin(t * 1.5) * 0.1;
    }
  });

  // Create a custom shader for the glowing RGB face edge
  const [faceEdgeMaterial] = useState(() => new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      varying vec2 vUv;
      void main() {
        // simple rainbow gradient based on uv
        vec3 col = 0.5 + 0.5 * cos(time + vUv.xyx * vec3(1.0, 2.0, 3.0) + vec3(0, 2, 4));
        // make it primarily cyan/purple/orange
        col = mix(vec3(0.0, 0.8, 1.0), vec3(0.6, 0.0, 1.0), vUv.x);
        col = mix(col, vec3(1.0, 0.5, 0.0), vUv.y);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    opacity: 1,
    transparent: true,
  }));

  useFrame((state) => {
    faceEdgeMaterial.uniforms.time.value = state.clock.getElapsedTime();
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} floatIntensity={1} floatingRange={[-0.1, 0.1]}>
        
        {/* Main Head Base */}
        <RoundedBox args={[2.8, 2.8, 2.8]} radius={0.4} smoothness={4}>
          <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.3} />
        </RoundedBox>

        {/* Outer glowing RGB visor frame */}
        <RoundedBox args={[3.0, 2.4, 3.0]} radius={0.3} smoothness={4} position={[0, 0, 0.1]}>
          <primitive object={faceEdgeMaterial} attach="material" />
        </RoundedBox>

        {/* Black Visor Screen */}
        <RoundedBox args={[2.8, 2.2, 3.05]} radius={0.2} smoothness={4} position={[0, 0, 0.1]}>
          <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
        </RoundedBox>

        {/* Eyes */}
        <mesh position={[-0.4, 0.2, 1.63]}>
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.4, 0.2, 1.63]}>
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Little blinking status lights below */}
        <mesh position={[0.2, -0.6, 1.55]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
        <mesh position={[0.4, -0.6, 1.55]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#0ea5e9" />
        </mesh>
        <mesh position={[0.6, -0.6, 1.55]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color="#a3e635" />
        </mesh>

        {/* Shoulders/Base */}
        <RoundedBox args={[3.2, 1.5, 2.0]} radius={0.3} smoothness={4} position={[0, -2.5, 0]}>
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
        </RoundedBox>
        
        {/* Neck connect */}
        <cylinderGeometry args={[0.6, 0.8, 1, 32]} />
        <meshStandardMaterial color="#111" />

      </Float>
    </group>
  );
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={0.5} color="#a855f7" />
        <RobotHead />
      </Canvas>
    </div>
  );
}
