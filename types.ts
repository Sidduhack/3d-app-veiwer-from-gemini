export enum QualityLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface ViewerSettings {
  quality: QualityLevel;
  environment: string; // 'studio' | 'sunset' | 'city' | 'night' | 'forest'
  gridVisible: boolean;
  autoRotate: boolean;
  fov: number;
  exposure: number;
  energySaver: boolean;
}

export interface LoadedModel {
  scene: any; // THREE.Group | THREE.Scene | THREE.Mesh
  animations: any[];
}

export interface FileMap {
  [key: string]: File;
}

export type SupportedExtension = 'gltf' | 'glb' | 'obj' | 'fbx' | 'stl';
