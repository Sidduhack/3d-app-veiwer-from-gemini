import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, OrbitControls, Center, Bounds, Stage } from '@react-three/drei';
import * as THREE from 'three';
import { ViewerSettings, QualityLevel, LoadedModel } from '../types';

// Fix for missing JSX Intrinsic Elements definitions in the current environment
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      directionalLight: any;
      primitive: any;
      gridHelper: any;
    }
  }
}

interface SceneContentProps {
  model: LoadedModel | null;
  settings: ViewerSettings;
  captureTrigger: number; // Increment to trigger capture
  onCaptureComplete: () => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ model, settings, captureTrigger, onCaptureComplete }) => {
  const { gl, scene, camera } = useThree();
  const controlsRef = useRef<any>(null);

  // Apply Tone Mapping
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = settings.exposure;
  }, [gl, settings.exposure]);

  // Handle Screenshot Logic
  useEffect(() => {
    if (captureTrigger > 0) {
      captureHighRes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureTrigger]);

  const captureHighRes = () => {
    const originalSize = new THREE.Vector2();
    gl.getSize(originalSize);
    const originalPixelRatio = gl.getPixelRatio();

    try {
      // 1. Force 4K resolution
      gl.setPixelRatio(1); // Reset PR for predictable math
      gl.setSize(3840, 2160);
      
      // 2. Render frame explicitly
      gl.render(scene, camera);

      // 3. Extract Data URL
      const dataURL = gl.domElement.toDataURL('image/png');

      // 4. Trigger download
      const link = document.createElement('a');
      link.download = `omniview_capture_${Date.now()}.png`;
      link.href = dataURL;
      link.click();
    } finally {
      // 5. Restore
      gl.setSize(originalSize.x, originalSize.y);
      gl.setPixelRatio(originalPixelRatio);
      onCaptureComplete();
    }
  };

  // Auto Rotate
  useFrame(() => {
    if (settings.autoRotate && controlsRef.current) {
      controlsRef.current.autoRotate = true;
      controlsRef.current.autoRotateSpeed = 2.0;
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false;
    }
  });

  // Calculate Shadow Configuration based on Quality
  const shadowConfig = React.useMemo(() => {
    switch (settings.quality) {
      case QualityLevel.LOW:
        return { opacity: 0, blur: 0, resolution: 64 }; // Effectively off
      case QualityLevel.MEDIUM:
        return { opacity: 0.4, blur: 2, resolution: 512 };
      case QualityLevel.HIGH:
        return { opacity: 0.6, blur: 1.5, resolution: 1024 };
      default:
        return { opacity: 0.4, blur: 2, resolution: 512 };
    }
  }, [settings.quality]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow={settings.quality !== QualityLevel.LOW} />
      
      {/* Environment Map */}
      <Environment preset={settings.environment as any} background={false} blur={0.8} />

      {model && (
        <Bounds fit clip observe margin={1.2}>
           <Center top>
              <primitive object={model.scene} />
           </Center>
        </Bounds>
      )}

      {/* Contact Shadows - Optimized based on quality */}
      {!settings.energySaver && settings.quality !== QualityLevel.LOW && (
        <ContactShadows 
          resolution={shadowConfig.resolution} 
          scale={50} 
          blur={shadowConfig.blur} 
          opacity={shadowConfig.opacity} 
          far={10} 
          color="#000000" 
        />
      )}

      {settings.gridVisible && <gridHelper args={[20, 20, 0x555555, 0x222222]} position={[0, -0.01, 0]} />}

      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        enableDamping={true} 
        dampingFactor={0.05}
      />
    </>
  );
};

export default SceneContent;