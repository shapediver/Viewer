import * as THREE from 'three';

export interface MeshUnlitMaterialParameters extends THREE.MeshBasicMaterialParameters {
    KHR_materials_unlit?: boolean | undefined,
}