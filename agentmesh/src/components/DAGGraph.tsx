"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html, Sphere } from "@react-three/drei";
import * as THREE from "three";

type NodeStatus = "idle" | "executing" | "completed";

interface NodeData {
  id: string;
  position: [number, number, number];
  status: NodeStatus;
  label: string;
  dependencies: string[];
}

const INITIAL_NODES: NodeData[] = [
  { id: "planner", position: [0, 4, 0], status: "completed", label: "Planner", dependencies: [] },
  { id: "worker1", position: [-3, 0, 0], status: "executing", label: "Frontend", dependencies: ["planner"] },
  { id: "worker2", position: [3, 0, 0], status: "idle", label: "Smart Contract", dependencies: ["planner"] },
  { id: "worker3", position: [0, -4, 0], status: "idle", label: "Integration", dependencies: ["worker1", "worker2"] },
];

function GraphNode({ 
  node, 
  onClick 
}: { 
  node: NodeData; 
  onClick: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Status colors
  const color = 
    node.status === "completed" ? "#a3e635" : 
    node.status === "executing" ? "#fbbf24" : "#3b82f6"; // neon green, gold, blue

  // Glow material based on state
  const emissiveIntensity = node.status === "executing" || hovered ? 1 : 0.2;

  useFrame((state) => {
    if (meshRef.current && node.status === "executing") {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.1);
    } else if (meshRef.current) {
       meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
  });

  return (
    <group position={node.position}>
      <Sphere 
        ref={meshRef} 
        args={[0.6, 32, 32]}
        onClick={() => onClick(node.id)}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={emissiveIntensity} 
          roughness={0.2} 
          metalness={0.8}
        />
      </Sphere>
      
      {/* Halo for executing state */}
      {node.status === "executing" && (
        <Sphere args={[0.9, 16, 16]}>
          <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
        </Sphere>
      )}

      {/* HTML Label */}
      <Html position={[0, -1, 0]} center as="div" className="pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          <p className="text-white text-xs font-mono font-bold whitespace-nowrap">{node.label}</p>
          <p className="text-[9px] uppercase tracking-widest" style={{ color: color }}>{node.status}</p>
        </div>
      </Html>
    </group>
  );
}

function GraphScene() {
  const [nodes, setNodes] = useState<NodeData[]>(INITIAL_NODES);

  // Simulate execution flow
  useFrame((state) => {
    const t = Math.floor(state.clock.elapsedTime % 6);
    // Simple mock animation logic
    if (t === 0) {
      setNodes(nds => nds.map(n => n.id === "planner" ? { ...n, status: "executing" } : { ...n, status: "idle" }));
    }
    if (t === 2) {
      setNodes(nds => nds.map(n => n.id === "planner" ? { ...n, status: "completed" } : n.id === "worker1" || n.id === "worker2" ? { ...n, status: "executing" } : n));
    }
    if (t === 4) {
       setNodes(nds => nds.map(n => n.id === "worker1" || n.id === "worker2" ? { ...n, status: "completed" } : n.id === "worker3" ? { ...n, status: "executing" } : n));
    }
  });

  const edges = useMemo(() => {
    const list: { start: THREE.Vector3; end: THREE.Vector3; status: NodeStatus }[] = [];
    nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const depNode = nodes.find(n => n.id === depId);
        if (depNode) {
          list.push({
            start: new THREE.Vector3(...depNode.position),
            end: new THREE.Vector3(...node.position),
            status: node.status === 'completed' ? 'completed' : node.status === 'executing' ? 'executing' : 'idle'
          });
        }
      });
    });
    return list;
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      
      {edges.map((edge, i) => (
        <Line 
          key={`edge-${i}`}
          points={[edge.start, edge.end]} 
          color={edge.status === 'completed' ? "#a3e635" : edge.status === 'executing' ? "#fbbf24" : "#ffffff"} 
          lineWidth={2}
          transparent
          opacity={edge.status === 'idle' ? 0.2 : 0.8}
        />
      ))}

      {nodes.map(node => (
        <GraphNode key={node.id} node={node} onClick={() => {}} />
      ))}
    </>
  );
}

export function DAGGraph() {
  return (
    <div className="relative w-full h-[600px] bg-black/40 rounded-2xl border border-white/10 overflow-hidden shadow-2xl group">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
      
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <GraphScene />
        </Canvas>
      </div>

      {/* UI Overlays */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none">
        <h3 className="text-xl font-bold font-sans text-white tracking-widest">BATTLE MAP</h3>
        <p className="text-sm font-mono text-[#a855f7] mt-1 uppercase tracking-widest">Live Execution Graph</p>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6 z-20 pointer-events-none flex justify-between items-center px-6 py-3 bg-black/50 backdrop-blur border border-white/10 rounded-xl">
        <div className="flex gap-4 font-mono text-xs uppercase tracking-widest">
            <span className="text-blue-500 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Idle</span>
            <span className="text-yellow-500 flex items-center gap-2 animate-pulse"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Executing</span>
            <span className="text-[#a3e635] flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#a3e635]"></div> Completed</span>
        </div>
        <div className="font-mono text-xs text-white/50 tracking-widest">
          10,000 TPS • PARALLEL EXECUTION • ESCROW RELEASED
        </div>
      </div>
    </div>
  );
}
