import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

const Buildings = ({ theme }) => {
  const buildingMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? '#1E2947' : '#E2E8F0',
      roughness: 0.7,
      metalness: 0.2,
    });
  }, [theme]);

  const buildings = useMemo(() => {
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        position: [
          (Math.random() - 0.5) * 30,
          0,
          (Math.random() - 0.5) * 30
        ],
        scale: [
          Math.random() * 2 + 1,
          Math.random() * 10 + 2,
          Math.random() * 2 + 1
        ],
        rotation: [0, Math.random() * Math.PI, 0]
      });
    }
    return data;
  }, []);

  const group = useRef();
  useFrame((state) => {
    if (group.current) {
      group.current.children.forEach((mesh, i) => {
        mesh.scale.y = buildings[i].scale[1] + Math.sin(state.clock.elapsedTime + i) * 0.5;
      });
    }
  });

  return (
    <group ref={group}>
      {buildings.map((b, i) => (
        <mesh 
          key={i} 
          position={[b.position[0], b.scale[1]/2, b.position[2]]}
          rotation={b.rotation}
          castShadow 
          receiveShadow
          material={buildingMaterial}
        >
          <boxGeometry args={[b.scale[0], 1, b.scale[2]]} />
        </mesh>
      ))}
    </group>
  );
};

const Particles = ({ theme }) => {
  const count = 300;
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    particles.forEach((particle, i) => {
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
      t = particle.t += speed / 2;
      const a = Math.cos(t) + Math.sin(t * 1) / 10;
      const b = Math.sin(t) + Math.cos(t * 2) / 10;
      const s = Math.cos(t);
      
      dummy.position.set(
        (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      dummy.scale.set(s, s, s);
      dummy.rotation.set(s * 5, s * 5, s * 5);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: theme === 'dark' ? '#3B82F6' : '#1E40AF',
      transparent: true,
      opacity: 0.6
    });
  }, [theme]);

  return (
    <instancedMesh ref={mesh} args={[null, null, count]}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  );
};

const Scene = ({ theme }) => {
  const { camera } = useThree();
  
  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 20;
    camera.position.z = Math.cos(state.clock.elapsedTime * 0.1) * 20;
    camera.lookAt(0, 5, 0);
  });

  return (
    <>
      <ambientLight intensity={theme === 'dark' ? 0.2 : 0.8} />
      <pointLight position={[10, 20, 10]} intensity={theme === 'dark' ? 1.5 : 1} color={theme === 'dark' ? '#3B82F6' : '#FFFFFF'} castShadow />
      <pointLight position={[-10, 10, -10]} intensity={theme === 'dark' ? 1 : 0.5} color={theme === 'dark' ? '#A78BFA' : '#7C3AED'} />
      <Buildings theme={theme} />
      <Particles theme={theme} />
      {theme === 'dark' && <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={theme === 'dark' ? '#0F172A' : '#F8FAFC'} />
      </mesh>
    </>
  );
};

const Background3D = ({ theme }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Canvas shadows camera={{ position: [20, 15, 20], fov: 45 }}>
        <fog attach="fog" args={[theme === 'dark' ? '#050A14' : '#FFFFFF', 10, 50]} />
        <Scene theme={theme} />
      </Canvas>
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: theme === 'dark' 
            ? 'linear-gradient(180deg, rgba(5,10,20,0.6) 0%, rgba(5,10,20,0.8) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.7) 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default Background3D;
