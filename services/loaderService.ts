import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { LoadedModel, SupportedExtension } from '../types';

// Helper to get extension
const getExt = (filename: string): string => filename.split('.').pop()?.toLowerCase() || '';

export const isModelFile = (filename: string): boolean => {
  return ['gltf', 'glb', 'obj', 'fbx', 'stl'].includes(getExt(filename));
};

export const loadScene = (mainFile: File, resourceMap: Record<string, string>): Promise<LoadedModel> => {
  return new Promise(async (resolve, reject) => {
    
    // Setup LoadingManager with URL Modifier for Smart Linking
    const manager = new THREE.LoadingManager();
    manager.setURLModifier((url) => {
      // Clean path (remove directories)
      const fileName = url.replace(/^.*[\\\/]/, '');
      
      // Check if we have a blob for this file
      if (resourceMap[fileName]) {
        return resourceMap[fileName];
      }
      return url;
    });

    const ext = getExt(mainFile.name) as SupportedExtension;
    const mainUrl = resourceMap[mainFile.name];

    if (!mainUrl) {
        reject(new Error("Main file URL not found in resource map."));
        return;
    }

    try {
      if (ext === 'obj') {
        const loader = new OBJLoader(manager);
        // Heuristic: Look for ANY .mtl file in the resources to pair with this OBJ
        // This supports drag-and-drop where users drop 1 obj and 1 mtl
        const mtlKey = Object.keys(resourceMap).find(k => k.toLowerCase().endsWith('.mtl'));
        
        if (mtlKey) {
          const mtlLoader = new MTLLoader(manager);
          const materials = await mtlLoader.loadAsync(resourceMap[mtlKey]);
          materials.preload();
          loader.setMaterials(materials);
        }
        const object = await loader.loadAsync(mainUrl);
        resolve({ scene: object, animations: [] });
      } 
      else if (ext === 'gltf' || ext === 'glb') {
        const loader = new GLTFLoader(manager);
        const gltf = await loader.loadAsync(mainUrl);
        resolve({ scene: gltf.scene, animations: gltf.animations });
      } 
      else if (ext === 'fbx') {
        const loader = new FBXLoader(manager);
        const object = await loader.loadAsync(mainUrl);
        resolve({ scene: object, animations: object.animations });
      } 
      else if (ext === 'stl') {
        const loader = new STLLoader(manager);
        const geometry = await loader.loadAsync(mainUrl);
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const mesh = new THREE.Mesh(geometry, material);
        const group = new THREE.Group();
        group.add(mesh);
        resolve({ scene: group, animations: [] });
      }
    } catch (err) {
      reject(err);
    }
  });
};

export const createResourceMap = (files: File[]): Record<string, string> => {
    const map: Record<string, string> = {};
    files.forEach(f => {
        map[f.name] = URL.createObjectURL(f);
    });
    return map;
}

export const revokeResourceMap = (map: Record<string, string>) => {
  Object.values(map).forEach(url => URL.revokeObjectURL(url));
};