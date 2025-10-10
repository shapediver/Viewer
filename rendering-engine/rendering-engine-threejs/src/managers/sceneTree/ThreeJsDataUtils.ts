import {Tree} from "@shapediver/viewer.shared.node-tree";
import {mat4, quat} from "gl-matrix";
import * as THREE from "three";
import {ENVIRONMENT_MAP_TYPE} from "../../loaders/EnvironmentMapLoader";
import {ThreejsData} from "../../types/ThreejsData";

export const assignEnvironmentMapForThreeJsDataObject = (
	data: ThreejsData,
	environmentMap: THREE.Texture | THREE.CubeTexture | null,
	environmentMapType: ENVIRONMENT_MAP_TYPE,
	environmentMapIntensity: number,
	environmentMapRotation: quat,
) => {
	const rotationMatrix = new THREE.Matrix4()
		.fromArray(
			mat4.fromQuat(
				mat4.create(),
				quat.fromValues(
					environmentMapRotation[0],
					environmentMapRotation[2],
					-environmentMapRotation[1],
					environmentMapRotation[3],
				),
			),
		)
		.transpose();
	const euler = new THREE.Euler().setFromRotationMatrix(rotationMatrix);

	// set the currently used environment map
	(<ThreejsData>data).obj.traverseVisible((child) => {
		if (
			child instanceof THREE.Mesh &&
			child.material instanceof THREE.Material
		) {
			const material = child.material as THREE.Material;
			// for all materials that support env maps, set the env map
			if ("envMap" in material && "envMapIntensity" in material) {
				(material as any).envMap = environmentMap;
				(material as any).envMapIntensity = environmentMapIntensity;
				material.needsUpdate = true;

				for (const d in material.defines) {
					if (d.startsWith("ENVMAP_TYPE_"))
						delete material.defines[d];
				}
				if (material.defines)
					material.defines[
						"ENVMAP_TYPE_" + environmentMapType.toUpperCase()
					] = "";
			}

			if ("envMapRotation" in material) {
				(material as any).envMapRotation = euler;
				material.needsUpdate = true;
			}
		}
	});
};

export const assignEnvironmentMapForThreeJsData = (
	environmentMap: THREE.Texture | THREE.CubeTexture | null,
	environmentMapType: ENVIRONMENT_MAP_TYPE,
	environmentMapIntensity: number,
	environmentMapRotation: quat,
) => {
	Tree.instance.root.traverse((node) => {
		node.data.forEach((data) => {
			if (data instanceof ThreejsData) {
				assignEnvironmentMapForThreeJsDataObject(
					data,
					environmentMap,
					environmentMapType,
					environmentMapIntensity,
					environmentMapRotation,
				);
			}
		});
	});
};
